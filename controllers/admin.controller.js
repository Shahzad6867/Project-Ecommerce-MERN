const Admin = require("../models/admin.model.js");
const User = require("../models/user.model.js");
const Category = require("../models/category.model.js");
const bcryptjs = require("bcryptjs");
const cloudinary = require("../config/cloudinaryConfig.js")
const fs = require("fs");
const Product = require("../models/product.model.js");
const Brand = require("../models/brand.model.js");

const getAdminLogin = async (req,res) => {
    const message = req.session.message || null
    delete req.session.message 
    res.render("admin-view/admin.login.ejs",{message})
}

const adminLogin = async (req,res) => {
    try {
        console.log(req.body)
    const {email,password} = req.body
    const isAdmin = await Admin.findOne({email})
    if(!isAdmin){
    return res.render("admin-view/admin.login.ejs",{message : "403 Unauthorized User, Access Denied! "})
    }
    const isPassMatch = await bcryptjs.compare(password,isAdmin.password)
    if(isAdmin && !isPassMatch){
    return  res.render("admin-view/admin.login.ejs",{message : "Incorrect Password"})
    }
    req.session.admin = isAdmin
    req.session.message = `Welcome ${isAdmin.firstName}`
    return res.redirect("/admin/users")
    } catch (error) {
        console.error(error)
    }
}

const getUsers = async (req,res) => {
    const perPage = req.session.itemsPerPage || 5 
    const page = req.query.page || 1
     const users = await User.find({}).sort({createdAt : -1}).skip(perPage * page - perPage).limit(perPage)
     const count = await User.countDocuments({})
    const pages = Math.ceil(count / perPage)
    const message = req.session.message || null
    delete req.session.message
    res.render("admin-view/admin.user-managment.ejs",{message,users,page,pages,count})
}

const blockUser = async (req,res) => {
    try {
        const {id} = req.query
     await User.findByIdAndUpdate({_id : id},{$set : {isBlocked : true}})
    req.session.message = "User Blocked"
    res.redirect("/admin/users")
    } catch (error) {
        console.log(error)
    }
}
const unblockUser = async (req,res) => {
    try {
        const {id} = req.query
     await User.findByIdAndUpdate({_id : id},{$set : {isBlocked : false}})
    req.session.message = "User Unblocked"
    res.redirect("/admin/users")
    } catch (error) {
        console.log(error)
    }
}

const deleteUser = async (req,res) => {
    try {
    const {id} = req.query
     await User.findByIdAndDelete({_id : id})
    req.session.message = "User Deleted"
    res.redirect("/admin/users")
    } catch (error) {
        console.log(error)
    }
}
const searchUser = async (req, res) => {
    try {
      const { search } = req.body;
      console.log(search)
      const query = {
        $or: [
          { firstName: { $regex: search, $options: "i" } },
          { lastName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      };
      const users = await User.find(query);
      if (!users) {
        req.session.message = "Enter an Eixsting User's Name or Email";
        return res.redirect("/admin/users");
      }
      res.render("admin-view/admin.searched-user-managment.ejs", { users });
    } catch (error) {
      console.error(error);
      req.session.message = "Something Went Wrong";
      res.redirect("/admin/users");
    }
  };

  const selectedOptionToViewTheList = async (req,res) => {
    try {
        const {itemsPerPage} = req.body
        req.session.itemsPerPage = itemsPerPage
        res.redirect("/admin/users")
    } catch (error) {
        console.log(error)
    }
  }

  const getCategories = async (req,res) => {
    const perPage = req.session.itemsPerPage || 5 
    const page = req.query.page || 1
     const categories = await Category.find({}).sort({createdAt : -1}).skip(perPage * page - perPage).limit(perPage)
     const count = await Category.countDocuments({})
    const pages = Math.ceil(count / perPage)
    const message = req.session.message || null
    delete req.session.message
    res.render("admin-view/admin.categories.ejs",{message,categories,page,pages,count})
  }

  const addCategory = async (req,res) => {
    try {
        const { categoryName, description} = req.body;
        const categoryExist = await Category.findOne({ categoryName : categoryName.toUpperCase() });
        if(categoryExist){
          req.session.message = "Category already Exists"
            return res.redirect("/admin/categories")
        }
        let result = null;
        let newCategory = null;
        if(req.file){
            result = await cloudinary.uploader.upload(req.file.path)
             newCategory = new Category({
              categoryName : categoryName.toUpperCase(),
              description,
              categoryImage : result.secure_url ,
              isDeleted :  false
            });
            fs.unlinkSync(req.file.path)
        }else{
          newCategory = new Category({
            categoryName : categoryName.toUpperCase(),
            description,
            categoryImage : null,
            isDeleted :  false
          });
        }
        
        await newCategory.save();
        
        req.session.message = "Category Created Successfully";
        return res.redirect("/admin/categories");
      } catch (error) {
        console.error(error);
      }
  }
  const restoreCategory = async (req,res) => {
    try {
        const {id} = req.query
     await Category.findByIdAndUpdate({_id : id},{$set : {isDeleted : false}})
    req.session.message = "Category Restored Successfully"
    res.redirect("/admin/categories")
    } catch (error) {
        console.log(error)
    }
}   
    const deleteCategory = async (req,res) => {
    try {
        const {id} = req.query
     await Category.findByIdAndUpdate({_id : id},{$set : {isDeleted : true}})
    req.session.message = "Category Soflty Deleted"
    res.redirect("/admin/categories")
    } catch (error) {
        console.log(error)
    }
}
  const editCategory = async (req, res) => {
    try {
       
        
      const {id} = req.query
      const { categoryName,description} = req.body;
      let result = null; 
      if(req.file){
        result = await cloudinary.uploader.upload(req.file.path)
        await Category.findOneAndUpdate({_id : id},
          { $set: {
               categoryName : categoryName.toUpperCase(),
                description,
                categoryImage : result.secure_url} }
                
        );
        fs.unlinkSync(req.file.path)
      }else{
        await Category.findOneAndUpdate({_id : id},
          { $set: {
               categoryName : categoryName.toUpperCase(),
                description,}
               }
        );
      }
      req.session.message = "Category Updated";
      return res.redirect("/admin/categories");
    } catch (error) {
      console.error(error);
    }
  };

  const getBrand = async (req,res) => {
    const perPage = req.session.itemsPerPage || 5 
    const page = req.query.page || 1
     const brands = await Brand.find({}).sort({createdAt : -1}).skip(perPage * page - perPage).limit(perPage)
     const count = await Brand.countDocuments({})
    const pages = Math.ceil(count / perPage)
    const message = req.session.message || null
    delete req.session.message
    res.render("admin-view/admin.brand.ejs",{message,brands,page,pages,count})
  }

  const addBrand = async (req,res) => {
    try {
        const { brandName, description} = req.body;
        const brandExist = await Brand.findOne({ brandName : brandName.toUpperCase() });
        if(brandExist){
          req.session.message = "Brand already Exists"
            return res.redirect("/admin/brands")
        }
        let result = null;
        let newBrand = null;
        if(req.file){
            result = await cloudinary.uploader.upload(req.file.path)
             newBrand = new Brand({
              brandName : brandName.toUpperCase(),
              description,
              brandImage : result.secure_url ,
              isDeleted :  false
            });
            fs.unlinkSync(req.file.path)
        }else{
          newBrand = new Brand({
            brandName : brandName.toUpperCase(),
            description,
            brandImage : null,
            isDeleted :  false
          });
        }
        
        await newBrand.save();
        
        req.session.message = "Brand Created Successfully";
        return res.redirect("/admin/brands");
      } catch (error) {
        console.error(error);
      }
  }

  const restoreBrand = async (req,res) => {
    try {
        const {id} = req.query
     await Brand.findByIdAndUpdate({_id : id},{$set : {isDeleted : false}})
    req.session.message = "Brand Restored Successfully"
    res.redirect("/admin/brands")
    } catch (error) {
        console.log(error)
    }
}   
    const deleteBrand = async (req,res) => {
    try {
        const {id} = req.query
     await Brand.findByIdAndUpdate({_id : id},{$set : {isDeleted : true}})
    req.session.message = "Brand Soflty Deleted"
    res.redirect("/admin/brands")
    } catch (error) {
        console.log(error)
    }
}
  const editBrand = async (req, res) => {
    try {
       
        
      const {id} = req.query
      const { brandName,description} = req.body;
      let result = null; 
      if(req.file){
        result = await cloudinary.uploader.upload(req.file.path)
        await Category.findOneAndUpdate({_id : id},
          { $set: {
               brandName : brandName.toUpperCase(),
                description,
                brandImage : result.secure_url} }
                
        );
        fs.unlinkSync(req.file.path)
      }else{
        await Category.findOneAndUpdate({_id : id},
          { $set: {
               brandName : brandName.toUpperCase(),
                description,}
               }
        );
      }
      req.session.message = "Brand Updated";
      return res.redirect("/admin/brands");
    } catch (error) {
      console.error(error);
    }
  };



  const getProducts = async (req,res) => {
    const perPage = req.session.itemsPerPage || 5 
    const page = req.query.page || 1
     const products = await Product.find({}).populate("categoryId").populate("brandId").sort({createdAt : -1}).skip(perPage * page - perPage).limit(perPage)
     const count = await Product.countDocuments({})
    const pages = Math.ceil(count / perPage)
    const message = req.session.message || null
    delete req.session.message
    res.render("admin-view/admin.products.ejs",{message,products,page,pages,count})
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
    console.log(product)
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
  
      
      product.productName = productName;
      product.description = description;
      product.brandId = brandId;
      product.categoryId = categoryId;
      product.variants = finalVariants;
  
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

const logoutAdmin = async (req,res) => {
  try {
    req.session.admin = null
  res.redirect("/admin/login")
  } catch (error) {
    console.error(error);
    req.session.message = "Something Went Wrong";
    res.redirect("/admin/dashboard");
  }
}
  
module.exports = {
    getAdminLogin,
    adminLogin,
    getUsers,
    blockUser,
    unblockUser,
    deleteUser,
    searchUser,
    selectedOptionToViewTheList,
    getProducts,
    getAddProduct,
    getCategories,
    addCategory,
    editCategory,
    restoreCategory,
    deleteCategory,
    addProduct,
    getEditProduct,
    editProduct,
    deleteProduct,
    restoreProduct,
    getBrand,
    addBrand,
    editBrand,
    restoreBrand,
    deleteBrand,
    logoutAdmin
    
}
