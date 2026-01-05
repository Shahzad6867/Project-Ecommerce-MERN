const mongoose = require("mongoose")
const {Schema} = mongoose

const paymentSchema = new Schema({
    userId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
        required : true
    },
    orderId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Order",
        required : true,
        default : null
    },
    amountToBePaid : {
        type : Number
    },
    amountPaid : {
        type : Number,
        default : 0
    },
    paymentDate : {
        type : Date,
        default : null
    },
    paymentMethod : {
        type : String,
        enum : ["Cash on Delivery","Pay with Stripe","Pay with NovaWallet"]
    },
    status : {
        type : String,
        enum : ["Pending","Paid Successfully","Payment Failed","Order Cancelled"]
    },
    orderWillBeCancelledAt : {
        type : Date,
        default : null
    }
})

module.exports = mongoose.model("Payment",paymentSchema)