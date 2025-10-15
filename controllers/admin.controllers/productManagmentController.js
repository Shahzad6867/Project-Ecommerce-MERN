
const cloudinary = require("../../config/cloudinaryConfig.js")
const fs = require("fs");
const Product = require("../../models/product.model.js");
const Brand = require("../../models/brand.model.js");
const Category = require("../../models/category.model.js");



const getProducts = async (req,res) => {
    const perPage = req.session.itemsPerPage || 5 
    const page = req.query.page || 1
    const productsFullList = await Product.aggregate().project({productName : 1,_id : 0})
     const products = await Product.find({}).populate("categoryId").populate("brandId").sort({createdAt : -1}).skip(perPage * page - perPage).limit(perPage)
     const count = await Product.countDocuments({})
    const pages = Math.ceil(count / perPage)
    const message = req.session.message || null
    delete req.session.message
    res.render("admin-view/admin.products.ejs",{message,products,page,pages,count,productsFullList})
  }

  const getAddProduct = async (req,res) => {
    const categories = await Category.find({})
    const brands = await Brand.find({})
    const message = req.session.message || null
    delete req.session.message
    res.render("admin-view/admin.add-product.ejs",{message,categories,brands})
  }

  const addProduct = async (req,res) => {
    try {
      const { productName, description,brandId,categoryId} = req.body;
      const productExist = await Product.findOne({ productName : productName });
      if(productExist){
        req.session.message = "Product already Exists"
          return res.redirect("/admin/products")
      }
      if(!req.files || req.files.length < 3){
        console.log(!req.files || req.files.length < 3)
        req.session.message = "Minimum 3 Images required."
        return res.redirect("/admin/add-product")
      }
     
      
      const variants = req.body.variants
      const variantEntries = Object.keys(variants).map(async (index) => {
        const variant = variants[index]

        const filesOfVariant = req.files.filter((file) => file.fieldname === `variants[${index}][productImages]`)
    
        const uploadImages = filesOfVariant.map(async (file) => {
          const result = await cloudinary.uploader.upload(file.path,{
            folder : "product-images"
          })
          fs.unlinkSync(file.path)
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
        variants: finalVariants,
      })

      await newProduct.save()
      req.session.message = "Product created successfully!";
     return res.redirect("/admin/products");
    } catch (error) {
      console.error(error);
    }
  }
  const getEditProduct = async (req,res) => {
    const  {id} = req.query
    const product = await Product.find({_id : id}).populate("categoryId").populate("brandId")
    const categories = await Category.find({})
    const brands = await Brand.find({})
    const message = req.session.message || null
    delete req.session.message
    res.render("admin-view/admin.edit-product.ejs",{message,product,categories,brands})
  }

  const editProduct = async (req, res) => {
    try {
      const { id } = req.query;
      const { productName, description, brandId, categoryId } = req.body;
      const variants = req.body.variants;
  
      
      const product = await Product.findById(id);
      if (!product) {
        req.session.message = "Product not found!";
        return res.redirect("/admin/products");
      }
  
      
      const variantEntries = Object.keys(variants).map(async (index) => {
        const variant = variants[index];
  
        
        const filesOfVariant = req.files.filter(
          (file) => file.fieldname === `variants[${index}][productImages]`
        );
  
        let imageUrls = [];
  
        if (filesOfVariant.length > 0) {
        
          const uploadImages = filesOfVariant.map(async (file) => {
            const result = await cloudinary.uploader.upload(file.path, {
              folder: "product-images",
            });
            fs.unlinkSync(file.path);
            return result.secure_url;
          });
  
          imageUrls = await Promise.all(uploadImages);
        } else {
          
          const oldVariant = product.variants[index];
          imageUrls = oldVariant ? oldVariant.productImages : [];
        }
  
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
  
      
      await Product.findByIdAndUpdate({_id : id},{$set : {
      productName,
      description,
      brandId,
      categoryId,
      variants : finalVariants
      }})
  
      await product.save();
  
      req.session.message = "Product updated successfully!";
      return res.redirect("/admin/products");
    } catch (error) {
      console.error(error);
      req.session.message = "Something went wrong!";
      return res.redirect("/admin/products");
    }
  };
  const restoreProduct = async (req,res) => {
    try {
        const {id} = req.query
     await Product.findByIdAndUpdate({_id : id},{$set : {isDeleted : false}})
    req.session.message = "Product Restored Successfully"
    res.redirect("/admin/products")
    } catch (error) {
        console.log(error)
    }
}   
    const deleteProduct = async (req,res) => {
    try {
        const {id} = req.query
     await Product.findByIdAndUpdate({_id : id},{$set : {isDeleted : true}})
    req.session.message = "Product Soflty Deleted"
    res.redirect("/admin/products")
    } catch (error) {
        console.log(error)
    }
}


module.exports = {
    getProducts,
    getAddProduct,
    addProduct,
    getEditProduct,
    editProduct,
    restoreProduct,
    deleteProduct
}