const cloudinary = require("../../config/cloudinaryConfig.js");
const Brand = require("../../models/brand.model.js");

const countBrands = async () => {
  let count = await Brand.countDocuments();
  return count;
};
const getBrands = async (perPage, page) => {
  let brands = await Brand.find({})
    .sort({ createdAt: -1 })
    .skip(perPage * page - perPage)
    .limit(perPage);
  return brands;
};

const doesBrandExist = async (brandName) => {
  let brand = await Brand.findOne({ brandName: brandName.toUpperCase() });
  return brand;
};

const uploadToCloudinary = async (file) => {
  let result = await cloudinary.uploader.upload(file, {
    folder: "brand-images",
  });
  return result;
};

const createNewBrand = async (brandName, description, cloudUrl) => {
  let newBrand = new Brand({
    brandName: brandName.toUpperCase(),
    description,
    brandImage: cloudUrl,
    isDeleted: false,
  });
  await newBrand.save();
};

const updateBrand = async (id, brandName, description, cloudUrl) => {
  if (cloudUrl) {
    await Brand.findOneAndUpdate(
      { _id: id },
      {
        $set: {
          brandName: brandName.toUpperCase(),
          description,
          brandImage: cloudUrl,
        },
      }
    );
  } else {
    await Brand.findOneAndUpdate(
      { _id: id },
      {
        $set: {
          brandName: brandName.toUpperCase(),
          description,
        },
      }
    );
  }
};

const deleteBrand = async (id) => {
  await Brand.findByIdAndUpdate({ _id: id }, { $set: { isDeleted: true } });
};
const restoreBrand = async (id) => {
  await Brand.findByIdAndUpdate({ _id: id }, { $set: { isDeleted: false } });
};

module.exports = {
  countBrands,
  getBrands,
  doesBrandExist,
  uploadToCloudinary,
  createNewBrand,
  updateBrand,
  deleteBrand,
  restoreBrand,
};
