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
    res.render("user-view/user.homepage.ejs",{categories,products})
}

const getProductDetail = async(req,res) => {
    try {
    const {id} = req.query
    const product = await Product.findById({ _id : id})
    console.log(product)
    const relatedProduct = await Product.find({ categoryId : product.categoryId}).limit(5).populate("categoryId").populate("brandId")
    console.log(relatedProduct)
    res.render("user-view/user.product-detail-page.ejs",{product,relatedProduct})
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
    res.render("user-view/user.shop.ejs",{categories,products,brands})
    
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

    // Re-render your product listing EJS or HTML
    res.render("user-view/user.shop-filtered.ejs", {
      products: filteredProducts,
      filters: req.body, 
      categories,
      brands
    });

  } catch (error) {
    console.log(error)
  }
};

const logoutUser = async (req,res) => {
    try {
        if(req.session.user){
            req.session.user = null
        }else if(req.user){
            req.user = null
        }
      res.redirect("/login")
      } catch (error) {
        console.error(error);
        req.session.message = "Something Went Wrong";
        res.redirect("/admin/dashboard");
      }
}


module.exports = {
    getHomepage,
    getProductDetail,
    getShop,
    shopFiltered,
    logoutUser
}