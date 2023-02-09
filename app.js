//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

mongoose.set('strictQuery', true);
const app = express();

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
    password : String,
    googleID : String,
    secret : String
});


userSchema.plugin(passportLocalMongoose);

const userModel = new mongoose.model("users", userSchema);

passport.use(userModel.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    userModel.findById(id, (err, user)=>{
        done(err, user);

    });
});

passport.use(new GoogleStrategy({
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/secrets",
        userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"

    },
    function(accessToken, refreshToken, profile, cb) {
        console.log(profile);
        // userModel.findOrCreate({ googleId: profile.id }, function (err, user) {
        //     return cb(err, user);
        // });
        //check user table for anyone with a facebook ID of profile.id
        userModel.findOne({
            googleID : profile.id
        }, function(err, user) {
            if (err) {
                return cb(err);
            }
            //No user was found... so create a new user with values from Facebook (all the profile. stuff)
            if (!user){
                user = new userModel({
                    email: profile.displayName,
                    googleID: profile.id,
                    //now in the future searching on User.findOne({'facebook.id': profile.id } will match because of this next line
                    google: profile._json
                });
                user.save(function(err) {
                    if (err) console.log(err);
                    return cb(err, user);
                });
            } else {
                //found user. Return
                return cb(err, user);
            }
        });

    }
));


app.get("/", (req,res)=>{
    res.render('home.ejs');
});

app.get("/auth/google",
    passport.authenticate("google", { scope: ["profile"] })
);

app.get("/auth/google/secrets",
    passport.authenticate("google", { failureRedirect: "/login" }),
    function(req, res) {
        // Successful authentication, redirect secrets.
        res.redirect('/secrets');
    });

app.get("/login", (req,res)=>{
    res.render("login.ejs");
})
app.get("/register", (req,res)=>{
    res.render  ("register.ejs");
})

app.get("/secrets", (req,res)=>{

    userModel.find({"secret": {$ne: null}},  (err, foundUser)=>{
        if (err) {console.log(err)}
        else {
            if (foundUser){
                res.render("secrets", {userWithSecrets : foundUser});
            }
        }
    });
});

app.get("/submit", (req,res)=>{
    if (req.isAuthenticated()){
        res.render("submit");
    }else{
        res.redirect("/login");
    }
})

app.post("/submit", (req,res)=>{
    const submittedSecret = req.body.secret;
    console.log(req.user.id);

    userModel.findById(req.user.id, (err , foundUser)=>{
        if (err)
        {
            console.log(err)
        }else {
            if (foundUser){
                foundUser.secret = submittedSecret;
                foundUser.save( function (){
                        res.redirect("/secrets");
                });
                console.log("data save successfully ");
            }
        }
    });
});

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


app.listen(3000, function () {
    console.log("Server is running on port 3000 ");
});
