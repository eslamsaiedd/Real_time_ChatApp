const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true, 
        match: /.+\@.+\..+/
    },
    password: {
        type: String,
        required: true
    },
    avatar: {
        type: String,
        default: 'uploads/profile.png'
    }
})

module.exports = mongoose.model('user', userSchema)