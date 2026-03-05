const Product = require("../../models/product.model");
const Address = require("../../models/address.model");
const Cart = require("../../models/cart.model.js");
const Wishlist = require("../../models/wishlist.model.js");
const mongoose = require("mongoose");
const cloudinary = require("../../config/cloudinaryConfig.js");
const fs = require("fs");
const path = require("path");
const User = require("../../models/user.model");
require("dotenv").config();

const getUserDetails = async (userId,skip,limit) => {
  const productsFullList = await Product.find(
    {},
    { productName: 1, variants: 1, categoryId: 1 }
  ).populate("categoryId", "categoryName");
  const cartItems = await Cart.find({ userId: userId }).populate("productId");
  const cartItemsCount = await Cart.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    { $group: { _id: "$userId", totalQuantity: { $sum: "$quantity" } } },
  ]);
  const wishlistItemsCount = await Wishlist.find({
    userId: userId,
  }).countDocuments();
  const address = await Address.find({
    userId: userId,
    isDefault: false,
  }).skip(skip).limit(limit);

  const addressessCount = await Address.find({userId : userId}).countDocuments()
  const defaultAddress = await Address.findOne({
    userId: userId,
    isDefault: true,
  });
  const user = await User.findOne({ _id: userId });
  return {
    productsFullList,
    cartItems,
    cartItemsCount,
    wishlistItemsCount,
    address,
    addressessCount,
    defaultAddress,
    user,
  };
};

const uploadToCloudinary = async (file) => {
  let result = await cloudinary.uploader.upload(file, {
    folder: "user-profile-images",
  });
  fs.unlinkSync(path.resolve(file));
  return result.secure_url;
};

const deleteImageFromCloudinary = async (publicId) => {
  await cloudinary.uploader.destroy(publicId, (error, result) => {
    if (error) {
      console.error(error);
    } else {
      console.log(result);
    }
  });
};

const addNewAddress = async (
  id,
  firstName,
  lastName,
  country,
  state,
  city,
  pincode,
  mobileNo,
  address,
  isDefault
) => {
  let isDefaultToSave = null;
  let oldDefaultAddress = null;
  if (isDefault === undefined) {
    let isThereDefaultAddress = await Address.findOne({
      userId: id,
      isDefault: true,
    });

    if (isThereDefaultAddress === null) {
      isDefaultToSave = true;
    } else {
      isDefaultToSave = false;
    }
  } else {
    isDefaultToSave = true;
    oldDefaultAddress = await Address.findOneAndUpdate(
      { userId: id, isDefault: true },
      { $set: { isDefault: false } },
      { new: true }
    );
  }

  const addressToBeSaved = new Address({
    firstName,
    lastName,
    country,
    state,
    city,
    address,
    pincode,
    mobileNo,
    userId: id,
    isDefault: isDefaultToSave,
  });
  const newAddress = await addressToBeSaved.save();
  return { newAddress, oldDefaultAddress };
};

module.exports = {
  getUserDetails,
  deleteImageFromCloudinary,
  uploadToCloudinary,
  addNewAddress,
};
