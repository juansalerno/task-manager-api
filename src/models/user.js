const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Task = require('../models/task')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Email is invalid')
            }
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 7,
        trim: true,
        validate(value) {
            if (value.toLowerCase().includes('password')) {
                throw new Error('Password cannot contain "password"')
            }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if (value < 0) {
                throw new Error('Age must be a positive number.')
            }
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer
    }
}, {
    timestamps: true
})

// Set up a virtual property (it is NOT stored in the database, is a relationship between 2 entities)
userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id', // where the local datails stored
    foreignField: 'owner' // the name of the field on the other thing
})

// methods are accesible on the instances (called Instance Methods)
userSchema.methods.generateAuthToken = async function () { // standard function is required because the "this" binding plays an important role
    const user = this // is optional, but is more clear using user than this
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET)

    user.tokens = user.tokens.concat({ token })
    await user.save()

    return token
}

userSchema.methods.toJSON = function () { // when we pass an object to res.send(), Express is calling JSON.stringify(object) behind the scenes
    const user = this
    const userObject = user.toObject() // mongoose method, give us the raw profile data, (making one object)

    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar

    return userObject
}


// statics methods are accesible on the model (called Model Methods)
userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email })

    if (!user) {
        throw new Error('Unable to login')
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
        throw new Error('Unable to login')
    }

    return user
}

// Hash the plain text password before saving
userSchema.pre('save', async function (next) { // standard function is required because the "this" binding plays an important role
    const user = this

    if (user.isModified('password')) { // method provided by mongoose
        user.password = await bcrypt.hash(user.password, 8)
    }   

    next()
})

// Delete user tasks when user is removed
userSchema.pre('remove', async function (next) {
    const user = this
    await Task.deleteMany({owner: user._id})
    next()
})


const User = mongoose.model('User', userSchema)

module.exports = User