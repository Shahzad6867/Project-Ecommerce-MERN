const Cart = require("../../models/cart.model");
const Coupon = require("../../models/coupon.model");
const usedCoupon = require("../../models/usedCoupon.model");
const cartService = require("../../services/user-services/cartService.js");
const HTTP_STATUS = require("../../constants/httpStatus.js");
const mongoose = require("mongoose");

const getCart = async (req, res, next) => {
  let user = req.session.user || req.user;
  let message = req.session.message || null;
  delete req.session.message;
  const productsFullList = await cartService.getFullProducts();
  const cartItems = await cartService.getCartItems(user._id);
  const cartItemsCount = await cartService.getCartItemsCount(user._id);
  const wishlistItemsCount = await cartService.getWishlistItemsCount(user._id);
  const usedCoupons = await usedCoupon.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(user._id),
      },
    },
    {
      $group: { _id: null, coupons: { $push: "$couponId" } },
    },
  ]);
  const search = req.query.search || null;
  const coupons =
    usedCoupons.length > 0
      ? await Coupon.find({ _id: { $nin: usedCoupons[0].coupons},userId : null, endDate : {$gt : new Date()}  })
      : await Coupon.find({ userId: null , endDate : {$gt : new Date()}});
  const userCoupons = await Coupon.find({ userId: user._id, endDate : {$gt : new Date()}});
  res.status(HTTP_STATUS.OK).render("user-view/user.cart-management.ejs", {
    message,
    user,
    productsFullList,
    cartItems,
    cartItemsCount,
    coupons,
    userCoupons,
    wishlistItemsCount,
    search,
  });
};

const addToCart = async (req, res, next) => {
  try {
    const { productId, variant, quantity } = req.query;
    let cartUser = req.session.user || req.user;
    const result = await cartService.addItemToCart(
      cartUser._id,
      productId,
      variant,
      quantity
    );
    if (result.message === "Out of Stock") {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: "Out of Stock",
        specMessage: `${result.product.productName} is Out of Stock`,
      });
    } else if (result.message === "Product Unavailable") {
      return res.status(HTTP_STATUS.UNAVAILABLE).json({
        success: false,
        message: "Product Unavailable",
      });
    }
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Product has been added to Cart",
      product: result.product,
      cart: result.cartItem,
    });
  } catch (error) {
    next(error)
  }
};

const buyNow = async (req, res, next) => {
  const { productId, variant } = req.query;

  let cartUser = req.session.user || req.user;
  let cartItem = await cartService.getCartItem(
    cartUser._id,
    productId,
    variant
  );
  let quantity = cartItem?.quantity || 1;
  if (cartItem) {
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Done",
    });
  } else {
    const result = await cartService.addItemToCart(
      cartUser._id,
      productId,
      variant,
      quantity
    );
    if (result.message === "Out of Stock") {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: "Out of Stock",
        specMessage: `${result.product.productName} is Out of Stock`,
      });
    } else if (result.message === "Product Unavailable") {
      return res.status(HTTP_STATUS.UNAVAILABLE).json({
        success: false,
        message: "Product Unavailable",
      });
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Done",
    });
  }
};

const updateCartItem = async (req, res, next) => {
  try {
    const { productId, variant, quantity } = req.query;
    let cartUser = req.session.user || req.user;
    let cartItem = await cartService.getCartItem(
      cartUser._id,
      productId,
      variant
    );
    let product = await cartService.getProduct(productId);
    let availableStock = product.variants[variant].stockQuantity;
    if (!product.isDeleted) {
      if (
        availableStock === 0 ||
        product.variants[variant].stockStatus === "Out of Stock"
      ) {
        return res.status(HTTP_STATUS.CONFLICT).json({
          success: false,
          message: "Out of Stock",
          specMessage: `${product.productName} has become Out of Stock`,
          product,
          cart: cartItem,
        });
      } else if (quantity > availableStock) {
          if(quantity < cartItem.quantity){
            cartItem.quantity = quantity;
            await cartItem.save();
          }
        return res.status(HTTP_STATUS.CONFLICT).json({
          success: false,
          message : "Limited Stock",
          specMessage: `${product.productName} has only Limited Stock, The maximum quantity you can order is ${availableStock}`,
          product,
          cart: cartItem,
        });
      }
    } else {
      return res.status(HTTP_STATUS.UNAVAILABLE).json({
        success: false,
        message: "Product Unavailable",
        product,
        cart: cartItem,
      });
    }
    cartItem.quantity = quantity;
    await cartItem.save();
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Quantity has been updated in Cart",
      product,
      cart: cartItem,
    });
  } catch (error) {
    next(error)
  }
};
const deleteCartItem = async (req, res, next) => {
  try {
    const user = req.session.user || req.user;
    const { cartItemId, productId } = req.query;
    const oldCouponId = await cartService.getCartItems(user._id);
    await Cart.findByIdAndDelete({ _id: cartItemId });
    let product = await cartService.getProduct(productId);
    let cartItems = await cartService.getCartItems(user._id);
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Item have been removed from your Cart",
      product,
      couponApplied:
        cartItems.length > 0 && cartItems[0]?.couponApplied !== null
          ? cartItems[0]?.couponApplied
          : null,
      oldCouponId:
        oldCouponId.length > 0 && oldCouponId[0]?.couponApplied !== null
          ? oldCouponId[0]?.couponApplied._id
          : null,
    });
  } catch (error) {
   next(error)
  }
};

const applyCoupon = async (req, res, next) => {
  let { id } = req.params;
  let user = req.session.user || req.user;
  const olderCoupon = await Cart.findOne({ userId: user._id });
  await Cart.updateMany({ userId: user._id }, { couponApplied: id });
  const coupon = await Coupon.findById(id);
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "Done",
    coupon,
    olderCoupon: olderCoupon.couponApplied,
  });
};
const removeCoupon = async (req, res, next) => {
  let user = req.session.user || req.user;
  const coupon = await Cart.findOne({ userId: user._id });
  await Cart.updateMany({ userId: user._id }, { couponApplied: null });
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "Done",
    coupon,
  });
};
module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  deleteCartItem,
  applyCoupon,
  removeCoupon,
  buyNow,
};
