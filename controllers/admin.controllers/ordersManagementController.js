const ordersService = require("../../services/admin-services/ordersService.js");
const HTTP_STATUS = require("../../constants/httpStatus.js");

const getOrders = async (req, res, next) => {
  const perPage = Number(req.session.itemsPerPage) || 5;
  const page = req.query.page || 1;
  const ordersFullList = await ordersService.getOrdersForSearch();
  const status = req.query.status || "Placed";
  const search = req.query.search || null
  const startDate = req.query.startDate || null;
  let endDate = req.query.endDate || null
  let dateQuery = null
  if(startDate || endDate){
    const dateMatch = {}
    endDate = new Date(endDate)
    endDate.setUTCHours(23,59,59,999)
    if(startDate !== null) dateMatch.$gte = new Date(startDate)
    if(endDate !== null) dateMatch.$lte = endDate
    dateQuery = {
      $match : {
        "items.statusTimeline.orderedAt" : dateMatch
      } 
    }  
  }
  const sortBy = req.query.sortBy || null
  const orders = await ordersService.getOrders(perPage, page, status,search,dateQuery,sortBy);
  const count = await ordersService.getOrdersCount(status,search,dateQuery);
  const pages = Math.ceil(count / perPage);
  const message = req.session.message || null;
  delete req.session.message;
  res.status(HTTP_STATUS.OK).render("admin-view/admin.orders.ejs", {
    message,
    orders,
    page,
    pages,
    perPage,
    count,
    search,
    ordersFullList,
    startDate : req.query.startDate || null,
    endDate : req.query.endDate || null,
    sortBy,
    status,
  });
};
const getOrderDetailPage = async (req, res, next) => {
  let user = req.session.user || req.user;
  let message = req.session.message || null;
  delete req.session.message;
  const order = await ordersService.getOrder(req.params.id);
  res.status(HTTP_STATUS.OK).render("admin-view/admin.order-details-page.ejs", {
    message,
    user,
    order,
  });
};

const updateStatus = async (req, res, next) => {
  try {
    let order = await ordersService.getOrder(req.params.id);
    await ordersService.updateOrderStatus(
      order,
      req.query.status,
      req.query?.item,
      req.body?.declineReason
    );
    req.session.message = "Status Updated Successfully";
    return res.status(HTTP_STATUS.OK).json({
      success: true,
    });
  } catch (error) {
   next(error)
  }
};

const updateProductStock = async (req, res, next) => {
  try {
    const { orderId, itemIndex, productVariant, quantity } = req.query;
    const order = await ordersService.getOrder(orderId);
    await ordersService.updateProductStock(
      order,
      itemIndex,
      productVariant,
      quantity
    );
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Stock Updated Successfully",
    });
  } catch (error) {
    next(error)
  }
};

module.exports = {
  getOrders,
  getOrderDetailPage,
  updateStatus,
  updateProductStock,
};
