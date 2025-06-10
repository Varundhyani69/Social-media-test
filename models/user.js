const mongoose = require('mongoose');
const { boolean } = require('webidl-conversions');

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    bio: {
        type: String,
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verifyOtp: {
        type: String,
        default: ''
    },
    verifyOtpExpired: {
        type: Number,
        default: 0
    },
    resetOtp: {
        type: String,
        default: ''
    },
    resetOtpExpired: {
        type: Number,
        default: 0
    },
    resetOtpVerified:{
        type: Boolean,
        default: false
    },
    posts: [
        {
            title: String,
            url: String,
            filename: String
        }
    ],
    pfp: {
        url: { type: String, default: 'https://icon-library.com/images/unknown-person-icon/unknown-person-icon-4.jpg' },
        filename: { type: String, default: '' },
    }

})

const userModel = mongoose.model('user',userSchema);

module.exports = userModel;