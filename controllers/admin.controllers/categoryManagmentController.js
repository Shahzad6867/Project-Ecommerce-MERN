const categoryService = require("../../services/admin-services/categoryService.js");
const fs = require("fs");
const path = require("path");
const HTTP_STATUS = require("../../constants/httpStatus.js");

const getCategories = async (req, res, next) => {
  const perPage = Number(req.session.itemsPerPage) || 5;
  const page = req.query.page || 1;
  const sortBy = req.query.sortBy || "recently-created"
  const categories = await categoryService.getCategories(perPage, page,sortBy);
  const count = await categoryService.countCategories();
  const pages = Math.ceil(count / perPage);
  const message = req.session.message || null;
  delete req.session.message;
  res.status(HTTP_STATUS.OK).render("admin-view/admin.categories.ejs", {
    message,
    categories,
    page,
    pages,
    perPage,
    sortBy : req.query.sortBy || "recently-created",
    count,
  });
};

const addCategory = async (req, res, next) => {
  try {
    const { categoryName, description } = req.body;
    const categoryExist = await categoryService.doesCategoryExist(categoryName);
    if (categoryExist) {
      req.session.message = "Category already Exists";
      return res.redirect("/admin/categories");
    }
    let result = await categoryService.uploadToCloudinary(req.file.path);
    await categoryService.createNewCategory(
      categoryName,
      description,
      result.secure_url
    );
    fs.unlinkSync(path.resolve(req.file.path));
    req.session.message = "Category Created Successfully";
    return res.redirect("/admin/categories");
  } catch (error) {
    next(error)
  }
};
const restoreCategory = async (req, res, next) => {
  try {
    const { id } = req.query;
    await categoryService.restoreCategory(id);
    req.session.message = "Category Restored Successfully";
    return res.status(HTTP_STATUS.OK).json({
      success: true,
    });
  } catch (error) {
    next(error)
  }
};
const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.query;
    await categoryService.deleteCategory(id);
    req.session.message = "Category has been successfully Blocked";
    return res.status(HTTP_STATUS.OK).json({
      success: false,
    });
  } catch (error) {
   next(error)
  }
};
const editCategory = async (req, res, next) => {
  try {
    const { id } = req.query;
    const { categoryName, description } = req.body;

    if (req.file) {
      let result = await categoryService.uploadToCloudinary(req.file.path);
      await categoryService.updateCategory(
        id,
        categoryName,
        description,
        result.secure_url
      );
      fs.unlinkSync(path.resolve(req.file.path));
    } else {
      await categoryService.updateCategory(id, categoryName, description);
    }

    req.session.message = "Category Updated Successfully";
    return res.redirect("/admin/categories");
  } catch (error) {
    next(error)
  }
};

module.exports = {
  getCategories,
  addCategory,
  editCategory,
  restoreCategory,
  deleteCategory,
};
