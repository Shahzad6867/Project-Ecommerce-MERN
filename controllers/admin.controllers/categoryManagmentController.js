const categoryService = require("../../services/admin-services/categoryService.js")
const fs = require("fs");
const path = require("path");
const ERROR_MESSAGES = require("../../constants/errorMessages.js")
const HTTP_STATUS = require("../../constants/httpStatus.js")

const getCategories = async (req,res) => {
    const perPage = req.session.itemsPerPage || 5 
    const page = req.query.page || 1
     const categories = await categoryService.getCategories(perPage,page)
     const count = await categoryService.countCategories()
    const pages = Math.ceil(count / perPage)
    const message = req.session.message || null
    delete req.session.message
    res.render("admin-view/admin.categories.ejs",{message,categories,page,pages,count})
  }

  const addCategory = async (req,res) => {
    try {
        const { categoryName, description} = req.body;
        const categoryExist = await categoryService.doesCategoryExist(categoryName)
        if(categoryExist){
          req.session.message = "Category already Exists"
            return res.redirect("/admin/categories")
        }
        let result = await categoryService.uploadToCloudinary(req.file.path)
        await categoryService.createNewCategory(categoryName,description,result.secure_url)
        fs.unlinkSync(path.resolve(req.file.path))
        req.session.message = "Category Created Successfully";
        return res.redirect("/admin/categories");
      } catch (error) {
        console.error(error);
        req.session.message = ERROR_MESSAGES.SERVER_ERROR
        return res.redirect("/admin/categories")
      }
  }
  const restoreCategory = async (req,res) => {
    try {
        const {id} = req.query
     await categoryService.restoreCategory(id)
    req.session.message = "Category Restored Successfully"
    return res.status(HTTP_STATUS.OK).json({
      success : true
     })
    } catch (error) {
        console.log(error)
        req.session.message = ERROR_MESSAGES.SERVER_ERROR
        res.redirect("/admin/categories")
    }
}   
    const deleteCategory = async (req,res) => {
    try {
        const {id} = req.query
     await categoryService.deleteCategory(id)
    req.session.message = "Category has been successfully Blocked"
     return res.status(HTTP_STATUS.OK).json({
      success : false
     })
    } catch (error) {
        console.log(error)
        req.session.message = ERROR_MESSAGES.SERVER_ERROR
        return res.redirect("/admin/categories")
    }
}
  const editCategory = async (req, res) => {
    try {

      const {id} = req.query
      const { categoryName,description} = req.body;
      
      if(req.file){
       let result = await categoryService.uploadToCloudinary(req.file.path)
        await categoryService.updateCategory(id,categoryName,description,result.secure_url)
        fs.unlinkSync(path.resolve(req.file.path))
      }else{
        await categoryService.updateCategory(id,categoryName,description)
      }

      req.session.message = "Category Updated Successfully";
      return res.redirect("/admin/categories");
    } catch (error) {
      console.error(error);
      req.session.message = ERROR_MESSAGES.SERVER_ERROR
      return res.redirect("/admin/categories")
    }
  };

  module.exports = {
    getCategories,
    addCategory,
    editCategory,
    restoreCategory,
    deleteCategory
  }