const mongoose = require("mongoose")
const {Schema} = mongoose

const cartSchema = new Schema({
    userId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
        required : true
    },
    productId  : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Product",
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

module.exports = mongoose.model("Cart",cartSchema)