const cloudinary = require('cloudinary').v2
const userModel = require('../models/user.js');
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const transporter = require('../utils/nodeMailer.js');

exports.register = async(req,res)=>{
    const {name,email,password} = req.body;
    try {
        if(!name || !email || !password){
            req.flash("errors","Invalid entry");
            return res.redirect('/api/auth/register');
        }
        const alreadyReg = await userModel.findOne({email});
        if(alreadyReg){
            req.flash("errors","Email already registered");
            return res.redirect('/api/auth/register');
        }
        let hashedPassword = await bcrypt.hash(password,10);
        const newUser = new userModel({name,email,password: hashedPassword});
        await newUser.save();

        const token = jwt.sign({id: newUser._id},process.env.JWT_SECRET,{expiresIn: '7d'});
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        req.flash("success","Successfully Registered!!");
        return res.redirect('/api/auth/get-home-page');

    } catch (error) {
        req.flash("errors","Error while registering!!");
        return res.redirect('/api/auth/register');
    }
}
exports.login = async(req,res)=>{
    const {email,password} = req.body;
    try {
        if(!email || !password){
            req.flash("errors","Invalid entry");
            return res.redirect('/api/auth/login');
        }
        const user = await userModel.findOne({email});
        if(!user){
            req.flash("errors","Email is not registered");
            return res.redirect('/api/auth/login');
        }
        const isMatch = await bcrypt.compare(password,user.password);
        if(!isMatch){
            req.flash("errors","Invalid Password");
            return res.redirect('/api/auth/login');
        }
        const token = jwt.sign({id: user._id},process.env.JWT_SECRET,{expiresIn:'7d'});
        res.cookie('token',token,{
            httpOnly:true,
            secure: process.env.NODE_ENV == 'production',
            sameSite: process.env.NODE_ENV == 'production'?'none':'strict',
            maxAge: 7*24*60*60*1000,
        });
        req.flash("success","Successfully logged in");
        return res.redirect('/api/auth/get-home-page');
    
    } catch (error) {
        req.flash("errors","Error while loggin in");
        return res.redirect('/api/auth/login');
    }
    
}
exports.logout = async(req,res)=>{
    try {
        res.clearCookie('token',{
            httpOnly:true,
            secure: process.env.NODE_ENV == 'production',
            sameSite: process.env.NODE_ENV == 'production'?'none':'strict'
        })
        res.redirect('/api/auth/login');
    } catch (error) {
        req.flash("errors","Error while loggin out");
        return res.redirect('/api/auth/get-home-page');
    }
}
exports.sendVerifyOtp = async (req, res) => {
    try {
        const userId = req.userId; 
        const user = await userModel.findById(userId);
        if (!user) {
            req.flash("errors","User not registered");
            return res.redirect('/api/auth/login');
        }
        if (user.isVerified) {
            req.flash("success","You are already verified");
            return res.redirect('/api/auth/get-home-page');
        }


        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        user.verifyOtp = otp;
        user.verifyOtpExpired = Date.now() + 5 * 60 * 1000;
        await user.save();

        const mail = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: 'Verification OTP',
            text: `Your verification OTP is ${otp}`
        };

        await transporter.sendMail(mail);
        req.flash("success","Verification OTP sent to your email!!");
        res.render('../views/verification.ejs',{user,success:req.flash("success"),errors: req.flash("errors")});
    } catch (error) {
        req.flash("errors","Error while sending otp");
        return res.redirect('/api/auth/get-home-page');
    }
}
exports.verifyOtp = async(req,res)=>{
    const {otp} = req.body;
    try {
        const userId = req.userId;
        const user = await userModel.findById(userId);
        if (!otp) {
            req.flash("errors","Problem while getting OTP");
            return res.redirect('/api/auth/get-home-page');
        }
        if(user.verifyOtpExpired<Date.now()){
            user.verifyOtp='';
            user.verifyOtpExpired=0;
            user.save();
            req.flash("errors","OTP expired");
            return res.redirect('/api/auth/get-home-page');            
        }
        
        if (!user) {
            req.flash("errors","User not registered");
            return res.redirect('/api/auth/login');
        }
        if(otp === user.verifyOtp){
            user.isVerified = true;
            user.verifyOtp='';
            user.verifyOtpExpired=0;
            await user.save();
            req.flash("success","Verification OTP sent to your email!!");
            return res.redirect('/api/auth/get-home-page');
        }else{
            return res.json({ success: false, message: "Wrong Otp!" });
        }
    } catch (error) {
        req.flash("errors","Error while verifying otp");
        return res.redirect('/api/auth/get-home-page');
    }
}
exports.sendResetOtp = async(req,res)=>{
    try {
        const userId = req.userId; 
        const user = await userModel.findById(userId);
        if (!user) {
            req.flash("errors","User not registered");
            return res.redirect('/api/auth/login');
        }
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        user.resetOtp = otp;
        user.resetOtpExpired = Date.now() + 5 * 60 * 1000;
        await user.save();
        const mail = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: 'Reset OTP',
            text: `Your Reset OTP is ${otp}`
        };
        await transporter.sendMail(mail);
        req.flash("success","Reset OTP sent to your email!!");
        return res.render('../views/resetPassVerify.ejs',{user,success: req.flash("success"),errors: req.flash("errors")});    
    } catch (error) {
        req.flash("errors","Error while sending reset otp");
        return res.redirect('/api/auth/get-home-page');
    }
}
exports.verifyResetOtp = async(req,res)=>{
    const {otp} = req.body;
    try {
        const userId = req.userId;
        const user = await userModel.findById(userId);
        if (!otp) {
            req.flash("errors","Problem while getting OTP");
            return res.redirect('/api/auth/get-home-page');
        }
        if(user.resetOtpExpired<Date.now()){
            user.resetOtp='';
            user.resetOtpExpired=0;
            user.save();
            req.flash("errors","OTP expired");
            return res.redirect('/api/auth/get-home-page');    
        }
        
        if (!user) {
            req.flash("errors","User not registered");
            return res.redirect('/api/auth/login');
        }
        if(otp === user.resetOtp){
            user.resetOtpVerified = true;
            user.resetOtp='';
            user.resetOtpExpired=0;
            await user.save();
            req.flash("success","Reset OTP verified!!");
            return res.render('../views/resetPass.ejs',{success: req.flash("success"),errors: req.flash("errors")});
        }else{
            req.flash("errors","Wrong OTP!");
            return res.render('../views/resetPassVerify.ejs',{errors:req.flash('errors')});  
        }
    } catch (error) {
        req.flash("errors","Error while verifying reset otp");
        return res.redirect('/api/auth/get-home-page');
    }
}
exports.resetOtp = async(req,res)=>{ 
    try {
        const{newPassword} = req.body;
        const userId = req.userId;
        const user = await userModel.findById(userId);
        if(!user.resetOtpVerified){
            return res.json({ success: false, message: "Reset OTP not verified!" });
        }
        if (!newPassword) {
            return res.json({ success: false, message: "No password!" });
        }

        const newPass = await bcrypt.hash(newPassword,10);
        user.password = newPass;
        user.resetOtpVerified=false;
        user.resetOtpExpired=0;
        user.resetOtp='';
        await user.save();

        req.flash("success","Password was changed successfully!!");
        return res.redirect('/api/auth/get-home-page');
        
    } catch (error) {
        req.flash("errors","Error while verifying otp");
        return res.redirect('/api/auth/get-home-page');
    }
}
exports.editProfile = async (req,res) =>{
    try {
        const userId = req.userId;
        const user = await userModel.findById(userId);
        const newBio = req.body.newBio;
        if (req.file) {
            const url = req.file.path || req.file.secure_url;
            const filename = req.file.filename; 
            user.pfp = { url, filename };
        }
        user.bio = newBio;
        await user.save();
        req.flash("success","Bio was changed successfully!!");
        res.redirect('/api/auth/get-home-page');
    } catch (error) {
        
        req.flash("errors","Error while saving changes");
        return res.redirect('/api/auth/get-home-page');
    }
}
exports.uploadPost = async (req, res) => {
  try {
    const userId = req.userId;

    const title = req.body.title;
    const url = req.file?.path || req.file?.secure_url;
    const filename = req.file?.filename;


    if (!url || !filename || !title) {
      req.flash("errors", "All fields are required.");
      return res.redirect('/api/auth/getUploadPost');
    }

    await userModel.findByIdAndUpdate(
      userId,
      {
        $push: {
          posts: {
            title,
            url,
            filename
          }
        }
      },
      { new: true, runValidators: true }
    );

    req.flash("success", "Post uploaded successfully!");
    res.redirect('/api/auth/get-home-page');
  } catch (error) {
    console.error("Upload Post Error:", error.message, error.stack);
    req.flash("errors", "Error while uploading post.");
    res.redirect('/api/auth/get-home-page');
  }
};
exports.deletePost = async(req,res)=>{
    try{
        const userId = req.userId;
        const postId = req.params.id;
        if (!postId) {
        req.flash("errors", "Post ID is required.");
        return res.redirect('/api/auth/get-home-page');
        }
        const user = await userModel.findById(userId);
        if (!user) {
        req.flash("errors", "User not found.");
        return res.redirect('/api/auth/login');
        }
        const post = user.posts.id(postId);
        if (!post) {
        req.flash("errors", "Post not found.");
        return res.redirect('/api/auth/get-home-page');
        }
        await cloudinary.uploader.destroy(post.filename);
        await userModel.findByIdAndUpdate(userId,{
            $pull:{posts:{_id:postId}}},
        {new:true}
        );
        req.flash("success", "Post deleted successfully!");
        res.redirect('/api/auth/get-home-page');
    }catch (error) {
    console.error("Delete Post Error:", error.message, error.stack);
    req.flash("errors", `Error while deleting post: ${error.message}`);
    res.redirect('/api/auth/get-home-page');
  }
    
}
exports.editPost = async(req,res)=>{
    const postId = req.params;
    const userId = req.userId;
    const newTitle = req.body.newTitle;
    const user = await userModel.findById(userId);
    const post = user.posts.id(postId);
    post.title = newTitle;
    await user.save();
    res.redirect('/api/auth/get-home-page');
}
exports.getRegister = async(req,res)=>{
    res.render("../views/login.ejs",{signUp:true,success: req.flash("success"),errors: req.flash("errors")});
}
exports.getLogin = async(req,res)=>{
    
    res.render("../views/login.ejs",{signUp:false,success: req.flash("success"),errors: req.flash("errors")});
}
exports.getHomePage = async(req,res)=>{
    const userId = req.userId;
    const user = await userModel.findById(userId);
    res.render('../views/home.ejs',{user,success: req.flash("success"),errors: req.flash("errors")});
}
exports.getEditProfile =  async(req,res)=>{
    const userId = req.userId;
    const user = await userModel.findById(userId);
    res.render("../views/editProfile.ejs",{user,success: req.flash("success"),errors: req.flash("errors")});
}
exports.getUploadPost = async(req,res)=>{
    const userId = req.userId;
    const user = await userModel.findById(userId);
    res.render("../views/uploadPost.ejs",{user});
}
exports.getEdit = async(req,res)=>{
    const postId = req.params;
    const userId = req.userId;
    const user = await userModel.findById(userId);
    const post = await user.posts.id(postId);
    res.render('../views/edit.ejs',{post,user});
}
