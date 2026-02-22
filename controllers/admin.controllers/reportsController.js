const ExcelJs = new require("exceljs")
const PDFDocument = require("pdfkit-table")
const reportsService = require("../../services/admin-services/reportsService.js")
const ERROR_MESSAGES = require("../../constants/errorMessages.js")
const HTTP_STATUS = require("../../constants/httpStatus.js")

const getSalesReport = async (req, res) => {
    try {
    const {today,fromDate,toDate} = reportsService.computeFromAndToDate(req.query.fromDate,req.query.toDate)
    let reportBasedOn = req.query.reportBasedOn || "today"
    const perPage = 1
    const productWisePage  = req.query.productWisePage || 1
    const orderWisePage  = req.query.orderWisePage || 1
    const skipForProduct = (perPage * productWisePage) - perPage
    const skipForOrder = (perPage * orderWisePage) - perPage
     let totalOrdersCount = await reportsService.computeTotalOrdersCount(fromDate,toDate)
     let itemsSoldCount = await reportsService.itemsSold(fromDate,toDate)
     let grossSales = await reportsService.computeGrossSales(fromDate,toDate)
     let totalProductDiscount = await reportsService.computeTotalProductDiscount(fromDate,toDate)
     let totalCouponDiscount = await reportsService.computeTotalCouponDiscount(fromDate,toDate)
     let totalRefunds = await reportsService.computeTotalRefunds(fromDate,toDate)
     let totalTax = await reportsService.computeTotalTax(fromDate,toDate)
     let totalShipping = await reportsService.computeTotalShipping(fromDate,toDate)
     let totalOrderValue = await reportsService.computeTotalOrderValue(fromDate,toDate)
     let netSales = await reportsService.computeNetSales(fromDate,toDate)
     let salePerItem = await reportsService.computeSalePerItem(fromDate,toDate,skipForProduct,perPage)
     let orderBasedSales = await reportsService.computeOrderBasedSales(fromDate,toDate,skipForOrder,perPage)
     const productCount = salePerItem[0].totalCount[0]?.count || 1
     const pagesForProduct = Math.ceil(productCount / perPage)
     const orderCount = totalOrdersCount || 1
     const pagesForOrder = Math.ceil(orderCount / perPage)
     salePerItem = salePerItem[0].data
      res.render("admin-view/admin.sales-report.ejs",{totalOrdersCount,itemsSoldCount,grossSales,totalProductDiscount,totalCouponDiscount,totalRefunds,netSales,totalTax,totalShipping,totalOrderValue,salePerItem,orderBasedSales,orderWisePage,productWisePage,pagesForOrder,pagesForProduct,fromDate,toDate,reportBasedOn})
  
    } catch (err) {
      console.error(err)
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send(ERROR_MESSAGES.SERVER_ERROR)
    }
  }
const getSalesReportIntoExcel = async (req, res) => {
    try {
     const {today,fromDate,toDate} = reportsService.computeFromAndToDate(req.query.fromDate,req.query.toDate)
    let reportPeriod = fromDate.toLocaleDateString("en-IN", {day: "numeric",month: "short",year: "numeric"}) + " - " + toDate.toLocaleDateString("en-IN", {day: "numeric",month: "short",year: "numeric"})
    let generatedOn = today.toLocaleDateString("en-IN", {day: "numeric",month: "short",year: "numeric"})
     let totalOrdersCount = await reportsService.computeTotalOrdersCount(fromDate,toDate)
     let itemsSoldCount = await reportsService.itemsSold(fromDate,toDate)
     let grossSales = await reportsService.computeGrossSales(fromDate,toDate)
     let totalProductDiscount = await reportsService.computeTotalProductDiscount(fromDate,toDate)
     let totalCouponDiscount = await reportsService.computeTotalCouponDiscount(fromDate,toDate)
     let totalRefunds = await reportsService.computeTotalRefunds(fromDate,toDate)
     let netSales = await reportsService.computeNetSales(fromDate,toDate)
     let totalTax = await reportsService.computeTotalTax(fromDate,toDate)
     let totalShipping = await reportsService.computeTotalShipping(fromDate,toDate)
     let totalOrderValue = await reportsService.computeTotalOrderValue(fromDate,toDate)
     let salePerItem = await reportsService.computeSalePerItemForPdfAndExcel(fromDate,toDate)
     let orderBasedSales = await reportsService.computeOrderBasedSalesForPdfAndExcel(fromDate,toDate)
      
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
      {metric : "Refunds", value : totalRefunds},
      {metric : "Net Sales", value : netSales},
      {metric : "Tax", value : totalTax},
      {metric : "Shipping", value : totalShipping},
      {metric : "Total Order Value", value : totalOrderValue}
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
      { header: "Refunds", key: "amountRefunded", width: 20 },
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
        amountRefunded : item.amountRefunded,
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
     productWiseSalesReport.getColumn(5).numFmt = "0.00"
     productWiseSalesReport.getColumn(6).numFmt = "0.00"
     productWiseSalesReport.getColumn(7).numFmt = "0.00"
     productWiseSalesReport.getColumn(8).numFmt = "0.00"
     productWiseSalesReport.getColumn(9).numFmt = "0.00"

     const orderWiseSalesReport = workbook.addWorksheet("Order-Wise Sales Report")

     orderWiseSalesReport.columns = [
      { header : "No", key : "no", width : 15},
      { header: "Order ID", key: "orderId", width: 40 },
      { header: "Date", key: "date", width: 20 },
      { header: "Revenue", key: "revenue", width: 20 },
      { header: "Product Discount", key: "productDiscount", width: 20 },
      { header: "Coupon Discount", key: "couponDiscount", width: 20 },
      { header: "Refunds", key: "amountRefunded", width: 20 },
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
        amountRefunded : order.amountRefunded,
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
     orderWiseSalesReport.getColumn(4).numFmt = "0.00"
     orderWiseSalesReport.getColumn(5).numFmt = "0.00"
     orderWiseSalesReport.getColumn(6).numFmt = "0.00"
     orderWiseSalesReport.getColumn(7).numFmt = "0.00"
     orderWiseSalesReport.getColumn(8).numFmt = "0.00"
     
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
     const {today,fromDate,toDate} = reportsService.computeFromAndToDate(req.query.fromDate,req.query.toDate)
    let reportPeriod = fromDate.toLocaleDateString("en-US", {day: "numeric",month: "short",year: "numeric",timeZone : req.cookies.tz}) + " - " + toDate.toLocaleDateString("en-US", {day: "numeric",month: "short",year: "numeric",timeZone : req.cookies.tz})
    let generatedOn = today.toLocaleDateString("en-US", {day: "numeric",month: "short",year: "numeric",timeZone : req.cookies.tz})
     let totalOrdersCount = await reportsService.computeTotalOrdersCount(fromDate,toDate)
     let itemsSoldCount = await reportsService.itemsSold(fromDate,toDate)
     let grossSales = await reportsService.computeGrossSales(fromDate,toDate)
     let totalProductDiscount = await reportsService.computeTotalProductDiscount(fromDate,toDate)
     let totalCouponDiscount = await reportsService.computeTotalCouponDiscount(fromDate,toDate)
     let totalRefunds = await reportsService.computeTotalRefunds(fromDate,toDate)
     let netSales = await reportsService.computeNetSales(fromDate,toDate)
     let totalTax = await reportsService.computeTotalTax(fromDate,toDate)
     let totalShipping = await reportsService.computeTotalShipping(fromDate,toDate)
     let totalOrderValue = await reportsService.computeTotalOrderValue(fromDate,toDate)
     let salePerItem = await reportsService.computeSalePerItemForPdfAndExcel(fromDate,toDate)
     let orderBasedSales = await reportsService.computeOrderBasedSalesForPdfAndExcel(fromDate,toDate)
   

     const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 40 })
     res.setHeader("Content-Type", "application/pdf")
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=sales-report.pdf"
      )

      doc.registerFont(
        "Batangas",
        "/Users/muhammedshahzad/Project Ecommerce/public/fonts/Batangas Bold 700.otf"
      )

      doc.pipe(res)
     
        // Title
        doc.fontSize(20).font("Batangas").text("NovaMart", { align: "left" })
        doc.fontSize(12).font("Helvetica").text("Sales Report")
        doc.moveDown()

        // Meta
        doc.fontSize(10).text(`Report Period: ${reportPeriod}`, { align: "right" })
        doc.text(`Generated On: ${generatedOn}`, { align: "right" })
        doc.moveDown(2)

        // Section title
        doc.fontSize(14).font("Helvetica-Bold").text("Key Sales Metrics")
        doc.moveDown(0.5)

        // Table
        await doc.table({
          headers: [
            {label : "Total Orders",align : "center",headerAlign : "center",valign : "center"},
            {label : "Items Sold",align : "center",headerAlign : "center",valign : "center"},
            {label : "Gross Sales",align : "center",headerAlign : "center",valign : "center"},
            {label : "Product Discount",align : "center",headerAlign : "center",valign : "center"},
            {label : "Coupon Discount",align : "center",headerAlign : "center",valign : "center"},
            {label : "Refunds",align : "center",headerAlign : "center",valign : "center"},
            {label : "Net Revenue",align : "center",headerAlign : "center",valign : "center"},
            {label : "Tax",align : "center",headerAlign : "center",valign : "center"},
            {label : "Shipping",align : "center",headerAlign : "center",valign : "center"},
            {label : "Total Order Value",align : "center",headerAlign : "center",valign : "center"}
          ],
          rows: [[
            totalOrdersCount,
            itemsSoldCount,
            grossSales,
            totalProductDiscount,
            totalCouponDiscount,
            totalRefunds,
            netSales,
            totalTax,
            totalShipping,
            totalOrderValue
          ]]
        }, {
          prepareHeader: () => doc.font("Helvetica-Bold").fontSize(12),
          prepareRow: () => doc.font("Helvetica").fontSize(10)
        })

      doc.moveDown(2)
      doc.fontSize(14).font("Helvetica-Bold").text("Product-Wise Sales")
      doc.moveDown(0.5)
      doc.table({
        headers: [
          {label : "No",align : "center",headerAlign : "center",valign : "center"},
          {label : "Product",align : "left",headerAlign : "left",valign : "center"},
          {label : "Category",align : "center",headerAlign : "center",valign : "center"},
          {label : "Units Sold",align : "center",headerAlign : "center",valign : "center"},
          {label : "Revenue",align : "center",headerAlign : "center",valign : "center"},
          {label : "Product Discount",align : "center",headerAlign : "center",valign : "center"},
          {label : "Coupon Discount",align : "center",headerAlign : "center",valign : "center"},
          {label : "Refunds",align : "center",headerAlign : "center",valign : "center"},
          {label : "Net Revenue",align : "center",headerAlign : "center",valign : "center"}
        ],
        rows: salePerItem.map((item, i) => [
          i + 1,
          `${item._id.productName} ${item._id.productColor} ${item._id.productSize}`,
          item.categoryName,
          item.itemsSold,
          `$${item.revenue.toFixed(2)}`,
          `$${item.productDiscount.toFixed(2)}`,
          `$${item.couponDiscount.toFixed(2)}`,
          `$${item.amountRefunded.toFixed(2)}`,
          `$${item.netRevenue.toFixed(2)}`
        ])
      })

      doc.addPage()
      doc.fontSize(14).font("Helvetica-Bold").text("Order-Wise Sales")
      doc.moveDown(0.5)
      await doc.table({
        headers: [
          {label : "No",align : "center",headerAlign : "center",valign : "center"},
          {label : "Order ID",align : "left",headerAlign : "left",valign : "center"},
          {label : "Date",align : "center",headerAlign : "center",valign : "center"},
          {label : "Revenue",align : "center",headerAlign : "center",valign : "center"},
          {label : "Product Discount",align : "center",headerAlign : "center",valign : "center"},
          {label : "Coupon Discount",align : "center",headerAlign : "center",valign : "center"},
          {label : "Refunds",align : "center",headerAlign : "center",valign : "center"},
          {label : "Net Revenue",align : "center",headerAlign : "center",valign : "center"},
          {label : "Tax",align : "center",headerAlign : "center",valign : "center"},
          {label : "Shipping",align : "center",headerAlign : "center",valign : "center"},
          {label : "Total Order Value",align : "center",headerAlign : "center",valign : "center"}
        ],
        rows: orderBasedSales.map((order, i) => [
          i + 1,
          `${order._id}`,
          order.orderedAt.toLocaleDateString("en-IN", {day: "numeric",month: "short",year: "numeric"}),
          `$${order.revenue.toFixed(2)}`,
          `$${order.productDiscount.toFixed(2)}`,
          `$${order.couponDiscount.toFixed(2)}`,
          `$${order.amountRefunded.toFixed(2)}`,
          `$${order.netRevenue.toFixed(2)}`,
          `$${order.tax.toFixed(2)}`,
          `$${order.shipping.toFixed(2)}`,
          `$${order.totalOrderValue.toFixed(2)}`
        ])
      })
      
      doc.end()
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