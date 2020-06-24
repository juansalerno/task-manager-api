const express = require('express')
const Task = require('../models/task')
const auth = require('../middleware/auth')
const router = new express.Router()
const multer = require('multer')
const sharp = require('sharp')


// Setting up multer:
const upload = multer({
    limits: {
        fileSize: 1500000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Please upload an image'))
        }

        cb(undefined, true)
    }
})


router.post('/tasks', auth, upload.single('image'), async (req, res) => {
    try {

        const task = new Task({
            ...JSON.parse(req.body.task),
            owner: req.user._id
        })

        if (req.file) {
            task.image = await sharp(req.file.buffer).png().toBuffer()
        }

        await task.save()
        res.status(201).send(task)
    } catch (e) {
        res.status(400).send(e)
    }
})

//  GET /tasks?completed=false  --> FILTERING DATA
//  GET /tasks?limit=10&skip=0  --> PAGINATING DATA
//  GET /tasks?sortBy=createdAt:desc --> SORTING DATA
router.get('/tasks', auth, async (req, res) => {
    const match = {}
    const sort = {}

    if (req.query.completed) {
        match.completed = req.query.completed === 'true' // that is because query strings are always strings and completed property must be boolean in this case
    }

    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    }

    try {
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit), // if it isn't provided or it's NaN it's going to be ignored by mongoose
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate()
        res.send(req.user.tasks)
    } catch (e) {
        res.status(500).send()
    }
})


router.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id

    try {
        const task = await Task.findOne({ _id, owner: req.user._id })

        if (!task) {
            return res.status(404).send()
        }

        res.send(task)
    } catch (e) {
        res.status(500).send()
    }
})


// Read task image from the browser:
router.get('/tasks/:id/image', async (req, res) => {
    try {
        const task = await Task.findById(req.params.id)

        if (!task || !task.image) {
            throw new Error()
        }

        res.set('Content-Type', 'image/png') // setting up the response header (because it is not JSON)
        res.send(task.image)
    } catch (e) {
        res.status(404).send()
    }
})


router.patch('/tasks/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['description', 'completed']
    const isValidOperation = updates.every(update => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' })
    }

    try {
        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id }) // mongoose automatically converts the string ids into ObjectIDs for us

        if (!task) {
            return res.status(404).send()
        }

        updates.forEach(update => task[update] = req.body[update])

        await task.save()
        res.send(task)
    } catch (e) {
        res.status(400).send(e)
    }

})

router.delete('/tasks/:id', auth, async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id })

        if (!task) {
            return res.status(404).send()
        }

        res.send(task)
    } catch (e) {
        res.status(500).send()
    }
})

// Delete image from a task:
router.delete('/tasks/:id/image', auth, async (req, res) => {
    try {
        
        const task = await Task.findById(req.params.id)
        
        if (!task || task.image === null) {
            return res.status(404).send()
        }

        task.image = null
        await task.save()
        res.send()
    } catch (e) {
        res.status(500).send()
    }
})

module.exports = router