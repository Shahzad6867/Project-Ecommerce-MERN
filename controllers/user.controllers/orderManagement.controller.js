const Product = require("../../models/product.model.js");
const Wallet = require("../../models/wallet.model.js");
const Address = require("../../models/address.model.js");
const Cart = require("../../models/cart.model.js");
const Wishlist = require("../../models/wishlist.model.js");
const Order = require("../../models/order.model.js");
const Payment = require("../../models/payment.model.js");
const mongoose = require("mongoose");
const cloudinary = require("../../config/cloudinaryConfig.js");
const stripe = require("../../config/stripeConfig.js");
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const orderService = require("../../services/user-services/orderService.js");
const adminOrderService = require("../../services/admin-services/ordersService.js");

const getCheckout = async (req, res) => {
  let user = req.session.user || req.user;
  let message = req.session.message || null;
  delete req.session.message;

  const productsFullList = await Product.find(
    {},
    { productName: 1, variants: 1, categoryId: 1 }
  ).populate("categoryId", "categoryName");
  const cartItems = await Cart.find({ userId: user._id })
    .populate("productId")
    .populate("categoryId")
    .populate("brandId")
    .populate("productOfferId")
    .populate("categoryOfferId")
    .populate("couponApplied");
  for (let i = 0; i < cartItems.length; i++) {
    if (
      cartItems[i].productId.variants[cartItems[i].variant].isBlocked ||
      cartItems[i].categoryId.isDeleted ||
      cartItems[i].brandId.isDeleted
    ) {
      req.session.message =
        "Some items in your cart are unavailable. Please remove them to continue";
      return res.redirect("/cart");
    } else if (
      cartItems[i].productId.variants[cartItems[i].variant].stockQuantity ===
        0 ||
      cartItems[i].productId.variants[cartItems[i].variant].stockStatus ===
        "Out of Stock"
    ) {
      req.session.message =
        "Some items in your cart are Out of Stock. Please remove them to continue";
      return res.redirect("/cart");
    }
  }
  const wishlistItemsCount = await Wishlist.find({
    userId: user._id,
  }).countDocuments();
  const address = await Address.find({ userId: user._id, isDefault: false });
  const defaultAddress = await Address.findOne({
    userId: user._id,
    isDefault: true,
  });
  const search = req.query.search || null;
  res.render("user-view/user.checkout-page.ejs", {
    user,
    productsFullList,
    cartItems,
    address,
    defaultAddress,
    message,
    wishlistItemsCount,
    search,
  });
};

const placeOrder = async (req, res) => {
  let user = req.session.user || req.user;
  const response = await orderService.placeOrder(
    user,
    req.body.price,
    req.body.offerPrice,
    req.body.paymentMethod,
    req.body.isCouponApplied,
    req.body.addressId
  );
  if (!response.success) {
    req.session.message = response.message;
    return res.redirect(response.redirect);
  }

  return res.redirect(response.redirect);
};
const retryPayment = async (req, res) => {
  try {
    const user = req.session.user || req.user;

    const { id } = req.params;
    const session = await orderService.retryPayment(user, id);
    return res.redirect(session.url);
  } catch (error) {
    console.log(error);
  }
};
const getPaymentProcessingPage = async (req, res) => {
  const { id } = req.params;
  res.render("user-view/payment-processing.ejs", {
    orderId: id,
    paymentId: null,
  });
};
const getPaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    const payment = await Payment.findById(order.paymentId);
    if (payment.status === "Payment Failed") {
      return res.status(402).json({
        success: false,
        messsage: payment.status,
      });
    } else if (payment.status === "Paid Successfully") {
      return res.status(200).json({
        success: true,
        messsage: payment.status,
      });
    } else {
      return res.json({
        messsage: payment.status,
      });
    }
  } catch (error) {
    console.log(error);
  }
};
const getOrderConfirmationPage = async (req, res) => {
  const { id } = req.params;
  if (req.query?.paymentId && req.query?.status === "Cancelled") {
    await Payment.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(req.query.paymentId) },
      { $set: { status: "Payment Failed" } }
    );
  }
  let user = req.session.user || req.user;
  const confirmedOrder = await Order.findOne({
    _id: new mongoose.Types.ObjectId(id),
  }).populate("paymentId");
  const productsFullList = await Product.find(
    {},
    { productName: 1, variants: 1, categoryId: 1 }
  ).populate("categoryId", "categoryName");
  const cartItems = await Cart.find({ userId: user._id })
    .populate("productId")
    .populate("productOfferId")
    .populate("categoryOfferId");
  const wishlistItemsCount = await Wishlist.find({
    userId: user._id,
  }).countDocuments();
  const search = req.query.search || null;
  return res.render("user-view/order-confirmation-page.ejs", {
    user,
    confirmedOrder,
    productsFullList,
    cartItems,
    wishlistItemsCount,
    search,
  });
};

const getOrders = async (req, res) => {
  try {
    let user = req.session.user || req.user;
    const productsFullList = await Product.find(
      {},
      { productName: 1, variants: 1, categoryId: 1 }
    ).populate("categoryId", "categoryName");
    const cartItems = await Cart.find({ userId: user._id })
      .populate("productId")
      .populate("productOfferId")
      .populate("categoryOfferId");

    const orders = await Order.find({
      userId: new mongoose.Types.ObjectId(user._id),
    })
      .sort({ createdAt: -1 })
      .populate("paymentId");
    const ordersStatus = await orderService.getOrdersStatus(orders);
    const wishlistItemsCount = await Wishlist.find({
      userId: user._id,
    }).countDocuments();
    const search = req.query.search || null;
    res.render("user-view/user.orders-listing.ejs", {
      user,
      productsFullList,
      cartItems,
      orders,
      wishlistItemsCount,
      ordersStatus,
      search,
    });
  } catch (error) {
    console.log(error);
  }
};

const getOrderDetailPage = async (req, res) => {
  let user = req.session.user || req.user;
  const productsFullList = await Product.find(
    {},
    { productName: 1, variants: 1, categoryId: 1 }
  ).populate("categoryId", "categoryName");
  const cartItems = await Cart.find({ userId: user._id })
    .populate("productId")
    .populate("productOfferId")
    .populate("categoryOfferId");
  const order = await Order.findOne({ _id: req.params.id }).populate(
    "paymentId"
  );
  const wishlistItemsCount = await Wishlist.find({
    userId: user._id,
  }).countDocuments();
  const search = req.query.search || null;
  let message = req.session.message || null;
  delete req.session.message;
  res.render("user-view/user.order-details-page.ejs", {
    user,
    productsFullList,
    cartItems,
    order,
    wishlistItemsCount,
    message,
    search,
  });
};

const cancelItem = async (req, res) => {
  try {
    let orderId = req.params.id;
    let itemId = req.query.item;
    let user = req.session.user || req.user;
    let order = await Order.findOne({ _id: orderId });
    let payment = await Payment.findOne({ _id: order.paymentId });

    let everyItemCancelled = 0;
    for (let i = 0; i < order.items.length; i++) {
      if (String(order.items[i]._id) === String(itemId)) {
        if (order.items[i].status !== "Placed") {
          return res.status(409).json({
            success: false,
            message: `Cannot cancel the Order, Current Status : ${order.items[i].status}`,
          });
        }
        let amount = 0;
        if (order.discount > 0) {
          let discountDividedByItems = order.discount / order.items.length;
          amount =
            order.items[i].offerPrice * order.items[i].quantity -
            discountDividedByItems;
        } else {
          amount = order.items[i].offerPrice * order.items[i].quantity;
        }
        amount = Number(amount.toFixed(2));
        let product = await Product.findOne({ _id: order.items[i].productId });
        product.variants[order.items[i].variant].stockQuantity +=
          order.items[i].quantity;
        if (
          payment.paymentMethod === "Pay with NovaWallet" &&
          order.items[i].isCancelled === false &&
          payment.status !== "Pending" &&
          payment.status !== "Payment Failed"
        ) {
          let wallet = await Wallet.findOne({ userId: user._id });
          wallet.walletBalance += amount;
          wallet.transactions.push({
            paymentId: payment._id,
            transactionType: "Credit",
            transactionReason: "Order Refund",
            transactionAmount: amount,
          });
          await wallet.save();
          payment.amountRefunded += amount;
          order.items[i].refundOnCancelled = {
            refundId: null,
            amount: amount,
            status: "Refunded",
            refundedAt: new Date(),
          };
        } else if (
          payment.paymentMethod === "Pay with Stripe" &&
          order.items[i].isCancelled === false &&
          payment.status !== "Pending" &&
          payment.status !== "Payment Failed"
        ) {
          payment.amountToBeRefunded += amount;
          let refund = await stripe.refunds.create({
            payment_intent: payment.paymentIntentId,
            amount: Math.round(amount * 100),
            reason: "requested_by_customer",
          });

          order.items[i].refundOnCancelled = {
            refundId: refund.id,
            amount: amount,
            status: "Initiated",
            refundedAt: null,
          };
        }

        order.items[i].isCancelled = true;
        order.items[i].status = "Cancelled";
        order.items[i].statusTimeline.cancelledAt = new Date();

        if (payment.paymentMethod === "Cash on Delivery") {
          const discount = order.discount / order.items.length;
          let amountOfItemsNotCancelled = 0;
          if (order.discount > 0) {
            for (let i = 0; i < order.items.length; i++) {
              if (
                !order.items[i].isCancelled &&
                order.items[i].statusTimeline.deliveredAt === null
              ) {
                amountOfItemsNotCancelled +=
                  order.items[i].offerPrice * order.items[i].quantity -
                  discount;
              }
            }
          }
          const subTotal = amountOfItemsNotCancelled;
          const tax = subTotal * 0.05;
          const shipping = amountOfItemsNotCancelled > 0 ? order.shipping : 0;
          const amountToBePaid =
            Math.round((subTotal + tax + shipping) * 100) / 100;
          payment.amountToBePaid = amountToBePaid;
          let nonCancelledItems = order.items.filter(
            (item) => !item.isCancelled
          );
          if (
            nonCancelledItems.every(
              (item) => item.statusTimeline.deliveredAt !== null
            )
          ) {
            payment.status = "Paid Successfully";
          }
        }

        await product.save();
        await order.save();
        await payment.save();
      }
      if (order.items[i].isCancelled === true) {
        everyItemCancelled++;
      }
    }
    if (everyItemCancelled === order.items.length) {
      order.isCancelled = true;
      order.willBeCancelledAt = null;
      payment.status = "Order Cancelled";
      payment.amountToBePaid = 0;
      payment.orderWillBeCancelledAt = null;
      await order.save();
      await payment.save();
    }
    order = await Order.findById(order._id);
    let nonCancelledItems = order.items.filter((item) => !item.isCancelled);
    if (order.invoiceCreatedAt === null && order.invoiceUrl === null) {
      let allDelivered = nonCancelledItems.every(
        (item) => item.statusTimeline.deliveredAt !== null
      );
      if (allDelivered) {
        setImmediate(() =>
          adminOrderService.generateAndUploadInvoice(order._id)
        );
      }
    }
    req.session.message =
      "Item has been successfully cancelled.<br>Any applicable refund will be processed according to our refund policy.";
    return res.status(200).json({
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};

const cancelOrder = async (req, res) => {
  let orderId = req.params.id;
  let order = await Order.findOne({ _id: orderId });
  let payment = await Payment.findOne({ _id: order.paymentId });
  let user = req.session.user || req.user;
  let wallet = await Wallet.findOne({ userId: user._id });
  if (order.items.every((item) => item.statusTimeline.processedAt === null)) {
    let sumOfAmounts = 0;
    for (let i = 0; i < order.items.length; i++) {
      let amount = 0;
      if (
        order.items[i].isCancelled === false &&
        (payment.paymentMethod === "Pay with NovaWallet" ||
          payment.paymentMethod === "Pay with Stripe")
      ) {
        if (order.discount > 0) {
          let discountDividedByItems = order.discount / order.items.length;
          amount +=
            order.items[i].offerPrice * order.items[i].quantity -
            discountDividedByItems;
        } else {
          amount += order.items[i].offerPrice * order.items[i].quantity;
        }
        const nonCancelledItems = order.items.filter(
          (item) => !item.isCancelled
        );
        const taxPerItem = order.tax / nonCancelledItems.length;
        const shippingPerItem = order.shipping / nonCancelledItems.length;
        amount = Number((amount + taxPerItem + shippingPerItem).toFixed(2));
        sumOfAmounts += amount;
        order.items[i].refundOnCancelled = {
          refundId: null,
          amount: amount,
          status: "Initiated",
          refundedAt: null,
        };
        let product = await Product.findOne({ _id: order.items[i].productId });
        product.variants[order.items[i].variant].stockQuantity +=
          order.items[i].quantity;
        await product.save();
      }
      if (
        order.items[i].isCancelled === false &&
        payment.paymentMethod === "Cash on Delivery"
      ) {
        order.items[i].isCancelled = true;
        order.items[i].status = "Cancelled";
        order.items[i].statusTimeline.cancelledAt = new Date();

        let product = await Product.findOne({ _id: order.items[i].productId });
        product.variants[order.items[i].variant].stockQuantity +=
          order.items[i].quantity;
        await product.save();
      }
    }
    if (
      payment.paymentMethod === "Pay with Stripe" &&
      payment.status !== "Pending" &&
      payment.status !== "Payment Failed"
    ) {
      payment.amountToBeRefunded += sumOfAmounts;
      let refund = await stripe.refunds.create({
        payment_intent: payment.paymentIntentId,
        amount: Math.round(sumOfAmounts * 100),
        reason: "requested_by_customer",
      });
      order.items.forEach((item) => {
        if (item.isCancelled === false) {
          item.refundOnCancelled.refundId = refund.id;
          item.isCancelled = true;
          item.status = "Cancelled";
          item.statusTimeline.cancelledAt = new Date();
        }
      });
    }

    if (
      payment.paymentMethod === "Pay with NovaWallet" &&
      payment.status !== "Pending" &&
      payment.status !== "Payment Failed"
    ) {
      wallet.walletBalance += sumOfAmounts;
      wallet.transactions.push({
        paymentId: payment._id,
        transactionType: "Credit",
        transactionReason: "Order Refund",
        transactionAmount: sumOfAmounts,
      });
      await wallet.save();
      payment.amountRefunded += sumOfAmounts;
      for (let i = 0; i < order.items.length; i++) {
        if (order.items[i].isCancelled === false) {
          order.items[i].refundOnCancelled.status = "Refunded";
          order.items[i].refundOnCancelled.refundedAt = new Date();
          order.items[i].isCancelled = true;
          order.items[i].status = "Cancelled";
          order.items[i].statusTimeline.cancelledAt = new Date();
        }
      }
    }

    payment.amountToBePaid = 0;
    payment.status = "Order Cancelled";
    payment.orderWillBeCancelledAt = null;
    order.isCancelled = true;
    order.willBeCancelledAt = null;
    await order.save();
    await payment.save();

    req.session.message =
      "Order has been successfully cancelled.<br>Any applicable refund will be processed according to our refund policy.";
    return res.status(200).json({
      success: true,
    });
  } else {
    return res.status(409).json({
      success: false,
      message:
        "Order cannot be cancelled as some items are already being processed.",
    });
  }
};

const reorder = async (req, res) => {
  try {
    let availablity = [];
    const { orderId } = req.query;
    let user = req.session.user || req.user;
    let order = await Order.findById(orderId);
    for (let i = 0; i < order.items.length; i++) {
      const product = await Product.findById(order.items[i].productId);
      let stock = product.variants[order.items[i].variant].stockQuantity;
      if (!product.isDeleted) {
        if (
          stock === 0 ||
          product.variants[order.items[i].variant].stockStatus ===
            "Out of Stock"
        ) {
          product.variants[order.items[i].variant].stockStatus = "Out of Stock";
          await product.save();
          availablity.push(
            `${product.productName}${order.items[i].size} is Out of Stock_`
          );
        } else if (order.items[i].quantity > stock) {
          availablity.push(
            `${product.productName}${order.items[i].size} has Limited Quantity, The maximum you can order is ${stock}_`
          );
          const cartItem = new Cart({
            userId: user._id,
            productId: order.items[i].productId,
            categoryId: product.categoryId,
            variant: order.items[i].variant,
            quantity: stock,
          });
          await cartItem.save();
        } else {
          const cartItem = new Cart({
            userId: user._id,
            productId: order.items[i].productId,
            categoryId: product.categoryId,
            variant: order.items[i].variant,
            quantity: order.items[i].quantity,
          });
          await cartItem.save();
        }
      } else {
        availablity.push(
          `${product.productName}${order.items[i].size} is Unavailable_`
        );
      }
    }
    if (availablity.length > 0) {
      req.session.message = availablity;
    }

    return res.status(200).json({
      success: true,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Oops! something went wrong from our side",
    });
  }
};

const getInvoice = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    const downloadUrl = cloudinary.utils.private_download_url(
      order.invoicePublicId,
      "pdf",
      {
        resource_type: "raw",
        expires_at: Math.floor(Date.now() / 1000) + 300,
      }
    );
    res.status(200).json({
      downloadUrl,
    });
  } catch (error) {
    console.log(error);
    res.redirect("/orders");
  }
};

const returnOrder = async (req, res) => {
  try {
    const { id } = req.params;
    let order = await Order.findById(id);
    if (!req.file) {
      req.session.message = "Please provide proof for Return Request";
      return res.redirect(`/orders/${id}`);
    }
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "return-order-proofs",
      resource_type: "image",
    });
    fs.unlinkSync(path.resolve(req.file.path));
    for (let i = 0; i < order.items.length; i++) {
      if (
        order.items[i].isCancelled === false &&
        order.items[i].return.isRequested === false
      ) {
        order.items[i].status = "Return Requested";
        order.items[i].return.isRequested = true;
        order.items[i].return.reason = req.body.returnReason;
        order.items[i].return.proof = result.secure_url;
        order.items[i].return.requestedAt = new Date();
      }
    }
    order.isReturned = true;
    await order.save();
    return res.redirect(`/orders/${id}`);
  } catch (error) {
    console.log(error);
  }
};

const returnItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { itemIndex } = req.query;
    let order = await Order.findById(id);
    if (!req.file) {
      req.session.message = "Please provide proof for Return Request";
      return res.redirect(`/orders/${id}`);
    }
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "return-order-proofs",
      resource_type: "image",
    });
    fs.unlinkSync(path.resolve(req.file.path));
    order.items[itemIndex].status = "Return Requested";
    order.items[itemIndex].return.isRequested = true;
    order.items[itemIndex].return.reason = req.body.returnReason;
    order.items[itemIndex].return.requestedAt = new Date();
    order.items[itemIndex].return.proof = result.secure_url;

    await order.save();
    res.redirect(`/orders/${id}`);
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  getCheckout,
  placeOrder,
  getOrders,
  getOrderDetailPage,
  cancelItem,
  cancelOrder,
  reorder,
  getInvoice,
  returnOrder,
  returnItem,
  getOrderConfirmationPage,
  getPaymentStatus,
  retryPayment,
  getPaymentProcessingPage,
};
