const mongoose = require("mongoose")
const {Schema} = mongoose

const brandSchema = new Schema({
    brandName : {
        type : String,
        required : true
    },
    brandImage : {
        type : String,
        required : false,
        default : null
    },
    description : {
        type : String,
        required : false,
        default : null
    },
    isDeleted : {
        type : Boolean,
        default : false
    }
},{timestamps : true})

module.exports = mongoose.model("Brand",brandSchema)