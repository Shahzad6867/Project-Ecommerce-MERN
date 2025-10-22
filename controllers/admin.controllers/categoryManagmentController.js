const Category = require("../../models/category.model.js");
const cloudinary = require("../../config/cloudinaryConfig.js")
const fs = require("fs");


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
       
            result = await cloudinary.uploader.upload(req.file.path,{
              folder : "category-image"
            })
             newCategory = new Category({
              categoryName : categoryName.toUpperCase(),
              categoryImage : result.secure_url ,
              description,
              isDeleted :  false
            });
            fs.unlinkSync(req.file.path)
        
        
        await newCategory.save();
        
        req.session.message = "Category Created Successfully";
        return res.redirect("/admin/categories");
      } catch (error) {
        console.error(error);
        req.session.message = "Something went Wrong!"
        res.redirect("/admin/categories")
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
        req.session.message = "Something went Wrong!"
        res.redirect("/admin/categories")
    }
}   
    const deleteCategory = async (req,res) => {
    try {
        const {id} = req.query
     await Category.findByIdAndUpdate({_id : id},{$set : {isDeleted : true}})
    req.session.message = "Category Deleted"
    res.redirect("/admin/categories")
    } catch (error) {
        console.log(error)
        req.session.message = "Something went Wrong!"
        res.redirect("/admin/categories")
    }
}
  const editCategory = async (req, res) => {
    try {

      const {id} = req.query
      const { categoryName,description} = req.body;
      
      let result = null; 
      if(req.file){
        result = await cloudinary.uploader.upload(req.file.path,{
          folder : "category-image"
        })
        console.log(result)
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
      req.session.message = "Category Updated Successfully";
      return res.redirect("/admin/categories");
    } catch (error) {
      console.error(error);
    }
  };

  module.exports = {
    getCategories,
    addCategory,
    editCategory,
    restoreCategory,
    deleteCategory
  }