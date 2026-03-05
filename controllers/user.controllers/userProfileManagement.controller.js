const Address = require("../../models/address.model");
const { extractPublicId } = require("cloudinary-build-url");
const User = require("../../models/user.model");
require("dotenv").config();
const profileService = require("../../services/user-services/profileService.js");

const getProfile = async (req, res) => {
  const theUser = req.session.user || req.user;
  const {
    productsFullList,
    cartItems,
    cartItemsCount,
    wishlistItemsCount,
    address,
    defaultAddress,
    user,
  } = await profileService.getUserDetails(theUser._id);
  const referralUrl = process.env.APP_BASE_URL + `/register?ref=${user.referralCode}`;
  const search = req.query?.search || null;
  let message = req.session.message || null;
  delete req.session.message;
  res.render("user-view/user.profile-page.ejs", {
    message,
    productsFullList,
    user,
    address : (address.length > 0) ? address[0] : null,
    defaultAddress,
    cartItems,
    cartItemsCount,
    referralUrl,
    wishlistItemsCount,
    search,
  });
};

const getEditProfile = async (req, res) => {
  let profileUser = req.session.user || req.user;
  const {
    productsFullList,
    cartItems,
    cartItemsCount,
    wishlistItemsCount,
    user,
  } = await profileService.getUserDetails(profileUser._id);
  let message = req.session.message || null;
  delete req.session.message;
  const search = req.query?.search || null;
  res.render("user-view/user.edit-profile.ejs", {
    user,
    productsFullList,
    message,
    cartItems,
    cartItemsCount,
    wishlistItemsCount,
    search,
  });
};
const editProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body;
    let user = req.session.user || req.user;

    if (
      firstName === user.firstName &&
      lastName === user.lastName &&
      phone === "" &&
      req.files.length === 0
    ) {
      return res.redirect("/profile");
    }
    if (req.files.length > 0) {
      const imageUrl = await profileService.uploadToCloudinary(
        req.files[0].path
      );
      if (user.profileImage !== null) {
        let publicId = extractPublicId(user.profileImage);
        await profileService.deleteImageFromCloudinary(publicId);
      }
      await User.findByIdAndUpdate(
        { _id: user._id },
        { $set: { profileImage: imageUrl } }
      );
    }
    if (firstName !== "" && firstName !== user.firstName) {
      await User.findByIdAndUpdate(
        { _id: user._id },
        { $set: { firstName: firstName } }
      );
    }
    if (lastName !== "" && lastName !== user.lastName) {
      await User.findByIdAndUpdate(
        { _id: user._id },
        { $set: { lastName: lastName } }
      );
    }
    if (phone !== "" && phone !== user.phone) {
      await User.findByIdAndUpdate(
        { _id: user._id },
        { $set: { phone: phone } }
      );
    }

    req.session.message = "Profile Updated Successfully";
    res.redirect("/profile");
  } catch (error) {
    console.log(error);
    req.session.message = "Oops! Something went wrong";
    res.redirect("/edit-profile");
  }
};

const getAddress = async (req, res) => {
  const theUser = req.session.user || req.user;
  const page = req.query.page || 1
  const perPage = 1
  const skip = perPage * page - perPage
  const {
    productsFullList,
    cartItems,
    cartItemsCount,
    wishlistItemsCount,
    address,
    addressessCount,
    defaultAddress,
    user,
  } = await profileService.getUserDetails(theUser._id,skip,perPage);
  const pages = Math.ceil(addressessCount/perPage)
  const message = req.session.message || null;
  delete req.session.message;
  const search = req.query?.search || null;
  res.render("user-view/user.address-management.ejs", {
    productsFullList,
    user,
    addressList: address,
    defaultAddress,
    message,
    cartItems,
    cartItemsCount,
    wishlistItemsCount,
    page,
    pages,
    addressessCount,
    search,
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
    const user = req.session.user || req.user;
    const { newAddress, oldDefaultAddress } =
      await profileService.addNewAddress(
        user._id,
        firstName,
        lastName,
        country,
        state,
        city,
        pincode,
        mobileNo,
        address,
        isDefault
      );

    return res.status(200).json({
      success: true,
      message: "Address added successfully",
      address: newAddress,
      oldDefaultAddress,
    });
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
    } = req.body;
    const addressToBeUpdated = await Address.findOne({ _id: id });
    const updatedAddress = await Address.findByIdAndUpdate(
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
      },
      {
        new: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Address updated Successfully",
      address: updatedAddress,
    });
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
  if (addressToBeDeleted?.isDefault === true) {
    await Address.findOneAndUpdate(
      { userId: idOfUser },
      { $set: { isDefault: true } }
    );
  }
  if (req.body?.redirect && req.body.redirect === "/checkout") {
    return res.redirect("/checkout");
  }
  req.session.message = "Address deleted Successfully";
  res.redirect("/address");
};

const resetDefaultAddress = async (req, res) => {
  const id = req.query.id;

  const idOfUser = req.session.user?._id || req.user?._id;
  const oldDefaultAddress = await Address.findOneAndUpdate(
    { userId: idOfUser, isDefault: true },
    { $set: { isDefault: false } },
    { new: true }
  );

  const newAddress = await Address.findByIdAndUpdate(
    { _id: id },
    { $set: { isDefault: true } },
    { new: true }
  );

  if (req.query.redirect && req.query.redirect === "checkout") {
    return res.redirect("/checkout");
  }

  return res.status(200).json({
    message: "Your Default address has been Updated",
    address: newAddress,
    oldDefaultAddress,
  });
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
