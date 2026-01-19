
const Product = require("../../models/product.model.js");
const Brand = require("../../models/brand.model.js");
const Category = require("../../models/category.model.js");
const Order = require("../../models/order.model.js");


const getSalesReport = async (req, res) => {
    try {
      let matchStage = { status: "Delivered" }
  
      // Date filters
      if (req.query.range === "today") {
        matchStage.createdAt = {
          $gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
  
      if (req.query.range === "7") {
        matchStage.createdAt = {
          $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
  
      if (req.query.range === "30") {
        matchStage.createdAt = {
          $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
  
      // KPIs
      const totalSales = await Order.aggregate([
        { $match: matchStage },
        { $group: { _id: null, totalSales: { $sum: "$subTotal" } } }
      ])
  
      const totalNetSales = await Order.aggregate([
        { $match: matchStage },
        {
          $addFields: {
            netAmount: { $subtract: ["$grandTotal", "$tax"] }
          }
        },
        { $group: { _id: null, totalNetSales: { $sum: "$netAmount" } } }
      ])
  
      const totalDiscounts = await Order.aggregate([
        { $match: matchStage },
        { $group: { _id: null, totalDiscounts: { $sum: "$discount" } } }
      ])
  
      const totalOrders = await Order.countDocuments(matchStage)
  
      // Sales trend (line chart)
      const salesTrend = await Order.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
            },
            total: { $sum: "$grandTotal" }
          }
        },
        { $sort: { _id: 1 } }
      ])
  
      // Payment distribution (doughnut)
      const paymentSplit = await Order.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: "$paymentMethod",
            count: { $sum: 1 }
          }
        }
      ])
  
      res.render("admin-view/sales-report.ejs", {
        totalSales: totalSales[0] || { totalSales: 0 },
        totalNetSales: totalNetSales[0] || { totalNetSales: 0 },
        totalDiscounts: totalDiscounts[0] || { totalDiscounts: 0 },
        totalOrders,
        salesTrend,
        paymentSplit
      })
  
    } catch (err) {
      console.error(err)
      res.status(500).send("Server Error")
    }
  }
  

module.exports = {
    getSalesReport
}