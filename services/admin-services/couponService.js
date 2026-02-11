const Coupon = require("../../models/coupon.model.js");
const cloudinary = require("../../config/cloudinaryConfig.js")

const getCoupons = async (perPage,page) => {
   let coupons = await Coupon.find({userId : null}).sort({createdAt : -1}).skip(perPage * page - perPage).limit(perPage)
   return coupons
}

const countCoupons = async () => {
    let count = await Coupon.countDocuments({})
    return count
}

const getCoupon = async (id) => {
    let coupon = await Coupon.findOne({ _id : id })
    return coupon
}

const uploadToCloudinary = async (file) => {
    let result = await cloudinary.uploader.upload(file,{
        folder : "coupon-banners"
      })
    return result.secure_url
}

const deleteImageFromCloudinary = async (publicId) => {
    await cloudinary.uploader.destroy(publicId,(error,result) => {
        if(error) {
            console.error(error)
        }else{
            console.log(result)
        }
        })
}

const createNewCoupon = async (couponName,description,endDate,discountType,discountValue,minAmount,maxDiscountAmount,cloudUrl) => {
    let coupon = new Coupon({
        name : couponName.toUpperCase(),
        description,
        endDate : new Date(endDate),
        discountType,
        discountValue,
        minAmount,
        maxDiscountAmount,
        bannerImage : cloudUrl
    })
    await coupon.save() 
}

const updateCoupon = async (id,couponName,description,endDate,discountType,discountValue,minAmount,maxDiscountAmount,cloudUrl) => {

    await Coupon.findOneAndUpdate({_id : id},{
        name : couponName.toUpperCase(),
        description : description,
        endDate : new Date(endDate),
        discountType,
        discountValue,
        minAmount,
        maxDiscountAmount,
        bannerImage : cloudUrl
    })
   
}

const deleteCoupon = async (id) => {
    await Coupon.findByIdAndDelete(id)
}



module.exports = {
    getCoupons,
    countCoupons,
    getCoupon,
    uploadToCloudinary,
    deleteImageFromCloudinary,
    createNewCoupon,
    updateCoupon,
    deleteCoupon
}