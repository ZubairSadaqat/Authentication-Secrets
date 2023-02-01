//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require('ejs');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const saltRounds = 5;

mongoose.set('strictQuery', true);
app = express();

app.use(express.static("public"));
//setting view engine to ejs
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended : true}));


// mongoose.connect("mongodb://localhost:27017/userDB");
mongoose.connect("mongodb://127.0.0.1:27017/userDB");

const userSchema = new mongoose.Schema({
    email : String,
    password : String
});

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

    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {

        const  newUser = new userModel({
            email : req.body.username,
            password : hash
        });
        newUser.save( (err, result)=>{
            if (!err){
                res.render("secrets");
            }else {
                res.send(err);
            }
        });
    });
});


app.listen(3000, function () {
    console.log("Server is running on port 3000 ");
});

app.post('/login', (req,res)=>{
    const getemail = req.body.username;
    const getpassword = req.body.password;

    userModel.findOne({email : getemail}, (err,foundUser)=>{
        if (err){
            console.log(err);
        }else{
            if (foundUser){
                bcrypt.compare(getpassword, foundUser.password , function(err, result) {
                    // res === true
                    if (result === true){
                        res.render("secrets");
                    }
                });
            }else{
                res.send("user Not found");
            }
        }

    });
});

