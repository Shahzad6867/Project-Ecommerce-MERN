const Category = require("../../models/category.model.js");
const Product = require("../../models/product.model.js");
const User = require("../../models/user.model.js");
const Brand = require("../../models/brand.model.js");
const Cart = require("../../models/cart.model.js");
const Offer = require("../../models/offer.model.js");
const mongoose = require("mongoose")
require("dotenv").config()

const lookUpProducts = async function(query,priceQuery,limit){
 
  if(typeof query === "object" && typeof priceQuery === "undefined"){
    
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
    console.log("Hellp")
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
  }
 
    const products = await Product.aggregate([{
      $unwind : "$variants"
    },{
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
}
const getHomepage = async(req,res) => {
    try {
      let message = req.session.message || null 
    delete req.session.message
    const categories = await Category.find({})
    const products = await lookUpProducts()
    const productsFullList = await Product.find({},{productName : 1,variants : 1,categoryId : 1}).populate("categoryId","categoryName")
    const user = req.session.user || req.user
    const cartItems = await Cart.find({userId : user._id}).populate("productId").populate("productOfferId").populate("categoryOfferId")
    const cartItemsCount = await Cart.aggregate([{$match : {userId : new mongoose.Types.ObjectId(user._id)}},{$group : {_id : "$userId", totalQuantity : {$sum : "$quantity"}}}])
    res.render("user-view/user.homepage.ejs",{message,categories,products,productsFullList,user,cartItems,cartItemsCount})
    } catch (error) {
      console.log(error)
    }
}

const getProductDetail = async(req,res) => {
    try {
    const {id,variant} = req.query
  
    const products = await lookUpProducts({_id : new mongoose.Types.ObjectId(id)})
    console.log(products)
    const product = products[0]
    if(product.isDeleted){
      req.session.message = "Product Unavailable"
      return res.redirect("/")
    }
    const relatedProduct = await lookUpProducts({ categoryId : new mongoose.Types.ObjectId(product.categoryId._id)},"",5)
    console.log(relatedProduct)
    const productsFullList = await Product.find({},{productName : 1,variants : 1,categoryId : 1}).populate("categoryId","categoryName")
    const user = req.session.user || req.user
    const cartItems = await Cart.find({userId : user._id}).populate("productId").populate("productOfferId").populate("categoryOfferId")
    const isProductInCart = await Cart.findOne({productId : id,variant : variant})
    res.render("user-view/user.product-detail-page.ejs",{product,relatedProduct,productsFullList,variant,user,cartItems,isProductInCart})
    } catch (error) {
        console.log(error.message)
    }
}

const getShop = async (req,res) => {
try {
    let message = req.session.message || null 
    delete req.session.message
    const categories = await Category.find({})
    const brands = await Brand.find({})
    const products = await lookUpProducts()
    const productsFullList = await Product.find({},{productName : 1,variants : 1,categoryId : 1}).populate("categoryId","categoryName")
    const user = req.session.user || req.user
    const cartItems = await Cart.find({userId : user._id}).populate("productId").populate("productOfferId").populate("categoryOfferId")
    const cartItemsCount = await Cart.aggregate([{$match : {userId : new mongoose.Types.ObjectId(user._id)}},{$group : {_id : "$userId", totalQuantity : {$sum : "$quantity"}}}])
    res.render("user-view/user.shop.ejs",{categories,products,brands,productsFullList,user,cartItemsCount,cartItems})
    
} catch (error) {
    console.log(error)
}
}

const shopFiltered = async (req,res) => {
  try {
    const { category, brand, minPrice, maxPrice } = req.body;

    // Build query dynamically
    let query = { isDeleted: false };

    // Category filter — expects category IDs
    if (category ) {
      // Ensure array type (in case only one checkbox selected)
      query.categoryId = {
        $in: (Array.isArray(category) ? category : [category])
          .map(id => new mongoose.Types.ObjectId(id))
      };
    }

    // Brand filter — expects brand IDs
    if (brand) {
      query.brandId = {
        $in: (Array.isArray(brand) ? brand : [brand])
          .map(id => new mongoose.Types.ObjectId(id))
      };
    }

    // Price range (for variants)
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
   

    // Fetch filtered products
    const user = req.session.user || req.user
    let filteredProducts = null
    if(priceQuery !== null){
      filteredProducts =  await lookUpProducts(query,priceQuery)
    }else{
      filteredProducts =  await lookUpProducts(query)
    }
    
     

  

      const categories = await Category.find({})
      const brands = await Brand.find({})
      const productsFullList = await Product.find({},{productName : 1,variants : 1,categoryId : 1}).populate("categoryId","categoryName")
      const cartItems = await Cart.find({userId : user._id}).populate("productId").populate("productOfferId").populate("categoryOfferId")
      const cartItemsCount = await Cart.aggregate([{$match : {userId : new mongoose.Types.ObjectId(user._id)}},{$group : {_id : "$userId", totalQuantity : {$sum : "$quantity"}}}])
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
    // Re-render your product listing EJS or HTML
    res.render("user-view/user.shop-filtered.ejs", {
      products: filteredProducts,
      filters: req.body, 
      categories,
      brands,
      productsFullList,
      cartItems,cartItemsCount,user
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