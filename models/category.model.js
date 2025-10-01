const mongoose = require("mongoose")
const {Schema} = mongoose

const categorySchema = new Schema({
    categoryName : {
        type : String,
        required : true
    },
    description : {
        type : String,
        required : false,
        default : null
    }
},{timestamps : true})

module.exports = mongoose.model("Category",categorySchema)