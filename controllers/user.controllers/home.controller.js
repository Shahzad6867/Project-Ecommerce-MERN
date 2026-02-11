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
    const {categories,productsFullList,cartItems,wishlistItems,wishlistItemsCount,cartItemsCount} = await homeService.getUserShopContext(user)
    res.render("user-view/user.homepage.ejs",{message,categories,products,productsFullList,user,cartItems,cartItemsCount,wishlistItems,wishlistItemsCount})
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
    const isProductInCart = await Cart.findOne({productId : id,variant : variant})
    const wishlistItems = await Wishlist.find({userId : user?._id})
    const wishlistItemsCount = await Wishlist.find({userId : user?._id}).countDocuments()
    res.render("user-view/user.product-detail-page.ejs",{product,relatedProduct,productsFullList,variant,user,cartItems,isProductInCart,wishlistItems,wishlistItemsCount})
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
    const products = await homeService.getProducts(skip,perPage)
    const user = req.session.user || req.user
    let count = await homeService.getProductsCount()
    const pages = Math.ceil(count / perPage)
    const {categories,brands,productsFullList,cartItems,wishlistItems,wishlistItemsCount,cartItemsCount} = await homeService.getUserShopContext(user)
    res.render("user-view/user.shop.ejs",{categories,products,brands,productsFullList,user,cartItemsCount,cartItems,wishlistItems,wishlistItemsCount,pages,page,count})
    
} catch (error) {
    console.log(error)
}
}

const shopFiltered = async (req,res) => {
  try {
    const { category, brand, minPrice, maxPrice } = req.body;
    if(!category && !brand && !minPrice && !maxPrice){
      return res.redirect("/shop")
    }
    const user = req.session.user || req.user
    const perPage = 8
    const page = req.query.page || 1
    const skip = (perPage * page) - perPage
    let query = {};

    if (category ) {
      query.categoryId = {
        $in: (Array.isArray(category) ? category : [category])
          .map(id => new mongoose.Types.ObjectId(id))
      };
    }

    if (brand) {
      query.brandId = {
        $in: (Array.isArray(brand) ? brand : [brand])
          .map(id => new mongoose.Types.ObjectId(id))
      };
    }
    let priceQuery = null
    if (minPrice || maxPrice) {
      let priceMatch = {};
      if (minPrice) priceMatch.$gte = parseFloat(minPrice);
      if (maxPrice) priceMatch.$lte = parseFloat(maxPrice);

       priceQuery = {
        $match : {
          "variants.price": priceMatch
        }
      }
    }
    let filteredProducts = (priceQuery !== null) ? await homeService.getProducts(skip,perPage,query,priceQuery) : await homeService.getProducts(skip,perPage,query)
    const count = (priceQuery !== null) ? await homeService.getProductsCount(query,priceQuery) : await homeService.getProductsCount(query)
    const pages = Math.ceil(count / perPage)
     const {categories,brands,productsFullList,cartItems,wishlistItems,wishlistItemsCount,cartItemsCount} = await homeService.getUserShopContext(user)
      if(Array.isArray(req.body.category)){
       req.body.category = req.body.category.map(value => String(value))
      }else{
        req.body.category = String(req.body.category)
      }

      if(Array.isArray(req.body.brand)){
        req.body.brand = req.body.brand.map(value => String(value))
       }else{
         req.body.brand = String(req.body.brand)
       }
    res.render("user-view/user.shop-filtered.ejs", {
      products: filteredProducts,
      filters: req.body,
      page,
      pages, 
      count,
      categories,
      brands,
      productsFullList,
      cartItems,cartItemsCount,user,wishlistItems,wishlistItemsCount
    });

  } catch (error) {
    console.log(error)
  }
};




module.exports = {
    getHomepage,
    getProductDetail,
    getShop,
    shopFiltered
}