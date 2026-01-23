
const Product = require("../../models/product.model.js");
const Brand = require("../../models/brand.model.js");
const Category = require("../../models/category.model.js");
const Order = require("../../models/order.model.js");
const ExcelJs = new require("exceljs")
const puppeteer = require("puppeteer")
const path = require("path")
const ejs = require("ejs")

async function itemsSold(fromDate,toDate){
 let result = await Order.aggregate([
    {
      $match : {
        "status" : {"$in" : ["Processed","Shipped","Out for Delivery","Delivered"],"$nin" : ["Cancelled","Return Order Requested"]}
      }
    },{
      $match : {
        "statusTimeline.orderedAt" : {
          $gte : fromDate,
          $lt : toDate
        }
      }
    },{
      $unwind : "$items"
    },{
      $group : {_id : null,totalItemsSold : {$sum : "$items.quantity"} }
    }
   ])
   return result[0]?.totalItemsSold || 0
}

async function computeGrossSales(fromDate,toDate){
  let result = await Order.aggregate([
    {
      $match : {
        "status" : {"$in" : ["Processed","Shipped","Out for Delivery","Delivered"],"$nin" : ["Cancelled","Return Order Requested"]}
      }
    },{
      $match : {
        "statusTimeline.orderedAt" : {
          $gte : fromDate,
          $lt : toDate
        }
      }
    },{
      $unwind : "$items"
    },{
      $group : {_id : null,grossSales : {$sum : {$multiply : ["$items.price","$items.quantity"]}} }
    }
   ])
    return new Intl.NumberFormat("en-US",{
    style : "currency",
    currency : "USD",
    minimumFractionDigits : 2
   }).format(result[0]?.grossSales || 0)
   
}
async function computeTotalProductDiscount(fromDate,toDate){
  let result = await Order.aggregate([
    {
      $match : {
        "status" : {"$in" : ["Processed","Shipped","Out for Delivery","Delivered"],"$nin" : ["Cancelled","Return Order Requested"]}
      }
    },{
      $match : {
        "statusTimeline.orderedAt" : {
          $gte : fromDate,
          $lt : toDate
        }
      }
    },{
      $unwind : "$items"
    },{
      $group : {_id : null, totalProductDiscount : {$sum : {$subtract : [{$multiply : ["$items.price","$items.quantity"]},{$multiply : ["$items.offerPrice","$items.quantity"]}] }}}
    }
   ])
    return new Intl.NumberFormat("en-US",{
    style : "currency",
    currency : "USD",
    minimumFractionDigits : 2
   }).format(result[0]?.totalProductDiscount || 0)
   
}
async function computeTotalCouponDiscount(fromDate,toDate){
  let result = await Order.aggregate([
    {
      $match : {
        "status" : {"$in" : ["Processed","Shipped","Out for Delivery","Delivered"],"$nin" : ["Cancelled","Return Order Requested"]}
      }
    },{
      $match : {
        "statusTimeline.orderedAt" : {
          $gte : fromDate,
          $lt : toDate
        }
      }
    },{
      $group : {_id : null, totalCouponDiscount : {$sum : "$discount"}}
    }
   ])
    return new Intl.NumberFormat("en-US",{
    style : "currency",
    currency : "USD",
    minimumFractionDigits : 2
   }).format(result[0]?.totalCouponDiscount || 0)
   
}
async function computeNetSales(fromDate,toDate){
  let result = await Order.aggregate([
    {
      $match : {
        "status" : {"$in" : ["Processed","Shipped","Out for Delivery","Delivered"],"$nin" : ["Cancelled","Return Order Requested"]}
      }
    },{
      $match : {
        "statusTimeline.orderedAt" : {
          $gte : fromDate,
          $lt : toDate
        }
      }
    },{
      $group : {_id : null, netSales : {$sum : "$subTotal"}}
    }
   ])
    return new Intl.NumberFormat("en-US",{
    style : "currency",
    currency : "USD",
    minimumFractionDigits : 2
   }).format(result[0]?.netSales || 0)
   
}

async function computeSalePerItem(fromDate,toDate,skip,limit){
  let result = await Order.aggregate([
    {
      $match : {
        "status" : {"$in" : ["Processed","Shipped","Out for Delivery","Delivered"],"$nin" : ["Cancelled","Return Order Requested"]}
      }
    },{
      $match : {
        "statusTimeline.orderedAt" : {
          $gte : fromDate,
          $lt : toDate
        }
      }
    },{
      $addFields : {
        itemsLength : {$size : "$items"}
      }
    },{
      $unwind : "$items"
    },{
      $group : {_id : {productName : "$items.productName",productColor : "$items.color",productSize : "$items.size"},
       productId : {$first : "$items.productId"},
       itemsSold : {$sum : "$items.quantity"},
       revenue : {$sum : {$multiply : ["$items.quantity","$items.price"]}},
       productDiscount : {$sum : {$subtract : [{$multiply : ["$items.quantity","$items.price"]},{$multiply : ["$items.quantity","$items.offerPrice"]}]}},
       couponDiscount : {$sum : {$divide : [{$divide : ["$discount","$itemsLength"]},"$items.quantity"]}},
       netRevenue : {$sum :{$subtract : [{$multiply : ["$items.quantity","$items.offerPrice"]},{ $divide: ["$discount", "$itemsLength"] }]} }
      }
    },{
      $lookup : {
        from : "products",
        localField : "productId",
        foreignField : "_id",
        as : "productId"
      }
    },{
      $unwind : "$productId"
    },{
      $lookup : {
        from : "categories",
        localField : "productId.categoryId",
        foreignField : "_id",
        as : "categoryId"
      }
    },{
      $unwind : "$categoryId"
    },{
      $project : {
        _id : 1,
        itemsSold : 1,
        revenue : 1,
        productDiscount : 1,
        couponDiscount : 1,
        netRevenue : 1,
        categoryName : "$categoryId.categoryName"
      }
    },{
      $sort : {"netRevenue" : -1}
    },{
      $facet: {
        data: [
          { $skip: skip },
          { $limit: limit }
        ],
        totalCount: [
          { $count: "count" }
        ]
      }
    }
   ])
    return result
   
}
async function computeOrderBasedSales(fromDate,toDate,skip,limit){
  let result = await Order.aggregate([
    {
      $match : {
        "status" : {"$in" : ["Processed","Shipped","Out for Delivery","Delivered"],"$nin" : ["Cancelled","Return Order Requested"]}
      }
    },{
      $match : {
        "statusTimeline.orderedAt" : {
          $gte : fromDate,
          $lt : toDate
        }
      }
    },{
      $addFields : {
        itemsLength : {$size : "$items"}
      }
    },{
      $unwind : "$items"
    },{
      $group : {_id : "$orderId",
        orderedAt : {$first : "$statusTimeline.orderedAt"},
       revenue : {$sum : {$multiply : ["$items.price","$items.quantity"]}},
       productDiscount : {$sum : {$subtract : [{$multiply : ["$items.quantity","$items.price"]},{$multiply : ["$items.quantity","$items.offerPrice"]}]}},
       couponDiscount : {$sum : { $divide: ["$discount", "$itemsLength"] }},
       netRevenue : {$sum : {$subtract : [{$multiply : ["$items.quantity","$items.offerPrice"]},{ $divide: ["$discount", "$itemsLength"] }]}}
      }
    },{
      $sort : {"netRevenue" : -1}
    },{
      $skip : skip
    },{
      $limit : limit
    }
   ])
    return result
   
}


const getSalesReport = async (req, res) => {
    try {
    let today = new Date(new Date().toISOString().split("T")[0])
    let fromDate = null 
    let toDate = null
    if(req.query.fromDate && req.query.toDate){
      fromDate = new Date(req.query.fromDate)
      fromDate.setUTCHours(0,0,0,0)
      toDate = new Date(req.query.toDate )
      toDate.setUTCHours(23,59,59,999) 
    }else{
      fromDate = new Date(today)
      fromDate.setUTCHours(0,0,0,0)
      toDate = new Date(today) 
      toDate.setUTCHours(23,59,59,999)
    }
    let reportPeriod = fromDate.toLocaleDateString("en-IN", {day: "numeric",month: "short",year: "numeric"}) + " - " + toDate.toLocaleDateString("en-IN", {day: "numeric",month: "short",year: "numeric"})
    let generatedOn = today.toLocaleDateString("en-IN", {day: "numeric",month: "short",year: "numeric"})
    
    let reportBasedOn = req.query.reportBasedOn || "today"
    const perPage = 5
    const productWisePage  = req.query.productWisePage || 1
    const orderWisePage  = req.query.orderWisePage || 1
    const skipForProduct = (perPage * productWisePage) - perPage
    const skipForOrder = (perPage * orderWisePage) - perPage
     let totalOrdersCount = await Order.find({"status" : {"$in" : ["Processed","Shipped","Out for Delivery","Delivered"],"$nin" : ["Cancelled","Return Order Requested"]},"statusTimeline.orderedAt" : {$gte : fromDate,$lt : toDate}}).countDocuments()
     let itemsSoldCount = await itemsSold(fromDate,toDate)
     let grossSales = await computeGrossSales(fromDate,toDate)
     let totalProductDiscount = await computeTotalProductDiscount(fromDate,toDate)
     let totalCouponDiscount = await computeTotalCouponDiscount(fromDate,toDate)
     let netSales = await computeNetSales(fromDate,toDate)
     let salePerItem = await computeSalePerItem(fromDate,toDate,skipForProduct,perPage)
     let orderBasedSales = await computeOrderBasedSales(fromDate,toDate,skipForOrder,perPage)
     const productCount = salePerItem[0].totalCount[0]?.count || 1
     const pagesForProduct = Math.ceil(productCount / perPage)
     const orderCount = totalOrdersCount || 1
     const pagesForOrder = Math.ceil(orderCount / perPage)
     salePerItem = salePerItem[0].data
      res.render("admin-view/admin.sales-report.ejs",{totalOrdersCount,itemsSoldCount,grossSales,totalProductDiscount,totalCouponDiscount,netSales,salePerItem,orderBasedSales,orderWisePage,productWisePage,pagesForOrder,pagesForProduct,fromDate,toDate,reportBasedOn})
  
    } catch (err) {
      console.error(err)
      res.status(500).send("Server Error")
    }
  }
  const getSalesReportIntoExcel = async (req, res) => {
    try {
    let today = new Date(new Date().toISOString().split("T")[0])
    let fromDate = null 
    let toDate = null
    if(req.query.fromDate && req.query.toDate){
      fromDate = new Date(req.query.fromDate)
      fromDate.setUTCHours(0,0,0,0)
      toDate = new Date(req.query.toDate )
      toDate.setUTCHours(23,59,59,999) 
    }else{
      fromDate = new Date(today)
      fromDate.setUTCHours(0,0,0,0)
      toDate = new Date(today) 
      toDate.setUTCHours(23,59,59,999)
    }
    let reportPeriod = fromDate.toLocaleDateString("en-IN", {day: "numeric",month: "short",year: "numeric"}) + " - " + toDate.toLocaleDateString("en-IN", {day: "numeric",month: "short",year: "numeric"})
    let generatedOn = today.toLocaleDateString("en-IN", {day: "numeric",month: "short",year: "numeric"})
    let reportBasedOn = req.query.reportBasedOn || "today"
    const perPage = 5
    const productWisePage  = req.query.productWisePage || 1
    const orderWisePage  = req.query.orderWisePage || 1
    const skipForProduct = (perPage * productWisePage) - perPage
    const skipForOrder = (perPage * orderWisePage) - perPage
     let totalOrdersCount = await Order.find({"status" : {"$in" : ["Processed","Shipped","Out for Delivery","Delivered"],"$nin" : ["Cancelled","Return Order Requested"]},"statusTimeline.orderedAt" : {$gte : fromDate,$lt : toDate}}).countDocuments()
     let itemsSoldCount = await itemsSold(fromDate,toDate)
     let grossSales = await computeGrossSales(fromDate,toDate)
     let totalProductDiscount = await computeTotalProductDiscount(fromDate,toDate)
     let totalCouponDiscount = await computeTotalCouponDiscount(fromDate,toDate)
     let netSales = await computeNetSales(fromDate,toDate)
     let salePerItem = await computeSalePerItem(fromDate,toDate,skipForProduct,perPage)
     let orderBasedSales = await computeOrderBasedSales(fromDate,toDate,skipForOrder,perPage)
     const productCount = salePerItem[0].totalCount[0]?.count || 1
     const pagesForProduct = Math.ceil(productCount / perPage)
     const orderCount = totalOrdersCount || 1
     const pagesForOrder = Math.ceil(orderCount / perPage)
     salePerItem = salePerItem[0].data
      
     const workbook = new ExcelJs.Workbook()

     const summarySheet = workbook.addWorksheet("Sales Summary")

     summarySheet.columns = [
      {header : "Metric", key : "metric" , width : 30},
      {header : "Value", key : "value", width : 20}
     ]
     summarySheet.addRows([
      {metric : "Total Orders", value : totalOrdersCount},
      {metric : "Items Sold", value : itemsSoldCount},
      {metric : "Gross Sales", value : grossSales},
      {metric : "Total Product Discount", value : totalProductDiscount},
      {metric : "Total Coupon Discount", value : totalCouponDiscount},
      {metric : "Net Sales", value : netSales},
      {metric : "", value : ""},
      {metric : "Report Period", value : reportPeriod},
      {metric : "Generated On", value : generatedOn},
     ])

     summarySheet.getRow(1).font = {bold : true}

     const productWiseSalesReport = workbook.addWorksheet("Product-Wise Sales Report")

     productWiseSalesReport.columns = [
      { header : "No", key : "no", width : 15},
      { header: "Product", key: "product", width: 50 , style: { alignment: { wrapText: true } }},
      { header: "Category", key: "category", width: 20 },
      { header: "Units Sold", key: "unitsSold", width: 15 },
      { header: "Revenue", key: "revenue", width: 20 },
      { header: "Product Discount", key: "productDiscount", width: 20 },
      { header: "Coupon Discount", key: "couponDiscount", width: 20 },
      { header: "Net Revenue", key: "netRevenue", width: 20 }
     ]
     let countForProduct = 1
     salePerItem.forEach(item => {
      productWiseSalesReport.addRows([{
        no : countForProduct,
        product : `${item._id.productName}-${item._id.productColor}-${item._id.productSize}`,
        category : item.categoryName,
        unitsSold : item.itemsSold,
        revenue : item.revenue,
        productDiscount : item.productDiscount,
        couponDiscount : item.couponDiscount,
        netRevenue : item.netRevenue
       }
      ])
      countForProduct++
     });

     productWiseSalesReport.addRow({});
     productWiseSalesReport.addRow({});
     productWiseSalesReport.addRow({});

      // 🔹 Add report metadata
      productWiseSalesReport.addRow({
        product: "Report Period",
        category: reportPeriod
      });

      productWiseSalesReport.addRow({
        product: "Generated On",
        category: generatedOn
      });
     productWiseSalesReport.getRow(1).font = {bold : true}

     const orderWiseSalesReport = workbook.addWorksheet("Order-Wise Sales Report")

     orderWiseSalesReport.columns = [
      { header : "No", key : "no", width : 15},
      { header: "Order ID", key: "orderId", width: 40 },
      { header: "Date", key: "date", width: 20 },
      { header: "Revenue", key: "revenue", width: 20 },
      { header: "Product Discount", key: "productDiscount", width: 20 },
      { header: "Coupon Discount", key: "couponDiscount", width: 20 },
      { header: "Net Revenue", key: "netRevenue", width: 20 }
     ]
     let countForOrder = 1
     orderBasedSales.forEach(order => {
      orderWiseSalesReport.addRows([{
        no : countForOrder,
        orderId : order._id,
        date : order.orderedAt,
        revenue : order.revenue,
        productDiscount : order.productDiscount,
        couponDiscount : order.couponDiscount,
        netRevenue : order.netRevenue
       }
      ])
      countForOrder++
     });

     orderWiseSalesReport.addRow({});
     orderWiseSalesReport.addRow({});
     orderWiseSalesReport.addRow({});

      // 🔹 Add report metadata
      orderWiseSalesReport.addRow({
        orderId: "Report Period",
        date: reportPeriod
      });

      orderWiseSalesReport.addRow({
        orderId: "Generated On",
        date : generatedOn
      });

     orderWiseSalesReport.getRow(1).font = {bold : true}
     
     res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );

      res.setHeader(
        "Content-Disposition",
        "attachment; filename=sales-report.xlsx"
      );

  await workbook.xlsx.write(res);
  res.end();
  
    } catch (err) {
      console.error(err)
      res.status(500).send("Server Error")
    }
  }
const getSalesReportIntoPdf = async (req, res) => {
    try {
    let today = new Date(new Date().toISOString().split("T")[0])
    let fromDate = null 
    let toDate = null
    if(req.query.fromDate && req.query.toDate){
      fromDate = new Date(req.query.fromDate)
      fromDate.setUTCHours(0,0,0,0)
      toDate = new Date(req.query.toDate )
      toDate.setUTCHours(23,59,59,999) 
    }else{
      fromDate = new Date(today)
      fromDate.setUTCHours(0,0,0,0)
      toDate = new Date(today) 
      toDate.setUTCHours(23,59,59,999)
    }
    let reportPeriod = fromDate.toLocaleDateString("en-IN", {day: "numeric",month: "short",year: "numeric"}) + " - " + toDate.toLocaleDateString("en-IN", {day: "numeric",month: "short",year: "numeric"})
    let generatedOn = today.toLocaleDateString("en-IN", {day: "numeric",month: "short",year: "numeric"})

    let reportBasedOn = req.query.reportBasedOn || "today"
    const perPage = 5
    const productWisePage  = req.query.productWisePage || 1
    const orderWisePage  = req.query.orderWisePage || 1
    const skipForProduct = (perPage * productWisePage) - perPage
    const skipForOrder = (perPage * orderWisePage) - perPage
     let totalOrdersCount = await Order.find({"status" : {"$in" : ["Processed","Shipped","Out for Delivery","Delivered"],"$nin" : ["Cancelled","Return Order Requested"]},"statusTimeline.orderedAt" : {$gte : fromDate,$lt : toDate}}).countDocuments()
     let itemsSoldCount = await itemsSold(fromDate,toDate)
     let grossSales = await computeGrossSales(fromDate,toDate)
     let totalProductDiscount = await computeTotalProductDiscount(fromDate,toDate)
     let totalCouponDiscount = await computeTotalCouponDiscount(fromDate,toDate)
     let netSales = await computeNetSales(fromDate,toDate)
     let salePerItem = await computeSalePerItem(fromDate,toDate,skipForProduct,perPage)
     let orderBasedSales = await computeOrderBasedSales(fromDate,toDate,skipForOrder,perPage)
     const productCount = salePerItem[0].totalCount[0]?.count || 1
     const pagesForProduct = Math.ceil(productCount / perPage)
     const orderCount = totalOrdersCount || 1
     const pagesForOrder = Math.ceil(orderCount / perPage)
     salePerItem = salePerItem[0].data

     const browser = await puppeteer.launch();
     const page = await browser.newPage();
     const html = await ejs.renderFile(
      "/Users/muhammedshahzad/Project Ecommerce/views/admin-view/admin.sales-report-pdf.ejs",
      {totalOrdersCount,itemsSoldCount,grossSales,totalProductDiscount,totalCouponDiscount,netSales,salePerItem,orderBasedSales,orderWisePage,productWisePage,pagesForOrder,pagesForProduct,fromDate,toDate,reportBasedOn,reportPeriod,generatedOn}
     )

      await page.setContent(html, { waitUntil: "networkidle0" });

        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: { top: "20px", bottom: "20px", left: "20px", right: "20px" }
          });
          

        await browser.close();
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          "attachment; filename=sales-report.pdf"
        );
        res.send(pdfBuffer)
    } catch (err) {
      console.error(err)
      res.status(500).send("Server Error")
    }
  }
  

module.exports = {
    getSalesReport,
    getSalesReportIntoExcel,
    getSalesReportIntoPdf
}