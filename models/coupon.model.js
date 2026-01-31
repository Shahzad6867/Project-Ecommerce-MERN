const mongoose = require("mongoose")
const {Schema} = mongoose

const couponSchema = new Schema({
    name : {
        type : String,
        required : true
    },
    description : {
        type : String,
        required : true
    },
    endDate : {
        type : Date,
        required : true
    },
    discountValue : {
        type : Number,
        required : true
    },
     minAmount : {
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
    },
    userId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
        default : null
    },
    maxUsage : {
        type : Number,
        default : null
    }
})

module.exports = mongoose.model("Coupon",couponSchema)