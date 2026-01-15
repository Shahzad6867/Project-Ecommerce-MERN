const Category = require("../../models/category.model.js");
const Product = require("../../models/product.model.js");
const Wallet = require("../../models/wallet.model.js");
const User = require("../../models/user.model.js");
const Brand = require("../../models/brand.model.js");
const Address = require("../../models/address.model.js");
const Cart = require("../../models/cart.model.js");
const Order = require("../../models/order.model.js");
const Payment = require("../../models/payment.model.js");
const mongoose = require("mongoose");
const cloudinary = require("../../config/cloudinaryConfig.js")
const stripe = require("../../config/stripeConfig.js")
require("dotenv").config()

const getCheckout = async (req,res) => {
    let user = req.session.user || req.user
    let message = req.session.message || null
    delete req.session.message
    const productsFullList = await Product.find({}, { productName: 1, variants: 1, categoryId: 1 }).populate("categoryId", "categoryName");
    const cartItems = await Cart.find({userId : user._id}).populate("productId").populate("productOfferId").populate("categoryOfferId")
    const address = await Address.find({userId : user._id,isDefault : false})
    const defaultAddress = await Address.findOne({userId : user._id,isDefault : true})
    res.render("user-view/user.checkout-page.ejs",{user,productsFullList,cartItems,address,defaultAddress,message})
}

function orderIdGenerator() {
    const date = new Date().toISOString().slice(0,10).replace(/-/g, "");
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ORD${date}${random}`;
  }
  

const placeOrder = async (req,res) => {
    let tax = await stripe.taxRates.create({
        display_name : "VAT",
        percentage : 5,
        inclusive : false
    })

    const items = []
    const lineItems = []
    const stockUnavailable = []

    let user = req.session.user || req.user
    if(Array.isArray(req.body.productId)){
        for(let i = 0 ; i < req.body.productId.length ; i++){
            let product = await Product.findById(req.body.productId[i])
            if( product.variants[req.body.variants[i]].stockStatus !== "Out of Stock" && product.variants[req.body.variants[i]].stockQuantity >= req.body.quantity[i]){
                if(req.body.paymentMethod === "Pay with Stripe"){
                    lineItems.push(
                        {
                            price_data : {
                                currency : "usd",
                                product_data : {name : req.body.productName[i]},
                                unit_amount : req.body.price[i] * 100,
                            },
                            quantity : req.body.quantity[i],
                            tax_rates : [tax.id]
        
                    })
                }
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
            if(req.body.paymentMethod === "Pay with Stripe"){
                lineItems.push({
                        price_data : {
                            currency : "usd",
                            product_data : {name : req.body.productName},
                            unit_amount : req.body.price * 100,
                        },
                        quantity : req.body.quantity,
                        tax_rates : [tax.id]
    
                })
            }
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
    if(req.body.paymentMethod === "Cash on Delivery"){
        for(let j = 0 ; j < items.length ; j++){
            let product = await Product.findById(items[j].productId)
                product.variants[items[j].variant].stockQuantity -=  items[j].quantity
                await product.save()
                await Cart.findOneAndDelete({userId : user._id, productId : items[j].productId,variant : items[j].variant})
        }
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
    confirmedOrder = await order.save()
    let payment = new Payment({
        userId : user._id,
        orderId : confirmedOrder._id,
        amountToBePaid : req.body.grandTotal,
        amountPaid : 0,
        paymentMethod : req.body.paymentMethod,
        status : "Pending",
        relatedTo : "Order"
    })
    let savedPayment = await payment.save()
    confirmedOrder.paymentId = savedPayment._id
    await confirmedOrder.save()
    if(req.body.paymentMethod === "Cash on Delivery"){
        confirmedOrder = await Order.findOne({_id : confirmedOrder._id }).populate("addressId").populate("paymentId")
        const productsFullList = await Product.find({}, { productName: 1, variants: 1, categoryId: 1 }).populate("categoryId", "categoryName");
        const cartItems = await Cart.find({userId : user._id}).populate("productId").populate("productOfferId").populate("categoryOfferId")
        return res.render("user-view/order-confirmation-page.ejs",{user,confirmedOrder,productsFullList,cartItems})
    }else if(req.body.paymentMethod === "Pay with Stripe"){
        try{
            for(let j = 0 ; j < items.length ; j++){
                    await Cart.findOneAndDelete({userId : user._id, productId : items[j].productId,variant : items[j].variant})
            }
            let startDate = new Date()
            savedPayment.orderWillBeCancelledAt = new Date(startDate.getTime() + (48 * 60 * 60 * 1000))
            confirmedOrder.willBeCancelledAt = new Date(startDate.getTime() + (48 * 60 * 60 * 1000))
            await confirmedOrder.save()
            await savedPayment.save()
                const session = await stripe.checkout.sessions.create({
                    mode : "payment",
                    line_items : lineItems,
                    success_url : `http://localhost:1348/checkout/payment-processing/${confirmedOrder._id}`,
                    cancel_url : `http://localhost:1348/order-confirmation/${confirmedOrder._id}?paymentId=${savedPayment._id}&status=Cancelled`,
                    customer_email : user.email,
                    metadata : {
                        user : user._id.toString(),
                        payment : savedPayment._id.toString(),
                        for : "Order"
                    },
                    payment_intent_data : {
                        metadata : {
                            user : user._id.toString(),
                            payment : savedPayment._id.toString(),
                            for : "Order"
                        }
                    }
                })

                return res.redirect(session.url)
            } catch (error) {
                console.log(error)
            }
    }else if(req.body.paymentMethod === "Pay with NovaWallet"){
        let user = req.session.user || req.user
        let wallet = await Wallet.findOne({userId : user._id})
        if(wallet.walletBalance < confirmedOrder.grandTotal){
            await Order.findByIdAndDelete(confirmedOrder._id)
            await Payment.findByIdAndUpdate(savedPayment._id,{status : "Payment Failed"})
            req.session.message = "Insufficient Balance in NovaWallet, Please Top-up the wallet or Pay with Card"
            return res.redirect("/checkout")
        }

        wallet.walletBalance -= savedPayment.amountToBePaid
        wallet.transactions.push({
            paymentId : savedPayment._id,
            transactionType : "Debit",
            transactionReason : "Novamart Purchase",
            transactionAmount : savedPayment.amountToBePaid
        })
       
        savedPayment.amountPaid = savedPayment.amountToBePaid
        savedPayment.amountToBePaid = 0
        savedPayment.status = "Paid Successfully"
        savedPayment.paymentDate = new Date()
        await savedPayment.save()
        await wallet.save()
        for(let j = 0 ; j < items.length ; j++){
            let product = await Product.findById(items[j].productId)
                product.variants[items[j].variant].stockQuantity -=  items[j].quantity
                await product.save()
                await Cart.findOneAndDelete({userId : user._id, productId : items[j].productId,variant : items[j].variant})
        }
        confirmedOrder = await Order.findOne({_id : confirmedOrder._id }).populate("addressId").populate("paymentId")
        const productsFullList = await Product.find({}, { productName: 1, variants: 1, categoryId: 1 }).populate("categoryId", "categoryName");
        const cartItems = await Cart.find({userId : user._id}).populate("productId").populate("productOfferId").populate("categoryOfferId")
        return res.render("user-view/order-confirmation-page.ejs",{user,confirmedOrder,productsFullList,cartItems})
    }
    
}
const retryPayment = async (req,res) => {
    try {
        let user = req.session.user || req.user
        let tax = await stripe.taxRates.create({
            display_name : "VAT",
            percentage : 5,
            inclusive : false
        })
        const {id} = req.params
        const lineItems = []
        const order = await Order.findById(id)
        for(let i = 0 ; i < order.items.length ; i ++){
            if(!order.items[i].isCancelled){
                lineItems.push(
                    {
                        price_data : {
                            currency : "usd",
                            product_data : {name : order.items[i].productName},
                            unit_amount : order.items[i].price * 100,
                        },
                        quantity : order.items[i].quantity,
                        tax_rates : [tax.id]
        
                })
            }
            
        }
        
        const session = await stripe.checkout.sessions.create({
            mode : "payment",
            line_items : lineItems,
            success_url : `http://localhost:1348/checkout/payment-processing/${order._id}`,
            cancel_url : `http://localhost:1348/order-confirmation/${order._id}?paymentId=${order.paymentId}&status=Cancelled`,
            customer_email : user.email,
            metadata : {
                payment : order.paymentId.toString(),
                for : "Order"
            },
            payment_intent_data : {
                metadata : {
                    payment : order.paymentId.toString(),
                    for : "Order"
                }
            }
        })

        return res.redirect(session.url)
    } catch (error) {
        console.log(error)
    }
}
const getPaymentProcessingPage = async (req,res) => {
    const {id} = req.params
    res.render("user-view/payment-processing.ejs",{orderId : id,paymentId : null})
}
const getOrderStatus = async(req,res) => {
    try {
        const {id} = req.params
    const order = await Order.findById(id)
    const payment = await Payment.findById(order.paymentId)
    if(payment.status === "Payment Failed" ){
       return res.status(402).json({
            success : false,
            messsage : "Payment Failed"
        })
    }else if(payment.status === "Paid Successfully"){
       return res.status(200).json({
            success : true,
            messsage : "Paid Successfully"
        })
    }else{
       return res.json({
            messsage : "Pending"
        })
    }
    } catch (error) {
     console.log(error)   
    }
}
const getOrderConfirmationPage = async (req,res) => {
   const {id} = req.params
   if(req.query?.paymentId && req.query?.status === "Cancelled"){
    await Payment.findOneAndUpdate({_id : new mongoose.Types.ObjectId(req.query.paymentId) },{$set : {status : "Payment Failed"}})
   }
   let user = req.session.user || req.user
   const confirmedOrder = await Order.findOne({_id : new mongoose.Types.ObjectId(id) }).populate("addressId").populate("paymentId")
   const productsFullList = await Product.find({}, { productName: 1, variants: 1, categoryId: 1 }).populate("categoryId", "categoryName");
   const cartItems = await Cart.find({userId : user._id}).populate("productId").populate("productOfferId").populate("categoryOfferId")
   console.log(confirmedOrder)
   return res.render("user-view/order-confirmation-page.ejs",{user,confirmedOrder,productsFullList,cartItems})
}
async function cancelOrderWhileOrdersListing(orderId){
    let order = await Order.findOne({_id : orderId})
    let payment = await Payment.findOne({_id : order.paymentId})
    if(order.status[order.status.length - 1] === "Pending"){
        for(let i = 0 ; i < order.items.length ; i++){
       
            let product = await Product.findOne({_id : order.items[i].productId })
            product.variants[order.items[i].variant].stockQuantity += order.items[i].quantity
            await product.save()
            order.items[i].isCancelled = true
               
            }
                order.subTotal = 0
                order.tax = 0
                order.grandTotal = 0
                payment.amountToBePaid = order.grandTotal
                payment.status = "Order Cancelled"
                payment.orderWillBeCancelledAt = null
                order.isCancelled = true
                order.status.push("Cancelled")
                order.statusTimeline.cancelledAt = new Date()
                order.willBeCancelledAt = null
                await order.save()
                await payment.save()
    }
            
}
const getOrders = async (req,res) => {
    try{
        let user = req.session.user || req.user
        const productsFullList = await Product.find({}, { productName: 1, variants: 1, categoryId: 1 }).populate("categoryId", "categoryName");
        const cartItems = await Cart.find({userId : user._id}).populate("productId").populate("productOfferId").populate("categoryOfferId")
        const pendingPaymentOrders = await Order.find({userId : user._id,willBeCancelledAt : {$lt : new Date()}})
        for(let i = 0 ; i < pendingPaymentOrders.length ; i++){
         await cancelOrderWhileOrdersListing(pendingPaymentOrders[i])
        }
        const orders = await Order.find({userId : user._id}).sort({createdAt : -1}).populate("paymentId")
    
        res.render("user-view/user.orders-listing.ejs",{user,productsFullList,cartItems,orders})
    }catch(error){
        console.log(error)
    }
}

const getOrderDetailPage = async (req,res) => {
    let user = req.session.user || req.user
    const productsFullList = await Product.find({}, { productName: 1, variants: 1, categoryId: 1 }).populate("categoryId", "categoryName");
    const cartItems = await Cart.find({userId : user._id}).populate("productId").populate("productOfferId").populate("categoryOfferId")
    const order = await Order.findOne({_id : req.params.id}).populate("addressId").populate("paymentId")
    res.render("user-view/user.order-details-page.ejs",{user,productsFullList,cartItems,order})
}

const cancelItem = async (req,res) => {
    try {
        let orderId = req.params.id
    let itemId = req.query.item
    let user = req.session.user || req.user
    let order = await Order.findOne({_id : orderId})
    let payment = await Payment.findOne({_id : order.paymentId})
    
    let everyItemCancelled = 0
    if(order.status[order.status.length - 1] === "Pending"){
        for(let i = 0 ; i < order.items.length ; i++){
            if(String(order.items[i]._id) === String(itemId)){
                let product = await Product.findOne({_id : order.items[i].productId })
                product.variants[order.items[i].variant].stockQuantity += order.items[i].quantity
                await product.save()
                if (payment.paymentMethod === "Pay with NovaWallet" && order.items[i].isCancelled === false) {
                    let wallet = await Wallet.findOne({userId : user._id})
                    wallet.walletBalance += (order.items[i].price * order.items[i].quantity)
                    wallet.transactions.push({
                        paymentId : payment._id,
                        transactionType : "Credit",
                        transactionReason : "Order Refund",
                        transactionAmount : (order.items[i].price * order.items[i].quantity)
                    })
                    await wallet.save()
                    payment.amountRefunded += (order.items[i].price * order.items[i].quantity)
                }else if (payment.paymentMethod === "Pay with Stripe" && order.items[i].isCancelled === false) {
                    let amount = (order.items[i].price * order.items[i].quantity)
                    payment.amountToBeRefunded += amount
                    let refund = await stripe.refunds.create({
                        payment_intent : payment.paymentIntentId,
                        amount : amount,
                        reason : "requested_by_customer"
                    })
                    console.log(refund)
                    order.items[i].refundOnCancelled = {
                        refundId : refund.id,
                        amount : refund.amount,
                        status : "Initiated",
                        refundedAt : null
                    }
                }else if(payment.paymentMethod === "Cash on Delivery"){
                    payment.amountToBePaid = order.grandTotal
                }
                order.subTotal = (order.subTotal -  (order.items[i].price * order.items[i].quantity)).toFixed(2)
                order.tax = (order.subTotal * 0.05).toFixed(2)
                order.grandTotal = (order.subTotal + order.tax).toFixed(2)
                
                order.items[i].isCancelled = true
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
            order.willBeCancelledAt = null
            payment.status = "Order Cancelled"
            payment.amountToBePaid = 0
            payment.orderWillBeCancelledAt = null
            await order.save()
            await payment.save()
        }
        req.session.message = "Item has been successfully cancelled.<br>Any applicable refund will be processed according to our refund policy."
        return res.status(200).json({
            success : true
        })
    }else{
        return res.status(409).json({
            success : false,
            message : `Cannot cancel the Order, Current Status : ${order.status[order.status.length-1]}`
        })
    }
    } catch (error) {
        console.log(error)
    }
    
    
    
}

const cancelOrder = async (req,res) => {
    let orderId = req.params.id
    let order = await Order.findOne({_id : orderId})
    let payment = await Payment.findOne({_id : order.paymentId})
    let user = req.session.user || req.user
    let wallet = await Wallet.findOne({userId : user._id})
    if(order.status[order.status.length - 1] === "Pending" ){
        let amount = 0
        for(let i = 0 ; i < order.items.length ; i++){
            if(order.items[i].isCancelled === false && (payment.paymentMethod === "Pay with NovaWallet" || payment.paymentMethod === "Pay with Stripe")){
                amount += (order.items[i].price * order.items[i].quantity)
            }
            let product = await Product.findOne({_id : order.items[i].productId })
            product.variants[order.items[i].variant].stockQuantity += order.items[i].quantity
            await product.save()
            
            if (payment.paymentMethod === "Pay with Stripe" && order.items[i].isCancelled === false) {
                payment.amountToBeRefunded += amount
                let refund = await stripe.refunds.create({
                    payment_intent : payment.paymentIntentId,
                    amount : amount,
                    reason : "requested_by_customer"
                })
                console.log(refund)
                order.items[i].refundOnCancelled = {
                    refundId : refund.id,
                    amount : refund.amount,
                    status : "Initiated",
                    refundedAt : null
                }
              }
              order.items[i].isCancelled = true
                
            }

               if(payment.paymentMethod === "Pay with NovaWallet"){
                 wallet.walletBalance += amount
                 wallet.transactions.push({
                    paymentId : payment._id,
                    transactionType : "Credit",
                    transactionReason : "Order Refund",
                    transactionAmount : amount
                 })
                 await wallet.save()
                 payment.amountRefunded += amount
               }
               
                
                payment.amountToBePaid = 0
                payment.status = "Order Cancelled"
                payment.orderWillBeCancelledAt = null
                order.isCancelled = true
                order.status.push("Cancelled")
                order.statusTimeline.cancelledAt = new Date()
                order.willBeCancelledAt = null
                await order.save()
                await payment.save()
            
            req.session.message = "Order has been successfully cancelled.<br>Any applicable refund will be processed according to our refund policy."
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
    try {
        const {id} = req.params
    let order = await Order.findById(id)
    for(let i = 0 ; i < order.items.length ; i++){
        order.items[i].return.isRequested = true
        order.items[i].return.reason = (order.items[i].return.reason === null) ? req.body.returnReason : order.items[i].return.reason
        order.return.requestedAt = (order.items[i].return.requestedAt === null) ? new Date() : order.items[i].return.requestedAt
    }
    result = await cloudinary.uploader.upload(req.file.path,{
        folder : "return-order-proofs",
        resource_type : "image"
      })
    order.return.isRequested = true
    order.return.reason = req.body.returnReason
    order.return.requestedAt = new Date()
    order.status.push("Return Order Requested")
    order.return.proof = result.secure_url
    order.save()
    res.redirect(`/orders/${id}`)
    } catch (error) {
        console.log(error)
    }
}


const returnItem = async (req,res) => {
    try {
        const {id} = req.params
        const {itemIndex} = req.query
    let order = await Order.findById(id)
    result = await cloudinary.uploader.upload(req.file.path,{
        folder : "return-order-proofs",
        resource_type : "image"
      })
    order.items[itemIndex].return.isRequested = true
    order.items[itemIndex].return.reason = req.body.returnReason
    order.items[itemIndex].return.requestedAt = new Date()
    order.items[itemIndex].return.proof = result.secure_url

    let counter = 0
    for(let i = 0 ; i < order.items.length ; i++){
        if(order.items[i].return.isRequested === true){
            counter++
        }
    }
    if(counter === order.items.length){
        order.return.isRequested = true
        order.return.reason = req.body.returnReason
        order.return.requestedAt = new Date()
        order.status.push("Return Order Requested")
    }
    order.save()
    res.redirect(`/orders/${id}`)
    } catch (error) {
        console.log(error)
    }
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
    returnOrder,
    returnItem,
    getOrderConfirmationPage,
    getOrderStatus,
    retryPayment,
    getPaymentProcessingPage
}