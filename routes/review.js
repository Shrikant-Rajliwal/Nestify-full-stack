var express = require('express');
var router = express.Router();
var mongoose = require("mongoose");

// mongoose.connect("mongodb://127.0.0.1:27017/Wanderlust");

var reviewSchema = new mongoose.Schema({

    comment:{
        type:String,
    },
    rating:{
        type:Number,
        min:1,
        max:5
    },
    cratedAt:{
        type:Date,
        default:Date.now()
    },
    author:{
        type:mongoose.Types.ObjectId,
        ref:"User"
    }

})

module.exports = mongoose.model("Review",reviewSchema);