const cron = require("node-cron");
const Order = require("../models/order.model.js");
const Payment = require("../models/payment.model.js");
const Product = require("../models/product.model.js");

cron.schedule("*/10 * * * *", async () => {
  const expiredOrders = await Order.find({
    willBeCancelledAt: { $lte: new Date() },
  });
  for (let i = 0; i < expiredOrders.length; i++) {
    const order = await Order.findById(expiredOrders[i]._id);
    const payment = await Payment.findById(expiredOrders[i].paymentId);
    if (
      payment.paymentMethod === "Pay with Stripe" &&
      (payment.status === "Pending" || payment.status === "Payment Failed")
    ) {
      for (const item of order.items) {
        await Product.updateOne(
          { _id: item.productId },
          {
            $inc: {
              [`variants.${item.variant}.stockQuantity`]: item.quantity,
            },
          }
        );

        item.isCancelled = true;
        item.status = "Cancelled";
        item.statusTimeline.cancelledAt = new Date();
      }
    }
    payment.amountToBePaid = order.grandTotal;
    payment.status = "Order Cancelled";

    order.isCancelled = true;
    order.willBeCancelledAt = null;

    await order.save();
    await payment.save();
  }
});
