const mongoose = require("mongoose")
const {Schema} = mongoose

const categorySchema = new Schema({
    categoryName : {
        type : String,
        required : true
    },
    categoryImage : {
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

module.exports = mongoose.model("Category",categorySchema)