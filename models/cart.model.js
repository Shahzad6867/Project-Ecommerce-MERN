const mongoose = require("mongoose")
const {Schema} = mongoose

const cart = new Schema({
    userId : {
        type : mongoose.Types.ObjectId,
        ref : "User",
        unique : true,
        required : true
    },
    productId  : {
        type : mongoose.Types.ObjectId,
        ref : "Product",
        unique : true,
        required : true
    },
    variant : {
        type : Number,
        required : true
    },
    quantity : {
        type : Number,
        required : true,
    }
},{timestamps : true})

