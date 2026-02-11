const fs = require("fs");
const path = require("path");
const {extractPublicId} = require("cloudinary-build-url")
const couponService = require("../../services/admin-services/couponService.js")
const ERROR_MESSAGES = require("../../constants/errorMessages.js")
const HTTP_STATUS = require("../../constants/httpStatus.js")

const getCoupons = async(req,res) => {
    const perPage = req.session.itemsPerPage || 5 
    const page = req.query.page || 1
    const coupons = await couponService.getCoupons(perPage,page)
    const count = await couponService.countCoupons()
    const pages = Math.ceil(count / perPage)
     const message = req.session.message || null
    delete req.session.message
    const timezone = req.cookies.tz
    res.render("admin-view/admin.coupons.ejs",{message,coupons,count,page,pages,timezone})
}
const getAddCoupon = async(req,res) => {
    res.render("admin-view/admin.add-coupon.ejs",{coupon : null})
}
const getEditCoupon = async(req,res) => {
    const couponId = req.query.id
    const coupon = await couponService.getCoupon(couponId)
    const timezone = req.cookies.tz
    res.render("admin-view/admin.add-coupon.ejs",{coupon,timezone})
}
const addCoupon = async (req,res) => {
   try {
    const {couponName,description,endDate,discountType,discountValue,minAmount,maxDiscountAmount} = req.body
    let imageUrl = null
    if(req.file){
        imageUrl = await couponService.uploadToCloudinary(req.file.path)
        fs.unlinkSync(path.resolve(req.file.path))
    }
    await couponService.createNewCoupon(couponName,description,endDate,discountType,discountValue,minAmount,maxDiscountAmount,imageUrl)
    req.session.message = "Coupon has been created Successfully"
    return res.redirect("/admin/coupons")
   } catch (error) {
    console.log(error)
    req.session.message = ERROR_MESSAGES.SERVER_ERROR
    return res.redirect("/admin/coupons")
   }
}

const editCoupon = async (req,res) => {
    try {
        const {couponName,description,endDate,discountType,discountValue,minAmount,maxDiscountAmount} = req.body
        let coupon = await couponService.getCoupon(req.query.id)
        let imageUrl = null
        if(req.file){
            imageUrl = await couponService.uploadToCloudinary(req.file.path)
            fs.unlinkSync(path.resolve(req.file.path))
            if(coupon.bannerImage !== null){
                let publicId = extractPublicId(coupon.bannerImage)
                    await couponService.deleteImageFromCloudinary(publicId)
               }
        }

        if(imageUrl === null){
            imageUrl = coupon.bannerImage 
        }

        await couponService.updateCoupon(req.query.id,couponName,description,endDate,discountType,discountValue,minAmount,maxDiscountAmount,imageUrl) 
        req.session.message = "Coupon Updated Successfully"
        return res.redirect("/admin/coupons")
       } catch (error) {
        console.log(error)
        req.session.message = ERROR_MESSAGES.SERVER_ERROR
        return res.redirect("/admin/coupons")
       }
}

const deleteCoupon = async(req,res) => {
    await couponService.deleteCoupon(req.query.id)
    req.session.message =  "Coupon has been deleted Successfully"
    return res.status(HTTP_STATUS.OK).json({
        success : true
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