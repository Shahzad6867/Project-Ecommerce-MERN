
const Product = require("../../models/product.model.js");
const Brand = require("../../models/brand.model.js");
const Category = require("../../models/category.model.js");
const Order = require("../../models/order.model.js");
const ExcelJs = new require("exceljs")
const PDFDocument = require("pdfkit-table")
const path = require("path")
const ejs = require("ejs")



async function computeGrossSales(){
  let result = await Order.aggregate([
    {
      $match : {
        "status" : {"$in" : ["Processed","Shipped","Out for Delivery","Delivered"],"$nin" : ["Cancelled","Return Order Requested"]}
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
async function computeTotalProductDiscount(){
  let result = await Order.aggregate([
    {
      $match : {
        "status" : {"$in" : ["Processed","Shipped","Out for Delivery","Delivered"],"$nin" : ["Cancelled","Return Order Requested"]}
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
async function computeTotalCouponDiscount(){
  let result = await Order.aggregate([
    {
      $match : {
        "status" : {"$in" : ["Processed","Shipped","Out for Delivery","Delivered"],"$nin" : ["Cancelled","Return Order Requested"]}
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
async function computeTotalRefunds(){
  let result = await Order.aggregate([
    {
      $match : {
        "status" : {"$in" : ["Processed","Shipped","Out for Delivery","Delivered"],"$nin" : ["Cancelled","Return Order Requested"]}
      }
    },{
      $lookup : {
        from : "payments",
        localField : "paymentId",
        foreignField : "_id",
        as : "paymentId"
      }
    },{
      $unwind : "$paymentId"
    },{
      $group : {_id : null, amountRefunded : {$sum : "$paymentId.amountRefunded"}}
    }
   ])
    return new Intl.NumberFormat("en-US",{
    style : "currency",
    currency : "USD",
    minimumFractionDigits : 2
   }).format(result[0]?.amountRefunded || 0)
   
}
async function computeNetSales(){
  let result = await Order.aggregate([
    {
      $match : {
        "status" : {"$in" : ["Processed","Shipped","Out for Delivery","Delivered"],"$nin" : ["Cancelled","Return Order Requested"]}
      }
    },{
      $lookup : {
        from : "payments",
        localField : "paymentId",
        foreignField : "_id",
        as : "paymentId"
      }
    },{
      $unwind : "$paymentId"
    },{
      $group : {_id : null, netSales : {$sum : {$subtract : ["$subTotal","$paymentId.amountRefunded"]}}}
    }
   ])
    return new Intl.NumberFormat("en-US",{
    style : "currency",
    currency : "USD",
    minimumFractionDigits : 2
   }).format(result[0]?.netSales || 0)
   
}

async function computeTop10Products(){
  let result = await Order.aggregate([
    {
      $match : {
        "status" : {"$in" : ["Processed","Shipped","Out for Delivery","Delivered"],"$nin" : ["Cancelled","Return Order Requested"]}
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
      }
    },{
      $sort : {"revenue" : -1}
    },{
      $limit : 10
    }
   ])
    return result
   
}
async function computeTop10Categories(){
  let result = await Order.aggregate([
    {
      $match : {
        "status" : {"$in" : ["Processed","Shipped","Out for Delivery","Delivered"],"$nin" : ["Cancelled","Return Order Requested"]}
      }
    },{
      $addFields : {
        itemsLength : {$size : "$items"}
      }
    },{
      $unwind : "$items"
    },{
      $lookup : {
        from : "products",
        localField : "items.productId",
        foreignField : "_id",
        as : "items.productId"
      }
    },{
      $unwind : "$items.productId"
    },{
      $lookup : {
        from : "categories",
        localField : "items.productId.categoryId",
        foreignField : "_id",
        as : "items.category"
      }
    },{
      $unwind : "$items.category"
    },{
      $group : {_id : "$items.category.categoryName",
       itemsSold : {$sum : "$items.quantity"},
       revenue : {$sum : {$multiply : ["$items.quantity","$items.price"]}},
      }
    },{
      $sort : {"revenue" : -1}
    },{
      $limit : 10
    }
   ])
    return result
   
}
async function computeTop10Brands(){
  let result = await Order.aggregate([
    {
      $match : {
        "status" : {"$in" : ["Processed","Shipped","Out for Delivery","Delivered"],"$nin" : ["Cancelled","Return Order Requested"]}
      }
    },{
      $addFields : {
        itemsLength : {$size : "$items"}
      }
    },{
      $unwind : "$items"
    },{
      $lookup : {
        from : "products",
        localField : "items.productId",
        foreignField : "_id",
        as : "items.productId"
      }
    },{
      $unwind : "$items.productId"
    },{
      $lookup : {
        from : "brands",
        localField : "items.productId.brandId",
        foreignField : "_id",
        as : "items.brand"
      }
    },{
      $unwind : "$items.brand"
    },{
      $group : {_id : "$items.brand.brandName",
       itemsSold : {$sum : "$items.quantity"},
       revenue : {$sum : {$multiply : ["$items.quantity","$items.price"]}},
      }
    },{
      $sort : {"revenue" : -1}
    },{
      $limit : 10
    }
   ])
    return result
   
}

async function computeSalesLastTwelveMonths(){
  try {
    let now = new Date()
    let yearly = new Date(now.getFullYear(), now.getMonth() - 12, now.getDate())
    let revenueIn12Months = []
    for(let i = 12 ; i >= 0 ; i--){
      let obj = {}
      obj.date = new Date(now.getFullYear(),now.getMonth() - i,2).toISOString().slice(0,7)
      obj.revenue = 0 
      revenueIn12Months.push(obj)
    }
    
    let result = await Order.aggregate([
      {
        $match : {
          "status" : {"$in" : ["Processed","Shipped","Out for Delivery","Delivered"],"$nin" : ["Cancelled","Return Order Requested"]}
        }
      },{
        $match : {
          "statusTimeline.orderedAt" : {
            $gte : yearly,
            $lte : now
          }
        }
      },{
        $group : {_id : {
          $dateToString : {format : "%Y-%m" , date : "$statusTimeline.orderedAt"}
        },
        revenue : {$sum : "$grandTotal"}
      }
      }
    ])
    for (let i = 0; i < result.length; i++) {
      for(let j = 0 ; j < revenueIn12Months.length ; j++){
        if(revenueIn12Months[j].date === result[i]._id && result[i].revenue > 0){
          revenueIn12Months[j].revenue = result[i].revenue
          revenueIn12Months[j].date = new Date(revenueIn12Months[j].date).toLocaleDateString("en-US",{year : "numeric",month : "long"})
        }else{
          revenueIn12Months[j].date = new Date(revenueIn12Months[j].date).toLocaleDateString("en-US",{year : "numeric",month : "long"})
        }
      }
      
    }
    return revenueIn12Months
  } catch (error) {
    console.log(error)
  }
}
async function computeSalesLastThirtyDays(){
  let dateToday = new Date()
  let lastThirtyDaysBefore = new Date(dateToday.getFullYear(), dateToday.getMonth(), dateToday.getDate() - 29)
  let dateInThisMonth = []
  let todaysDayDate = dateToday.getDate() 
  for(let i = 2 ; i <= todaysDayDate + 1 ; i++){
    let obj = {}
    obj.date = new Date(dateToday.getFullYear(),dateToday.getMonth(),i).toISOString().slice(0,10)
    obj.revenue = 0 
    dateInThisMonth.push(obj)
  }
  
  let result = await Order.aggregate([
    {
      $match : {
        "status" : {"$in" : ["Processed","Shipped","Out for Delivery","Delivered"],"$nin" : ["Cancelled","Return Order Requested"]}
      }
    },{
      $match : {
        "statusTimeline.orderedAt" : {
          $gte : lastThirtyDaysBefore,
          $lte : dateToday
        }
      }
    },{
      $group : {_id : {
        $dateToString : {format : "%Y-%m-%d" , date : "$statusTimeline.orderedAt"}
      },
      revenue : {$sum : "$grandTotal"}
    }
    }
  ])
  for (let i = 0; i < result.length; i++) {
    for(let j = 0 ; j < dateInThisMonth.length ; j++){
      if(dateInThisMonth[j].date === result[i]._id && result[i].revenue > 0){
        dateInThisMonth[j].revenue = result[i].revenue
      }
    }
    
  }

  return dateInThisMonth
}
async function computeSalesLastSevenDays(){
  let dateToday = new Date()
  let sevenDaysBack = new Date(dateToday.getFullYear(), dateToday.getMonth(), dateToday.getDate() - 6)
  let dateInThisMonth = []
  let todaysDayDate = dateToday.getDate() 
  for(let i = todaysDayDate - 5 ; i <= todaysDayDate + 1  ; i++){
    let obj = {}
    obj.date = new Date(dateToday.getFullYear(),dateToday.getMonth(),i).toISOString().slice(0,10)
    obj.revenue = 0 
    dateInThisMonth.push(obj)
  }
  
  let result = await Order.aggregate([
    {
      $match : {
        "status" : {"$in" : ["Processed","Shipped","Out for Delivery","Delivered"],"$nin" : ["Cancelled","Return Order Requested"]}
      }
    },{
      $match : {
        "statusTimeline.orderedAt" : {
          $gte : sevenDaysBack,
          $lte : dateToday
        }
      }
    },{
      $group : {_id : {
        $dateToString : {format : "%Y-%m-%d" , date : "$statusTimeline.orderedAt"}
      },
      revenue : {$sum : "$grandTotal"}
    }
    }
  ])
  
  for (let i = 0; i < result.length; i++) {
    for(let j = 0 ; j < dateInThisMonth.length ; j++){
      if(dateInThisMonth[j].date === result[i]._id && result[i].revenue > 0){
        dateInThisMonth[j].revenue = result[i].revenue
      }
    }
    
  }
  return dateInThisMonth
}
async function computeSalesLastTwentyFourHours(){
  let dateToday = new Date()
  let oneDayInMilliseconds = 24 * 60 * 60 * 1000
  let twentyFourHoursBefore = new Date(dateToday.getTime() - oneDayInMilliseconds)
  let dateInThisMonth = []
  let oneHour = 60 * 60 * 1000
  for(let i = 0 ; i <= 24 ; i++){
    let obj = {}
    obj.date = new Date(twentyFourHoursBefore.getTime() + i * oneHour)
    obj.revenue = 0 
    dateInThisMonth.push(obj)
  }
  
  let result = await Order.aggregate([
    {
      $match : {
        "status" : {"$in" : ["Processed","Shipped","Out for Delivery","Delivered"],"$nin" : ["Cancelled","Return Order Requested"]}
      }
    },{
      $match : {
        "statusTimeline.orderedAt" : {
          $gte : twentyFourHoursBefore,
          $lte : dateToday
        }
      }
    },{
      $group : {_id : "$statusTimeline.orderedAt",
      revenue : {$sum : "$grandTotal"}
    }
    }
  ])
  console.log(result)
  console.log(dateInThisMonth)
  for (let i = 0; i < result.length; i++) {
    for(let j = 0 ; j < dateInThisMonth.length ; j++){
      let todayCurrentHour = new Date(dateInThisMonth[j].date)
      let todayCurrentPlusOneHour = new Date(dateInThisMonth[j + 1]?.date)
      let saleTodayPerHour = new Date(result[i]._id)
      if(saleTodayPerHour >= todayCurrentHour && saleTodayPerHour < todayCurrentPlusOneHour  && result[i].revenue > 0){
        dateInThisMonth[j].revenue += result[i].revenue
      }
    }
    
    
  }
  for (let i = 0; i < dateInThisMonth.length; i++) {
    dateInThisMonth[i].date = dateInThisMonth[i].date.toLocaleDateString("en-US",{day : "2-digit",month : "short",hour : "2-digit"})
  }
  return dateInThisMonth
}


const getAdminDashboard = async (req, res) => {
    try {
     let totalOrdersCount = await Order.find({"status" : {"$in" : ["Processed","Shipped","Out for Delivery","Delivered"],"$nin" : ["Cancelled","Return Order Requested"]}}).countDocuments()
     let totalCustomersCount = await Order.find().countDocuments()
     let grossSales = await computeGrossSales()
     let totalProductDiscount = await computeTotalProductDiscount()
     let totalCouponDiscount = await computeTotalCouponDiscount()
     let totalRefunds = await computeTotalRefunds()
     let netSales = await computeNetSales()
     let top10Products = await computeTop10Products()
     let top10Categories = await computeTop10Categories()
     let top10Brands = await computeTop10Brands() 
      res.render("admin-view/admin.dashboard.ejs",{totalCustomersCount,totalOrdersCount,grossSales,totalProductDiscount,totalCouponDiscount,totalRefunds,netSales,top10Products,top10Categories,top10Brands})
  
    } catch (err) {
      console.error(err)
      res.status(500).send("Server Error")
    }
  }

  const getRevenueChartDetails = async (req,res) => {
    let generateFor = req.query.basedOn
    let revenueChart = null
    if(generateFor === "last24Hours"){
      revenueChart = await computeSalesLastTwentyFourHours()
    }else if(generateFor === "last12Months"){
      revenueChart = await computeSalesLastTwelveMonths()
    }else if(generateFor === "last7Days"){
      revenueChart = await computeSalesLastSevenDays()
    }else if(generateFor === "last30Days"){
      revenueChart = await computeSalesLastThirtyDays()
    }

      console.log(revenueChart)
    const revenueDate = revenueChart.map(obj => obj.date)
    const revenues = revenueChart.map(obj => obj.revenue)
    return res.json({
      succes : true,
      details : {
        date : revenueDate,
        revenue : revenues
      }
    })
  }


module.exports = {
    getAdminDashboard,
    getRevenueChartDetails
}