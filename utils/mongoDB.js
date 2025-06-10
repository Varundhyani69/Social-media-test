const mongoose = require('mongoose');

const connectDB = async ()=>{
    mongoose.connection.on('connected',()=>{console.log("Database Connected")});
    await mongoose.connect(`${process.env.MONGODB_URI}/login-auth`);
} 

module.exports = connectDB;