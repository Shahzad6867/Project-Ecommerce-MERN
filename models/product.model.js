const mongoose = require("mongoose")
const {Schema} = mongoose

const variantSchema = Schema({
    stockQuantity: { type: Number, required: false, default : 0 },
    stockStatus: { 
      type: String, 
      enum: ["In Stock", "Out of Stock", "Pre Order"], 
      default: "In-Stock" 
    },
    price: { type: Number, required: false, default : 0.00 },
    size: { type: String }, 
    color: { type: String },
    productImages: {
      type: [String], 
    },
    productOfferId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Offer",
        default : null
    }
},{_id : false})

const productSchema = Schema({
    productName : {
        type : String,
        required : true
    },
    description : {
        type : String,
        required : false,
        default : null
    },
    isDeleted : {
        type : Boolean,
        default : false
    },
    isFeatured : {
        type : Boolean,
        default : false
    },
    categoryId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Category"
    },
    categoryOfferId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Offer",
        default : null
    },
    brandId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Brand"
    },
    variants : [variantSchema],
    
},{timestamps : true})

module.exports = mongoose.model("Product",productSchema)