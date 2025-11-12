const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const User = require('../models/userModel')
const salt = 8


//* register
const register = async (req, res) => {

    const {username, email, password} = req.body

    // emphasizing if this email not exists before 
    const oldUser = await User.findOne({email})
    if (oldUser) {
        return res.status(400).json({status: "FAIL", message: 'user already exists'})
    }
    // start to hash password
    const hashedPassword = await bcrypt.hash(password, salt)
    const newUser = new User({
        username,
        email,
        password: hashedPassword
    })

    // generate token
    const jwt_secret_key = process.env.jwt_secret_key;
    
    const token = jwt.sign(
        { email: newUser.email, id: newUser._id },
        jwt_secret_key,
        { expiresIn: "2d" }
    )

    newUser.token = token

    await newUser.save();

    res.status(201).json({ status: "SUCCESS", data: { user: newUser } });
}
//* login
const login = async (req, res) => {
    const {email, password} = req.body

    if (!email || !password) {
        res.status(400).json({ status: "FAIL", message: "email and password are required" })
    }

    const user = await User.findOne({email})
    if (!user) {
        return res.status(400).json({ status: "FAIL", message: "user not found" })
    }

    const matchedPassword = await bcrypt.compare(password, user.password)

    if (email && matchedPassword) {
        const jwt_secret_key = process.env.jwt_secret_key

        const token = await jwt.sign(
            { email: email, id: user._id },
            jwt_secret_key,
            { expiresIn: "2d" }
        )
        res.status(200).json({status: "SUCCESS", data:{token}})
    } else {
        return res.status(400).json({ status: "ERROR", message: "something went wrong" });
    }
}
//* profile
const profile = async (req, res) => {

    try {

        const userId = req.user.id

        const user = await User.findById(userId).select('-password')

        if (!user) {
            res.status(404).json({message: "User not found"})
        }

        res.status(200).json({
        success: true,
        data: user
        });
    }catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
}

const upload = async (req, res) => {
    try {
        const userId = req.user.id
        console.log("userId===========",userId);
        const imagePath = `/uploads/${req.file.filename}`
        
        await User.findByIdAndUpdate(userId, { avatar: imagePath })

        res.json({ success: true, message: "Profile photo updated successfully", imagePath});
    }catch (err) {
        res.status(500).json({ success: false, message: "Error uploading photo", error: err.message});
    }
}


const deletePhoto = async (req, res) => {
    try {
        const userId = req.user.id
        console.log("userId===========",userId);
        const imagePath = `uploads/profile.png`

        await User.findByIdAndUpdate(userId, {avatar: imagePath})

        res.json({ success: true, message: "Profile photo deleted successfully", imagePath});

    }catch (err) {
        res.status(500).json({ success: false, message: "Error deleting photo", error: err.message});
    }
}


const updateUsername = async (req, res) => {
    try{ 
        const userId = req.user.id
        console.log("==============", userId);
        const newName = req.body.username;
         
        await User.findByIdAndUpdate(userId, {username: newName})

        res.json({success: true, message:'username updating successfully', newName})

    }catch(err) {
        res.status(500).json({ success: false, message: "Error updating username", error: err.message});
    }
}

module.exports = {
    register, 
    login,
    profile,
    upload,
    deletePhoto,
    updateUsername
}