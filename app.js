//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require('ejs');
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');
mongoose.set('strictQuery', true);
app = express();

app.use(express.static("public"));
//setting view engine to ejs
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended : true}));


mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema({
    email : String,
    password : String
});


userSchema.plugin(encrypt, {encryptionKey: process.env.S3_BUCKET, signingKey: process.env.SECRET_KEY, encryptedFields: ['password'] });

const userModel = new mongoose.model("users", userSchema);

app.get("/", (req,res)=>{
    res.render('home.ejs');
})
app.get("/login", (req,res)=>{
    res.render("login.ejs");
})
app.get("/register", (req,res)=>{
    res.render  ("register.ejs");
})

app.post('/register', (req,res)=>{

    const  newUser = new userModel({
     email : req.body.username,
     password : req.body.password
    });

    newUser.save( (err, result)=>{
        if (!err){
            res.render("secrets");
        }else {
            res.send(err);
        }
    });
});


app.listen(3000, function () {
    console.log("Server is running on port 3000 ");
});

app.post('/login', (req,res)=>{
    const getemail = req.body.username;
    const getpassword = req.body.password;
    
    userModel.findOne({email : getemail}, (err,result)=>{
        if (err){
            console.log(err);
        }else{
            if (result){
                if (result.password === getpassword && result.email === getemail)
                {
                    res.render("secrets");
                }else{
                    res.send(" recheckk your password");
                    console.log(result.username + " "+ result.password);
                }
            }else{
                res.send("user Not found");
            }
        }

    });
});

