const Product = require("../../models/product.model");
const Cart = require("../../models/cart.model")
const Wishlist = require("../../models/wishlist.model")
const mongoose = require("mongoose");


const getFullProducts = async () => {
    let result = await Product.find({}, { productName: 1, variants: 1, categoryId: 1 }).populate("categoryId");
    return result
}
const getCartItems = async (userId) => {
    let result = await Cart.find({userId : new mongoose.Types.ObjectId(userId)}).populate("productId").populate("categoryId").populate("brandId").populate("productOfferId").populate("categoryOfferId").populate("couponApplied")
    return result
}
const getCartItem = async (userId,productId,variant) => {
   let result = await Cart.findOne({userId : userId,productId : productId,variant : variant}).populate("couponApplied")
   return result
}
const getProduct = async (productId) => {
    const product = await Product.findById(productId)
    return product
}
const getCartItemsCount = async (userId) => {
    let count = await Cart.aggregate([{$match : {userId : new mongoose.Types.ObjectId(userId)}},{$group : {_id : "$userId", totalQuantity : {$sum : "$quantity"}}}])
    return count
}
const getWishlistItemsCount = async (userId) => {
   let count = await Wishlist.find({userId : userId}).countDocuments()
   return count
}
const addItemToCart = async (userId,productId,variant,quantity) => {
    await Wishlist.findOneAndDelete({userId : userId,productId : productId,variant : variant})
    const product = await getProduct(productId)
    let stock = product.variants[variant].stockQuantity 
    if(!product.isDeleted){
        if(stock === 0 || product.variants[variant].stockStatus === "Out of Stock"){
            product.variants[variant].stockStatus = "Out of Stock"
            await product.save()
          return  {message : "Out of Stock",product}
        }
    }else{
        return {message : "Product Unavailable",product}
    }
    const cartItems = await getCartItems(userId)
   
    const cartItem = new Cart({
        userId : userId,
        productId : product._id,
        categoryId : product.categoryId,
        brandId : product.brandId,
        variant : variant,
        quantity : quantity,
        categoryOfferId : product.categoryOfferId,
        productOfferId : product.variants[variant].productOfferId,
        couponApplied : (cartItems.length > 0 && cartItems[0]?.couponApplied !== null) ? cartItems[0]?.couponApplied : null
    })
    await cartItem.save()
    return {message : "Done",product,cartItem}
}

module.exports = {
    getFullProducts,
    getCartItems,
    getCartItemsCount,
    getWishlistItemsCount,
    addItemToCart,
    getCartItem,
    getProduct
}