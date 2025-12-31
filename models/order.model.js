const mongoose = require("mongoose")
const {Schema} = mongoose

const itemSchema = Schema({
    productId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Product"
    },
    productName : {
        type : String
    },
    variant : {
        type : Number
    },
    quantity : {
        type : Number
    },
    color : {
        type : String
    },
    size : {
      type : String    
    },
    price : {
        type : Number
    },
    productImage : {
        type : String
    },
    isCancelled : {
        type : Boolean,
        default : false
    },
    return: {
        isRequested: { type: Boolean, default: false },
        reason: { type: String, default : null },
        requestedAt: {type: Date, default : null },
        approvedAt: {type: Date, default : null },
        refundedAt: {type: Date, default : null }
      }
})

const statusTimelineSchema = Schema({
    orderedAt : {
        type : Date,
        default : Date.now()
    },
    processedAt : {
        type : Date,
        default : null
    },
    shippedAt : {
        type : Date,
        default : null
    },
    outForDeliveryAt : {
        type : Date,
        default : null
    },
    deliveredAt : {
        type : Date,
        default : null
    },
    cancelledAt : {
        type : Date,
        default : null
    }

})

const orderSchema = Schema({
    orderId : {
        type : String
    },
    userId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
        required : true
    },
    addressId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Address",
        required : true
    },
    items : [itemSchema],
    subTotal : {
        type : Number
    },
    tax : {
        type : Number
    },
    grandTotal : {
        type : Number
    },
    paymentId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Payment"
    },
    status : {
        type: Array,  
      default: ["Pending"]
    },
    isCancelled : {
        type : Boolean,
        default : false
    },
    statusTimeline : statusTimelineSchema,
    invoiceUrl : {
        type : String,
        default : null
    },
    invoiceCreatedAt : {
        type : Date,
        default : null
    },
    return: {
        isRequested: { type: Boolean, default: false },
        reason: { type: String, default : null },
        requestedAt: {type: Date, default : null },
        approvedAt: {type: Date, default : null },
        refundedAt: {type: Date, default : null }
      }
},{timestamps : true})

module.exports = mongoose.model("Order",orderSchema)