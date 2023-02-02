//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

mongoose.set('strictQuery', true);
app = express();

app.use(express.static("public"));
//setting view engine to ejs
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended : true}));

app.use(session({
    secret: "MySecrete.",
    resave: false,
    saveUninitialized: false

}));

app.use(passport.initialize());
app.use(passport.session());

// mongoose.connect("mongodb://localhost:27017/userDB");
mongoose.connect("mongodb://127.0.0.1:27017/userDB");

const userSchema = new mongoose.Schema({
    email : String,
    password : String
});


userSchema.plugin(passportLocalMongoose);

const userModel = new mongoose.model("users", userSchema);

passport.use(userModel.createStrategy());

passport.serializeUser(userModel.serializeUser());
passport.deserializeUser(userModel.deserializeUser());


app.get("/", (req,res)=>{
    res.render('home.ejs');
})
app.get("/login", (req,res)=>{
    res.render("login.ejs");
})
app.get("/register", (req,res)=>{
    res.render  ("register.ejs");
})

app.get("/secrets", (req,res)=>{
    if (req.isAuthenticated()){
        res.render("secrets");
    }else{
        res.redirect("/login");
    }
})

app.get("/logout", (req,res)=>{
    req.logout((err)=>{
        if (err){
            console.log(err)
        }
        res.redirect("/");
    });
})


app.post('/register', (req,res)=>{

    userModel.register({ username: req.body.username}, req.body.password, (err,user)=>{
        if (err){
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req,res,()=>{
                res.redirect("/secrets");
            })
        }
    })
});


app.listen(3000, function () {
    console.log("Server is running on port 3000 ");
});

app.post('/login', (req,res)=>{

    const newUser = new userModel({
        username: req.body.username,
        password: req.body.password
    });

    req.login(newUser, (err)=>{
        if (err){
            console.log(err)
        }else
        {
            passport.authenticate("local")(req,res, ()=>{
                res.redirect("/secrets");
            })
        }
    })

});

