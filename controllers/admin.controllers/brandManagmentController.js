const fs = require("fs");
const path = require("path");
const brandService = require("../../services/admin-services/brandService.js");
const ERROR_MESSAGES = require("../../constants/errorMessages.js");
const HTTP_STATUS = require("../../constants/httpStatus.js");

const getBrand = async (req, res) => {
  const perPage = req.session.itemsPerPage || 5;
  const page = req.query.page || 1;
  const brands = await brandService.getBrands(perPage, page);
  const count = await brandService.countBrands();
  const pages = Math.ceil(count / perPage);
  const message = req.session.message || null;
  delete req.session.message;
  res.render("admin-view/admin.brand.ejs", {
    message,
    brands,
    page,
    pages,
    count,
  });
};

const addBrand = async (req, res) => {
  try {
    const { brandName, description } = req.body;
    const brandExist = await brandService.doesBrandExist(brandName);
    if (brandExist) {
      req.session.message = "Brand already Exists";
      return res.redirect("/admin/brands");
    }
    let result = await brandService.uploadToCloudinary(req.file.path);
    await brandService.createNewBrand(
      brandName,
      description,
      result.secure_url
    );
    fs.unlinkSync(path.resolve(req.file.path));
    req.session.message = "Brand Created Successfully";
    return res.redirect("/admin/brands");
  } catch (error) {
    console.error(error);
    req.session.message = ERROR_MESSAGES.SERVER_ERROR;
    return res.redirect("/admin/brands");
  }
};

const restoreBrand = async (req, res) => {
  try {
    const { id } = req.query;
    await brandService.restoreBrand(id);
    req.session.message = "Brand Restored Successfully";
    return res.status(HTTP_STATUS.OK).json({
      success: true,
    });
  } catch (error) {
    console.log(error);
    req.session.message = ERROR_MESSAGES.SERVER_ERROR;
    return res.redirect("/admin/brands");
  }
};
const deleteBrand = async (req, res) => {
  try {
    const { id } = req.query;
    await brandService.deleteBrand(id);
    req.session.message = "Brand has been successfully Blocked";
    return res.status(HTTP_STATUS.OK).json({
      success: true,
    });
  } catch (error) {
    console.log(error);
    req.session.message = ERROR_MESSAGES.SERVER_ERROR;
    return res.redirect("/admin/brands");
  }
};
const editBrand = async (req, res) => {
  try {
    const { id } = req.query;
    const { brandName, description } = req.body;
    let result = null;
    if (req.file) {
      result = await brandService.uploadToCloudinary(req.file.path);
      await brandService.updateBrand(
        id,
        brandName,
        description,
        result.secure_url
      );
      fs.unlinkSync(path.resolve(req.file.path));
    } else {
      await brandService.updateBrand(id, brandName, description);
    }
    req.session.message = "Brand Updated Successfully";
    return res.redirect("/admin/brands");
  } catch (error) {
    console.error(error);
    req.session.message = ERROR_MESSAGES.SERVER_ERROR;
    return res.redirect("/admin/brands");
  }
};

module.exports = {
  getBrand,
  editBrand,
  addBrand,
  restoreBrand,
  deleteBrand,
};
