const authRoute = require('./routes/authRoute.js');
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const cookieParser = require("cookie-parser");
const connectDB = require('./utils/mongoDB.js');
var session = require('express-session')
var flash = require('connect-flash');
const engine = require('ejs-mate');
const app = express();
const port = 8080;

//connecting to mongo atlas
connectDB();

app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(express.static('public'));
app.use(cors({
  credentials: true
}));
app.use(cookieParser());

app.use(session({
  secret:process.env.JWT_SECRET ,
  resave:true,
  saveUninitialized:false
}))
app.use(flash());
app.engine('ejs', engine);
app.set('view engine','ejs');

//API endpoint
app.get('/', (req, res) => {
  res.redirect('/api/auth/login');
});
app.use('/api/auth',authRoute);

app.listen(port,()=>{
    console.log("listening to port 8080");
});