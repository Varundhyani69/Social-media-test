const express = require('express');
const userAuth = require("../controllers/authController");
const cookieData = require('../middleware/middleware');
const router = express.Router();
const multer = require('multer');
const {storage} = require('../utils/cloudinary.js');
const upload = multer({ storage });


router.post('/register',userAuth.register);
router.post('/login',userAuth.login);
router.post('/logout',userAuth.logout);
router.post('/send-verify-otp',cookieData,userAuth.sendVerifyOtp);
router.post('/verifyOtp',cookieData,userAuth.verifyOtp);
router.post('/sendResetOtp',cookieData,userAuth.sendResetOtp);
router.post('/verifyResetOtp',cookieData,userAuth.verifyResetOtp);
router.post('/resetOtp',cookieData,userAuth.resetOtp);
router.post('/editProfile',cookieData,upload.single('pfp'),userAuth.editProfile);
router.post('/uploadPost',cookieData,upload.single('post'),userAuth.uploadPost);
router.post('/delete/:id',cookieData,userAuth.deletePost);
router.post('/edit/:id',cookieData,userAuth.editPost);


router.get('/register',userAuth.getRegister);
router.get('/login',userAuth.getLogin);
router.get('/get-home-page',cookieData,userAuth.getHomePage);
router.get('/edit-profile',cookieData,userAuth.getEditProfile);
router.get('/getUploadPost',cookieData,userAuth.getUploadPost);
router.get('/getEdit/:id',cookieData,userAuth.getEdit);

module.exports = router;