var express = require('express');
var router = express.Router();
var mongoose = require("mongoose");
const plm = require("passport-local-mongoose");

const userSchema = mongoose.Schema({
    email:{
        type:String,
        required:true
    },

})

userSchema.plugin(plm);

module.exports = mongoose.model("User" , userSchema);