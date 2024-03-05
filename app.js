
if(process.env.NODE_ENV != "production"){
  require('dotenv').config()
}



var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require("express-session");
const MongoStore = require('connect-mongo');

const flash = require("connect-flash");
const passport = require("passport");
const localStrategy = require("passport-local");
var User = require("./routes/user");
var atlasdb = process.env.ATLASDB_URL;
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/list');
const { createSecretKey } = require('crypto');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

const store = MongoStore.create({
  mongoUrl: atlasdb,
  crypto:{
    secret :process.env.SECRET,
  },
  touchAfter:24*3600, 
})

store.on("error",()=>{
  console.log("Error in mongo session store",err);
})

app.use(session({
  store,
  secret :process.env.SECRET,
  resave:false,
  saveUninitialized:false}
))
app.use(flash())

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
  res.locals.success =  req.flash("success")
  res.locals.error =  req.flash("error")
  res.locals.curruser =  req.user;
  next();
});


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
