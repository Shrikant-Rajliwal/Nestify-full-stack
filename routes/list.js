var express = require('express');
var router = express.Router();
var mongoose = require("mongoose");
var review = require("./review")

var atlasdb = process.env.ATLASDB_URL;
mongoose.connect(atlasdb);

var listSchema = new mongoose.Schema({

  title:{ type: String},
  image:{
    url: String,
    filename:String,
  },
  description:{ type: String },
  price:{ type: Number },
  location:{ type: String },
  country:{ type: String},
  reviews:[{
    type:mongoose.Types.ObjectId,
    ref:"Review"
  }],
  owner:{
    type:mongoose.Types.ObjectId,
    ref:"User"
  },
  category: {
    type: String,
    enum: ['Mountains', 'Sweaming pools', 'Beach', 'Arctic','farms']
  }
});



listSchema.post("findOneAndDelete",async function(listing){

  if(listing.reviews.length){
     await review.deleteMany({_id : {$in : listing.reviews}}) 
  }
  console.log("deleted");

})

var list  = mongoose.model("list",listSchema);


module.exports = list;
