const Category = require("../../models/category.model.js");
const Product = require("../../models/product.model.js");
const Wallet = require("../../models/wallet.model.js");
const User = require("../../models/user.model.js");
const Brand = require("../../models/brand.model.js");
const Address = require("../../models/address.model.js");
const Cart = require("../../models/cart.model.js");
const Wishlist = require("../../models/wishlist.model.js");
const Offer = require("../../models/offer.model.js");
const Coupon = require("../../models/coupon.model.js");
const Order = require("../../models/order.model.js");
const Payment = require("../../models/payment.model.js");
const mongoose = require("mongoose");
const cloudinary = require("../../config/cloudinaryConfig.js")
const stripe = require("../../config/stripeConfig.js")
require("dotenv").config()

const placeOrder = async (userId,bodyPrice,bodyOfferPrice) => {
    
}
const getOrdersStatus = async (orders) => {
    const statuses = []
    for(let i = 0 ; i < orders.length ; i++){
        const items = orders[i].items.filter(item => item.status !== "Cancelled")
        const statusesList = items.map(item => item.status)
        const all = (status) => statusesList.every(s => s === status)
        const some = (status) => statusesList.some(s => s === status)

        if (items.length === 0) {
            statuses.push("Cancelled")
        }else if (all("Return Requested")) {
            statuses.push("Return Requested")
        }
        else if (all("Return Request Approved")) {
            statuses.push("Returned")
        }
        else if (all("Return Request Declined")) {
            statuses.push("Return Declined")
        }
        else if (some("Return Requested") || some("Return Request Approved")) {
            statuses.push("Partially Returned")
        }
        else if (all("Delivered")) {
            statuses.push("Delivered")
        }
        else if (some("Delivered")) {
            statuses.push("Partially Delivered")
        }
        else if (all("Out for Delivery")) {
            statuses.push("Out for Delivery")
        }
        else if (some("Shipped") || some("Out for Delivery")) {
            statuses.push("Partially Shipped")
        }
        else if (all("Processed")) {
            statuses.push("Processed")
        }
        else if (some("Processed")) {
            statuses.push("Partially Processed")
        }
        else if (all("Placed")) {
            statuses.push("Placed")
        }

    }
    return statuses
}

module.exports = {
    placeOrder,
    getOrdersStatus,
    
}