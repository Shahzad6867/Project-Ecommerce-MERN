const fs = require("fs");
const path = require("path");
const { extractPublicId } = require("cloudinary-build-url");
const HTTP_STATUS = require("../../constants/httpStatus.js");
const offerService = require("../../services/admin-services/offerService.js");

const getOffers = async (req, res, next) => {
  const perPage =  Number(req.session.itemsPerPage) || 5;
  const page = req.query.page || 1;
  const sortBy = req.query.sortBy || null
  const discountType = req.query.discountType || null
  const applicableOn = req.query.applicableOn || null
  const startDate = req.query.startDate || null
  const expiryDate = req.query.expiryDate || null
  const offers = await offerService.getOffers(perPage, page,sortBy,discountType,applicableOn,startDate,expiryDate);
  const count = await offerService.countOffers(discountType,applicableOn,startDate,expiryDate);
  const pages = Math.ceil(count / perPage);
  const timezone = req.cookies.tz;
  const message = req.session.message || null;
  delete req.session.message;
  res.status(HTTP_STATUS.OK).render("admin-view/admin.offers.ejs", {
    message,
    offers,
    count,
    page,
    pages,
    perPage,
    discountType,
    applicableOn,
    startDate,
    expiryDate,
    sortBy,
    timezone,
  });
};
const getAddOffer = async (req, res, next) => {
  res.status(HTTP_STATUS.OK).render("admin-view/admin.add-offer.ejs", { offer: null });
};
const getEditOffer = async (req, res, next) => {
  const offer = await offerService.getOffer(req.query.id);
  const timezone = req.cookies.tz;
  res.status(HTTP_STATUS.OK).render("admin-view/admin.add-offer.ejs", { offer, timezone });
};
const addOffer = async (req, res, next) => {
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
    next()
  }
};

const editOffer = async (req, res, next) => {
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
    next(error)
  }
};

const deleteOffer = async (req, res, next) => {
  try {
    let offer = await offerService.getOffer(req.query.id);
    await offerService.deleteOffer(offer);
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Offer has been deleted Successfully",
    });
  } catch (error) {
   next(error)
  }
};
const searchProducts = async (req, res, next) => {
  const result = await offerService.getProducts(req.query.searchTerm);
  return res.status(HTTP_STATUS.OK).json({
    products: result,
  });
};
const searchCategories = async (req, res, next) => {
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
