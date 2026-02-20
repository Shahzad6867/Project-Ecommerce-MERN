const Category = require("../../models/category.model.js");
const Product = require("../../models/product.model.js");
const User = require("../../models/user.model.js");
const Brand = require("../../models/brand.model.js");
const Cart = require("../../models/cart.model.js");
const Wishlist = require("../../models/wishlist.model.js");
const Offer = require("../../models/offer.model.js");
const mongoose = require("mongoose")
require("dotenv").config()
const homeService = require("../../services/user-services/homeService.js")

const lookUpProducts = async function(query,priceQuery,limit,skip,count){
 
  if(typeof query === "object" && typeof priceQuery === "undefined"){
    console.log("fromQueryAndPriceQueryUndefined")
    const products = await Product.aggregate([{
      $match : query
    },{
      $unwind : "$variants"
    },
    {
      $lookup : {
        from : "categories",
        localField : "categoryId",
        foreignField : "_id",
        as : "categoryId"
      }
    },{
      $lookup : {
        from : "brands",
        localField : "brandId",
        foreignField : "_id",
        as : "brandId"
      }
    },{
      $lookup : {
        from : "offers",
        localField : "variants.productOfferId",
        foreignField : "_id",
        as : "variants.productOfferId"
      }
    },{
      $lookup : {
        from : "offers",
        localField : "categoryOfferId",
        foreignField : "_id",
        as : "categoryOfferId"
      }
    },{
      $unwind : "$categoryId"
    },{
      $unwind : "$brandId"
    },{
      $unwind : {
        path : "$variants.productOfferId",
      preserveNullAndEmptyArrays: true
      }
    },{
      $unwind :{
        path : "$categoryOfferId",
      preserveNullAndEmptyArrays: true
               }
    },{
      $group: {
        _id: "$_id",
  
        productName: { $first: "$productName" },
        description: { $first: "$description" },
        isDeleted: { $first: "$isDeleted" },
        categoryId: { $first: "$categoryId" },
        brandId: { $first: "$brandId" },
        createdAt: { $first: "$createdAt" },
        updatedAt: { $first: "$updatedAt" },
        isFeatured: { $first: "$isFeatured" },
        categoryOfferId: { $first: "$categoryOfferId" },
        variants: { $push: "$variants" }
      }
    }])
    return products
  }else if(typeof query === "object" && typeof priceQuery === "object" ){
    console.log("fromQueryAndPriceQuery")
          const products = await Product.aggregate([{
            $match : query
          },{
            $unwind : "$variants"
          },
          priceQuery,
          {
            $lookup : {
              from : "categories",
              localField : "categoryId",
              foreignField : "_id",
              as : "categoryId"
            }
          },{
            $lookup : {
              from : "brands",
              localField : "brandId",
              foreignField : "_id",
              as : "brandId"
            }
          },{
            $lookup : {
              from : "offers",
              localField : "variants.productOfferId",
              foreignField : "_id",
              as : "variants.productOfferId"
            }
          },{
            $lookup : {
              from : "offers",
              localField : "categoryOfferId",
              foreignField : "_id",
              as : "categoryOfferId"
            }
          },{
            $unwind : "$categoryId"
          },{
            $unwind : "$brandId"
          },{
            $unwind : {
              path : "$variants.productOfferId",
            preserveNullAndEmptyArrays: true
            }
          },{
            $unwind :{
              path : "$categoryOfferId",
            preserveNullAndEmptyArrays: true
                    }
          },{
            $group: {
              _id: "$_id",
        
              productName: { $first: "$productName" },
              description: { $first: "$description" },
              isDeleted: { $first: "$isDeleted" },
              categoryId: { $first: "$categoryId" },
              brandId: { $first: "$brandId" },
              createdAt: { $first: "$createdAt" },
              updatedAt: { $first: "$updatedAt" },
              isFeatured: { $first: "$isFeatured" },
              categoryOfferId: { $first: "$categoryOfferId" },
              variants: { $push: "$variants" }
            }
          }])
          return products
  }else if(typeof query === "object" && typeof limit === "number"){
    console.log("fromQueryAndLimit")
    const products = await Product.aggregate([{
      $match : query
    },{
      $unwind : "$variants"
    },
    {
      $lookup : {
        from : "categories",
        localField : "categoryId",
        foreignField : "_id",
        as : "categoryId"
      }
    },{
      $lookup : {
        from : "brands",
        localField : "brandId",
        foreignField : "_id",
        as : "brandId"
      }
    },{
      $lookup : {
        from : "offers",
        localField : "variants.productOfferId",
        foreignField : "_id",
        as : "variants.productOfferId"
      }
    },{
      $lookup : {
        from : "offers",
        localField : "categoryOfferId",
        foreignField : "_id",
        as : "categoryOfferId"
      }
    },{
      $unwind : "$categoryId"
    },{
      $unwind : "$brandId"
    },{
      $unwind : {
        path : "$variants.productOfferId",
      preserveNullAndEmptyArrays: true
      }
    },{
      $unwind :{
        path : "$categoryOfferId",
      preserveNullAndEmptyArrays: true
               }
    },{
      $group: {
        _id: "$_id",
  
        productName: { $first: "$productName" },
        description: { $first: "$description" },
        isDeleted: { $first: "$isDeleted" },
        categoryId: { $first: "$categoryId" },
        brandId: { $first: "$brandId" },
        createdAt: { $first: "$createdAt" },
        updatedAt: { $first: "$updatedAt" },
        isFeatured: { $first: "$isFeatured" },
        categoryOfferId: { $first: "$categoryOfferId" },
        variants: { $push: "$variants" }
      }
    },{
      $limit : limit
    }])
    return products
  }else if(typeof skip === "number" && typeof limit === "number"){
    console.log("fromSkipAndLimit")
        const products = await Product.aggregate([{
          $unwind : "$variants"
        },
        {
          $lookup : {
            from : "categories",
            localField : "categoryId",
            foreignField : "_id",
            as : "categoryId"
          }
        },{
          $lookup : {
            from : "brands",
            localField : "brandId",
            foreignField : "_id",
            as : "brandId"
          }
        },{
          $lookup : {
            from : "offers",
            localField : "variants.productOfferId",
            foreignField : "_id",
            as : "variants.productOfferId"
          }
        },{
          $lookup : {
            from : "offers",
            localField : "categoryOfferId",
            foreignField : "_id",
            as : "categoryOfferId"
          }
        },{
          $unwind : "$categoryId"
        },{
          $unwind : "$brandId"
        },{
          $unwind : {
            path : "$variants.productOfferId",
          preserveNullAndEmptyArrays: true
          }
        },{
          $unwind :{
            path : "$categoryOfferId",
          preserveNullAndEmptyArrays: true
                  }
        },
        {
          $skip : skip
        },
        {
          $limit : limit
        },{
          $group: {
            _id: "$_id",
      
            productName: { $first: "$productName" },
            description: { $first: "$description" },
            isDeleted: { $first: "$isDeleted" },
            categoryId: { $first: "$categoryId" },
            brandId: { $first: "$brandId" },
            createdAt: { $first: "$createdAt" },
            updatedAt: { $first: "$updatedAt" },
            isFeatured: { $first: "$isFeatured" },
            categoryOfferId: { $first: "$categoryOfferId" },
            variants: { $push: "$variants" }
          }
        }])
          return products
  }else if(count && count === "count"){
    console.log("fromCount")
        const products = await Product.aggregate([{
          $unwind : "$variants"
        },{
          $count : "products_count"
        }])
          return products
  }
  
    
}


const getHomepage = async(req,res) => {
    try {

    const user = req.session.user || req.user
    let message = req.session.message || null 
    delete req.session.message
    const products = await homeService.getProducts()
    const search = req.query.search || null
    const {categories,productsFullList,cartItems,wishlistItems,wishlistItemsCount,cartItemsCount} = await homeService.getUserShopContext(user)
    res.render("user-view/user.homepage.ejs",{message,categories,products,productsFullList,user,cartItems,cartItemsCount,wishlistItems,wishlistItemsCount,search})
    } catch (error) {
      console.log(error)
    }
}

const getProductDetail = async(req,res) => {
    try {
    const {id,variant} = req.query
  
    const products = await lookUpProducts({_id : new mongoose.Types.ObjectId(id)})
    const product = products[0]
    if(product.isDeleted){
      req.session.message = "Product Unavailable"
      return res.redirect("/")
    }
    const relatedProduct = await lookUpProducts({ categoryId : new mongoose.Types.ObjectId(product.categoryId._id)},"",5)
    const productsFullList = await Product.find({},{productName : 1,variants : 1,categoryId : 1}).populate("categoryId","categoryName")
    const user = req.session.user || req.user
    const cartItems = await Cart.find({userId : user?._id}).populate("productId").populate("productOfferId").populate("categoryOfferId")
    const isProductInCart = await Cart.findOne({userId : user?._id,productId : id,variant : variant})
    const wishlistItems = await Wishlist.find({userId : user?._id})
    const wishlistItemsCount = await Wishlist.find({userId : user?._id}).countDocuments()
    const search = req.query.search || null
    res.render("user-view/user.product-detail-page.ejs",{product,relatedProduct,productsFullList,variant,user,cartItems,isProductInCart,wishlistItems,wishlistItemsCount,search})
    } catch (error) {
        console.log(error.message)
    }
}

const getShop = async (req,res) => {
try {
    let message = req.session.message || null 
    delete req.session.message
    const perPage = 8
    const page = req.query.page || 1
    const skip = (perPage * page) - perPage
    const sort = req.query?.sort || null
    const category = req.query?.category || null
    const brand = req.query?.brand || null
    const minPrice = (req.query?.minPrice !== "") ? Number(req.query?.minPrice) : null
    const maxPrice = (req.query?.maxPrice !== "") ? Number(req.query?.maxPrice) : null
    const search = req.query.search || null
    const query = {};
    let categoryIds = null
    if (category ) {
      query.categoryId = {
        $in: (Array.isArray(category) ? category : [category])
          .map(id => new mongoose.Types.ObjectId(id))
      };
      categoryIds = query.categoryId["$in"].map(id => String(id))
    }
    let brandIds = null
    if (brand) {
      query.brandId = {
        $in: (Array.isArray(brand) ? brand : [brand])
          .map(id => new mongoose.Types.ObjectId(id))
      };
      brandIds = query.brandId["$in"].map(id => String(id))
    }
    let priceQuery = null
    if (minPrice||maxPrice) {
      let priceMatch = {};
      if (minPrice !== null) priceMatch.$gte = parseFloat(minPrice);
      if (maxPrice !== null) priceMatch.$lte = parseFloat(maxPrice);

       priceQuery = {
        $match : {
          "variants.price": priceMatch
        }
      }
    }
    const products = await homeService.getProducts(skip,perPage,query,priceQuery,search,sort)
    const user = req.session.user || req.user
    let count = await homeService.getProductsCount(query,priceQuery,req.query?.search)
    const pages = Math.ceil(count / perPage)
   
    const {categories,brands,productsFullList,cartItems,wishlistItems,wishlistItemsCount,cartItemsCount} = await homeService.getUserShopContext(user)
    res.render("user-view/user.shop.ejs",{categories,products,brands,productsFullList,user,cartItemsCount,cartItems,wishlistItems,wishlistItemsCount,pages,page,count,search,sort,categoryIds,brandIds,minPrice,maxPrice})
    
} catch (error) {
    console.log(error)
}
}






module.exports = {
    getHomepage,
    getProductDetail,
    getShop
}