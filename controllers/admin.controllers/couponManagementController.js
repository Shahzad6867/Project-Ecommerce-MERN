const cloudinary = require("../../config/cloudinaryConfig.js")
const fs = require("fs");
const {extractPublicId} = require("cloudinary-build-url")
const Product = require("../../models/product.model.js");
const Category = require("../../models/category.model.js")
const Cart = require("../../models/cart.model.js")
const Coupon = require("../../models/coupon.model.js")

const getCoupons = async(req,res) => {
    const perPage = req.session.itemsPerPage || 5 
    const page = req.query.page || 1
    const coupons = await Coupon.find({userId : null}).skip(perPage * page - perPage).limit(perPage)
    const count = await Coupon.countDocuments({})
    const productsFullList = await Product.aggregate().project({productName : 1,_id : 0})
    const pages = Math.ceil(count / perPage)
     const message = req.session.message || null
    delete req.session.message
    res.render("admin-view/admin.coupons.ejs",{message,coupons,count,page,pages,productsFullList})
}
const getAddCoupon = async(req,res) => {
    const message = req.session.message || null
    delete req.session.message
    const coupon = null
    res.render("admin-view/admin.add-coupon.ejs",{coupon})
}
const getEditCoupon = async(req,res) => {
    const couponId = req.query.id
    const coupon = await Coupon.findOne({_id : couponId })
    const message = req.session.message || null
    delete req.session.message
    res.render("admin-view/admin.add-coupon.ejs",{message,coupon})
}
const addCoupon = async (req,res) => {
   try {
    const {couponName,description,endDate,discountValue,minAmount,maxDiscountAmount} = req.body
    let coupon = {}
    let imageUrl = null
    if(req.file){
        
        let file = req.file
        const imageUpload = async (file) => {
        
            const result = await cloudinary.uploader.upload(file.path,{
                folder : "coupon-banners"
            })
            fs.unlinkSync(file.path)
          return result.secure_url
        }
         imageUrl = await imageUpload(file)
        
       }

    
     coupon = new Coupon({
         name : couponName.toUpperCase(),
         description,
         endDate : new Date(endDate),
         discountValue,
         minAmount,
         maxDiscountAmount,
         bannerImage : imageUrl
     })
     await coupon.save()
    return res.redirect("/admin/coupons")
   } catch (error) {
    console.log(error)
   }
}

const editCoupon = async (req,res) => {
    try {
        const {couponName,description,endDate,discountValue,minAmount,maxDiscountAmount} = req.body
        let coupon = await Coupon.findOne({_id : req.query.id })
        console.log(coupon)
        let imageUrl = null
        if(req.file){
            
            let file = req.file
            const imageUpload = async (file) => {
            
                const result = await cloudinary.uploader.upload(file.path,{
                    folder : "coupon-banners"
                })
                fs.unlinkSync(file.path)
              return result.secure_url
            }
             imageUrl = await imageUpload(file)
             if(coupon.bannerImage !== null){
                let publicId = extractPublicId(coupon.bannerImage)
                    await cloudinary.uploader.destroy(publicId,(error,result) => {
                    if(error) {
                        console.error(error)
                    }else{
                        console.log(result)
                    }
                    })
               }
           }

           
           if(imageUrl === null){
              imageUrl = coupon.bannerImage 
           }

           
           
         await Coupon.findOneAndUpdate({_id : req.query.id},{
             name : couponName.toUpperCase(),
             description : description,
             endDate : new Date(endDate),
             discountValue,
             minAmount,
             maxDiscountAmount,
             bannerImage : imageUrl
         })
        
        req.session.message = "Coupon Updated Successfully"
        return res.redirect("/admin/coupons")
       } catch (error) {
        console.log(error)
       }
}

const deleteCoupon = async(req,res) => {
    let couponId = req.query.id
    let coupon = await Coupon.findById(couponId)
    if(coupon.applicableOn === "product"){
        let product = await Product.findOne({_id : coupon.productId})
            await Coupon.findOneAndDelete({_id : product.variants[coupon.productVariant].productCouponId})
            product.variants[coupon.productVariant].productCouponId = null
            await Cart.updateMany({productId : product._id,variant : coupon.productVariant},{productCouponId : null})
            await product.save()
       }else{
            let product = await Product.findOne({categoryId : coupon.categoryId})
             await Coupon.findOneAndDelete({_id : product.categoryCouponId})
             await Product.updateMany({categoryId : coupon.categoryId },{categoryCouponId : null})
             await Cart.updateMany({categoryId : coupon.categoryId},{categoryCouponId : null})
       }
       return res.json({
        success : true,
        message : "Coupon has been Deleted Succesfully"
       })
  
}

module.exports = {
    getAddCoupon,
    addCoupon,
    getCoupons,
    deleteCoupon,
    getEditCoupon,
    editCoupon
}