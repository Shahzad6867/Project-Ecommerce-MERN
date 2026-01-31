const mongoose = require("mongoose")
const {Schema} = mongoose

const offerSchema = new Schema({
    offerName : {
        type : String,
        required : true
    },
    applicableOn : {
        type : String,
        required : true
    },
    productId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Product",
        default : null
    },
    productVariant : {
        type : Number,
        default : null
    },
    categoryId : {
         type : mongoose.Schema.Types.ObjectId,
        ref : "Category",
        default : null
    },
    description : {
        type : String,
        required : true
    },
    startDate : {
        type : Date,
        required : true
    },
    endDate : {
        type : Date,
        required : true
    },
    discountType : {
        type : String,
        required : true
    },
    discountValue : {
        type : Number,
        required : true
    },
    productMinPrice : {
        type : Number,
        default : null
    },
    maxDiscountAmount : {
        type : Number, 
        default : null
    },
    bannerImage : {
        type : String,
        default : null
    }
})

module.exports = mongoose.model("Offer",offerSchema)