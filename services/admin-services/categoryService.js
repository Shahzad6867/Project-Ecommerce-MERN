const Category = require("../../models/category.model.js");
const cloudinary = require("../../config/cloudinaryConfig.js");

const getCategories = async (perPage, page,sortBy) => {
  if(sortBy === "recently-created"){
    sortBy = {createdAt : -1}
  }else if(sortBy === "created-long-ago"){
    sortBy = {createdAt : 1}
  }else if(sortBy === "name-a-z"){
    sortBy = {categoryName : 1}
  }else if(sortBy === "name-z-a"){
    sortBy = {categoryName : -1}
  }
  let categories = await Category.find({})
    .sort(sortBy)
    .skip(perPage * page - perPage)
    .limit(perPage);
  return categories;
};

const countCategories = async () => {
  let count = await Category.countDocuments({});
  return count;
};

const doesCategoryExist = async (categoryName) => {
  let category = await Category.findOne({
    categoryName: categoryName.toUpperCase(),
  });
  return category;
};

const uploadToCloudinary = async (file) => {
  let result = await cloudinary.uploader.upload(file, {
    folder: "category-image",
  });
  return result;
};

const createNewCategory = async (categoryName, description, cloudUrl) => {
  let newCategory = new Category({
    categoryName: categoryName.toUpperCase(),
    categoryImage: cloudUrl,
    description,
    isDeleted: false,
  });
  await newCategory.save();
};

const updateCategory = async (id, categoryName, description, cloudUrl) => {
  if (cloudUrl) {
    await Category.findOneAndUpdate(
      { _id: id },
      {
        $set: {
          categoryName: categoryName.toUpperCase(),
          description,
          categoryImage: cloudUrl,
        },
      }
    );
  } else {
    await Category.findOneAndUpdate(
      { _id: id },
      {
        $set: {
          categoryName: categoryName.toUpperCase(),
          description,
        },
      }
    );
  }
};

const deleteCategory = async (id) => {
  await Category.findByIdAndUpdate({ _id: id }, { $set: { isDeleted: true } });
};
const restoreCategory = async (id) => {
  await Category.findByIdAndUpdate({ _id: id }, { $set: { isDeleted: false } });
};

module.exports = {
  getCategories,
  countCategories,
  doesCategoryExist,
  uploadToCloudinary,
  createNewCategory,
  updateCategory,
  deleteCategory,
  restoreCategory,
};
