const cloudinary = require("../../config/cloudinaryConfig.js")
const fs = require("fs");
const Brand = require("../../models/brand.model.js");


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
            result = await cloudinary.uploader.upload(req.file.path,{
              folder : "brand-images"
            })
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
        result = await cloudinary.uploader.upload(req.file.path,{
          folder : "brand-images"
        })
        await Brand.findOneAndUpdate({_id : id},
          { $set: {
               brandName : brandName.toUpperCase(),
                description,
                brandImage : result.secure_url} }
                
        );
        fs.unlinkSync(req.file.path)
      }else{
        await Brand.findOneAndUpdate({_id : id},
          { $set: {
               brandName : brandName.toUpperCase(),
                description,}
               }
        );
      }
      req.session.message = "Update Succesful";
      return res.redirect("/admin/brands");
    } catch (error) {
      console.error(error);
    }
  };


module.exports = {
    getBrand,
    editBrand,
    addBrand,
    restoreBrand,
    deleteBrand
}