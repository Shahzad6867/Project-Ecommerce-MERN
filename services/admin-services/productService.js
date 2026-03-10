const cloudinary = require("../../config/cloudinaryConfig.js");
const fs = require("fs");
const path = require("path");
const Product = require("../../models/product.model.js");
const Brand = require("../../models/brand.model.js");
const Category = require("../../models/category.model.js");

const getProductsForSearch = async () => {
  let result = await Product.aggregate([
    {
      $project: {
        _id: 0,
        productName: 1,
      },
    },
  ]);
  return result;
};

const getProducts = async (perPage, page,query,priceQuery,sortBy,search) => {
  if(sortBy === "recently-created"){
    sortBy = {createdAt : -1}
  }else if(sortBy === "created-long-ago"){
    sortBy = {createdAt : 1}
  }else if(sortBy === "name-a-z"){
    sortBy = {productName : 1}
  }else if(sortBy === "name-z-a"){
    sortBy = {productName : -1}
  }else if(sortBy === "price-high-low"){
    sortBy = {"variants.price" : -1}
  }else if(sortBy === "price-low-high"){
    sortBy = {"variants.price" : 1}
  }else if(sortBy === "stock-high-low"){
    sortBy = {"variants.stockQuantity" : -1}
  }else if(sortBy === "stock-low-high"){
    sortBy = {"variants.stockQuantity" : 1}
  }else{
    sortBy = {createdAt : -1}
  }
  let pipeline = []
  if(search){
    pipeline.push({ $match:{ productName: { $regex: search, $options: "i" } }})
  }
  if (typeof query === "object" && query !== null) {
    pipeline.push({ $match: query });
  }
  pipeline.push({
    $unwind: {
      path: "$variants",
      includeArrayIndex: "variant",
    },
  });

  if (typeof priceQuery === "object" && priceQuery !== null) {
    pipeline.push(priceQuery);
  }

  pipeline.push(
    {
      $lookup: {
        from: "categories",
        localField: "categoryId",
        foreignField: "_id",
        as: "categoryId",
      },
    },
    {
      $lookup: {
        from: "brands",
        localField: "brandId",
        foreignField: "_id",
        as: "brandId",
      },
    },
    { $unwind: "$categoryId" },
    { $unwind: "$brandId" },

  );

  pipeline.push({
    $sort : sortBy
  })
  pipeline.push({
    $skip : perPage * page - perPage
  })
  pipeline.push({
    $limit : perPage
  })

  let result = await Product.aggregate(pipeline)
   
  return result;
};

const getProduct = async (id) => {
  let result = await Product.findById(id)
    .populate("categoryId")
    .populate("brandId");
  return result;
};

const getProductsCount = async (query,priceQuery,search) => {
  let pipeline = []
  if(search){
    pipeline.push({ $match:{ productName: { $regex: search, $options: "i" } }})
  }
  if (typeof query === "object" && query !== null) {
    pipeline.push({ $match: query });
  }
  pipeline.push({
    $unwind: "$variants",
  });

  if (typeof priceQuery === "object" && priceQuery !== null) {
    pipeline.push(priceQuery);
  }
  
  pipeline.push({
    $count : "productsCount"
  })
  let result = await Product.aggregate(pipeline)

  return result[0]?.productsCount ?? 0;
};

const getAddProduct = async () => {
  const categories = await Category.find({});
  const brands = await Brand.find({});
  const products = await Product.find({});
  return { categories, brands, products };
};

const doesProductExist = async (productName) => {
  let result = await Product.findOne({ productName: productName });
  return result;
};

const uploadToCloudinary = async (file) => {
  const result = await cloudinary.uploader.upload(file.path, {
    folder: "product-images",
  });
  fs.unlinkSync(path.resolve(file.path));
  return result;
};

const deleteFromCloudinary = async (publicId) => {
  await cloudinary.uploader.destroy(publicId, (error, result) => {
    if (error) {
      console.error(error);
    } else {
      console.log(result);
    }
  });
};

const createNewProduct = async (
  productName,
  description,
  brandId,
  categoryId,
  isFeatured,
  variants,
  files
) => {
  const variantEntries = Object.keys(variants).map(async (index) => {
    const variant = variants[index];

    const filesOfVariant = files.filter(
      (file) => file.fieldname === `variants[${index}][productImages]`
    );

    const uploadImages = filesOfVariant.map(async (file) => {
      const result = await uploadToCloudinary(file);
      return result.secure_url;
    });

    const imageUrls = await Promise.all(uploadImages);

    return {
      size: variant.size,
      color: variant.color,
      price: variant.price,
      stockQuantity: variant.stockQuantity,
      stockStatus: variant.stockStatus,
      productImages: imageUrls,
    };
  });

  const finalVariants = await Promise.all(variantEntries);

  const newProduct = new Product({
    productName,
    description,
    brandId,
    categoryId,
    isFeatured,
    variants: finalVariants,
  });

  await newProduct.save();
};

const restoreProduct = async (id, variant) => {
  let product = await getProduct(id);
  product.variants[variant].isBlocked = false;
  await product.save();
};
const deleteProduct = async (id, variant) => {
  let product = await getProduct(id);
  product.variants[variant].isBlocked = true;
  await product.save();
};
module.exports = {
  getProductsForSearch,
  getProducts,
  getProduct,
  getProductsCount,
  getAddProduct,
  doesProductExist,
  createNewProduct,
  uploadToCloudinary,
  deleteFromCloudinary,
  restoreProduct,
  deleteProduct,
};
