
const mongoose = require('mongoose')


// connect with data 

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL || 'mongodb+srv://eslamsaied051_db_user:eslam555@real-time-chatapp.rpidfjo.mongodb.net/Real-time-chatapp?retryWrites=true&w=majority' )
        console.log('MongoDB connected successfully');
    }catch (error) {    
      console.error("Database connection failed");
        return
    }
}

module.exports = connectDB