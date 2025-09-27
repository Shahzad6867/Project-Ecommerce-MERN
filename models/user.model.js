const mongoose = require("mongoose")
const {Schema} = mongoose

const userSchema = new Schema({
    firstName : {
        type : String,
        required : true,
        unique : false
    },
    lastName : {
        type : String,
        required : true,
        unique : false
    },
    email : {
        type : String,
        required : true,
        unique : true
    },
    phone : {
        type : String,
        required : false,
        unique : false
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
        unique : false
    },
    terms : {
        type : String,
        required : true
    }

},{timestamps : true})

module.exports = mongoose.model("User",userSchema)