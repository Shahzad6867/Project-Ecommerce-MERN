const mongoose = require("mongoose")
const {Schema} = mongoose

const userSchema = new Schema({
    firstName : {
        type : String,
        unique : true
    },
    lastName : {
        type : String,
        unique : true
    },
    email : {
        type : String,
        required : true,
        unique : true
    },
    mobileNo : {
        type : String,
        required : false,
        unique : true
    }
    ,
    profileImage : {
        type : String,
        required : false,
        default : null
    }
    ,
    isBlocked : {
        type : Boolean,
        default : false
    }
    ,
    isVerified : {
        type : Boolean,
        default : false
    },
    password : {
        type : String,
        required : false,
    },
    terms : {
        type : String,
        required : true
    }

},{timestamps : true})

module.exports = mongoose.model("User",userSchema)