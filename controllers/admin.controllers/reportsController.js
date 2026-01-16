
const Product = require("../../models/product.model.js");
const Brand = require("../../models/brand.model.js");
const Category = require("../../models/category.model.js");

const getSalesReport = async(req,res) => {
    res.render("admin-view/sales-report.ejs")
}

module.exports = {
    getSalesReport
}