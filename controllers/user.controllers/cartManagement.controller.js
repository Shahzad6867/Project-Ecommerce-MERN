const Product = require("../../models/product.model");
const Address = require("../../models/address.model");
const User = require("../../models/user.model");
const Cart = require("../../models/cart.model")
const mongoose = require("mongoose");
const Offer = require("../../models/offer.model");
const Coupon = require("../../models/coupon.model");
const { getCoupons } = require("../admin.controllers/couponManagementController");


const getCart = async (req,res) => {
    let user = req.session.user || req.user
    let message = req.session.message || null
    delete req.session.message
    const productsFullList = await Product.find({}, { productName: 1, variants: 1, categoryId: 1 }).populate("categoryId", "categoryName");
    const cartItems = await Cart.find({userId : user._id}).populate("productId").populate("productOfferId").populate("categoryOfferId").populate("couponApplied")
    const cartItemsCount = await Cart.aggregate([{$match : {userId : new mongoose.Types.ObjectId(user._id)}},{$group : {_id : "$userId", totalQuantity : {$sum : "$quantity"}}}])
    const offers = await Offer.find({})
    const coupons = await Coupon.find({userId : null})
    const userCoupons = await Coupon.find({userId : user._id})
    res.render("user-view/user.cart-management.ejs",{message,user,productsFullList,cartItems,cartItemsCount,offers,coupons,userCoupons})
}

const addToCart = async (req,res) => {
   try {
    const {productId,variant,quantity} = req.query
    let cartUser = req.session.user || req.user
    const product = await Product.findById(productId)
    let stock = product.variants[variant].stockQuantity 
    if(!product.isDeleted){
        if(stock === 0 || product.variants[variant].stockStatus === "Out of Stock"){
            product.variants[variant].stockStatus = "Out of Stock"
            await product.save()
          return   res.status(409).json({
                success : false,
                message : "Out of Stock",
                specMessage : `${product.productName} is Out of Stock`
            })
        }
    }else{
        return res.status(410).json({
            success : false,
            message : "Product Unavailable"
        })
    }
    const cartItem = new Cart({
        userId : cartUser._id,
        productId : productId,
        categoryId : product.categoryId,
        variant : variant,
        quantity : quantity,
        categoryOfferId : product.categoryOfferId,
        productOfferId : product.variants[variant].productOfferId
        
    })
    await cartItem.save()
     res.status(200).json({
        success : true,
        message : "Product has been added to Cart",
        product,
        cart : cartItem
    })
   } catch (error) {
    console.log(error)
    res.status(500).json({
        success : false,
        message : "Oops! something went wrong from our side"
    })
   }
}

const updateCartItem = async (req,res) => {
    try {
     const {productId,variant,quantity} = req.query
     let cartUser = req.session.user || req.user
     console.log(productId)
     let cartItem = await Cart.findOne({userId : cartUser._id,productId : productId,variant : variant})
     let product = await Product.findById(productId)
     let availableStock = product.variants[variant].stockQuantity
     if(!product.isDeleted){
        if(availableStock === 0 || product.variants[variant].stockStatus === "Out of Stock"){
            return res.status(409).json({
                success : false,
                message : "Out of Stock",
                specMessage : `${product.productName} has become Out of Stock`,
                product,
                cart : cartItem
            })
        }else if(quantity > availableStock){
            return res.status(409).json({
                success : false,
                message : `${product.productName} has only Limited Stock, The maximum quantity you can order is ${availableStock}`,
                product,
                cart : cartItem
            })
         }
     }else{
        return res.status(410).json({
            success : false,
            message : "Product Unavailable",
            product,
            cart : cartItem
        })
    }
     cartItem.quantity = quantity
     await cartItem.save()
     return res.status(200).json({
        success : true,
        message : "Quantity has been updated in Cart",
        product,
        cart : cartItem
     })
    } catch (error) {
     console.log(error)
     res.status(500).json({
        success : false,
        message : "Oops! something went wrong from our side"
    })
    }
 }
 const deleteCartItem = async (req,res) => {
    try {
        const {cartItemId,productId} = req.query
        console.log(cartItemId)
        await Cart.findByIdAndDelete({_id : cartItemId})
        let product = await Product.findById(productId)
        return res.status(200).json({
            success : true,
            message : "Item have been removed from your Cart",
            product
        })
       } catch (error) {
        console.log(error)
        return res.status(200).json({
            success : false,
            message : error.message,

        })
       }
}
const deleteCartItemFromHome = async (req,res) => {
    try {
        const {cartItemId} = req.query
        await Cart.findByIdAndDelete({_id : cartItemId})
        req.session.message = "Product has been removed from your Cart"
        return res.redirect("/")
       } catch (error) {
        console.log(error)
        req.session.message = "Oops! Something went wrong"
        res.redirect("/")
       }
}
const applyCoupon = async (req,res) => {
    let {id} = req.params
    let user = req.session.user || req.user
    await Cart.updateMany({userId : user._id},{couponApplied : id})
    return res.json({
        success : true,
        message : "Done"
    })
}
const removeCoupon = async (req,res) => {
    let user = req.session.user || req.user
    await Cart.updateMany({userId : user._id},{couponApplied : null})
    return res.json({
        success : true,
        message : "Done"
    })
}
module.exports = {
    getCart,
    addToCart,
    updateCartItem,
    deleteCartItemFromHome,
    deleteCartItem,
    applyCoupon,
    removeCoupon
}