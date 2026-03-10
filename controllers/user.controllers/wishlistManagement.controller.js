const Product = require("../../models/product.model");
const Cart = require("../../models/cart.model");
const Wishlist = require("../../models/wishlist.model");
const Offer = require("../../models/offer.model");
const HTTP_STATUS = require("../../constants/httpStatus.js");


const getWishlist = async (req, res, next) => {
  let user = req.session.user || req.user;
  let message = req.session.message || null;
  delete req.session.message;
  const productsFullList = await Product.find(
    {},
    { productName: 1, variants: 1, categoryId: 1 }
  ).populate("categoryId", "categoryName");
  const wishlistItems = await Wishlist.find({ userId: user._id })
    .populate("productId")
    .populate("categoryId")
    .populate("brandId")
    .populate("productOfferId")
    .populate("categoryOfferId");
  const wishlistItemsCount = await Wishlist.find({
    userId: user._id,
  }).countDocuments();
  const cartItems = await Cart.find({ userId: user._id })
    .populate("productId")
    .populate("productOfferId")
    .populate("categoryOfferId");
  const offers = await Offer.find({});
  const search = req.query.search || null;
  res.status(HTTP_STATUS.OK).render("user-view/user.wishlist.ejs", {
    message,
    user,
    productsFullList,
    wishlistItems,
    offers,
    cartItems,
    wishlistItemsCount,
    search,
  });
};

const addToWishlist = async (req, res, next) => {
  try {
    const { productId, variant } = req.query;
    let user = req.session.user || req.user;
    const product = await Product.findById(productId);
    const wishlistItem = new Wishlist({
      userId: user._id,
      productId: productId,
      categoryId: product.categoryId,
      brandId: product.brandId,
      variant: variant,
      categoryOfferId: product.categoryOfferId,
      productOfferId: product.variants[variant].productOfferId,
    });
    await wishlistItem.save();
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Product has been added to Wishlist",
    });
  } catch (error) {
    next(error)
  }
};

const deleteWishlistItem = async (req, res, next) => {
  try {
    const { productId, variant } = req.query;
    let user = req.session.user || req.user;

    await Wishlist.findOneAndDelete({
      userId: user._id,
      productId: productId,
      variant: variant,
    });
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Item have been removed from your Cart",
    });
  } catch (error) {
    next(error)
  }
};

module.exports = {
  getWishlist,
  addToWishlist,
  deleteWishlistItem,
};
