const Coupon = require("../../models/coupon.model.js");
const Cart = require("../../models/cart.model.js");
const usedCoupon = require("../../models/usedCoupon.model.js");
const cloudinary = require("../../config/cloudinaryConfig.js");

const getCoupons = async (perPage, page, sortBy,discountType,discountValue,expiryDate) => {
  if(sortBy === "recently-created"){
    sortBy = {createdAt : -1}
  }else if(sortBy === "created-long-ago"){
    sortBy = {createdAt : 1}
  }else if(sortBy === "name-a-z"){
    sortBy = {name : 1}
  }else if(sortBy === "name-z-a"){
    sortBy = {name : -1}
  }else if(sortBy === "discount-high-low"){
    sortBy = { discountValue : -1}
  }else if(sortBy === "discount-low-high"){
    sortBy = { discountValue : 1}
  }else if(sortBy === "expiry-nearest"){
    sortBy = { endDate : 1}
  }else if(sortBy === "expiry-farthest"){
    sortBy = { endDate : -1}
  }else{
    sortBy = {createdAt : -1}
  }
  let query = {userId : null}
  if(discountType){
    query.discountType = discountType
  }
  if(discountValue){
    query.discountValue = {$gte : discountValue}
  }
  if(expiryDate){
    expiryDate = new Date(expiryDate)
    expiryDate.setUTCHours(23,59,59,999)
    query.endDate = {$lt : expiryDate}
  }
  let coupons = await Coupon.find(query)
    .sort(sortBy)
    .skip(perPage * page - perPage)
    .limit(perPage);
  return coupons;
};

const countCoupons = async (discountType,discountValue,expiryDate) => {
  let query = {userId : null}
  if(discountType){
    query.discountType = discountType
  }
  if(discountValue){
    query.discountValue = {$gte : discountValue}
  }
  if(expiryDate){
    expiryDate = new Date(expiryDate)
    expiryDate.setUTCHours(23,59,59,999)
    query.endDate = {$lt : expiryDate}
  }
  let count = await Coupon.countDocuments(query);
  return count;
};

const getCoupon = async (id) => {
  let coupon = await Coupon.findOne({ _id: id });
  return coupon;
};

const uploadToCloudinary = async (file) => {
  let result = await cloudinary.uploader.upload(file, {
    folder: "coupon-banners",
  });
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

const createNewCoupon = async (
  couponName,
  description,
  endDate,
  discountType,
  discountValue,
  minAmount,
  maxDiscountAmount,
  cloudUrl
) => {
  let coupon = new Coupon({
    name: couponName.toUpperCase(),
    description,
    endDate: new Date(endDate),
    discountType,
    discountValue,
    minAmount,
    maxDiscountAmount,
    bannerImage: cloudUrl,
  });
  await coupon.save();
};

const updateCoupon = async (
  id,
  couponName,
  description,
  endDate,
  discountType,
  discountValue,
  minAmount,
  maxDiscountAmount,
  cloudUrl
) => {
  await Coupon.findOneAndUpdate(
    { _id: id },
    {
      name: couponName.toUpperCase(),
      description: description,
      endDate: new Date(endDate),
      discountType,
      discountValue,
      minAmount,
      maxDiscountAmount,
      bannerImage: cloudUrl,
    }
  );
};

const deleteCoupon = async (id) => {
  await Cart.updateMany(
    { couponApplied: id },
    { $set: { couponApplied: null } }
  );
  await usedCoupon.deleteMany({ couponId: id });
  await Coupon.findByIdAndDelete(id);
};

module.exports = {
  getCoupons,
  countCoupons,
  getCoupon,
  uploadToCloudinary,
  deleteImageFromCloudinary,
  createNewCoupon,
  updateCoupon,
  deleteCoupon,
};
