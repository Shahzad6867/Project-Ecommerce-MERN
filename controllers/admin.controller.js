const Admin = require("../models/admin.model.js");
const User = require("../models/user.model.js");
const Category = require("../models/category.model.js");
const bcryptjs = require("bcryptjs");
const cloudinary = require("../config/cloudinaryConfig.js")
const fs = require("fs")

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
    req.session.message = `Welcome ${isAdmin.firstName}`
    return res.redirect("/admin-dashboard")
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
      const category = await Category.findOne({_id : id})
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


  const getProducts = async (req,res) => {
    const perPage = req.session.itemsPerPage || 5 
    const page = req.query.page || 1
     const categories = await Category.find({}).sort({createdAt : -1}).skip(perPage * page - perPage).limit(perPage)
     const count = await Category.countDocuments({})
    const pages = Math.ceil(count / perPage)
    const message = req.session.message || null
    delete req.session.message
    res.render("admin-view/admin.products.ejs",{message,categories,page,pages,count})
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
    getCategories,
    addCategory,
    editCategory,
    restoreCategory,
    deleteCategory
}
