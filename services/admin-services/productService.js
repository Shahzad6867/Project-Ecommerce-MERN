const cloudinary = require("../../config/cloudinaryConfig.js")
const fs = require("fs");
const path = require("path");
const Product = require("../../models/product.model.js");
const Brand = require("../../models/brand.model.js");
const Category = require("../../models/category.model.js");

const getProductsForSearch = async () => {
    let result = await Product.aggregate([{
        $project : {
          _id : 0,
          productName : 1
        }
      }])
      return result
}

const getProducts = async (perPage,page) => {
   let result = await Product.find({}).populate("categoryId").populate("brandId").sort({createdAt : -1}).skip(perPage * page - perPage).limit(perPage)
   return result
}

const getProduct = async (id) => {
    let result = await Product.findById(id).populate("categoryId").populate("brandId")
    return result
}

const getProductsCount = async () => {
    let count = await Product.countDocuments()
    return count
}

const getAddProduct = async () => {
    const categories = await Category.find({})
    const brands = await Brand.find({})
    const products = await Product.find({})
    return {categories,brands,products}
}

const doesProductExist = async (productName) => {
   let result = await Product.findOne({ productName : productName }) 
   return result
}

const uploadToCloudinary = async (file) => {
    const result = await cloudinary.uploader.upload(file.path,{
        folder : "product-images"
      })
      fs.unlinkSync(path.resolve(file.path))
      return result
      
}

const deleteFromCloudinary = async (publicId) => {
    await cloudinary.uploader.destroy(publicId,(error,result) => {
        if(error) {
          console.error(error)
        }else{
          console.log(result)
        }
      })
}

const createNewProduct = async (productName,description,brandId,categoryId,isFeatured,variants,files) => {
    const variantEntries = Object.keys(variants).map(async (index) => {
        const variant = variants[index]

        const filesOfVariant = files.filter((file) => file.fieldname === `variants[${index}][productImages]`)
    
        const uploadImages = filesOfVariant.map(async (file) => {
          const result = await uploadToCloudinary(file)
          return result.secure_url
        })

        const imageUrls = await Promise.all(uploadImages)

        return {
          size: variant.size,
          color: variant.color,
          price: variant.price,
          stockQuantity: variant.stockQuantity,
          stockStatus: variant.stockStatus,
          productImages: imageUrls,
          }
      })

      const finalVariants = await Promise.all(variantEntries)

      const newProduct = new Product({
        productName,
        description,
        brandId,
        categoryId,
        isFeatured,
        variants: finalVariants,
      })

      await newProduct.save()
}

const restoreProduct = async (id,variant) => {
    let product = await getProduct(id)
    product[0].variants[variant].isBlocked = false
    await product[0].save()
}
const deleteProduct = async (id,variant) => {
    let product = await getProduct(id)
    product[0].variants[variant].isBlocked = true
    await product[0].save()
}
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
    deleteProduct
}
