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
    const wishlistItems = await Wishlist.find({userId : user._id}).populate("productId").populate("brandId").populate("productOfferId").populate("categoryOfferId")
    const wishlistItemsCount = await Wishlist.find({userId : user._id}).countDocuments()
    const cartItems = await Cart.find({userId : user._id}).populate("productId").populate("productOfferId").populate("categoryOfferId")
    const offers = await Offer.find({})
    res.render("user-view/user.wishlist.ejs",{message,user,productsFullList,wishlistItems,offers,cartItems,wishlistItemsCount})
}

const addToWishlist = async (req,res) => {
   try {
    const {productId,variant} = req.query
    let user = req.session.user || req.user
    const product = await Product.findById(productId)
    const wishlistItem = new Wishlist({
        userId : user._id,
        productId : productId,
        categoryId : product.categoryId,
        brandId : product.brandId,
        variant : variant,
        categoryOfferId : product.categoryOfferId,
        productOfferId : product.variants[variant].productOfferId
        
    })
    await wishlistItem.save()
    return res.status(200).json({
        success : true,
        message : "Product has been added to Wishlist"
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
        const {productId,variant} = req.query
        let user = req.session.user || req.user
        
        await Wishlist.findOneAndDelete({userId : user._id, productId : productId, variant : variant})
        return res.status(200).json({
            success : true,
            message : "Item have been removed from your Cart",

        })
       } catch (error) {
        console.log(error)
        return res.status(200).json({
            success : false,
            message : error.message,

        })
       }
}


module.exports = {
    getWishlist,
    addToWishlist,
    deleteWishlistItem,
}