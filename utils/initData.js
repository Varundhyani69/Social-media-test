const mongoose = require('mongoose');
const User = require('../models/user.js'); 
require('dotenv').config({ path: '../.env' }); 
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    await User.updateMany(
      { posts: { $exists: false } }, 
      { $set: { posts: [] } }       
    );
    console.log('Users updated with posts field as empty array');
    mongoose.disconnect();
  })
  .catch(err => console.error(err));
