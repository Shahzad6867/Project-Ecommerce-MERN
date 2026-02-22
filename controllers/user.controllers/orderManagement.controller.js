const Category = require("../../models/category.model.js");
const Product = require("../../models/product.model.js");
const Wallet = require("../../models/wallet.model.js");
const User = require("../../models/user.model.js");
const Brand = require("../../models/brand.model.js");
const Address = require("../../models/address.model.js");
const Cart = require("../../models/cart.model.js");
const Wishlist = require("../../models/wishlist.model.js");
const Coupon = require("../../models/coupon.model.js");
const usedCoupon = require("../../models/usedCoupon.model.js");
const Order = require("../../models/order.model.js");
const Payment = require("../../models/payment.model.js");
const mongoose = require("mongoose");
const cloudinary = require("../../config/cloudinaryConfig.js")
const stripe = require("../../config/stripeConfig.js")
require("dotenv").config()
const fs = require("fs")
const path = require("path")
const orderService = require("../../services/user-services/orderService.js")
const adminOrderService = require("../../services/admin-services/ordersService.js")

const getCheckout = async (req,res) => {
    let user = req.session.user || req.user
    let message = req.session.message || null
    delete req.session.message

    const productsFullList = await Product.find({}, { productName: 1, variants: 1, categoryId: 1 }).populate("categoryId", "categoryName");
    const cartItems = await Cart.find({userId : user._id}).populate("productId").populate("categoryId").populate("brandId").populate("productOfferId").populate("categoryOfferId").populate("couponApplied")
    for(let i = 0 ; i < cartItems.length ; i++){
        if(cartItems[i].productId.variants[cartItems[i].variant].isBlocked || cartItems[i].categoryId.isDeleted || cartItems[i].brandId.isDeleted ){
            req.session.message = "Some items in your cart are unavailable. Please remove them to continue"
            return res.redirect("/cart")
        } else if(cartItems[i].productId.variants[cartItems[i].variant].stockQuantity === 0 || cartItems[i].productId.variants[cartItems[i].variant].stockStatus === "Out of Stock"){
            req.session.message = "Some items in your cart are Out of Stock. Please remove them to continue"
            return res.redirect("/cart")
        } 
    }
    const wishlistItemsCount = await Wishlist.find({userId : user._id}).countDocuments()
    const address = await Address.find({userId : user._id,isDefault : false})
    const defaultAddress = await Address.findOne({userId : user._id,isDefault : true})
    const search = req.query.search || null
    res.render("user-view/user.checkout-page.ejs",{user,productsFullList,cartItems,address,defaultAddress,message,wishlistItemsCount,search})
}

function orderIdGenerator() {
    const date = new Date().toISOString().slice(0,10).replace(/-/g, "");
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ORD${date}${random}`;
  }
  

const placeOrder = async (req,res) => {
    
    
    let user = req.session.user || req.user
    let subTotal = 0
    let grandTotal = 0
    let shipping = 10
    let tax = 0
    let cartItems = await Cart.find({userId : user._id}).populate("productId").populate("categoryId").populate("brandId").populate("productOfferId").populate("categoryOfferId").populate("couponApplied")
    const lineItems = []
    const items = []
    const stockUnavailable = []
    const now = new Date()
    for(let i = 0 ; i < cartItems.length ; i++){
        const productId = cartItems[i].productId._id
        const productName = cartItems[i].productId.productName
        const variant = cartItems[i].variant
        const quantity = cartItems[i].quantity
        const size = cartItems[i].productId.variants[variant].size
        const color = cartItems[i].productId.variants[variant].color
        const price = cartItems[i].productId.variants[variant].price
        const productImage = cartItems[i].productId.variants[variant].productImages[0]
        const reqBodyPrice = (Array.isArray(req.body.price)) ? Number(req.body.price[i]) : Number(req.body.price)
        const reqBodyOfferPrice = (Array.isArray(req.body.offerPrice)) ? Number(req.body.offerPrice[i]) : Number(req.body.offerPrice)
        let offerPrice = price
        if(cartItems[i].productId.variants[variant].isBlocked === true || cartItems[i].categoryId.isDeleted === true || cartItems[i].brandId.isDeleted === true){
            req.session.message = "Some items in your cart are unavailable. Please remove them to continue"
            return res.redirect("/cart")
         }

        if(cartItems[i].productId.variants[variant].stockQuantity > 0 && cartItems[i].productId.variants[variant].stockQuantity < quantity){
            stockUnavailable.push(`${productName}-${size} has only Limited Stock, The maximum quantity you can order is ${cartItems[i].productId.variants[variant].stockQuantity}, Please update the quantity in cart and proceed to Checkout_`)
        }else if(cartItems[i].productId.variants[variant].stockQuantity === 0 || cartItems[i].productId.variants[variant].stockQuantity === "Out of Stock"){
            req.session.message = "Some items in your cart are Out of Stock. Please remove them to continue"
            return res.redirect("/cart")
        }
        
        if(stockUnavailable.length > 0){
            req.session.message = stockUnavailable
            return res.redirect("/cart")
          }

          let productOfferPrice = null
          let categoryOfferPrice = null

          
          const productOffer =
          cartItems[i].productOfferId &&
          cartItems[i].productOfferId.startDate <= now &&
          cartItems[i].productOfferId.endDate >= now
              ? cartItems[i].productOfferId
              : null

          const categoryOffer =
          cartItems[i].categoryOfferId &&
          cartItems[i].categoryOfferId.startDate <= now &&
          cartItems[i].categoryOfferId.endDate >= now
              ? cartItems[i].categoryOfferId
              : null
          
          
          if (productOffer) {
          if (productOffer.discountType === "percentage") {
              productOfferPrice =
              price - (price * productOffer.discountValue) / 100
          } else if (productOffer.discountType === "flat") {
              productOfferPrice =
              price - productOffer.discountValue
          }
          }

          if (categoryOffer) {
          if (categoryOffer.discountType === "percentage") {
              const percentPrice =
              price - (price * categoryOffer.discountValue) / 100

              const maxPrice =
              price - categoryOffer.maxDiscountAmount

              categoryOfferPrice = Math.max(percentPrice, maxPrice)

          } else if (categoryOffer.discountType === "flat") {
              if (price > categoryOffer.productMinPrice) {
              categoryOfferPrice =
                  price - categoryOffer.discountValue
              }
          }
          }

          
          if (productOfferPrice !== null && categoryOfferPrice !== null) {
          offerPrice = Math.min(productOfferPrice, categoryOfferPrice)

          } else if (productOfferPrice !== null) {
          offerPrice = productOfferPrice

          } else if (categoryOfferPrice !== null) {
          offerPrice = categoryOfferPrice
          }
          
          if(reqBodyPrice !== price){
            req.session.message = "Prices may have changed, Please verify it and proceed to checkout"
            return res.redirect("/cart")
          }

          if(reqBodyOfferPrice !== offerPrice){
            req.session.message = "Offers may have changed, Please verify it and proceed to checkout"
            return res.redirect("/cart")
          }
          
          
          subTotal += offerPrice * quantity
        if(req.body.paymentMethod === "Pay with Stripe"){
            lineItems.push(
                {
                    price_data : {
                        currency : "usd",
                        product_data : {name : productName},
                        unit_amount : Math.round(Number(offerPrice.toFixed(2)) * 100),
                    },
                    quantity : quantity,
                    tax_rates : ["txr_1SvBzlBUciUB3yZurNMc9lzT"]

            })
        }
        items.push({
            productId : productId,
            productName : productName,
            variant : variant,
            quantity : quantity,
            color : color,
            size : size,
            price : price,
            offerPrice : offerPrice,
            productImage : productImage,
          })
       
    }
    let discountAmount = 0
    let stripeCoupon = null
    let userUsedCoupon = null
    if(JSON.parse(req.body.isCouponApplied) === true){
        if (cartItems[0]?.couponApplied !== null &&  subTotal >= cartItems[0]?.couponApplied.minAmount ) { 
            if(cartItems[0]?.couponApplied.endDate >= now){
                if (cartItems[0]?.couponApplied.discountType === "percentage") {
                    discountAmount = (subTotal * cartItems[0]?.couponApplied.discountValue) / 100 
                    if (discountAmount > cartItems[0]?.couponApplied.maxDiscountAmount) { 
                        discountAmount = cartItems[0]?.couponApplied.maxDiscountAmount 
                    } 
                }else{
                    discountAmount = cartItems[0]?.couponApplied.discountValue 
                }
                if(cartItems[0].couponApplied.name === "REFERRALCOUPON"){
                    await Coupon.deleteOne({_id : cartItems[0].couponApplied._id})
                }else{
                     userUsedCoupon = new usedCoupon({
                        couponId : cartItems[0].couponApplied._id,
                        userId : user._id
                    })
                    
                }
            }else{
                if(cartItems[0].couponApplied.name === "REFERRALCOUPON"){
                    await Coupon.deleteOne({_id : cartItems[0].couponApplied._id})
                    await Cart.updateMany({userId : user._id},{couponApplied : null})
                }else{
                    await Cart.updateMany({userId : user._id},{couponApplied : null})
                }
                req.session.message = "Coupon expired. Select another coupon or proceed to checkout."
                return res.redirect("/cart")
            }

            if(req.body.paymentMethod === "Pay with Stripe"){
                stripeCoupon = await stripe.coupons.create({
                    amount_off : Math.round(Number(discountAmount.toFixed(2)) * 100),
                    duration : "once",
                    currency : "usd",
                    name : cartItems[0]?.couponApplied.name
                })
            }
            
        } 
       

    }
    tax = (subTotal - discountAmount) * 0.05
    grandTotal = Math.round((subTotal - discountAmount + tax + shipping) * 100) / 100
    if(req.body.paymentMethod === "Cash on Delivery"){
        if(grandTotal > 100){
            req.session.message = "Order amount greater than $100 will not be eligible for Cash on Delivery"
            return res.redirect("/checkout")
        }
    }
    
    let address = await Address.findOne({_id : req.body.addressId})
    let addressObj = {
        firstName : address.firstName,
        lastName : address.lastName,
        country : address.country,
        state : address.state,
        city : address.city,
        address : address.address, 
        pincode : address.pincode,
        mobileNo : address.mobileNo
    }
    
    let order = new Order({
        orderId : orderIdGenerator(),
        userId : user._id,
        address : addressObj,
        items : items,
        subTotal : subTotal,
        shipping : shipping,
        tax : tax,
        discount : discountAmount,
        couponCode : (discountAmount > 0) ? cartItems[0].couponApplied.name : null,
        grandTotal : grandTotal,
        paymentId : null,
    })
    confirmedOrder = await order.save()
    let payment = new Payment({
        userId : user._id,
        orderId : confirmedOrder._id,
        amountToBePaid : grandTotal,
        amountPaid : 0,
        paymentMethod : req.body.paymentMethod,
        status : "Pending",
        relatedTo : "Order"
    })
    if(userUsedCoupon !== null){
        await userUsedCoupon.save()
    }
    let savedPayment = await payment.save()
    confirmedOrder.paymentId = savedPayment._id
    await confirmedOrder.save()
    if(req.body.paymentMethod === "Cash on Delivery"){
            for(let j = 0 ; j < items.length ; j++){
                let product = await Product.findById(items[j].productId)
                    product.variants[items[j].variant].stockQuantity -=  items[j].quantity
                    await product.save()
            }
            await Cart.deleteMany({userId : user._id})
        confirmedOrder = await Order.findOne({_id : confirmedOrder._id }).populate("paymentId")
        return res.redirect(`/order-confirmation/${confirmedOrder._id}`)
    }else if(req.body.paymentMethod === "Pay with Stripe"){
        try{
            await Cart.deleteMany({userId : user._id})
            let startDate = new Date()
            savedPayment.orderWillBeCancelledAt = new Date(startDate.getTime() + (48 * 60 * 60 * 1000))
            confirmedOrder.willBeCancelledAt = new Date(startDate.getTime() + (48 * 60 * 60 * 1000))
            await confirmedOrder.save()
            await savedPayment.save()
            const sessionConfig = {
                mode: "payment",
                line_items: lineItems,
                shipping_options: [
                    {
                        shipping_rate_data: {
                            type: "fixed_amount",
                            fixed_amount: { amount: 1000, currency: "usd" },
                            display_name: "Ground Shipping",
                            delivery_estimate: {
                                minimum: { unit: "business_day", value: 5 },
                                maximum: { unit: "business_day", value: 7 },
                            },
                        },
                    },
                ],
                success_url: `http://localhost:1348/checkout/payment-processing/${confirmedOrder._id}`,
                cancel_url: `http://localhost:1348/order-confirmation/${confirmedOrder._id}?paymentId=${savedPayment._id}&status=Cancelled`,
                customer_email: user.email,
                metadata: {
                    user: user._id.toString(),
                    payment: savedPayment._id.toString(),
                    for: "Order",
                },
                payment_intent_data: {
                    metadata: {
                        user: user._id.toString(),
                        payment: savedPayment._id.toString(),
                        for: "Order",
                    },
                },
            };
            
            // Add discount only if valid
            if (stripeCoupon !== null && req.body.paymentMethod === "Pay with Stripe") {
                sessionConfig.discounts = [{ coupon: stripeCoupon.id }];
            }
            
            const session = await stripe.checkout.sessions.create(sessionConfig);
            return res.redirect(session.url)
            } catch (error) {
                console.log(error)
            }
    }else if(req.body.paymentMethod === "Pay with NovaWallet"){
        let wallet = await Wallet.findOne({userId : new mongoose.Types.ObjectId(user._id)})
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
        }
        await Cart.deleteMany({userId : user._id})
        confirmedOrder = await Order.findOne({_id : confirmedOrder._id }).populate("paymentId")
        return res.redirect(`/order-confirmation/${confirmedOrder._id}`)
    }
    
}
const retryPayment = async (req,res) => {
    try {
        let user = req.session.user || req.user
        
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
                            unit_amount : order.items[i].offerPrice * 100,
                        },
                        quantity : order.items[i].quantity,
                        tax_rates : ["txr_1SvBzlBUciUB3yZurNMc9lzT"]
        
                })
            }
            
        }
        let session = null
        if(order.discount > 0){
            let coupon = await stripe.coupons.create({
                amount_off :  Math.floor(Number(order.discount) * 100),
                duration : "once",
                currency : "usd",
                name : order.couponCode
            })
            session = await stripe.checkout.sessions.create({
                mode : "payment",
                line_items : lineItems,
                discounts : [{
                    coupon : coupon.id
                }
                ],
                shipping_options : [
                    {
                        shipping_rate_data : {
                            type : "fixed_amount",
                            fixed_amount : {amount : 1000, currency : "usd" },
                            display_name : "Ground Shipping",
                            delivery_estimate: {
                                minimum: {unit: 'business_day', value: 5},
                                maximum: {unit: 'business_day', value: 7},
                              }
                        }
                    }
                ],
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
        }else{
            session = await stripe.checkout.sessions.create({
                mode : "payment",
                line_items : lineItems,
                shipping_options : [
                    {
                        shipping_rate_data : {
                            type : "fixed_amount",
                            fixed_amount : {amount : 1000, currency : "usd" },
                            display_name : "Ground Shipping",
                            delivery_estimate: {
                                minimum: {unit: 'business_day', value: 5},
                                maximum: {unit: 'business_day', value: 7},
                              }
                        }
                    }
                ],
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
        }
        
        

        return res.redirect(session.url)
    } catch (error) {
        console.log(error)
    }
}
const getPaymentProcessingPage = async (req,res) => {
    const {id} = req.params
    res.render("user-view/payment-processing.ejs",{orderId : id,paymentId : null})
}
const getPaymentStatus = async(req,res) => {
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
   const confirmedOrder = await Order.findOne({_id : new mongoose.Types.ObjectId(id) }).populate("paymentId")
   const productsFullList = await Product.find({}, { productName: 1, variants: 1, categoryId: 1 }).populate("categoryId", "categoryName");
   const cartItems = await Cart.find({userId : user._id}).populate("productId").populate("productOfferId").populate("categoryOfferId")
   const wishlistItemsCount = await Wishlist.find({userId : user._id}).countDocuments()
   const search = req.query.search || null
   return res.render("user-view/order-confirmation-page.ejs",{user,confirmedOrder,productsFullList,cartItems,wishlistItemsCount,search})
}
async function cancelOrderWhileOrdersListing(orderId){
    let order = await Order.findOne({_id : orderId})
    let payment = await Payment.findOne({_id : order.paymentId})
    if(order.items.every(item => item.status === "Placed")){
        for(let i = 0 ; i < order.items.length ; i++){
       
            let product = await Product.findOne({_id : order.items[i].productId })
                product.variants[order.items[i].variant].stockQuantity += order.items[i].quantity
                await product.save()
                order.items[i].isCancelled = true
                order.items[i].statusTimeline.cancelledAt = new Date()
            }
                
                payment.amountToBePaid = order.grandTotal
                payment.status = "Order Cancelled"
                payment.orderWillBeCancelledAt = null
                order.isCancelled = true
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
        const orders = await Order.find({userId : new mongoose.Types.ObjectId(user._id)}).sort({createdAt : -1}).populate("paymentId")
        const ordersStatus = await orderService.getOrdersStatus(orders)
        const wishlistItemsCount = await Wishlist.find({userId : user._id}).countDocuments()
        const result = await Order.aggregate([
            {
                $match : {
                    isCancelled : false,
                    isReturned : false
                }
            },{
              $lookup : {
                from : "payments",
                localField : "paymentId",
                foreignField : "_id",
                as : "paymentId"
              }  
            },{
                $unwind : "$paymentId"
            },{
                $match : {
                   "paymentId.paymentMethod" : "Pay with Stripe"
                }
            },{
                $match : {
                    "items.statusTimeline.deliveredAt" : {$ne : null}
                }
            },{
                $match : {
                    grandTotal : {
                        $gte : 1000,
                        $lt : 10000
                    } 
                }
            },{
                $group : {_id : null, totalOrderAmount : {$sum : "$grandTotal"}}
            }
        ])
        const search = req.query.search || null
        res.render("user-view/user.orders-listing.ejs",{user,productsFullList,cartItems,orders,wishlistItemsCount,ordersStatus,search})
    }catch(error){
        console.log(error)
    }
}

const getOrderDetailPage = async (req,res) => {
    let user = req.session.user || req.user
    const productsFullList = await Product.find({}, { productName: 1, variants: 1, categoryId: 1 }).populate("categoryId", "categoryName");
    const cartItems = await Cart.find({userId : user._id}).populate("productId").populate("productOfferId").populate("categoryOfferId")
    const order = await Order.findOne({_id : req.params.id}).populate("paymentId")
    const wishlistItemsCount = await Wishlist.find({userId : user._id}).countDocuments()
    const search = req.query.search || null
    let message = req.session.message || null
    delete req.session.message
    res.render("user-view/user.order-details-page.ejs",{user,productsFullList,cartItems,order,wishlistItemsCount,message,search})
}

const cancelItem = async (req,res) => {
    try {
        let orderId = req.params.id
    let itemId = req.query.item
    let user = req.session.user || req.user
    let order = await Order.findOne({_id : orderId})
    let payment = await Payment.findOne({_id : order.paymentId})
    
    let everyItemCancelled = 0
        for(let i = 0 ; i < order.items.length ; i++){
            if(String(order.items[i]._id) === String(itemId)){
                if(order.items[i].status !== "Placed"){
                    return res.status(409).json({
                        success : false,
                        message : `Cannot cancel the Order, Current Status : ${order.items[i].status}`
                    })
                }
                let amount = 0
                if(order.discount > 0){
                    let discountDividedByItems = order.discount / order.items.length 
                    amount = (order.items[i].offerPrice  * order.items[i].quantity) - discountDividedByItems
                 }else{
                    amount = order.items[i].offerPrice * order.items[i].quantity
                 }
                 amount = Math.round(amount * 100) / 100
                let product = await Product.findOne({_id : order.items[i].productId })
                product.variants[order.items[i].variant].stockQuantity += order.items[i].quantity
                if (payment.paymentMethod === "Pay with NovaWallet" && order.items[i].isCancelled === false && payment.status !== "Pending" && payment.status !== "Payment Failed" ) {
                    let wallet = await Wallet.findOne({userId : user._id})
                    wallet.walletBalance += amount
                    wallet.transactions.push({
                        paymentId : payment._id,
                        transactionType : "Credit",
                        transactionReason : "Order Refund",
                        transactionAmount : amount
                    })
                    await wallet.save()
                    payment.amountRefunded += amount
                    order.items[i].refundOnCancelled = {
                        refundId : null,
                        amount : amount,
                        status : "Refunded",
                        refundedAt : new Date()
                    }
                }else if (payment.paymentMethod === "Pay with Stripe" && order.items[i].isCancelled === false && payment.status !== "Pending" && payment.status !== "Payment Failed") {
                    payment.amountToBeRefunded += amount
                    let refund = await stripe.refunds.create({
                        payment_intent : payment.paymentIntentId,
                        amount : amount * 100,
                        reason : "requested_by_customer"
                    })
                    
                    order.items[i].refundOnCancelled = {
                        refundId : refund.id,
                        amount : amount,
                        status : "Initiated",
                        refundedAt : null
                    }
                }

                order.items[i].isCancelled = true
                order.items[i].status = "Cancelled"
                order.items[i].statusTimeline.cancelledAt = new Date()
                
                if(payment.paymentMethod === "Cash on Delivery"){
                    const discount = order.discount / order.items.length 
                    let amountOfItemsNotCancelled = 0
                    let itemsCount = 0
                    if(order.discount > 0){
                        for(let i = 0 ; i < order.items.length ; i++){
                            if(!order.items[i].isCancelled && order.items[i].statusTimeline.deliveredAt === null){
                                itemsCount++
                                amountOfItemsNotCancelled += (order.items[i].offerPrice  * order.items[i].quantity) - discount
                            }
                        }
                    }
                    const subTotal = amountOfItemsNotCancelled
                    const tax = subTotal * 0.05
                    const shipping = (amountOfItemsNotCancelled > 0) ? order.shipping : 0
                    const amountToBePaid = Math.round((subTotal + tax + shipping) * 100) / 100
                    payment.amountToBePaid = amountToBePaid  
                    let nonCancelledItems = order.items.filter(item => !item.isCancelled)
                    if(nonCancelledItems.every(item => item.statusTimeline.deliveredAt !== null)){
                        payment.status = "Paid Successfully"
                    }
                     
                }
                
                
               
               
                
               
                await product.save()
                await order.save()
                await payment.save()
            }
            if(order.items[i].isCancelled === true){
                everyItemCancelled++
            }
        }
        if(everyItemCancelled === order.items.length){
            order.isCancelled = true
            order.willBeCancelledAt = null
            payment.status = "Order Cancelled"
            payment.amountToBePaid = 0
            payment.orderWillBeCancelledAt = null
            await order.save()
            await payment.save()
        }
        order = await Order.findById(order._id)
        let nonCancelledItems = order.items.filter(item => !item.isCancelled)
        if(order.invoiceCreatedAt === null && order.invoiceUrl === null){
        let allDelivered = nonCancelledItems.every(item => item.statusTimeline.deliveredAt !== null)
        if (allDelivered) {
            setImmediate(() => adminOrderService.generateAndUploadInvoice(order._id))
          }             
        } 
        req.session.message = "Item has been successfully cancelled.<br>Any applicable refund will be processed according to our refund policy."
        return res.status(200).json({
            success : true
        })
  
       
    
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
    if(order.items.every(item => item.statusTimeline.processedAt === null) ){
        let sumOfAmounts = 0
        for(let i = 0 ; i < order.items.length ; i++){
            let amount = 0
            if(order.items[i].isCancelled === false && (payment.paymentMethod === "Pay with NovaWallet" || payment.paymentMethod === "Pay with Stripe")){
                if(order.discount > 0){
                    let discountDividedByItems = order.discount / order.items.length 
                    amount += ((order.items[i].offerPrice  * order.items[i].quantity) - discountDividedByItems)
                 }else{
                    amount += (order.items[i].offerPrice  * order.items[i].quantity)
                 }
                 const nonCancelledItems = order.items.filter(item => !item.isCancelled)
                 const taxPerItem = order.tax / nonCancelledItems.length
                 const shippingPerItem = order.shipping / nonCancelledItems.length
                amount = Number((amount + taxPerItem + shippingPerItem).toFixed(2))
                sumOfAmounts += amount
                order.items[i].refundOnCancelled = {
                    refundId : null,
                    amount : amount,
                    status : "Initiated",
                    refundedAt : null
                }
                let product = await Product.findOne({_id : order.items[i].productId })
                product.variants[order.items[i].variant].stockQuantity += order.items[i].quantity
                await product.save()
            }    
            if(order.items[i].isCancelled === false && payment.paymentMethod === "Cash on Delivery"){
                order.items[i].isCancelled = true
                order.items[i].status = "Cancelled"
                order.items[i].statusTimeline.cancelledAt = new Date()
                
                let product = await Product.findOne({_id : order.items[i].productId })
                product.variants[order.items[i].variant].stockQuantity += order.items[i].quantity
                await product.save()
            }    
         }
                if (payment.paymentMethod === "Pay with Stripe" && payment.status !== "Pending" && payment.status !== "Payment Failed") {
                    payment.amountToBeRefunded += sumOfAmounts
                    let refund = await stripe.refunds.create({
                        payment_intent : payment.paymentIntentId,
                        amount : Math.round(sumOfAmounts * 100),
                        reason : "requested_by_customer"
                    })
                    order.items.forEach(item => {
                        if(item.isCancelled === false){
                            item.refundOnCancelled.refundId = refund.id
                            item.isCancelled = true
                            item.status = "Cancelled"
                            item.statusTimeline.cancelledAt = new Date()
                        }
                    })
                }
            
               if(payment.paymentMethod === "Pay with NovaWallet" && payment.status !== "Pending" && payment.status !== "Payment Failed"){
                 wallet.walletBalance += sumOfAmounts
                 wallet.transactions.push({
                    paymentId : payment._id,
                    transactionType : "Credit",
                    transactionReason : "Order Refund",
                    transactionAmount : sumOfAmounts
                 })
                 await wallet.save()
                 payment.amountRefunded += sumOfAmounts
                 for(let i = 0 ; i < order.items.length ; i++ ){
                    if(order.items[i].isCancelled === false){
                        order.items[i].refundOnCancelled.status = "Refunded"
                        order.items[i].refundOnCancelled.refundedAt = new Date()
                        order.items[i].isCancelled = true
                        order.items[i].status = "Cancelled"
                        order.items[i].statusTimeline.cancelledAt = new Date()
                    }
                 }
               }
               
                
                payment.amountToBePaid = 0
                payment.status = "Order Cancelled"
                payment.orderWillBeCancelledAt = null
                order.isCancelled = true
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
            message : "Order cannot be cancelled as some items are already being processed."
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
                        categoryId : product.categoryId,
                        variant : order.items[i].variant,
                        quantity : stock
                    })
                    await cartItem.save()
                }else{
                    const cartItem = new Cart({
                        userId : user._id,
                        productId : order.items[i].productId,
                        categoryId : product.categoryId,
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
    if(!req.file){
        req.session.message = "Please provide proof for Return Request"
        return res.redirect(`/orders/${id}`)
    }
    const result = await cloudinary.uploader.upload(req.file.path,{
        folder : "return-order-proofs",
        resource_type : "image"
      })
      fs.unlinkSync(path.resolve(req.file.path))
    for(let i = 0 ; i < order.items.length ; i++){
        if(order.items[i].isCancelled === false && order.items[i].return.isRequested === false){
         order.items[i].status = "Return Requested"
         order.items[i].return.isRequested = true
         order.items[i].return.reason = req.body.returnReason 
         order.items[i].return.proof = result.secure_url 
         order.items[i].return.requestedAt = new Date() 
        }
    }
    order.isReturned = true
    await order.save()
    return res.redirect(`/orders/${id}`)
    } catch (error) {
        console.log(error)
    }
}


const returnItem = async (req,res) => {
    try {
        const {id} = req.params
        const {itemIndex} = req.query
    let order = await Order.findById(id)
    if(!req.file){
        req.session.message = "Please provide proof for Return Request"
        return res.redirect(`/orders/${id}`)
    }
    const result = await cloudinary.uploader.upload(req.file.path,{
        folder : "return-order-proofs",
        resource_type : "image"
      })
      fs.unlinkSync(path.resolve(req.file.path))
    order.items[itemIndex].status = "Return Requested"
    order.items[itemIndex].return.isRequested = true
    order.items[itemIndex].return.reason = req.body.returnReason
    order.items[itemIndex].return.requestedAt = new Date()
    order.items[itemIndex].return.proof = result.secure_url

    
    
    await order.save()
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
    getPaymentStatus,
    retryPayment,
    getPaymentProcessingPage
}