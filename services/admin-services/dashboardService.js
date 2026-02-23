const Order = require("../../models/order.model.js");
const User = require("../../models/user.model.js");

async function computeTotalOrdersCount() {
  let count = await Order.find({}).countDocuments();
  return count;
}
async function computeTotalCustomersCount() {
  let count = await User.find().countDocuments();
  return count;
}

async function computeGrossSales() {
  let result = await Order.aggregate([
    {
      $unwind: "$items",
    },
    {
      $group: { _id: null, grossSales: { $sum: {$multiply : ["$items.price","$items.quantity"]} } },
    },
  ]);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(result[0]?.grossSales || 0);
}

async function computeTotalProductDiscount() {
  let result = await Order.aggregate([
    {
      $unwind: "$items",
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

async function computeTotalCouponDiscount() {
  let result = await Order.aggregate([
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

async function computeTotalRefunds() {
  let result = await Order.aggregate([
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

async function computeNetSales() {
  let result = await Order.aggregate([
    {
      $addFields: {
        itemsLength: { $size: "$items" },
      },
    },
    {
      $unwind: "$items",
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
        netSalesBeforeRefund: {
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
        netSales: {
          $sum: { $subtract: ["$netSalesBeforeRefund", "$amountRefunded"] },
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

async function computeTop10Products() {
  let result = await Order.aggregate([
    {
      $addFields: {
        itemsLength: { $size: "$items" },
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
      },
    },
    {
      $sort: { revenue: -1 },
    },
    {
      $limit: 10,
    },
  ]);
  return result;
}

async function computeTop10Categories() {
  let result = await Order.aggregate([
    {
      $addFields: {
        itemsLength: { $size: "$items" },
      },
    },
    {
      $unwind: "$items",
    },
    {
      $lookup: {
        from: "products",
        localField: "items.productId",
        foreignField: "_id",
        as: "items.productId",
      },
    },
    {
      $unwind: "$items.productId",
    },
    {
      $lookup: {
        from: "categories",
        localField: "items.productId.categoryId",
        foreignField: "_id",
        as: "items.category",
      },
    },
    {
      $unwind: "$items.category",
    },
    {
      $group: {
        _id: "$items.category.categoryName",
        itemsSold: { $sum: "$items.quantity" },
        revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
      },
    },
    {
      $sort: { revenue: -1 },
    },
    {
      $limit: 10,
    },
  ]);
  return result;
}
async function computeTop10Brands() {
  let result = await Order.aggregate([
    {
      $addFields: {
        itemsLength: { $size: "$items" },
      },
    },
    {
      $unwind: "$items",
    },
    {
      $lookup: {
        from: "products",
        localField: "items.productId",
        foreignField: "_id",
        as: "items.productId",
      },
    },
    {
      $unwind: "$items.productId",
    },
    {
      $lookup: {
        from: "brands",
        localField: "items.productId.brandId",
        foreignField: "_id",
        as: "items.brand",
      },
    },
    {
      $unwind: "$items.brand",
    },
    {
      $group: {
        _id: "$items.brand.brandName",
        itemsSold: { $sum: "$items.quantity" },
        revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
      },
    },
    {
      $sort: { revenue: -1 },
    },
    {
      $limit: 10,
    },
  ]);
  return result;
}
async function computeSalesLastTwelveMonths() {
  try {
    let now = new Date();
    let yearly = new Date(
      now.getFullYear(),
      now.getMonth() - 12,
      now.getDate()
    );
    let revenueIn12Months = [];
    for (let i = 12; i >= 0; i--) {
      let obj = {};
      obj.date = new Date(now.getFullYear(), now.getMonth() - i, 2)
        .toISOString()
        .slice(0, 7);
      obj.revenue = 0;
      revenueIn12Months.push(obj);
    }

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
          "items.isCancelled": false,
        },
      },
      {
        $match: {
          "items.statusTimeline.orderedAt": {
            $gte: yearly,
            $lte: now,
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m",
              date: "$items.statusTimeline.orderedAt",
            },
          },
          revenue: {
            $sum: {
              $multiply: ["$items.offerPrice", "$items.quantity"],
            },
          },
        },
      },
    ]);
    for (let i = 0; i < result.length; i++) {
      for (let j = 0; j < revenueIn12Months.length; j++) {
        if (
          revenueIn12Months[j].date === result[i]._id &&
          result[i].revenue > 0
        ) {
          revenueIn12Months[j].revenue = result[i].revenue;
          revenueIn12Months[j].date = new Date(
            revenueIn12Months[j].date
          ).toLocaleDateString("en-US", { year: "numeric", month: "long" });
        } else {
          revenueIn12Months[j].date = new Date(
            revenueIn12Months[j].date
          ).toLocaleDateString("en-US", { year: "numeric", month: "long" });
        }
      }
    }
    return revenueIn12Months;
  } catch (error) {
    console.log(error);
  }
}
async function computeSalesLastThirtyDays() {
  let dateToday = new Date();

  let lastThirtyDaysBefore = new Date(dateToday);
  lastThirtyDaysBefore.setDate(dateToday.getDate() - 30);

  let dateInThisMonth = [];
  for (
    let d = new Date(lastThirtyDaysBefore);
    d <= dateToday;
    d.setDate(d.getDate() + 1)
  ) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");

    dateInThisMonth.push({
      date: `${yyyy}-${mm}-${dd}`, // LOCAL date, no UTC shift
      revenue: 0,
    });
  }

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
        "items.isCancelled": false,
      },
    },
    {
      $match: {
        "items.statusTimeline.orderedAt": {
          $gte: lastThirtyDaysBefore,
          $lte: dateToday,
        },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$items.statusTimeline.orderedAt",
          },
        },
        revenue: {
          $sum: {
            $multiply: ["$items.offerPrice", "$items.quantity"],
          },
        },
      },
    },
  ]);
  for (let i = 0; i < result.length; i++) {
    for (let j = 0; j < dateInThisMonth.length; j++) {
      if (dateInThisMonth[j].date === result[i]._id && result[i].revenue > 0) {
        dateInThisMonth[j].revenue = result[i].revenue;
      }
    }
  }

  return dateInThisMonth;
}
async function computeSalesLastSevenDays() {
  let dateToday = new Date();
  let sevenDaysBack = new Date(
    dateToday.getFullYear(),
    dateToday.getMonth(),
    dateToday.getDate() - 6
  );
  let dateInThisMonth = [];
  let todaysDayDate = dateToday.getDate();
  for (let i = todaysDayDate - 5; i <= todaysDayDate + 1; i++) {
    let obj = {};
    obj.date = new Date(dateToday.getFullYear(), dateToday.getMonth(), i)
      .toISOString()
      .slice(0, 10);
    obj.revenue = 0;
    dateInThisMonth.push(obj);
  }

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
        "items.isCancelled": false,
      },
    },
    {
      $match: {
        "items.statusTimeline.orderedAt": {
          $gte: sevenDaysBack,
          $lte: dateToday,
        },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$items.statusTimeline.orderedAt",
          },
        },
        revenue: {
          $sum: {
            $multiply: ["$items.offerPrice", "$items.quantity"],
          },
        },
      },
    },
  ]);

  for (let i = 0; i < result.length; i++) {
    for (let j = 0; j < dateInThisMonth.length; j++) {
      if (dateInThisMonth[j].date === result[i]._id && result[i].revenue > 0) {
        dateInThisMonth[j].revenue = result[i].revenue;
      }
    }
  }
  return dateInThisMonth;
}
async function computeSalesLastTwentyFourHours() {
  let dateToday = new Date();
  let oneDayInMilliseconds = 24 * 60 * 60 * 1000;
  let twentyFourHoursBefore = new Date(
    dateToday.getTime() - oneDayInMilliseconds
  );
  let dateInThisMonth = [];
  let oneHour = 60 * 60 * 1000;
  for (let i = 0; i <= 24; i++) {
    let obj = {};
    obj.date = new Date(twentyFourHoursBefore.getTime() + i * oneHour);
    obj.revenue = 0;
    dateInThisMonth.push(obj);
  }

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
        "items.isCancelled": false,
      },
    },
    {
      $match: {
        "items.statusTimeline.orderedAt": {
          $gte: twentyFourHoursBefore,
          $lte: dateToday,
        },
      },
    },
    {
      $group: {
        _id: "$items.statusTimeline.orderedAt",
        revenue: {
          $sum: {
            $multiply: ["$items.offerPrice", "$items.quantity"],
          },
        },
      },
    },
  ]);
  for (let i = 0; i < result.length; i++) {
    for (let j = 0; j < dateInThisMonth.length; j++) {
      let todayCurrentHour = new Date(dateInThisMonth[j].date);
      let todayCurrentPlusOneHour = new Date(dateInThisMonth[j + 1]?.date);
      let saleTodayPerHour = new Date(result[i]._id);
      if (
        saleTodayPerHour >= todayCurrentHour &&
        saleTodayPerHour < todayCurrentPlusOneHour &&
        result[i].revenue > 0
      ) {
        dateInThisMonth[j].revenue += result[i].revenue;
      }
    }
  }
  for (let i = 0; i < dateInThisMonth.length; i++) {
    dateInThisMonth[i].date = dateInThisMonth[i].date.toLocaleDateString(
      "en-US",
      { day: "2-digit", month: "short", hour: "2-digit" }
    );
  }
  return dateInThisMonth;
}
module.exports = {
  computeTotalOrdersCount,
  computeTotalCustomersCount,
  computeGrossSales,
  computeTotalProductDiscount,
  computeTotalCouponDiscount,
  computeTotalRefunds,
  computeNetSales,
  computeTop10Products,
  computeTop10Categories,
  computeTop10Brands,
  computeSalesLastTwentyFourHours,
  computeSalesLastSevenDays,
  computeSalesLastThirtyDays,
  computeSalesLastTwelveMonths,
};
