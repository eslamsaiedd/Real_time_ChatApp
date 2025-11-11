const mongoose  = require('mongoose')


const messageSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true, 
        ref: "user"
    },
    username: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    time: {
        type: Date,
        default: Date.now
    }, 
    room: {
        type: String
    }

})


module.exports = mongoose.model('message', messageSchema)