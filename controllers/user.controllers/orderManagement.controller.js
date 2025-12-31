const Category = require("../../models/category.model.js");
const Product = require("../../models/product.model.js");
const User = require("../../models/user.model.js");
const Brand = require("../../models/brand.model.js");
const Address = require("../../models/address.model.js");
const Cart = require("../../models/cart.model.js");
const Order = require("../../models/order.model.js");
const Payment = require("../../models/payment.model.js");
const mongoose = require("mongoose");
const cloudinary = require("../../config/cloudinaryConfig.js")
require("dotenv").config()

const getCheckout = async (req,res) => {
    let user = req.session.user || req.user
    const productsFullList = await Product.find({}, { productName: 1, variants: 1, categoryId: 1 }).populate("categoryId", "categoryName");
    const cartItems = await Cart.find({userId : user._id}).populate("productId")
    const address = await Address.find({userId : user._id,isDefault : false})
    const defaultAddress = await Address.findOne({userId : user._id,isDefault : true})
    res.render("user-view/user.checkout-page.ejs",{user,productsFullList,cartItems,address,defaultAddress})
}

function orderIdGenerator() {
    const date = new Date().toISOString().slice(0,10).replace(/-/g, "");
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ORD${date}${random}`;
  }
  

const placeOrder = async (req,res) => {
    const items = []
    const stockUnavailable = []


    let user = req.session.user || req.user
    if(Array.isArray(req.body.productId)){
        for(let i = 0 ; i < req.body.productId.length ; i++){
            let product = await Product.findById(req.body.productId[i])
            if( product.variants[req.body.variants[i]].stockStatus !== "Out of Stock" && product.variants[req.body.variants[i]].stockQuantity >= req.body.quantity[i]){
                items.push({
                    productId : req.body.productId[i],
                    productName : req.body.productName[i],
                    variant : req.body.variants[i],
                    quantity : req.body.quantity[i],
                    color : req.body.color[i],
                    size : req.body.size[i],
                    price : req.body.price[i],
                    productImage : req.body.productImages[i]
                  })
            }else{
                if(product.variants[req.body.variants[i]].stockQuantity > 0 && product.variants[req.body.variants[i]].stockQuantity < req.body.quantity[i]){
                    stockUnavailable.push(`${product.productName}-${req.body.size[i]} has only Limited Stock, The maximum quantity you can order is ${product.variants[req.body.variants[i]].stockQuantity}, Please update the quantity in cart and proceed to Checkout_`)
                }else if(product.variants[req.body.variants[i]].stockQuantity === 0 || product.variants[req.body.variants[i]].stockStatus === "Out of Stock"){
                    stockUnavailable.push(`${product.productName}-${req.body.size[i]} is Out of Stock, Click on Proceed to Checkout to proceed with other items in cart_`)
                }
                
            }
           
      
          }
          if(stockUnavailable.length > 0){
            req.session.message = stockUnavailable
            console.log(stockUnavailable)
            return res.redirect("/cart")
          }
    }else{
        let product = await Product.findById(req.body.productId)
        if( product.variants[req.body.variants].stockStatus !== "Out of Stock" && product.variants[req.body.variants].stockQuantity >= req.body.quantity){
            items.push({
                productId : req.body.productId,
                productName : req.body.productName,
                variant : req.body.variants,
                quantity : req.body.quantity,
                color : req.body.color,
                size : req.body.size,
                price : req.body.price,
                productImage : req.body.productImages
              })
        }else{
            if(product.variants[req.body.variants].stockQuantity > 0 && product.variants[req.body.variants].stockQuantity < req.body.quantity){
                stockUnavailable.push(`${product.productName}-${req.body.size} has only Limited Stock, The maximum quantity you can order is ${product.variants[req.body.variants].stockQuantity}, Please update the quantity in cart and proceed to Checkout_`)
            }else if(product.variants[req.body.variants].stockQuantity === 0 || product.variants[req.body.variants].stockStatus === "Out of Stock"){
                stockUnavailable.push(`${product.productName}-${req.body.size} is Out of Stock, Click on Proceed to Checkout to proceed with other items in cart_`)
            }
            
        }
        if(stockUnavailable.length > 0){
            req.session.message = stockUnavailable
            console.log(stockUnavailable)
            return res.redirect("/cart")
      }    
    }
    for(let j = 0 ; j < items.length ; j++){
        let product = await Product.findById(items[j].productId)
            product.variants[items[j].variant].stockQuantity -=  items[j].quantity
            await product.save()
            await Cart.findOneAndDelete({userId : user._id, productId : items[j].productId,variant : items[j].variant})
    }
    
    let order = new Order({
        orderId : orderIdGenerator(),
        userId : user._id,
        addressId : req.body.addressId,
        items : items,
        subTotal : req.body.subTotal,
        tax : req.body.tax,
        grandTotal : req.body.grandTotal,
        paymentId : null,
        statusTimeline : {
            orderedAt : Date.now()
        }
    })
    let confirmedOrder = await order.save()
    let payment = new Payment({
        userId : user._id,
        orderId : confirmedOrder._id,
        amountToBePaid : req.body.grandTotal,
        amountPaid : 0,
        paymentMethod : "Cash on Delivery",
        status : "Pending"
    })
    let savedPayment = await payment.save()
    confirmedOrder.paymentId = savedPayment._id
    await confirmedOrder.save()
    confirmedOrder = await Order.findOne({_id : confirmedOrder._id }).populate("addressId").populate("paymentId")
    const productsFullList = await Product.find({}, { productName: 1, variants: 1, categoryId: 1 }).populate("categoryId", "categoryName");
    const cartItems = await Cart.find({userId : user._id}).populate("productId")
    return res.render("user-view/order-confirmation-page.ejs",{user,confirmedOrder,productsFullList,cartItems})
}
const getOrders = async (req,res) => {
    let user = req.session.user || req.user
    const productsFullList = await Product.find({}, { productName: 1, variants: 1, categoryId: 1 }).populate("categoryId", "categoryName");
    const cartItems = await Cart.find({userId : user._id}).populate("productId")
    const orders = await Order.find({userId : user._id}).sort({createdAt : -1}).populate("paymentId")
    res.render("user-view/user.orders-listing.ejs",{user,productsFullList,cartItems,orders})
}

const getOrderDetailPage = async (req,res) => {
    let user = req.session.user || req.user
    const productsFullList = await Product.find({}, { productName: 1, variants: 1, categoryId: 1 }).populate("categoryId", "categoryName");
    const cartItems = await Cart.find({userId : user._id}).populate("productId")
    const order = await Order.findOne({_id : req.params.id}).populate("addressId").populate("paymentId")
    console.log(order)
    res.render("user-view/user.order-details-page.ejs",{user,productsFullList,cartItems,order})
}

const cancelItem = async (req,res) => {
    let orderId = req.params.id
    let itemId = req.query.item
    let order = await Order.findOne({_id : orderId})
    let payment = await Payment.findOne({_id : order.paymentId})
    console.log(order)
    let everyItemCancelled = 0
    if(order.status[order.status.length - 1] === "Pending"){
        for(let i = 0 ; i < order.items.length ; i++){
            if(String(order.items[i]._id) === String(itemId)){
                let product = await Product.findOne({_id : order.items[i].productId })
                product.variants[order.items[i].variant].stockQuantity += order.items[i].quantity
                await product.save()
                order.items[i].isCancelled = true
                order.subTotal = (order.subTotal -  (order.items[i].price * order.items[i].quantity)).toFixed(2)
                order.tax = (order.subTotal * 0.05).toFixed(2)
                order.grandTotal = (order.subTotal + order.tax).toFixed(2)
                payment.amountToBePaid = order.grandTotal
                await order.save()
                await payment.save()
            }
            if(order.items[i].isCancelled === true){
                everyItemCancelled++
            }
        }
        if(everyItemCancelled === order.items.length){
            order.isCancelled = true
            order.status.push("Cancelled")
            order.statusTimeline.cancelledAt = new Date()
            payment.amountToBePaid = 0
            await order.save()
            await payment.save()
        }
        req.session.message = "This item has been successfully cancelled.<br>Any applicable refund will be processed according to our refund policy."
        return res.status(200).json({
            success : true
        })
    }else{
        return res.status(409).json({
            success : false,
            message : `Cannot cancel the Order, Current Status : ${order.status[order.status.length-1]}`
        })
    }
    
    
    
}

const cancelOrder = async (req,res) => {
    let orderId = req.params.id
    let order = await Order.findOne({_id : orderId})
    let payment = await Payment.findOne({_id : order.paymentId})
    if(order.status[order.status.length - 1] === "Pending"){
        for(let i = 0 ; i < order.items.length ; i++){
       
            let product = await Product.findOne({_id : order.items[i].productId })
            product.variants[order.items[i].variant].stockQuantity += order.items[i].quantity
            await product.save()
            order.items[i].isCancelled = true
            order.subTotal = 0
            order.tax = 0
            order.grandTotal = 0
            payment.amountToBePaid = order.grandTotal
           
               
            }
                order.isCancelled = true
                order.status.push("Cancelled")
                order.statusTimeline.cancelledAt = new Date()
                await order.save()
                await payment.save()
            
            req.session.message = "This Order has been successfully cancelled.<br>Any applicable refund will be processed according to our refund policy."
            return res.status(200).json({
                success : true
            })
    }else{
        return res.status(409).json({
            success : false,
            message : `Cannot cancel the Order, Current Status : ${order.status[order.status.length-1]}`
        })
    }
    
}

const reorder = async (req,res) => {

        try {
        let availablity = []
         const {orderId} = req.query
         let user = req.session.user || req.user
         let order = await Order.findById(orderId)
         console.log(order)
         for(let i = 0 ; i < order.items.length ;i++){
            const product = await Product.findById(order.items[i].productId)
            let stock = product.variants[order.items[i].variant].stockQuantity 
            if(!product.isDeleted){
                if(stock === 0 || product.variants[order.items[i].variant].stockStatus === "Out of Stock"){
                    product.variants[order.items[i].variant].stockStatus = "Out of Stock"
                    await product.save()
                  availablity.push(`${product.productName}${order.items[i].size} is Out of Stock_`)
                }else if(order.items[i].quantity > stock){
                    availablity.push(`${product.productName}${order.items[i].size} has Limited Quantity, The maximum you can order is ${stock}_`)
                    const cartItem = new Cart({
                        userId : user._id,
                        productId : order.items[i].productId,
                        variant : order.items[i].variant,
                        quantity : stock
                    })
                    await cartItem.save()
                }else{
                    const cartItem = new Cart({
                        userId : user._id,
                        productId : order.items[i].productId,
                        variant : order.items[i].variant,
                        quantity : order.items[i].quantity
                    })
                    await cartItem.save()
                }
            }else{
                availablity.push(`${product.productName}${order.items[i].size} is Unavailable_`)
            }
            
         }
         if(availablity.length > 0){
            req.session.message = availablity
         }
         
          return res.status(200).json({
            success : true
          })
        } catch (error) {
         console.log(error)
         res.status(500).json({
             success : false,
             message : "Oops! something went wrong from our side"
         })
        }

}

const getInvoice = async (req,res) => {
    try {
        const order = await Order.findById(req.params.id);
       const downloadUrl = cloudinary.utils.private_download_url(order.invoicePublicId,"pdf",{
        resource_type: "raw",
        expires_at: Math.floor(Date.now() / 1000) + 300
      })
       res.status(200).json({
        downloadUrl
       })
    }catch(error){
        console.log(error)
        res.redirect("/orders")
    }
}

const returnOrder = async(req,res) => {
    const {id} = req.params
    let order = await Order.findById(id)
    order.return.isRequested = true
    order.return.reason = req.body.returnReason
    order.return.requestedAt = new Date()
    order.status.push("Return Requested")
    order.save()
    res.redirect(`/orders/${id}`)
}
module.exports = {
    getCheckout,
    placeOrder,
    getOrders,
    getOrderDetailPage,
    cancelItem,
    cancelOrder,
    reorder,
    getInvoice,
    returnOrder
}