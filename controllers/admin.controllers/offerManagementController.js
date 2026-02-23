const fs = require("fs");
const path = require("path");
const { extractPublicId } = require("cloudinary-build-url");
const ERROR_MESSAGES = require("../../constants/errorMessages.js");
const HTTP_STATUS = require("../../constants/httpStatus.js");
const offerService = require("../../services/admin-services/offerService.js");

const getOffers = async (req, res) => {
  const perPage = req.session.itemsPerPage || 5;
  const page = req.query.page || 1;
  const offers = await offerService.getOffers(perPage, page);
  const count = await offerService.countOffers();
  const pages = Math.ceil(count / perPage);
  const timezone = req.cookies.tz;
  const message = req.session.message || null;
  delete req.session.message;
  res.render("admin-view/admin.offers.ejs", {
    message,
    offers,
    count,
    page,
    pages,
    timezone,
  });
};
const getAddOffer = async (req, res) => {
  res.render("admin-view/admin.add-offer.ejs", { offer: null });
};
const getEditOffer = async (req, res) => {
  const offer = await offerService.getOffer(req.query.id);
  const timezone = req.cookies.tz;
  res.render("admin-view/admin.add-offer.ejs", { offer, timezone });
};
const addOffer = async (req, res) => {
  try {
    const {
      offerName,
      offerType,
      selectedTarget,
      selectedTargetVariant,
      description,
      startDate,
      endDate,
      discountType,
      discountValue,
    } = req.body;

    let imageUrl = null;
    if (req.file) {
      imageUrl = await offerService.uploadToCloudinary(req.file.path);
      fs.unlinkSync(path.resolve(req.file.path));
    }

    const newOffer = await offerService.createNewOffer(
      offerName,
      offerType,
      selectedTarget,
      selectedTargetVariant,
      description,
      startDate,
      endDate,
      discountType,
      discountValue,
      imageUrl,
      req.body?.productMinPrice,
      req.body?.maxDiscountAmount
    );
    await offerService.updateAccordingToApplicableOnCreatingNewOffer(newOffer);
    req.session.message = "Offer has been created Successfully";
    return res.redirect("/admin/offers");
  } catch (error) {
    console.log(error);
    req.session.message = ERROR_MESSAGES.SERVER_ERROR;
    return res.redirect("/admin/offers");
  }
};

const editOffer = async (req, res) => {
  try {
    const {
      offerName,
      offerType,
      selectedTarget,
      selectedTargetVariant,
      description,
      startDate,
      endDate,
      discountType,
      discountValue,
    } = req.body;
    let offer = await offerService.getOffer(req.query.id);
    let imageUrl = null;
    if (req.file) {
      imageUrl = await offerService.uploadToCloudinary(req.file.path);
      fs.unlinkSync(path.resolve(req.file.path));
      if (offer.bannerImage !== null) {
        let publicId = extractPublicId(offer.bannerImage);
        offerService.deleteImageFromCloudinary(publicId);
      }
    }

    if (imageUrl === null) {
      imageUrl = offer.bannerImage;
    }

    await offerService.updateAccordingToApplicableOnEditingOffer(offer);
    await offerService.updateOffer(
      offer._id,
      offerName,
      offerType,
      selectedTarget,
      selectedTargetVariant,
      description,
      startDate,
      endDate,
      discountType,
      discountValue,
      imageUrl,
      req.body?.productMinPrice,
      req.body?.maxDiscountAmount
    );
    req.session.message = "Offer Updated Successfully";
    return res.redirect("/admin/offers");
  } catch (error) {
    console.log(error);
    req.session.message = ERROR_MESSAGES.SERVER_ERROR;
    return res.redirect("/admin/offers");
  }
};

const deleteOffer = async (req, res) => {
  try {
    let offer = await offerService.getOffer(req.query.id);
    await offerService.deleteOffer(offer);
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Offer has been deleted Successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR,
    });
  }
};
const searchProducts = async (req, res) => {
  const result = await offerService.getProducts(req.body.searchTerm);
  return res.status(HTTP_STATUS.OK).json({
    products: result,
  });
};
const searchCategories = async (req, res) => {
  const result = await offerService.getCategories();
  return res.status(HTTP_STATUS.OK).json({
    categories: result,
  });
};
module.exports = {
  getAddOffer,
  searchProducts,
  searchCategories,
  addOffer,
  getOffers,
  deleteOffer,
  getEditOffer,
  editOffer,
};
