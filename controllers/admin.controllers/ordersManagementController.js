const ordersService = require("../../services/admin-services/ordersService.js")
const ERROR_MESSAGES = require("../../constants/errorMessages.js")
const HTTP_STATUS = require("../../constants/httpStatus.js")

const getOrders = async(req,res) => {
    const perPage = req.session.itemsPerPage || 5 
    const page = req.query.page || 1
    const ordersFullList = await ordersService.getOrdersForSearch()
     const orders = await ordersService.getOrders(perPage,page)
     const count = await ordersService.getOrdersCount()
    const pages = Math.ceil(count / perPage)
    const message = req.session.message || null
    delete req.session.message
    res.render("admin-view/admin.orders.ejs",{message,orders,page,pages,count,ordersFullList})
}
const getOrderDetailPage = async (req,res) => {
    let user = req.session.user || req.user
    let message = req.session.message || null
    delete req.session.message
    const order = await ordersService.getOrder(req.params.id)
    res.render("admin-view/admin.order-details-page.ejs",{message,user,order})
}

const updateStatus = async (req,res) => {
    try {
    let order = await ordersService.getOrder(req.params.id)
    await ordersService.updateOrderStatus(order,req.query.status)
    req.session.message = "Status Updated Successfully"
    return res.status(HTTP_STATUS.OK).json({
        success : true
    })
    } catch (error) {
        console.log(error)
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            message : ERROR_MESSAGES.SERVER_ERROR
        })
    }
}

const updateItemStatus = async (req,res) => {
    try {
    let order = await ordersService.getOrder(req.params.id)
    await ordersService.updateOrderItemStatus(order,req.query.status,req.query.itemIndex)
    return res.status(HTTP_STATUS.OK).json({
        success : true,
        message : "Done"
    })
    } catch (error) {
        console.log(error)
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            message : ERROR_MESSAGES.SERVER_ERROR
        })
    }
}

const updateProductStock = async (req,res) => {
    try {
        const {orderId,itemIndex,productVariant,quantity} = req.query
        const order = await ordersService.getOrder(orderId)
    await ordersService.updateProductStock(order,itemIndex,productVariant,quantity)
    return res.status(HTTP_STATUS.OK).json({
        success : true,
        message : "Stock Updated Successfully"
    })
    } catch (error) {
      console.log(error)  
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message : ERROR_MESSAGES.SERVER_ERROR
    })
    }
}
 


module.exports = {
    getOrders,
    getOrderDetailPage,
    updateStatus,
    updateItemStatus,
    updateProductStock
}