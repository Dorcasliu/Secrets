//jshint esversion:6
require("dotenv").config(); //setting environmental variables

const express=require("express");
const bodyParser=require("body-parser");
const ejs=require("ejs");
const mongoose=require("mongoose");
const app=express();
const findOrCreate = require('mongoose-findorcreate');


const LocalStrategy = require('passport-local').Strategy;

const session=require("express-session"); // using passport.js to add cookies and sessions

const passport=require("passport");

const passportLocalMongoose=require("passport-local-mongoose");

var GoogleStrategy = require('passport-google-oauth20').Strategy; //oauth20
// const encrypt=require("mongoose-encryption"); //Caesar Cipher
// const md5=require("md5"); //md5
// const bcrypt=require("bcrypt");  //salting&hashing
// const saltRounds=10;

app.set("view engine","ejs");

app.use(bodyParser.urlencoded({
  extends:true
}));

app.use(express.static("public"));

app.use(session({
  secret:"Our little secret.",
  resave:false,
  saveUninitialized:false
}));

app.use(passport.initialize());
app.use(passport.session());


mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser:true});

mongoose.set("useCreateIndex",true);

const userSchema=new mongoose.Schema({
  name:String,
  password:String,
  googleId:String,
  secret:String
});

// userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:["password"] }); //environment variable Caesar Cipher
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User=mongoose.model("User",userSchema);


passport.use(User.createStrategy());



// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());
passport.serializeUser(function(user, done) { //passport-google-oauth20
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});


passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


app.get("/",function(req,res){
  res.render("home");
});

app.get("/login",function(req,res){
  res.render("login");
});

app.get("/register",function(req,res){
  res.render("register");
});

app.get("/secrets",function(req,res){
  // if(req.isAuthenticated()){  //have cookies
  //   res.render("secrets");
  // }else{
  //   res.redirect("/login");
  User.find({"secret":{$ne:null}}, function(err,foundUsers){
    if (err){
      console.log(err);
    }else{
      if (foundUsers){
        res.render("secrets",{userWithSecrets:foundUsers});
      }
    }
  });
});

app.get("/logout",function(req,res){
  req.logout();
  res.redirect("/");
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get("/auth/google/secrets",
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
  // Successful authentication, redirect home.
  res.redirect('/secrets');
});

app.post("/register",function(req,res){ //passport.js
  User.register({username:req.body.username},req.body.password,function(err,user){
    if (err){
      console.log(err);
      res.redirect("/register");
    }else{
      passport.authenticate("local")(req,res,function(){
        res.redirect("/secrets");
      });
    }
  })
});

// app.post("/login",function(req,res){  //passport.js
//   const user=new User({
//     username:req.body.username,
//     password:req.body.password
//   });
//   req.login(user, function(err){
//     if (err){
//       console.log(err);
//     }
//     else{
//       passport.authenticate("local")(req,res,function(){ //only shows unauthorized when wrong username or pwd
//         res.redirect('/secrets');
//       })
//     }
//   })
// });
app.post('/login',
  passport.authenticate('local', { successRedirect: '/secrets',
                                   failureRedirect: '/'})
                                   // failureFlash: 'Invalid username or password.' })  // !!want to add flash
);

app.get("/submit",function(req,res){
  if(req.isAuthenticated()){  //have cookies
    res.render("submit");
  }else{
    res.redirect("/login");
  }
});

app.post("/submit",function(req,res){
  const submittedSecret=req.body.secret;
  // console.log(req.user);
  User.findById(req.user.id,function(err,foundUser){
    if (err){
      console.log(err);
    }else{
      if (foundUser){
        foundUser.secret=submittedSecret;
        foundUser.save(function(){  // each user could only submit one secret.
          res.redirect("/secrets");
        });
      }
    }
  });
});
// app.post("/register",function(req,res){
//     // password:md5(req.body.password) //md5
//     bcrypt.hash(req.body.password,saltRounds,function(err,hash){
//       const newUser=new User({
//         name:req.body.username,
//         password:hash
//       });
//       newUser.save();
//       res.render("secrets");
//     });
//
//   });
//
// app.post("/login",function(req,res){
//   const userName=req.body.username;
//   const password=req.body.password;
//   User.findOne({name:userName},function(err,foundUser){
//     if (foundUser){
//       console.log(foundUser);
//       // if (foundUser.password === md5(req.body.password)){ //md5 decrypt
//       bcrypt.compare(password,foundUser.password,function(err,result){
//         if (result===true){
//           res.render("secrets");
//         }else{
//           console.log("Wrong password, please try again!");
//           res.render("login");
//         }
//       });
//     }else{
//       console.log("Wrong name!");
//       res.render("home");
//     }
//   });
// });



app.listen(3000,function(){
  console.log("Server started on port 3000");
});
