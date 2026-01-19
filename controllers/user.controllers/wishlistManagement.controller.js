const Product = require("../../models/product.model");
const Address = require("../../models/address.model");
const User = require("../../models/user.model");
const Cart = require("../../models/cart.model")
const Wishlist = require("../../models/wishlist.model")
const mongoose = require("mongoose");
const Offer = require("../../models/offer.model");
const Coupon = require("../../models/coupon.model");
const { getCoupons } = require("../admin.controllers/couponManagementController");


const getWishlist = async (req,res) => {
    let user = req.session.user || req.user
    let message = req.session.message || null
    delete req.session.message
    const productsFullList = await Product.find({}, { productName: 1, variants: 1, categoryId: 1 }).populate("categoryId", "categoryName");
    const wishlistItems = await Wishlist.find({userId : user._id}).populate("productId").populate("productOfferId").populate("categoryOfferId")
    const cartItems = await Cart.find({userId : user._id}).populate("productId").populate("productOfferId").populate("categoryOfferId")
    const offers = await Offer.find({})
    res.render("user-view/user.wishlist.ejs",{message,user,productsFullList,wishlistItems,offers,cartItems})
}

const addToWishlist = async (req,res) => {
   try {
    const {productId,variant,quantity} = req.query
    let cartUser = req.session.user || req.user
    const product = await Product.findById(productId)
    let stock = product.variants[variant].stockQuantity 
    if(product.isDeleted){
        return res.status(410).json({
            success : false,
            message : "Product Unavailable"
        })
    }
    const wishlistItem = new Wishlist({
        userId : cartUser._id,
        productId : productId,
        categoryId : product.categoryId,
        variant : variant,
        categoryOfferId : product.categoryOfferId,
        productOfferId : product.variants[variant].productOfferId
        
    })
    await wishlistItem.save()
     res.status(200).json({
        success : true,
        message : "Product has been added to wishlist",
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


 const deleteWishlistItem = async (req,res) => {
    try {
        const {wishlistItemId,productId} = req.query
        
        await Wishlist.findByIdAndDelete({_id : wishlistItemId})
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
const deleteWishlistItemFromHome = async (req,res) => {
    try {
        const {wishlistItemId} = req.query
        await Cart.findByIdAndDelete({_id : wishlistItemId})
        req.session.message = "Product has been removed from your Cart"
        return res.redirect("/")
       } catch (error) {
        console.log(error)
        req.session.message = "Oops! Something went wrong"
        res.redirect("/")
       }
}

module.exports = {
    getWishlist,
    addToWishlist,
    deleteWishlistItemFromHome,
    deleteWishlistItem,
}