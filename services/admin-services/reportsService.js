const Order = require("../../models/order.model.js");

function computeFromAndToDate(queryFromDate, queryToDate) {
  let today = new Date(new Date().toISOString().split("T")[0]);
  let fromDate = null;
  let toDate = null;
  if (queryFromDate && queryToDate) {
    fromDate = new Date(queryFromDate);
    fromDate.setUTCHours(0, 0, 0, 0);
    toDate = new Date(queryToDate);
    toDate.setUTCHours(23, 59, 59, 999);
  } else {
    fromDate = new Date(today);
    fromDate.setUTCHours(0, 0, 0, 0);
    toDate = new Date(today);
    toDate.setUTCHours(23, 59, 59, 999);
  }
  return { today, fromDate, toDate };
}

async function computeTotalOrdersCount(fromDate, toDate) {
  let count = await Order.aggregate([
    {
      $match: {
        isCancelled: false,
        isReturned: false,
      },
    },
    {
      $unwind: "$items",
    },
    {
      $match: {
        "items.statusTimeline.orderedAt": {
          $gte: fromDate,
          $lte: toDate,
        },
      },
    },
    {
      $group: { _id: "$orderId" },
    },
    {
      $count: "ordersCount",
    },
  ]);
  return count[0]?.ordersCount ?? 0;
}

async function itemsSold(fromDate, toDate) {
  let result = await Order.aggregate([
    {
      $match: {
        isCancelled: false,
        isReturned: false,
      },
    },
    {
      $unwind: "$items",
    },
    {
      $match: {
        "items.statusTimeline.orderedAt": {
          $gte: fromDate,
          $lt: toDate,
        },
      },
    },
    {
      $group: { _id: null, totalItemsSold: { $sum: "$items.quantity" } },
    },
  ]);
  return result[0]?.totalItemsSold || 0;
}

async function computeGrossSales(fromDate, toDate) {
  let result = await Order.aggregate([
    {
      $match: {
        isCancelled: false,
        isReturned: false,
      },
    },
    {
      $match: {
        "items.statusTimeline.orderedAt": {
          $gte: fromDate,
          $lt: toDate,
        },
      },
    },
    {
      $group: { _id: null, grossSales: { $sum: "$subTotal" } },
    },
  ]);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(result[0]?.grossSales || 0);
}
async function computeTotalProductDiscount(fromDate, toDate) {
  let result = await Order.aggregate([
    {
      $match: {
        isCancelled: false,
        isReturned: false,
      },
    },
    {
      $unwind: "$items",
    },
    {
      $match: {
        "items.statusTimeline.orderedAt": {
          $gte: fromDate,
          $lt: toDate,
        },
      },
    },
    {
      $group: {
        _id: null,
        totalProductDiscount: {
          $sum: {
            $subtract: [
              { $multiply: ["$items.price", "$items.quantity"] },
              { $multiply: ["$items.offerPrice", "$items.quantity"] },
            ],
          },
        },
      },
    },
  ]);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(result[0]?.totalProductDiscount || 0);
}
async function computeTotalCouponDiscount(fromDate, toDate) {
  let result = await Order.aggregate([
    {
      $match: {
        isCancelled: false,
        isReturned: false,
      },
    },
    {
      $match: {
        "items.statusTimeline.orderedAt": {
          $gte: fromDate,
          $lt: toDate,
        },
      },
    },
    {
      $group: { _id: null, totalCouponDiscount: { $sum: "$discount" } },
    },
  ]);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(result[0]?.totalCouponDiscount || 0);
}
async function computeTotalRefunds(fromDate, toDate) {
  let result = await Order.aggregate([
    {
      $match: {
        isCancelled: false,
        isReturned: false,
      },
    },
    {
      $match: {
        "items.statusTimeline.orderedAt": {
          $gte: fromDate,
          $lt: toDate,
        },
      },
    },
    {
      $lookup: {
        from: "payments",
        localField: "paymentId",
        foreignField: "_id",
        as: "paymentId",
      },
    },
    {
      $unwind: "$paymentId",
    },
    {
      $group: {
        _id: null,
        amountRefunded: { $sum: "$paymentId.amountRefunded" },
      },
    },
  ]);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(result[0]?.amountRefunded || 0);
}
async function computeNetSales(fromDate, toDate) {
  let result = await Order.aggregate([
    {
      $match: {
        isCancelled: false,
        isReturned: false,
      },
    },
    {
      $addFields: {
        itemsLength: { $size: "$items" },
      },
    },
    {
      $unwind: "$items",
    },
    {
      $match: {
        "items.statusTimeline.orderedAt": {
          $gte: fromDate,
          $lt: toDate,
        },
      },
    },
    {
      $lookup: {
        from: "payments",
        localField: "paymentId",
        foreignField: "_id",
        as: "paymentId",
      },
    },
    {
      $unwind: "$paymentId",
    },
    {
      $group: {
        _id: "$orderId",
        amountRefunded: { $first: "$paymentId.amountRefunded" },
        subTotal: {
          $sum: {
            $subtract: [
              { $multiply: ["$items.offerPrice", "$items.quantity"] },
              { $divide: ["$discount", "$itemsLength"] },
            ],
          },
        },
      },
    },
    {
      $group: {
        _id: null,
        netSales: { $sum: { $subtract: ["$subTotal", "$amountRefunded"] } },
      },
    },
  ]);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(result[0]?.netSales || 0);
}
async function computeTotalOrderValue(fromDate, toDate) {
  let result = await Order.aggregate([
    {
      $match: {
        isCancelled: false,
        isReturned: false,
      },
    },
    {
      $match: {
        "items.statusTimeline.orderedAt": {
          $gte: fromDate,
          $lt: toDate,
        },
      },
    },
    {
      $lookup: {
        from: "payments",
        localField: "paymentId",
        foreignField: "_id",
        as: "paymentId",
      },
    },
    {
      $unwind: "$paymentId",
    },
    {
      $group: {
        _id: null,
        netSales: {
          $sum: { $subtract: ["$grandTotal", "$paymentId.amountRefunded"] },
        },
      },
    },
  ]);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(result[0]?.netSales || 0);
}

async function computeTotalTax(fromDate, toDate) {
  let result = await Order.aggregate([
    {
      $match: {
        isCancelled: false,
        isReturned: false,
      },
    },
    {
      $match: {
        "items.statusTimeline.orderedAt": {
          $gte: fromDate,
          $lt: toDate,
        },
      },
    },
    {
      $group: { _id: null, taxCollected: { $sum: "$tax" } },
    },
  ]);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(result[0]?.taxCollected || 0);
}
async function computeTotalShipping(fromDate, toDate) {
  let result = await Order.aggregate([
    {
      $match: {
        isCancelled: false,
        isReturned: false,
      },
    },
    {
      $match: {
        "items.statusTimeline.orderedAt": {
          $gte: fromDate,
          $lt: toDate,
        },
      },
    },
    {
      $group: { _id: "$orderId", shipping: { $first: "$shipping" } },
    },
    {
      $group: { _id: null, shippingCollected: { $sum: "$shipping" } },
    },
  ]);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(result[0]?.shippingCollected || 0);
}

async function computeSalePerItem(fromDate, toDate, skip, limit) {
  let result = await Order.aggregate([
    {
      $match: {
        isCancelled: false,
        isReturned: false,
      },
    },
    {
      $addFields: {
        itemsLength: { $size: "$items" },
      },
    },
    {
      $unwind: "$items",
    },
    {
      $match: {
        "items.statusTimeline.orderedAt": {
          $gte: fromDate,
          $lt: toDate,
        },
      },
    },
    {
      $unwind: "$items",
    },
    {
      $group: {
        _id: {
          productName: "$items.productName",
          productColor: "$items.color",
          productSize: "$items.size",
        },
        productId: { $first: "$items.productId" },
        itemsSold: { $sum: "$items.quantity" },
        revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
        productDiscount: {
          $sum: {
            $subtract: [
              { $multiply: ["$items.quantity", "$items.price"] },
              { $multiply: ["$items.quantity", "$items.offerPrice"] },
            ],
          },
        },
        couponDiscount: { $sum: { $divide: ["$discount", "$itemsLength"] } },
        netRevenueBeforeRefund: {
          $sum: {
            $subtract: [
              { $multiply: ["$items.quantity", "$items.offerPrice"] },
              { $divide: ["$discount", "$itemsLength"] },
            ],
          },
        },
        amountRefunded: {
          $sum: {
            $cond: {
              if: {
                $or: [
                  {
                    $and: [
                      { $eq: ["$items.return.isRequested", true] },
                      { $ne: ["$items.return.approvedAt", null] },
                    ],
                  },
                  {
                    $ne: ["$items.refundOnCancelled.status", null],
                  },
                ],
              },
              then: {
                $subtract: [
                  { $multiply: ["$items.quantity", "$items.offerPrice"] },
                  { $divide: ["$discount", "$itemsLength"] },
                ],
              },
              else: 0,
            },
          },
        },
      },
    },
    {
      $addFields: {
        netRevenue: {
          $subtract: ["$netRevenueBeforeRefund", "$amountRefunded"],
        },
      },
    },
    {
      $lookup: {
        from: "products",
        localField: "productId",
        foreignField: "_id",
        as: "productId",
      },
    },
    {
      $unwind: "$productId",
    },
    {
      $lookup: {
        from: "categories",
        localField: "productId.categoryId",
        foreignField: "_id",
        as: "categoryId",
      },
    },
    {
      $unwind: "$categoryId",
    },
    {
      $project: {
        _id: 1,
        itemsSold: 1,
        revenue: 1,
        productDiscount: 1,
        couponDiscount: 1,
        netRevenue: 1,
        amountRefunded: 1,
        categoryName: "$categoryId.categoryName",
      },
    },
    {
      $sort: { netRevenue: -1 },
    },
    {
      $facet: {
        data: [{ $skip: skip }, { $limit: limit }],
        totalCount: [{ $count: "count" }],
      },
    },
  ]);
  return result;
}
async function computeSalePerItemForPdfAndExcel(fromDate, toDate) {
  let result = await Order.aggregate([
    {
      $match: {
        isCancelled: false,
        isReturned: false,
      },
    },
    {
      $addFields: {
        itemsLength: { $size: "$items" },
      },
    },
    {
      $unwind: "$items",
    },
    {
      $match: {
        "items.statusTimeline.orderedAt": {
          $gte: fromDate,
          $lt: toDate,
        },
      },
    },
    {
      $group: {
        _id: {
          productName: "$items.productName",
          productColor: "$items.color",
          productSize: "$items.size",
        },
        productId: { $first: "$items.productId" },
        itemsSold: { $sum: "$items.quantity" },
        revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
        productDiscount: {
          $sum: {
            $subtract: [
              { $multiply: ["$items.quantity", "$items.price"] },
              { $multiply: ["$items.quantity", "$items.offerPrice"] },
            ],
          },
        },
        couponDiscount: { $sum: { $divide: ["$discount", "$itemsLength"] } },
        netRevenueBeforeRefund: {
          $sum: {
            $subtract: [
              { $multiply: ["$items.quantity", "$items.offerPrice"] },
              { $divide: ["$discount", "$itemsLength"] },
            ],
          },
        },
        amountRefunded: {
          $sum: {
            $cond: {
              if: {
                $or: [
                  {
                    $and: [
                      { $eq: ["$items.return.isRequested", true] },
                      { $ne: ["$items.return.approvedAt", null] },
                    ],
                  },
                  {
                    $ne: ["$items.refundOnCancelled.status", null],
                  },
                ],
              },
              then: {
                $subtract: [
                  { $multiply: ["$items.quantity", "$items.offerPrice"] },
                  { $divide: ["$discount", "$itemsLength"] },
                ],
              },
              else: 0,
            },
          },
        },
      },
    },
    {
      $addFields: {
        netRevenue: {
          $subtract: ["$netRevenueBeforeRefund", "$amountRefunded"],
        },
      },
    },
    {
      $lookup: {
        from: "products",
        localField: "productId",
        foreignField: "_id",
        as: "productId",
      },
    },
    {
      $unwind: "$productId",
    },
    {
      $lookup: {
        from: "categories",
        localField: "productId.categoryId",
        foreignField: "_id",
        as: "categoryId",
      },
    },
    {
      $unwind: "$categoryId",
    },
    {
      $project: {
        _id: 1,
        itemsSold: 1,
        revenue: 1,
        productDiscount: 1,
        couponDiscount: 1,
        netRevenue: 1,
        amountRefunded: 1,
        categoryName: "$categoryId.categoryName",
      },
    },
    {
      $sort: { netRevenue: -1 },
    },
  ]);
  return result;
}
async function computeOrderBasedSales(fromDate, toDate, skip, limit) {
  let result = await Order.aggregate([
    {
      $match: {
        isCancelled: false,
        isReturned: false,
      },
    },
    {
      $addFields: {
        itemsLength: { $size: "$items" },
      },
    },
    {
      $unwind: "$items",
    },
    {
      $match: {
        "items.statusTimeline.orderedAt": {
          $gte: fromDate,
          $lt: toDate,
        },
      },
    },
    {
      $lookup: {
        from: "payments",
        localField: "paymentId",
        foreignField: "_id",
        as: "paymentId",
      },
    },
    {
      $unwind: "$paymentId",
    },
    {
      $group: {
        _id: "$orderId",
        orderedAt: { $first: "$items.statusTimeline.orderedAt" },
        revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        productDiscount: {
          $sum: {
            $subtract: [
              { $multiply: ["$items.quantity", "$items.price"] },
              { $multiply: ["$items.quantity", "$items.offerPrice"] },
            ],
          },
        },
        couponDiscount: { $sum: { $divide: ["$discount", "$itemsLength"] } },
        netRevenueBeforeRefund: {
          $sum: {
            $subtract: [
              { $multiply: ["$items.quantity", "$items.offerPrice"] },
              { $divide: ["$discount", "$itemsLength"] },
            ],
          },
        },
        amountRefunded: { $first: "$paymentId.amountRefunded" },
        tax: { $first: "$tax" },
        shipping: { $first: "$shipping" },
        grandTotal: { $first: "$grandTotal" },
      },
    },
    {
      $addFields: {
        netRevenue: {
          $subtract: ["$netRevenueBeforeRefund", "$amountRefunded"],
        },
        totalOrderValue: { $subtract: ["$grandTotal", "$amountRefunded"] },
      },
    },
    {
      $sort: { netRevenue: -1 },
    },
    {
      $skip: skip,
    },
    {
      $limit: limit,
    },
  ]);
  return result;
}
async function computeOrderBasedSalesForPdfAndExcel(fromDate, toDate) {
  let result = await Order.aggregate([
    {
      $match: {
        isCancelled: false,
        isReturned: false,
      },
    },
    {
      $addFields: {
        itemsLength: { $size: "$items" },
      },
    },
    {
      $unwind: "$items",
    },
    {
      $match: {
        "items.statusTimeline.orderedAt": {
          $gte: fromDate,
          $lt: toDate,
        },
      },
    },
    {
      $lookup: {
        from: "payments",
        localField: "paymentId",
        foreignField: "_id",
        as: "paymentId",
      },
    },
    {
      $unwind: "$paymentId",
    },
    {
      $group: {
        _id: "$orderId",
        orderedAt: { $first: "$items.statusTimeline.orderedAt" },
        revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        productDiscount: {
          $sum: {
            $subtract: [
              { $multiply: ["$items.quantity", "$items.price"] },
              { $multiply: ["$items.quantity", "$items.offerPrice"] },
            ],
          },
        },
        couponDiscount: { $sum: { $divide: ["$discount", "$itemsLength"] } },
        netRevenueBeforeRefund: {
          $sum: {
            $subtract: [
              { $multiply: ["$items.quantity", "$items.offerPrice"] },
              { $divide: ["$discount", "$itemsLength"] },
            ],
          },
        },
        amountRefunded: { $first: "$paymentId.amountRefunded" },
        tax: { $first: "$tax" },
        shipping: { $first: "$shipping" },
        grandTotal: { $first: "$grandTotal" },
      },
    },
    {
      $addFields: {
        netRevenue: {
          $subtract: ["$netRevenueBeforeRefund", "$amountRefunded"],
        },
        totalOrderValue: { $subtract: ["$grandTotal", "$amountRefunded"] },
      },
    },
    {
      $sort: { netRevenue: -1 },
    },
  ]);
  return result;
}

module.exports = {
  computeFromAndToDate,
  computeTotalOrdersCount,
  itemsSold,
  computeGrossSales,
  computeTotalProductDiscount,
  computeTotalCouponDiscount,
  computeTotalRefunds,
  computeNetSales,
  computeTotalOrderValue,
  computeTotalTax,
  computeTotalShipping,
  computeSalePerItem,
  computeSalePerItemForPdfAndExcel,
  computeOrderBasedSales,
  computeOrderBasedSalesForPdfAndExcel,
};
