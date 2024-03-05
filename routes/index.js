var express = require('express');
var router = express.Router();
var list = require("./list")
var sample = require("./sample");
var User = require("./user")
var wrapAsync = require("./utils/wrapAsync")
var ExpressError = require("./utils/ExpressError")
var Review = require("./review");
const passport = require('passport');
const review = require('./review');
const multer  = require('multer')
const {storage} = require("../cloudconfig")
const upload = multer({ storage })
var path = require("path");




let isOwner = async (req,res,next)=>{
  var id  = req.params.id;
  let listing = await list.findById(id);

  if(!listing.owner._id.equals(res.locals.curruser._id)){

      req.flash("error","You don't have the permission to edit this listing")
     return res.redirect(`/singleList/${id}`)
  }

  next();
 }
let isAuthor = async (req,res,next)=>{
  var {id,reviewId}  = req.params;
  let reView = await review.findById(reviewId);

  if(!reView.author._id.equals(res.locals.curruser._id)){

      req.flash("error","You are not the author of that review")
     return res.redirect(`/singleList/${id}`)
  }

  next();
 }


/* GET users listing. */
router.get('/',wrapAsync(async function(req, res, next) {

  var lists =await list.find({});

  res.render("allListings.ejs",{lists});

  
  
}));
router.get('/insert',wrapAsync(async function(req, res, next) {
 sample.data=sample.data.map((obj)=>({...obj, owner:"65c5b55ef1ecfdeade57707b"}))
 var data= await list.insertMany(sample.data);
  
  console.log(data);
  res.send("created");
}));

router.get('/singleList/:id',wrapAsync(async function(req, res, next) {
var id  = req.params.id;
 var data = await list.findById(id).
 populate({path :"reviews",
          populate:{
          path:"author"
}}).
 populate("owner");
 
 console.log(data);
 
 res.render("displayList.ejs",{data});
  
  
}));


router.get('/addListing',isLoggedin,(async function(req, res, next) {

  
 res.render("createList.ejs");
  
  
}));

router.post('/addListing',upload.single('image'),wrapAsync(async function(req, res, next) {

 
    var data = req.body;
    let url = req.file.path;
    let filename = req.file.filename;
    var created = await new list({
   
     title:data.title,
     description:data.description,
     price:data.price,
     location:data.location,
     country:data.country
   
    })

    created.image = {url,filename}

   created.owner = req.user._id;
    created.save();
   
   req.flash("success","new listing created");
    res.redirect("/")

}));


router.get("/demouser",async function(req,res){
    var user1 = new User({
      email:"abcshr@gmail.com",
      username:"abcshr"
    });

    let registeredUser = await User.register(user1,"helloworld");
    res.send(registeredUser)
})

router.get('/editlist/:id',isLoggedin,wrapAsync(async function(req, res, next) {
  var id  = req.params.id;
  var data = await list.findById(id);

  res.render("editListing.ejs",{data});
 
  
 }));
 
router.post('/editlist/:id',isLoggedin,isOwner,upload.single('image'),wrapAsync(async function(req, res, next) {
 
  var id  = req.params.id;
  var data = req.body;

  var edited = await list.findByIdAndUpdate(id,{

    title:data.title,
    description:data.description,
    price:data.price,
    location:data.location,
    country:data.country


  });

  if(typeof req.file != "undefined"){
    let url = req.file.path;
    let filename = req.file.filename;
    edited.image = {url,filename}
    }
  
    await edited.save();
  req.flash("success","List updated successfully");
  

  res.redirect(`/singleList/${id}`)
  console.log(edited);
  
 }));

 router.post("/addReview/:id",isLoggedin,async function(req,res,next){
  var id = req.params.id;
  
  var listing = await list.findById(id);

  console.log(req.body.comment);
  console.log(req.body.rating);


  var newReview = new Review(req.body)
  newReview.author = req.user._id;
  console.log(newReview);
   listing.reviews.push( newReview );

  await newReview.save();
  await listing.save();
   
   console.log(listing);

   req.flash("success","New review created ");


   res.redirect(`/singleList/${id}`)

});



router.post("/deleteReview/:id/reviews/:reviewId",isAuthor,async(req,res)=>{

  var {id,reviewId} = req.params;


  await list.findByIdAndUpdate(id,{$pull : {reviews : reviewId}});
  await Review.findByIdAndDelete(reviewId);

  req.flash("success","Review deleted successfully");

  res.redirect(`/singleList/${id}`)
});

  

 router.get('/deletelist/:id',isLoggedin,isOwner,wrapAsync(async function(req, res, next) {
  var id  = req.params.id;
  var data = await list.findByIdAndDelete(id);

  console.log(data);

  req.flash("success","Listing deleted successfully");


  res.redirect("/");
 
  
 }));



 router.get("/signup",(req,res,next)=>{

    res.render("signup.ejs")

 })



 router.post("/signup",(req,res,next)=>{
try{

  var {username,email,password} = req.body;

  
  const newuser =new User({email,username});
 const registeredUser = User.register(newuser,password);
 console.log(registeredUser);
 req.flash("success","new user registered")
 res.redirect("/");


}catch(e){
  req.flash("success",e.message);
  res.redirect("/signup")
}
 });



 router.get("/login",(req,res,next)=>{

  res.render("login.ejs")

})



 router.post("/login",saveRedirectUrl,passport.authenticate("local",{
  failureRedirect:"/login",
  failureFlash:true
 }),(req,res,next)=>{

  req.flash("success","Welcome back to Nestify");
  let redirectUrl = res.locals.redirectUrl || "/"
  res.redirect(redirectUrl)
});

router.get("/logout", function(req, res, next){
  req.logout(function(err) {
    if (err) { return next(err); }
    req.flash("success","Logged out successfully");
    res.redirect('/login');
  });
});



 router.all("*",function(req,res,next){
  next( new ExpressError(404,"page not found"))
 });




 function isLoggedin(req,res,next){
  console.log(req.originalUrl);
  if(!req.isAuthenticated()){
    req.session.redirectUrl = req.originalUrl;
    req.flash("error","You should logged in first to do any changes")
    res.redirect("/login")
  }
    next();
 }

 function saveRedirectUrl(req,res,next){
    if(req.session.redirectUrl){
      res.locals.redirectUrl = req.session.redirectUrl
    }

    next();
 }
 
 router.use((error, req, res, next) => {
  let { status = 500, message } = error;
  res.status(status);
  res.render("error.ejs", { error });
});


module.exports = router;


