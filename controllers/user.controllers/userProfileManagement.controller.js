const Product = require("../../models/product.model");
const Address = require("../../models/address.model");
const Cart = require("../../models/cart.model.js");
const mongoose = require("mongoose")
const cloudinary = require("../../config/cloudinaryConfig.js")
const {extractPublicId} = require("cloudinary-build-url")
const fs = require("fs")
const User = require("../../models/user.model");
const getProfile = async (req, res) => {
  const theUser = req.session.user || req.user;
  const productsFullList = await Product.find(
    {},
    { productName: 1, variants: 1, categoryId: 1 }
  ).populate("categoryId", "categoryName");
  const cartItems = await Cart.find({userId : theUser._id}).populate("productId")
  const cartItemsCount = await Cart.aggregate([{$match : {userId : new mongoose.Types.ObjectId(theUser._id)}},{$group : {_id : "$userId", totalQuantity : {$sum : "$quantity"}}}])
  const address = await Address.findOne({
    userId: theUser._id,
    isDefault: false,
  });
  const defaultAddress = await Address.findOne({
    userId: theUser._id,
    isDefault: true,
  });
  const user = await User.findOne({ _id: theUser._id });
  let message = req.session.message || null;
  delete req.session.message;
  res.render("user-view/user.profile-page.ejs", {
    message,
    productsFullList,
    user,
    address,
    defaultAddress,
    cartItems,
    cartItemsCount
  });
};

const getEditProfile = async (req, res) => {
    let userId = req.session.user || req.user
   let user = await User.findOne({_id : userId._id})
  let productsFullList = await Product.find(
    {},
    { productName: 1, variants: 1, categoryId: 1 }
  ).populate("categoryId", "categoryName");
  const cartItems = await Cart.find({userId : userId._id}).populate("productId")
  const cartItemsCount = await Cart.aggregate([{$match : {userId : new mongoose.Types.ObjectId(user._id)}},{$group : {_id : "$userId", totalQuantity : {$sum : "$quantity"}}}])
  let message = req.session.message || null;
  delete req.session.message;
  res.render("user-view/user.edit-profile.ejs", {
    user,
    productsFullList,
    message,
    cartItems,
    cartItemsCount
  });
};
const editProfile = async (req, res) => {
    try {
        
        const {firstName,lastName,phone} = req.body
        let user = req.session.user || req.user 
    
        if(firstName === user.firstName && lastName === user.lastName && phone === "" && req.files.length === 0){
            return res.redirect("/profile")
        } 
        if(req.files.length > 0){
            let file = req.files[0]
            const imageUpload = async (file) => {
            
                const result = await cloudinary.uploader.upload(file.path,{
                    folder : "user-profile-images"
                })
                fs.unlinkSync(file.path)
            return result.secure_url
            }
        const imageUrl = await imageUpload(file)
        if(user.profileImage !== null){
            let publicId = extractPublicId(user.profileImage)
            await cloudinary.uploader.destroy(publicId,(error,result) => {
                if(error){
                    console.log(error)
                }else{
                    console.log(result)
                }
            })
        }
            await User.findByIdAndUpdate({_id : user._id},{$set : {profileImage : imageUrl }})
        }
        if(firstName !== "" && firstName !== user.firstName){
            await User.findByIdAndUpdate({_id : user._id},{$set : {firstName : firstName }})
        }
        if(lastName !== "" && lastName !== user.lastName){
            await User.findByIdAndUpdate({_id : user._id},{$set : {lastName : lastName }})
        }
        if(phone !== "" && phone !== user.phone){
            await User.findByIdAndUpdate({_id : user._id},{$set : {phone : phone }})
        }
        
        req.session.message = "Profile Updated Successfully"
        res.redirect("/profile")
    } catch (error) {
        console.log(error)
        req.session.message = "Oops! Something went wrong"
        res.redirect("/edit-profile")
    }
};

const getAddress = async (req, res) => {
  const user = req.session.user || req.user;
  const productsFullList = await Product.find(
    {},
    { productName: 1, variants: 1, categoryId: 1 }
  ).populate("categoryId", "categoryName");
  const cartItems = await Cart.find({userId : user._id}).populate("productId")
  const cartItemsCount = await Cart.aggregate([{$match : {userId : new mongoose.Types.ObjectId(user._id)}},{$group : {_id : "$userId", totalQuantity : {$sum : "$quantity"}}}])
  let id = req.session.user?._id || req.user?._id;
  const addressList = await Address.find({ userId: id, isDefault: false });
  let defaultAddress = await Address.find({ userId: id, isDefault: true });
  if (defaultAddress.length > 0) {
    defaultAddress = defaultAddress[0];
  } else {
    defaultAddress = null;
  }


  const message = req.session.message || null;
  delete req.session.message;
  res.render("user-view/user.address-management.ejs", {
    productsFullList,
    user,
    addressList,
    defaultAddress,
    message,
    cartItems,
    cartItemsCount
  });
};

const addAddress = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      country,
      state,
      city,
      pincode,
      mobileNo,
      address,
      isDefault,
    } = req.body;
    let isDefaultToSave = null;
    console.log(isDefault)
    if (isDefault === undefined) {
      let id = req.session.user?._id || req.user?._id;
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
      let id = req.session.user?._id || req.user?._id;
      await Address.findOneAndUpdate(
        { userId: id, isDefault: true },
        { $set: { isDefault: false } }
      );
    }

    let userId = req.session.user?._id || req.user?._id;

    const addressToBeSaved = new Address({
      firstName,
      lastName,
      country,
      state,
      city,
      address,
      pincode,
      mobileNo,
      userId,
      isDefault: isDefaultToSave,
    });
    await addressToBeSaved.save();
    if(req.body.redirect === "/checkout"){
      return res.redirect("/checkout");
    }
    req.session.message = "Address added successfully!";
    return res.redirect("/address");
  } catch (error) {
    console.log(error);
    req.session.message = "Oops! some error has occured";
    res.redirect("/address");
  }
};

const editAddress = async (req, res) => {
  try {
    const id = req.query.id;
    const {
      firstName,
      lastName,
      country,
      state,
      city,
      pincode,
      mobileNo,
      address,
      isDefault,
    } = req.body;
    const addressToBeUpdated = await Address.findOne({ _id: id });
    if(req.body.redirect === "/checkout"){
      await Address.findOneAndUpdate({userId : addressToBeUpdated.userId, isDefault : true},{$set : {isDefault : false}})
      await Address.findByIdAndUpdate(
        { _id: id },
        {
          $set: {
            firstName,
            lastName,
            country,
            state,
            city,
            address,
            pincode,
            mobileNo,
            userId: addressToBeUpdated.userId,
            isDefault : true
          },
        }
      );
      return res.redirect("/checkout");
    }
    await Address.findByIdAndUpdate(
      { _id: id },
      {
        $set: {
          firstName,
          lastName,
          country,
          state,
          city,
          address,
          pincode,
          mobileNo,
          userId: addressToBeUpdated.userId,
          isDefault: addressToBeUpdated.isDefault,
        },
      }
    );
    
    req.session.message = "Address updated Successfully";
    return res.redirect("/address");
  } catch (error) {
    console.log(error);
    req.session.message = "Oops! some error has occured";
    res.redirect("/address");
  }
};

const deleteAddress = async (req, res) => {
  const id = req.query.id;
  const idOfUser = req.query.userId;

  const addressToBeDeleted = await Address.findOneAndDelete({ _id: id });
  console.log(addressToBeDeleted);
  if (addressToBeDeleted?.isDefault === true) {
    await Address.findOneAndUpdate(
      { userId: idOfUser },
      { $set: { isDefault: true } }
    );
  }
  if(req.body.redirect === "/checkout"){
    return res.redirect("/checkout");
  }
  req.session.message = "Address deleted Successfully";
  res.redirect("/address");
};

const resetDefaultAddress = async (req, res) => {
  const id = req.query.id;

  const idOfUser = req.session.user?._id || req.user?._id;
  await Address.findOneAndUpdate(
    { userId: idOfUser, isDefault: true },
    { $set: { isDefault: false } }
  );
  
  await Address.findByIdAndUpdate({ _id: id }, { $set: { isDefault: true } });

  if(req.query.redirect && req.query.redirect === "checkout"){
    return res.redirect("/checkout")
  }
  req.session.message = "Your Default address has been Updated";
  return res.redirect("/address");
};

module.exports = {
  getProfile,
  getAddress,
  addAddress,
  editAddress,
  deleteAddress,
  resetDefaultAddress,
  getEditProfile,
  editProfile,
};
