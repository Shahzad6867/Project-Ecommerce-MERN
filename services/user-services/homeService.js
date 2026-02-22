const Category = require("../../models/category.model.js");
const Product = require("../../models/product.model.js");
const Brand = require("../../models/brand.model.js");
const Cart = require("../../models/cart.model.js");
const Wishlist = require("../../models/wishlist.model.js");
const mongoose = require("mongoose")

const getUserShopContext = async (user) => {
    const categories = await Category.find({})
    const brands = await Brand.find({})
    const productsFullList = await Product.find({},{productName : 1,variants : 1,categoryId : 1}).populate("categoryId","categoryName")
    const cartItems = await Cart.find({userId : user?._id}).populate("productId").populate("productOfferId").populate("categoryOfferId")
    const wishlistItems = await Wishlist.find({userId : user?._id})
    const wishlistItemsCount = await Wishlist.find({userId : user?._id}).countDocuments()
    const cartItemsCount = await Cart.aggregate([{$match : {userId : new mongoose.Types.ObjectId(user?._id)}},{$group : {_id : "$userId", totalQuantity : {$sum : "$quantity"}}}])
    return {categories,brands,productsFullList,cartItems,wishlistItems,wishlistItemsCount,cartItemsCount}
}
const getProducts = async (skip,limit,query,priceQuery,search,sort) => {
    const pipeline = []
    if(typeof search === "string" && search !== null){
      pipeline.push({$match : { productName: { $regex: search, $options: "i" } }})
    }
    if(typeof query === "object" && query !== null){
        pipeline.push({$match : query})
    }
    pipeline.push({ $unwind: {
      path: "$variants",
      includeArrayIndex: "variant" 
    }})

    if(typeof priceQuery === "object" && priceQuery !== null){
        pipeline.push(priceQuery)
    }
    
    pipeline.push(
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "categoryId"
        }
      },
      {
        $lookup: {
          from: "brands",
          localField: "brandId",
          foreignField: "_id",
          as: "brandId"
        }
      },
      {
        $lookup: {
          from: "offers",
          localField: "variants.productOfferId",
          foreignField: "_id",
          as: "variants.productOfferId"
        }
      },
      {
        $lookup: {
          from: "offers",
          localField: "categoryOfferId",
          foreignField: "_id",
          as: "categoryOfferId"
        }
      },
  
      { $unwind: "$categoryId" },
      { $unwind: "$brandId" },
  
      {
        $unwind: {
          path: "$variants.productOfferId",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $unwind: {
          path: "$categoryOfferId",
          preserveNullAndEmptyArrays: true
        }
      }
    )

    if(sort !== null && (sort === "low-high" || sort === "high-low")){
      pipeline.push({ $sort : {"variants.price" : (sort === "high-low") ? -1 : 1} })
    }
    if(sort !== null && (sort === "z-a" || sort === "a-z")){
      pipeline.push({ $sort : { productName : (sort === "z-a") ? -1 : 1} })
    }
    if(sort !== null && sort === "featured"){
      pipeline.push({ $sort : { isFeatured : -1} })
    }
    if (typeof skip === "number" && typeof limit === "number") {
      pipeline.push({ $skip: skip })
      pipeline.push({ $limit: limit })
    }

    let result = await Product.aggregate(pipeline).collation({locale : "en", strength : 2})
    return result
  }
  
const getProductsCount = async (query,priceQuery,search) => {
    let pipeline = []
    if(typeof search === "string" && search !== null){
      pipeline.push({$match : { productName: { $regex: search, $options: "i" } }})
    }
    if(typeof query === "object" && query !== null){
        pipeline.push({$match : query})
    }
    
    pipeline.push({$unwind : "$variants"})
    if(typeof priceQuery === "object" && priceQuery !== null){
        pipeline.push(priceQuery)
    }
    
    pipeline.push({$count : "products_count"})
    let count = await Product.aggregate(pipeline)
    return (count[0]?.products_count) ? count[0]["products_count"] : 0
}
module.exports = {
    getUserShopContext,
    getProducts,
    getProductsCount
}