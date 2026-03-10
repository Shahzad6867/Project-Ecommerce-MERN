const fs = require("fs");
const path = require("path");
const brandService = require("../../services/admin-services/brandService.js");
const HTTP_STATUS = require("../../constants/httpStatus.js");

const getBrand = async (req, res, next) => {
  const perPage =  Number(req.session.itemsPerPage) || 5;
  const page = req.query.page || 1;
  const sortBy = req.query.sortBy || "recently-created";
  const brands = await brandService.getBrands(perPage, page,sortBy);
  const count = await brandService.countBrands();
  const pages = Math.ceil(count / perPage);
  const message = req.session.message || null;
  delete req.session.message;
  res.status(HTTP_STATUS.OK).render("admin-view/admin.brand.ejs", {
    message,
    brands,
    page,
    pages,
    perPage,
    sortBy : req.query.sortBy || "recently-created",
    count,
  });
};

const addBrand = async (req, res, next) => {
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
    next(error)
  }
};

const restoreBrand = async (req, res, next) => {
  try {
    const { id } = req.query;
    await brandService.restoreBrand(id);
    req.session.message = "Brand Restored Successfully";
    return res.status(HTTP_STATUS.OK).json({
      success: true,
    });
  } catch (error) {
    next(error)
  }
};
const deleteBrand = async (req, res, next) => {
  try {
    const { id } = req.query;
    await brandService.deleteBrand(id);
    req.session.message = "Brand has been successfully Blocked";
    return res.status(HTTP_STATUS.OK).json({
      success: true,
    });
  } catch (error) {
   next(error)
  }
};
const editBrand = async (req, res, next) => {
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
    next(error)
  }
};

module.exports = {
  getBrand,
  editBrand,
  addBrand,
  restoreBrand,
  deleteBrand,
};
