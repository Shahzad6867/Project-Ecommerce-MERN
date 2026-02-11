const dashboardService = require("../../services/admin-services/dashboardService.js")
const ERROR_MESSAGES = require("../../constants/errorMessages.js")
const HTTP_STATUS = require("../../constants/httpStatus.js")

const getAdminDashboard = async (req, res) => {
    try {
     let totalOrdersCount = await dashboardService.computeTotalOrdersCount()
     let totalCustomersCount = await dashboardService.computeTotalCustomersCount()
     let grossSales = await dashboardService.computeGrossSales()
     let totalProductDiscount = await dashboardService.computeTotalProductDiscount()
     let totalCouponDiscount = await dashboardService.computeTotalCouponDiscount()
     let totalRefunds = await dashboardService.computeTotalRefunds()
     let netSales = await dashboardService.computeNetSales()
     let top10Products = await dashboardService.computeTop10Products()
     let top10Categories = await dashboardService.computeTop10Categories()
     let top10Brands = await dashboardService.computeTop10Brands() 
     const message = req.session.message || null
     delete req.session.message
      res.render("admin-view/admin.dashboard.ejs",{totalCustomersCount,totalOrdersCount,grossSales,totalProductDiscount,totalCouponDiscount,totalRefunds,netSales,top10Products,top10Categories,top10Brands,message})
  
    } catch (err) {
      console.error(err)
      res.render("admin-view/admin.dashboard.ejs",{message : ERROR_MESSAGES.SERVER_ERROR})
    }
  }

  const getRevenueChartDetails = async (req,res) => {
    let generateFor = req.query.basedOn
    let revenueChart = null
    if(generateFor === "last24Hours"){
      revenueChart = await dashboardService.computeSalesLastTwentyFourHours()
    }else if(generateFor === "last12Months"){
      revenueChart = await dashboardService.computeSalesLastTwelveMonths()
    }else if(generateFor === "last7Days"){
      revenueChart = await dashboardService.computeSalesLastSevenDays()
    }else if(generateFor === "last30Days"){
      revenueChart = await dashboardService.computeSalesLastThirtyDays()
    }

    const revenueDate = revenueChart.map(obj => obj.date)
    const revenues = revenueChart.map(obj => obj.revenue)
    return res.status(HTTP_STATUS.OK).json({
      success : true,
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