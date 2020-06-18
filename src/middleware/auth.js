const jwt = require('jsonwebtoken')
const User = require('../models/user')

const auth = async (req, res, next) => {
    try {
        // 1. Look for the token that the user is supposed to provide in the header
        const token = req.header('Authorization').replace('Bearer ', '')

        // 2. Validate that token
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        // 3. Find the associated user ( user id embedded on decoded _id property when token was generated (jwt.sign() )
        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token }) // ademas de buscar el user por su id, miras que aun tenga ese token registrado en su array de tokens
        
        if (!user) {
            throw new Error()
        }

        // add a property onto request to store the user, so the root handlers will be able to acces it later on:
        req.user = user

        // add a property onto request to store the token, so the root handlers will be able to acces it later on:
        req.token = token
        
        next()
    } catch (e) {
        res.status(401).send({error: 'Please authenticate.'})
    }
}

module.exports = auth