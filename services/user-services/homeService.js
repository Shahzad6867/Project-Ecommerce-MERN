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
const getProducts = async (skip, limit,query,priceQuery) => {
    const pipeline = []
    if(typeof query === "object"){
        pipeline.push({$match : query})
    }

    pipeline.push({ $unwind: "$variants" })

    if(typeof priceQuery === "object"){
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
  
   
    if (typeof skip === "number" && typeof limit === "number") {
      pipeline.push({ $skip: skip })
      pipeline.push({ $limit: limit })
    }

    pipeline.push({
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
      })
    return Product.aggregate(pipeline)
  }
  
const getProductsCount = async (query,priceQuery) => {
    let pipeline = []
    if(typeof query === "object"){
        pipeline.push({$match : query})
    }
    pipeline.push({$unwind : "$variants"})
    if(typeof priceQuery === "object"){
        pipeline.push(priceQuery)
    }
    pipeline.push({$count : "products_count"})
    let count = await Product.aggregate(pipeline)
    return count[0]["products_count"]
}
module.exports = {
    getUserShopContext,
    getProducts,
    getProductsCount
}