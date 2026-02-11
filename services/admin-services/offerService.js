const cloudinary = require("../../config/cloudinaryConfig.js")
const Product = require("../../models/product.model.js");
const Category = require("../../models/category.model.js")
const Cart = require("../../models/cart.model.js")
const Offer = require("../../models/offer.model.js")

const getOffers = async (perPage,page) => {
    let offers = await Offer.find({userId : null}).sort({startDate : -1}).skip(perPage * page - perPage).limit(perPage)
    return offers
 }
 
 const countOffers = async () => {
     let count = await Offer.countDocuments({})
     return count
 }

 const getOffer = async (id) => {
    let offer = await Offer.findOne({_id : id }).populate("productId").populate("categoryId")
    return offer
}

const uploadToCloudinary = async (file) => {
    let result = await cloudinary.uploader.upload(file,{
        folder : "offer-banners"
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

const createNewOffer = async(offerName,offerType,selectedTarget,selectedTargetVariant,description,startDate,endDate,discountType,discountValue,cloudUrl,productMinPrice,maxDiscountAmount) => {
    let offer = new Offer({
            offerName,
            applicableOn : offerType,
            productId : (offerType === "product") ? selectedTarget : null,
            productVariant : (offerType === "product") ? selectedTargetVariant : null,
            categoryId : (offerType === "category") ? selectedTarget : null,
            description,
            startDate : new Date(startDate),
            endDate : new Date(endDate),
            discountType,
            discountValue,
            productMinPrice : productMinPrice ?? null,
            maxDiscountAmount : maxDiscountAmount ?? null,
            bannerImage : cloudUrl
        })
       
       const newOffer = await offer.save()
       return newOffer
}

const updateAccordingToApplicableOnCreatingNewOffer = async (newOffer) => {
    if(newOffer.applicableOn === "product"){

        let product = await Product.findOne({_id : newOffer.productId})
        if(product.variants[newOffer.productVariant].productOfferId !== null){
            await Offer.findOneAndDelete({_id : product.variants[newOffer.productVariant].productOfferId})
            product.variants[newOffer.productVariant].productOfferId = newOffer._id
            await Cart.updateMany({productId : product._id,variant : newOffer.productVariant},{productOfferId : newOffer._id})
            await product.save()
        }else{
            product.variants[newOffer.productVariant].productOfferId = newOffer._id
            await Cart.updateMany({productId : product._id,variant : newOffer.productVariant},{productOfferId : newOffer._id})
            await product.save()
        }
    }else{

        let product = await Product.findOne({categoryId : newOffer.categoryId})
        if(product?.categoryOfferId !== null){
            await Offer.findOneAndDelete({_id : product.categoryOfferId})
            await Product.updateMany({categoryOfferId : product.categoryOfferId },{categoryOfferId : newOffer._id})
            await Cart.updateMany({categoryOfferId : product.categoryOfferId},{categoryOfferId : newOffer._id})
        }else{
            await Product.updateMany({categoryId : newOffer.categoryId },{categoryOfferId : newOffer._id})
            await Cart.updateMany({categoryId : newOffer.categoryId },{categoryOfferId : newOffer._id})
        }
    }
    

    
}

const updateAccordingToApplicableOnEditingOffer = async (offer) => {
    if (offer.applicableOn === "product" && offer.productId) {
        const product = await Product.findById(offer.productId);
        if (product && product.variants[offer.productVariant]) {
            product.variants[offer.productVariant].productOfferId = null;
            await product.save();
        }

        await Cart.updateMany(
            { productId: offer.productId, variant: offer.productVariant },
            { productOfferId: null }
        );
    }

    if (offer.applicableOn === "category" && offer.categoryId) {
        await Product.updateMany(
            { categoryId: offer.categoryId },
            { categoryOfferId: null }
        );

        await Cart.updateMany(
            { categoryId: offer.categoryId },
            { categoryOfferId: null }
        );
    }
}

const updateOffer = async (id,offerName,offerType,selectedTarget,selectedTargetVariant,description,startDate,endDate,discountType,discountValue,cloudUrl,productMinPrice,maxDiscountAmount) => {
    if(offerType === "product"){
        const product = await Product.findById(selectedTarget)
        product.variants[selectedTargetVariant].productOfferId = id
        await product.save()
        await Cart.updateMany({productId : selectedTarget,variant : selectedTargetVariant},{productOfferId : id})
    }else{
        await Product.updateMany({categoryId : selectedTarget},{categoryOfferId : id})
        await Cart.updateMany({categoryId : selectedTarget},{categoryOfferId : id})
    }
     await Offer.findOneAndUpdate({_id : id},{
         offerName : offerName,
         applicableOn : offerType,
         productId : (offerType === "product") ? selectedTarget : null,
         productVariant : (offerType === "product") ? selectedTargetVariant : null,
         categoryId : (offerType === "category") ? selectedTarget : null,
         productVariant : selectedTargetVariant,
         description : description,
         startDate : new Date(startDate),
         endDate : new Date(endDate),
         discountType : discountType,
         discountValue : discountValue,
         productMinPrice : productMinPrice ?? null,
         maxDiscountAmount : maxDiscountAmount ?? null,
         bannerImage : cloudUrl
     })
    
}

const deleteOffer = async (offer) => {
    if(offer.applicableOn === "product"){
        let product = await Product.findOne({_id : offer.productId})
            await Offer.findOneAndDelete({_id : offer._id})
            if(product.variants[offer.productVariant].productOfferId === offer._id){
                product.variants[offer.productVariant].productOfferId = null
                await product.save()
            }
            await Cart.updateMany({productId : product._id,variant : offer.productVariant,productOfferId : offer._id},{productOfferId : null})
       }else{
             await Product.updateMany({categoryOfferId : offer._id },{categoryOfferId : null})
             await Cart.updateMany({categoryOfferId : offer._id},{categoryOfferId : null})
             await Offer.findOneAndDelete({_id : offer._id})
       }
}

const getProducts = async (search) => {
   let result = await Product.find({ $text: { $search: search } })
   return result
}
const getCategories = async (search) => {
    let result = await Category.find({})
    return result
 }
 module.exports = {
    getOffers,
    countOffers,
    getOffer,
    uploadToCloudinary,
    deleteImageFromCloudinary,
    createNewOffer,
    updateAccordingToApplicableOnCreatingNewOffer,
    updateAccordingToApplicableOnEditingOffer,
    updateOffer,
    deleteOffer,
    getProducts,
    getCategories
 }