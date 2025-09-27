const mongoose = require("mongoose")
const {Schema} = mongoose

const otpSchema = new Schema({
    userEmail : {
        type : String,
        required : true,
        unqiue : true
    },
    otpCode : {
        type : Number,
        required : true
    },
    createdAt : {
        type : Date,
        required : true,
        expires : 180
    }
})

module.exports = mongoose.model("Otp",otpSchema)