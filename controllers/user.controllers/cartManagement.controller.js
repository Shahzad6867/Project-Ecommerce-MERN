const Product = require("../../models/product.model");
const Address = require("../../models/address.model");
const User = require("../../models/user.model");
const Cart = require("../../models/cart.model")

const getCart = async (req,res) => {
    let user = req.session.user || req.user
    const productsFullList = await Product.find({}, { productName: 1, variants: 1, categoryId: 1 }).populate("categoryId", "categoryName");
    const cartItems = await Cart.find({userId : user._id}).populate("productId")
    const cartItemsCount = await Cart.aggregate([{$match : {userId : user._id}},{$group : {_id : "$userId", totalQuantity : {$sum : "$quantity"}}}])
    res.render("user-view/user.cart-management.ejs",{user,productsFullList,cartItems,cartItemsCount})
}

const addToCartFromHome = async (req,res) => {
   try {
    const {productId,variant,quantity} = req.query
    let cartUser = req.session.user || req.user
    let doesUserHaveIt = await Cart.findOne({userId : cartUser._id,productId : productId,variant : variant})
    if(doesUserHaveIt !== null){
        await Cart.findOneAndUpdate({userId : doesUserHaveIt.userId , productId : doesUserHaveIt.productId , variant : variant},{$set : { quantity : quantity}})
        req.session.message = "Product has been updated in Cart"
        return res.redirect("/")
    }
    const cartItem = new Cart({
        userId : cartUser._id,
        productId : productId,
        variant : variant,
        quantity : quantity
    })
    await cartItem.save()
    req.session.message = "Product has been added to Cart"
    return res.redirect("/")
   } catch (error) {
    console.log(error)
    req.session.message = "Oops! Something went wrong"
    res.redirect("/")
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

module.exports = {
    getCart,
    addToCartFromHome,
    deleteCartItemFromHome
}