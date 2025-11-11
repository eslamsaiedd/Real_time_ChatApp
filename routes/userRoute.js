const express = require('express')
const router = express.Router()
const userController =  require('../controller/userController')
const verifyToken = require('../middleWare/verifyToken')

const multer  = require('multer');

//! for uploading a picture
const diskStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        console.log("FILE", file);
        cb(null, 'uploads')
    },
    filename: function (req, file, cb ) {
        const ext = file.mimetype.split('/')[1]
        const fileName =`user-${Date.now()}.${ext}`
        cb(null, fileName)
    }
})

//! if you sent a PDF instead of a image  

const fileFilter = (req, file, cb) => {
    const imageType = file.mimetype.split('/')[0]
    if (imageType == 'image') {
        return cb(null, true)
    }else {
        return cb(appError.create('file must be a image',400), false)
    }
}

const upload = multer({
    storage: diskStorage,
    fileFilter
})

router.route('/upload')
            .post(verifyToken, upload.single("avatar"), userController.upload)

router.route('/delete-photo')
            .put(verifyToken, userController.deletePhoto)

router.route('/profile')
            .get(verifyToken, userController.profile)

router.route('/register')
            .post(userController.register)
            
router.route('/login')
            .post(userController.login)

module.exports = router