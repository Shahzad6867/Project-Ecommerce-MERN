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
    categoryId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Category",
        required : true
    },
    variant : {
        type : Number,
        required : true
    },
    quantity : {
        type : Number,
        required : true,
    },
    categoryOfferId : {
        type :  mongoose.Schema.Types.ObjectId,
        ref : "Offer",
        default : null
    },
    productOfferId : {
        type :  mongoose.Schema.Types.ObjectId,
        ref : "Offer",
        default : null
    },
    couponApplied : {
        type :  mongoose.Schema.Types.ObjectId,
        ref : "Coupon",
        default : null
    }
},{timestamps : true})

module.exports = mongoose.model("Cart",cartSchema)