const mongoose = require("mongoose")
const {Schema} = mongoose

const addressSchema = new Schema({
    
    firstName : {
        type : String,
        required : true
    },
    lastName : {
        type : String,
        required : true
    },
    country : {
        type : String,
        required : true
    },
    state : {
        type : String,
        required : true
    },
    city : {
        type : String,
        require : true
    },
    address : {
        type : String,
        required : true
    }, 
    pincode : {
        type : String,
        required : true
    },
    mobileNo : {
        type : String,
        required : true
    },
    userId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
        required : true
    },
    isDefault : {
        type : Boolean,
        required : true,
        default : false
    }
},{timestamps : true})

module.exports = mongoose.model("Address",addressSchema)