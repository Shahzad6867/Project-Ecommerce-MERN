const cloudinary = require("../../config/cloudinaryConfig.js")
const fs = require("fs");
const {extractPublicId} = require("cloudinary-build-url")
const Product = require("../../models/product.model.js");
const Category = require("../../models/category.model.js")
const Cart = require("../../models/cart.model.js")
const Offer = require("../../models/offer.model.js")

const getOffers = async(req,res) => {
    const perPage = req.session.itemsPerPage || 5 
    const page = req.query.page || 1
    const offers = await Offer.find({}).skip(perPage * page - perPage).limit(perPage)
    const count = await Offer.countDocuments({})
    const productsFullList = await Product.aggregate().project({productName : 1,_id : 0})
    const pages = Math.ceil(count / perPage)
     const message = req.session.message || null
    delete req.session.message
    res.render("admin-view/admin.offers.ejs",{message,offers,count,page,pages,productsFullList})
}
const getAddOffer = async(req,res) => {
    const message = req.session.message || null
    delete req.session.message
    const offer = null
    res.render("admin-view/admin.add-offer.ejs",{offer})
}
const getEditOffer = async(req,res) => {
    const offerId = req.query.id
    const offer = await Offer.findOne({_id : offerId }).populate("productId").populate("categoryId")
    const message = req.session.message || null
    delete req.session.message
    res.render("admin-view/admin.add-offer.ejs",{message,offer})
}
const addOffer = async (req,res) => {
   try {
   
    console.log(req.body)
    const {offerName,offerType,selectedTarget,selectedTargetVariant,description,startDate,endDate,discountType,discountValue} = req.body
    let offer = {}
    let imageUrl = null
    if(req.file){
        
        let file = req.file
        const imageUpload = async (file) => {
        
            const result = await cloudinary.uploader.upload(file.path,{
                folder : "offer-banners"
            })
            fs.unlinkSync(file.path)
          return result.secure_url
        }
         imageUrl = await imageUpload(file)
        
       }

    if(offerType === "product"){
     offer = new Offer({
         offerName,
         applicableOn : offerType,
         productId : selectedTarget,
         productVariant : selectedTargetVariant,
         description,
         startDate,
         endDate,
         discountType,
         discountValue,
         bannerImage : imageUrl
     })
    }else if(offerType === "category" && discountType === "flat"){
     offer = new Offer({
         offerName,
         applicableOn : offerType,
         categoryId : selectedTarget,
         productVariant : selectedTargetVariant,
         description,
         startDate,
         endDate,
         discountType,
         discountValue,
         productMinPrice : req.body.productMinPrice,
         bannerImage : imageUrl
     })
    }else if(offerType === "category" && discountType === "percentage"){
     offer = new Offer({
         offerName,
         applicableOn : offerType,
         categoryId : selectedTarget,
         productVariant : selectedTargetVariant,
         description,
         startDate,
         endDate,
         discountType,
         discountValue,
         maxDiscountAmount : req.body.maxDiscountAmount,
         bannerImage : imageUrl
     })
    }
 
    
 
    const savedOffer = await offer.save()
    if(offerType === "product"){
     let product = await Product.findOne({_id : savedOffer.productId})
     if(product.variants[savedOffer.productVariant].productOfferId !== null){
         await Offer.findOneAndDelete({_id : product.variants[savedOffer.productVariant].productOfferId})
         product.variants[savedOffer.productVariant].productOfferId = savedOffer._id
         await Cart.updateMany({productId : product._id,variant : savedProduct.productVariant},{productOfferId : savedOffer._id})
         await product.save()
     }else{
         product.variants[savedOffer.productVariant].productOfferId = savedOffer._id
         await Cart.updateMany({productId : product._id,variant : savedOffer.productVariant},{productOfferId : savedOffer._id})
         await product.save()
     }
     
    }else{
         let product = await Product.findOne({categoryId : savedOffer.categoryId})
 
         if(product.categoryOfferId !== null){
             await Offer.findOneAndDelete({_id : product.categoryOfferId})
             await Product.updateMany({categoryOfferId : product.categoryOfferId },{categoryOfferId : savedOffer._id})
             await Cart.updateMany({categoryOfferId : product.categoryOfferId},{categoryOfferId : savedOffer._id})
         }else{
             await Product.updateMany({categoryId : savedOffer.categoryId },{categoryOfferId : savedOffer._id})
             await Cart.updateMany({categoryId : savedOffer.categoryId },{categoryOfferId : savedOffer._id})
         }
   
    }
    return res.redirect("/admin/offers")
   } catch (error) {
    console.log(error)
   }
}

const editOffer = async (req,res) => {
    try {
        console.log(req.body)
        const {offerName,offerType,selectedTarget,selectedTargetVariant,description,startDate,endDate,discountType,discountValue} = req.body
        let offer = await Offer.findOne({_id : req.query.id })
        console.log(offer)
        let imageUrl = null
        if(req.file){
            
            let file = req.file
            const imageUpload = async (file) => {
            
                const result = await cloudinary.uploader.upload(file.path,{
                    folder : "offer-banners"
                })
                fs.unlinkSync(file.path)
              return result.secure_url
            }
             imageUrl = await imageUpload(file)
             if(offer.bannerImage !== null){
                let publicId = extractPublicId(offer.bannerImage)
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
              imageUrl = offer.bannerImage 
           }

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
    
        // OLD CATEGORY OFFER
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

        if(offerType === "product"){
            const product = await Product.findById(selectedTarget)
            console.log(product)
            product.variants[selectedTargetVariant].productOfferId = offer._id
            await product.save()
            await Cart.updateMany({productId : selectedTarget,variant : selectedTargetVariant},{productOfferId : offer._id})
           
         await Offer.findOneAndUpdate({_id : req.query.id},{
             offerName : offerName,
             applicableOn : offerType,
             productId : selectedTarget,
             productVariant : selectedTargetVariant,
             categoryId : null,
             description : description,
             startDate : new Date(startDate),
             endDate : new Date(endDate),
             discountType : discountType,
             discountValue : discountValue,
             productMinPrice : null,
             maxDiscountAmount : null,
             bannerImage : imageUrl
         })
        }else if(offerType === "category" && discountType === "flat"){
            await Product.updateMany({categoryId : selectedTarget},{categoryOfferId : offer._id})
            await Cart.updateMany({categoryId : selectedTarget},{categoryOfferId : offer._id})
            await Offer.findOneAndUpdate({_id : req.query.id},{
             offerName : offerName,
             applicableOn : offerType,
             productId : null,
             productVariant : null,
             categoryId : selectedTarget,
             productVariant : selectedTargetVariant,
             description : description,
             startDate : new Date(startDate),
             endDate : new Date(endDate),
             discountType : discountType,
             discountValue : discountValue,
             productMinPrice : req.body.productMinPrice,
             maxDiscountAmount : null,
             bannerImage : imageUrl
         })
        }else if(offerType === "category" && discountType === "percentage"){
            await Product.updateMany({categoryId : selectedTarget},{categoryOfferId : offer._id})
            await Cart.updateMany({categoryId : selectedTarget},{categoryOfferId : offer._id})
            await Offer.findOneAndUpdate({_id : req.query.id},{
             offerName : offerName,
             applicableOn : offerType,
             productId : null,
             productVariant : null,
             categoryId : selectedTarget,
             productVariant : selectedTargetVariant,
             description : description,
             startDate : new Date(startDate),
             endDate : new Date(endDate),
             discountType : discountType,
             discountValue : discountValue,
             productMinPrice : null,
             maxDiscountAmount : req.body.maxDiscountAmount,
             bannerImage : imageUrl
         })
        }
        req.session.message = "Offer Updated Successfully"
        return res.redirect("/admin/offers")
       } catch (error) {
        console.log(error)
       }
}

const deleteOffer = async(req,res) => {
    let offerId = req.query.id
    let offer = await Offer.findById(offerId)
    if(offer.applicableOn === "product"){
        let product = await Product.findOne({_id : offer.productId})
            await Offer.findOneAndDelete({_id : product.variants[offer.productVariant].productOfferId})
            product.variants[offer.productVariant].productOfferId = null
            await Cart.updateMany({productId : product._id,variant : offer.productVariant},{productOfferId : null})
            await product.save()
       }else{
            let product = await Product.findOne({categoryId : offer.categoryId})
             await Offer.findOneAndDelete({_id : product.categoryOfferId})
             await Product.updateMany({categoryId : offer.categoryId },{categoryOfferId : null})
             await Cart.updateMany({categoryId : offer.categoryId},{categoryOfferId : null})
       }
       return res.json({
        success : true,
        message : "Offer has been Deleted Succesfully"
       })
  
}
const searchProducts = async(req,res) => {
    const search = req.body.searchTerm
    const result = await Product.find({ $text: { $search: search } })
    return res.json({
        products : result
    })
}
const searchCategories = async(req,res) => {
    const result = await Category.find({})
    return res.json({
        categories : result
    })
}
module.exports = {
    getAddOffer,
    searchProducts,
    searchCategories,
    addOffer,
    getOffers,
    deleteOffer,
    getEditOffer,
    editOffer
}