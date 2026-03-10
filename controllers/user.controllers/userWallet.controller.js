const mongoose = require("mongoose");
const Cart = require("../../models/cart.model");
const Wishlist = require("../../models/wishlist.model");
const Product = require("../../models/product.model");
const stripe = require("../../config/stripeConfig.js");
const Wallet = require("../../models/wallet.model.js");
const Payment = require("../../models/payment.model.js");
const HTTP_STATUS = require("../../constants/httpStatus.js");
require("dotenv").config();

const getWallet = async (req, res, next) => {
  let message = req.session.message || null;
  delete req.session.message;
  const productsFullList = await Product.find(
    {},
    { productName: 1, variants: 1, categoryId: 1 }
  ).populate("categoryId", "categoryName");
  const user = req.session.user || req.user;
  const cartItems = await Cart.find({ userId: user._id })
    .populate("productId")
    .populate("productOfferId")
    .populate("categoryOfferId");
  const cartItemsCount = await Cart.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(user._id) } },
    { $group: { _id: "$userId", totalQuantity: { $sum: "$quantity" } } },
  ]);
  const wishlistItemsCount = await Wishlist.find({
    userId: user._id,
  }).countDocuments();
  let wallet = await Wallet.find({ userId: user._id });
  if (wallet[0].transactions.length > 0) {
    wallet = await Wallet.aggregate([
      {
        $match: {
          userId: wallet[0].userId,
        },
      },
      {
        $unwind: "$transactions",
      },
      {
        $lookup: {
          from: "payments",
          localField: "transactions.paymentId",
          foreignField: "_id",
          as: "transactions.paymentId",
        },
      },
      {
        $unwind:  {
          path: "$transactions.paymentId",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "orders",
          localField: "transactions.paymentId.orderId",
          foreignField: "_id",
          as: "transactions.paymentId.order",
        },
      },
      {
        $unwind: {
          path: "$transactions.paymentId.order",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: "$userId",
          walletBalance: { $first: "$walletBalance" },
          transactions: { $push: "$transactions" },
        },
      },
    ]);
  }
  const search = req.query.search || null;
  res.status(HTTP_STATUS.OK).render("user-view/user.wallet.ejs", {
    message,
    user,
    cartItems,
    cartItemsCount,
    productsFullList,
    wallet: wallet[0],
    wishlistItemsCount,
    search,
  });
};

const walletTopUp = async (req, res, next) => {
  let user = req.session.user || req.user;
  let payment = new Payment({
    userId: user._id,
    amountToBePaid: req.body.amount,
    paymentMethod: "Pay with Stripe",
    status: "Pending",
    relatedTo: "Wallet",
  });
  payment = await payment.save();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: "Wallet Top-up" },
          unit_amount: (Math.round(req.body.amount * 100) / 100) * 100,
        },
        quantity: 1,
      },
    ],
    success_url: process.env.APP_BASE_URL+`/payment-processing/${payment._id}`,
    cancel_url: process.env.APP_BASE_URL+`/payment-failed/${payment._id}`,
    customer_email: user.email,
    metadata: {
      payment: payment._id.toString(),
      for: "Wallet",
    },
    payment_intent_data: {
      metadata: {
        payment: payment._id.toString(),
        for: "Wallet",
      },
    },
  });
  return res.redirect(session.url);
};
const getPaymentStatus = async (req, res, next) => {
  const { id } = req.params;
  const payment = await Payment.findById(id);

  return res.status(HTTP_STATUS.OK).json({
    message: payment.status,
  });
};
const getPaymentProcessingPage = async (req, res, next) => {
  const { id } = req.params;
  const orderId = null;
  res.status(HTTP_STATUS.OK).render("user-view/payment-processing.ejs", { paymentId: id, orderId });
};
const getPaymentSuccesful = async (req, res, next) => {
  res.status(HTTP_STATUS.OK).render("user-view/payment-successful.ejs");
};

const getPaymentFailed = async (req, res, next) => {
  const { id } = req.params;
  const payment = await Payment.findById(id);
  if (payment.status !== "Payment Failed") {
    payment.status = "Payment Failed";
    await payment.save();
  }
  res.status(HTTP_STATUS.PAYMENT_REQUIRED).render("user-view/payment-failed.ejs");
};
module.exports = {
  getWallet,
  walletTopUp,
  getPaymentStatus,
  getPaymentSuccesful,
  getPaymentFailed,
  getPaymentProcessingPage,
};
