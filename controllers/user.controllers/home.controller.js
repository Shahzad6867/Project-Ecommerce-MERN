const Category = require("../../models/category.model.js");
const Product = require("../../models/product.model.js");
const User = require("../../models/user.model.js");
const Brand = require("../../models/brand.model.js");
require("dotenv").config()


const getHomepage = async(req,res) => {
    let message = req.session.message || null 
    delete req.session.message
    const categories = await Category.find({})
    const products = await Product.find({}).populate("categoryId").populate("brandId")
    const productsFullList = await Product.find({},{productName : 1,variants : 1,categoryId : 1}).populate("categoryId","categoryName")
    res.render("user-view/user.homepage.ejs",{categories,products,productsFullList})
}

const getProductDetail = async(req,res) => {
    try {
    const {id,variant} = req.query
    const product = await Product.findById({ _id : id})
    const relatedProduct = await Product.find({ categoryId : product.categoryId}).limit(5).populate("categoryId").populate("brandId")
    const productsFullList = await Product.find({},{productName : 1,variants : 1,categoryId : 1}).populate("categoryId","categoryName")
    res.render("user-view/user.product-detail-page.ejs",{product,relatedProduct,productsFullList,variant})
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
    const products = await Product.find({}).populate("categoryId").populate("brandId")
    const productsFullList = await Product.find({},{productName : 1,variants : 1,categoryId : 1}).populate("categoryId","categoryName")
    res.render("user-view/user.shop.ejs",{categories,products,brands,productsFullList})
    
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
    if (category && category.length > 0) {
      // Ensure array type (in case only one checkbox selected)
      query.categoryId = Array.isArray(category)
        ? { $in: category }
        : category;
    }

    // Brand filter — expects brand IDs
    if (brand && brand.length > 0) {
      query.brandId = Array.isArray(brand)
        ? { $in: brand }
        : brand;
    }

    // Price range (for variants)
    if (minPrice || maxPrice) {
      query["variants.price"] = {};
      if (minPrice) query["variants.price"].$gte = parseFloat(minPrice);
      if (maxPrice) query["variants.price"].$lte = parseFloat(maxPrice);
    }

    // Fetch filtered products
    const filteredProducts = await Product.find(query)
      .populate("categoryId")
      .populate("brandId");

      const categories = await Category.find({})
      const brands = await Brand.find({})
      const productsFullList = await Product.find({},{productName : 1,variants : 1,categoryId : 1}).populate("categoryId","categoryName")

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
      productsFullList
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