const cloudinary = require("../../config/cloudinaryConfig.js");
const puppeteer = require("puppeteer");
const Product = require("../../models/product.model.js");
const Wallet = require("../../models/wallet.model.js");
const Order = require("../../models/order.model.js");
const Payment = require("../../models/payment.model.js");

const getOrdersForSearch = async () => {
  let result = await Order.find({}, { _id: 0, orderId: 1 });
  return result;
};

const getOrders = async (perPage, page, status) => {
  let skip = perPage * page - perPage;
  let pipeline = [];
  pipeline.push({
    $unwind: "$items",
  });
  if (status !== "All") {
    pipeline.push({
      $match: {
        "items.status": status,
      },
    });
  }
  pipeline.push(
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "userId",
      },
    },
    {
      $unwind: "$userId",
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
      $sort: { createdAt: -1 },
    },
    {
      $skip: skip,
    },
    {
      $limit: perPage,
    }
  );
  let orders = await Order.aggregate(pipeline);
  return orders;
};

const getOrdersCount = async (status) => {
  let pipeline = [];
  pipeline.push({ $unwind: "$items" });
  if (status !== "All") {
    pipeline.push({
      $match: {
        "items.status": status,
      },
    });
  }
  pipeline.push({ $count: "ordersCount" });
  let count = await Order.aggregate(pipeline);
  return count[0]?.ordersCount;
};

const getOrder = async (id) => {
  let order = await Order.findOne({ _id: id })
    .populate("userId")
    .populate("paymentId");
  return order;
};

async function generateInvoicePDF(htmlContent) {
  const browser = await puppeteer.launch({
    headless: "new",
  });

  const page = await browser.newPage();

  await page.setContent(htmlContent, {
    waitUntil: "domcontentloaded",
    timeout: 0,
  });

  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: { top: "20px", bottom: "20px", left: "20px", right: "20px" },
    timeout: 0,
  });

  await browser.close();
  return pdfBuffer;
}

function createInvoice(order) {
  let tableRow = ``;
  for (let i = 0; i < order.items.length; i++) {
    if (order.items[i].isCancelled) {
      tableRow += `<tr>
                            <td style="padding: 10px; border-bottom: 1px solid #eee;">
                                <p style="font-weight: bold; margin: 0;">${
                                  order.items[i].productName
                                }(Cancelled)</p>
                                <p style="margin: 5px 0 0; color: #666;">Color: ${
                                  order.items[i].color
                                }</p>
                                <p style="margin: 5px 0 0; color: #666;">Size: ${
                                  order.items[i].size
                                }</p>
                            </td>
                            <td style="text-align: right; padding: 10px; border-bottom: 1px solid #eee;">$${
                              order.items[i].price
                            }</td>
                            <td style="text-align: center; padding: 10px; border-bottom: 1px solid #eee;">${
                              order.items[i].quantity
                            }</td>
                            <td style="text-align: right; padding: 10px; border-bottom: 1px solid #eee;">$${(
                              order.items[i].price * order.items[i].quantity
                            ).toFixed(2)}</td>
                        </tr>`;
    } else {
      tableRow += `<tr>
                                <td style="padding: 10px; border-bottom: 1px solid #eee;">
                                    <p style="font-weight: bold; margin: 0;">${
                                      order.items[i].productName
                                    }</p>
                                    <p style="margin: 5px 0 0; color: #666;">Color: ${
                                      order.items[i].color
                                    }</p>
                                    <p style="margin: 5px 0 0; color: #666;">Size: ${
                                      order.items[i].size
                                    }</p>
                                </td>
                                <td style="text-align: right; padding: 10px; border-bottom: 1px solid #eee;">$${
                                  order.items[i].price
                                }</td>
                                <td style="text-align: center; padding: 10px; border-bottom: 1px solid #eee;">${
                                  order.items[i].quantity
                                }</td>
                                <td style="text-align: right; padding: 10px; border-bottom: 1px solid #eee;">$${(
                                  order.items[i].price * order.items[i].quantity
                                ).toFixed(2)}</td>
                            </tr>`;
    }
  }
  return ` <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8" />
                <title>Invoice</title>
            </head>
            <body>
                <div style="background-color: white;min-width: 210mm; max-width: 210mm; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
                <div>
                    <h1 style="font-size: 32px; color: #414141; margin: 0; font-family: Batangas;">NovaMart</h1>
                    <p style="margin: 5px 0 0; color: #666;">St44 Abi Aseed Bin Malik, <br> Sharjah, <br> United Arab Emirates <br>+971561134003<br> www.novamart.com</p>
                </div>
                <div style="text-align: right; ">
                    <h2 style="font-size: 30px; font-weight: bold; margin: 0; color: #333;">INVOICE</h2>
                    <p style="margin: 5px 0 0; color: #404040;">${
                      order.orderId
                    }</p>
                    <p style="margin: 5px 0 0; color:#404040;">Date:  ${new Date(
                      order.invoiceCreatedAt
                    ).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}</p>
                </div>
            </div>
            
            <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
                <div style="width: 48%;">
                    <h3 style="font-size: 16px; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 10px;">Bill To</h3>
                    <p style="margin: 5px 0; font-weight: bold;">${
                      order.address.firstName
                    } ${order.address.lastName}</p>
                    <p style="margin: 5px 0;">${order.address.address}</p>
                    <p style="margin: 5px 0;">${order.address.state} ${
    order.address.pincode !== "Not Applicable" ? order.address.pincode : ""
  }</p>
                    <p style="margin: 5px 0;">${order.address.country}</p>
                    <p style="margin: 5px 0;">${order.address.mobileNo}</p>
                </div>
                <div style="width: 48%;">
                    <h3 style="font-size: 16px; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 10px;">Payment Method</h3>
                    <p style="margin: 5px 0; font-weight: bold;">${
                      order.paymentId.paymentMethod
                    }</p>
                </div>
            </div>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                <thead>
                    <tr style="background-color: #f5f5f5;">
                        <th style="text-align: left; padding: 10px; border-bottom: 1px solid #ddd;">Item</th>
                        <th style="text-align: right; padding: 10px; border-bottom: 1px solid #ddd;">Price</th>
                        <th style="text-align: center; padding: 10px; border-bottom: 1px solid #ddd;">Qty</th>
                        <th style="text-align: right; padding: 10px; border-bottom: 1px solid #ddd;">Total</th>
                    </tr>
                </thead>
                <tbody>
                     ${tableRow}
                </tbody>
            </table>
            
            <div style="margin-left: auto; width: 300px;">
                <div style="display: flex; justify-content: space-between; padding: 5px 0;">
                    <span>Subtotal:</span>
                    <span>$${order.subTotal}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 5px 0;">
                    <span>Shipping:</span>
                    <span>$${order.shipping}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 5px 0;">
                    <span>Tax:</span>
                    <span>$${order.tax}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 5px 0;">
                    <span>Discount:</span>
                    <span>$${order.discount || "NA"}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 10px 0; border-top: 1px solid #ddd; font-weight: bold; font-size: 18px;">
                    <span>Total:</span>
                    <span>$${order.grandTotal}</span>
                </div>
            </div>
            
            <div style="margin-top: 50px; text-align: center; color: #666; font-size: 12px;">
                <p>Thank you for shopping with NovaMart!</p>
                <p>If you have any questions about this invoice, please contact support@novamart.com</p>
            </div>
        </div>
        </body>
        </html>`;
}

function uploadPDFToCloudinary(pdfBuffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        folder: "invoices/2026",
        type: "upload",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(pdfBuffer);
  });
}

async function generateAndUploadInvoice(orderId) {
  try {
    const order = await getOrder(orderId);

    if (!order) return;

    order.invoiceCreatedAt = new Date();

    const html = createInvoice(order);
    const pdfBuffer = await generateInvoicePDF(html);
    const uploadResult = await uploadPDFToCloudinary(pdfBuffer);

    order.invoiceUrl = uploadResult.secure_url;

    await order.save();

    console.log("Invoice generated for order:", order.orderId);
  } catch (error) {
    console.error("Invoice generation failed:", error);
  }
}

const updateOrderStatus = async (order, status, itemIndex, declineReason) => {
  order.items[itemIndex].status = status;
  if (status === "Processed") {
    order.items[itemIndex].statusTimeline.processedAt = new Date();
  } else if (status === "Shipped") {
    order.items[itemIndex].statusTimeline.shippedAt = new Date();
  } else if (status === "Out for Delivery") {
    order.items[itemIndex].statusTimeline.outForDeliveryAt = new Date();
  } else if (status === "Delivered") {
    let payment = await Payment.findById(order.paymentId._id);
    order.items[itemIndex].statusTimeline.deliveredAt = new Date();
    if (order.paymentId.paymentMethod === "Cash on Delivery") {
      const discount = order.discount / order.items.length;
      let nonCancelledAmount = 0;
      let nonCancelledItems = order.items.filter((item) => !item.isCancelled);
      order.items.forEach((item) => {
        if (!item.isCancelled) {
          nonCancelledAmount += item.offerPrice * item.quantity - discount;
        }
      });

      const tax = nonCancelledAmount * 0.05;
      const shipping = order.shipping / nonCancelledItems.length;
      const total =
        Math.round(
          (nonCancelledAmount + tax + shipping * nonCancelledItems.length) * 100
        ) / 100;
      let deliveredTotal = 0;
      let deliveredItems = 0;
      order.items.forEach((item) => {
        if (item.statusTimeline.deliveredAt !== null) {
          deliveredTotal += item.offerPrice * item.quantity - discount;
          deliveredItems++;
        }
      });
      const deliveredTax = deliveredTotal * 0.05;
      const deliveredAmount =
        Math.round(
          (deliveredTotal + deliveredTax + shipping * deliveredItems) * 100
        ) / 100;
      payment.amountToBePaid = total - deliveredAmount;
      payment.amountPaid = deliveredAmount;
      payment.status = "Paid Partially";
      payment.paymentDate = new Date();
      if (
        nonCancelledItems.every(
          (item) => item.statusTimeline.deliveredAt !== null
        )
      ) {
        payment.status = "Paid Successfully";
      }
      await payment.save();
    }

    if (order.invoiceCreatedAt === null && order.invoiceUrl === null) {
      let nonCancelledItems = order.items.filter((item) => !item.isCancelled);
      let allDelivered = nonCancelledItems.every(
        (item) => item.statusTimeline.deliveredAt !== null
      );
      if (allDelivered) {
        setImmediate(() => generateAndUploadInvoice(order._id));
      }
    }
  } else if (status === "Return Request Approved") {
    let payment = await Payment.findById(order.paymentId._id);
    let wallet = await Wallet.findOne({ userId: order.userId });
    let discountDividedByItems = 0;
    if (order.discount > 0) {
      discountDividedByItems = order.discount / order.items.length;
    }
    let priceOfItem =
      order.items[itemIndex].offerPrice * order.items[itemIndex].quantity -
      discountDividedByItems;
    priceOfItem = Math.round(priceOfItem * 100) / 100;
    payment.amountRefunded += priceOfItem;
    order.items[itemIndex].return.approvedAt = new Date();
    order.items[itemIndex].return.refundedAt = new Date();
    wallet.walletBalance += priceOfItem;
    wallet.transactions.push({
      paymentId: payment._id,
      transactionType: "Credit",
      transactionReason: "Order Refund",
      transactionAmount: priceOfItem,
    });
    await wallet.save();
    await payment.save();
    const nonCancelledItems = order.items.filter((item) => !item.isCancelled);
    let everyItemReturned = nonCancelledItems.every(
      (item) => item.return.approvedAt !== null
    );
    if (everyItemReturned) {
      order.isReturned = true;
    }
  } else if (status === "Return Request Declined") {
    order.items[itemIndex].return.declineReason = declineReason;
    order.items[itemIndex].return.declinedAt = new Date();
  }

  await order.save();
};

const updateProductStock = async (
  order,
  itemIndex,
  productVariant,
  quantity
) => {
  const product = await Product.findOne({
    _id: order.items[itemIndex].productId,
  });
  product.variants[productVariant].stockQuantity += Number(quantity);
  order.items[itemIndex].return.productStockUpdated = true;
  await product.save();
  await order.save();
};
module.exports = {
  getOrdersForSearch,
  getOrders,
  getOrdersCount,
  getOrder,
  updateOrderStatus,
  updateProductStock,
  generateAndUploadInvoice,
};
