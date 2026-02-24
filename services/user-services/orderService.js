const Product = require("../../models/product.model.js");
const Wallet = require("../../models/wallet.model.js");
const Address = require("../../models/address.model.js");
const Cart = require("../../models/cart.model.js");
const Coupon = require("../../models/coupon.model.js");
const usedCoupon = require("../../models/usedCoupon.model.js");
const Order = require("../../models/order.model.js");
const Payment = require("../../models/payment.model.js");
const mongoose = require("mongoose");
const stripe = require("../../config/stripeConfig.js");
const { orderIdGenerator } = require("../../utils/orderIdGenerator.js");
require("dotenv").config();

const getCartItems = async (userId) => {
  const cartItems = await Cart.find({ userId: userId })
    .populate("productId")
    .populate("categoryId")
    .populate("brandId")
    .populate("productOfferId")
    .populate("categoryOfferId")
    .populate("couponApplied");
  return { cartItems };
};

const decreaseProductStock = async (item) => {
  let product = await Product.findById(item.productId);
  product.variants[item.variant].stockQuantity -= item.quantity;
  await product.save();
};

const placeOrder = async (
  user,
  bodyPrice,
  bodyOfferPrice,
  bodyPaymentMethod,
  bodyIsCouponApplied,
  bodyAddressId
) => {
  let message = null;
  let subTotal = 0;
  let grandTotal = 0;
  let shipping = 10;
  let tax = 0;
  const { cartItems } = await getCartItems(user._id);
  const lineItems = [];
  const items = [];
  const stockUnavailable = [];
  const now = new Date();
  for (let i = 0; i < cartItems.length; i++) {
    const productId = cartItems[i].productId._id;
    const productName = cartItems[i].productId.productName;
    const variant = cartItems[i].variant;
    const quantity = cartItems[i].quantity;
    const size = cartItems[i].productId.variants[variant].size;
    const color = cartItems[i].productId.variants[variant].color;
    const price = cartItems[i].productId.variants[variant].price;
    const productImage =
      cartItems[i].productId.variants[variant].productImages[0];
    const reqBodyPrice = Array.isArray(bodyPrice)
      ? Number(bodyPrice[i])
      : Number(bodyPrice);
    const reqBodyOfferPrice = Array.isArray(bodyOfferPrice)
      ? Number(bodyOfferPrice[i])
      : Number(bodyOfferPrice);
    let offerPrice = price;
    if (
      cartItems[i].productId.variants[variant].isBlocked === true ||
      cartItems[i].categoryId.isDeleted === true ||
      cartItems[i].brandId.isDeleted === true
    ) {
      message =
        "Some items in your cart are unavailable. Please remove them to continue";
      return { success: false, message, redirect: "/cart" };
    }

    if (
      cartItems[i].productId.variants[variant].stockQuantity > 0 &&
      cartItems[i].productId.variants[variant].stockQuantity < quantity
    ) {
      stockUnavailable.push(
        `${productName}-${size} has only Limited Stock, The maximum quantity you can order is ${cartItems[i].productId.variants[variant].stockQuantity}, Please update the quantity in cart and proceed to Checkout_`
      );
    } else if (
      cartItems[i].productId.variants[variant].stockQuantity === 0 ||
      cartItems[i].productId.variants[variant].stockQuantity === "Out of Stock"
    ) {
      message =
        "Some items in your cart are Out of Stock. Please remove them to continue";
      return { success: false, message, redirect: "/cart" };
    }

    if (stockUnavailable.length > 0) {
      message = stockUnavailable;
      return { success: false, message, redirect: "/cart" };
    }

    let productOfferPrice = null;
    let categoryOfferPrice = null;

    const productOffer =
      cartItems[i].productOfferId &&
      cartItems[i].productOfferId.startDate <= now &&
      cartItems[i].productOfferId.endDate >= now
        ? cartItems[i].productOfferId
        : null;

    const categoryOffer =
      cartItems[i].categoryOfferId &&
      cartItems[i].categoryOfferId.startDate <= now &&
      cartItems[i].categoryOfferId.endDate >= now
        ? cartItems[i].categoryOfferId
        : null;

    if (productOffer) {
      if (productOffer.discountType === "percentage") {
        productOfferPrice = price - (price * productOffer.discountValue) / 100;
      } else if (productOffer.discountType === "flat") {
        productOfferPrice = price - productOffer.discountValue;
      }
    }

    if (categoryOffer) {
      if (categoryOffer.discountType === "percentage") {
        const percentPrice =
          price - (price * categoryOffer.discountValue) / 100;

        const maxPrice = price - categoryOffer.maxDiscountAmount;

        categoryOfferPrice = Math.max(percentPrice, maxPrice);
      } else if (categoryOffer.discountType === "flat") {
        if (price > categoryOffer.productMinPrice) {
          categoryOfferPrice = price - categoryOffer.discountValue;
        }
      }
    }

    if (productOfferPrice !== null && categoryOfferPrice !== null) {
      offerPrice = Math.min(productOfferPrice, categoryOfferPrice);
    } else if (productOfferPrice !== null) {
      offerPrice = productOfferPrice;
    } else if (categoryOfferPrice !== null) {
      offerPrice = categoryOfferPrice;
    }

    if (reqBodyPrice !== price) {
      message =
        "Prices may have changed, Please verify it and proceed to checkout";
      return { success: false, message, redirect: "/cart" };
    }

    if (reqBodyOfferPrice !== offerPrice) {
      message =
        "Offers may have changed, Please verify it and proceed to checkout";
      return { success: false, message, redirect: "/cart" };
    }

    subTotal += offerPrice * quantity;
    if (bodyPaymentMethod === "Pay with Stripe") {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: { name: productName },
          unit_amount: Math.round(Number(offerPrice.toFixed(2)) * 100),
        },
        quantity: quantity,
        tax_rates: [process.env.STRIPE_TAX_ID],
      });
    }
    items.push({
      productId: productId,
      productName: productName,
      variant: variant,
      quantity: quantity,
      color: color,
      size: size,
      price: price,
      offerPrice: offerPrice,
      productImage: productImage,
    });
  }
  let discountAmount = 0;
  let stripeCoupon = null;
  let userUsedCoupon = null;
  if (JSON.parse(bodyIsCouponApplied) === true) {
    if (
      cartItems[0]?.couponApplied !== null &&
      subTotal >= cartItems[0]?.couponApplied.minAmount
    ) {
      if (cartItems[0]?.couponApplied.endDate >= now) {
        if (cartItems[0]?.couponApplied.discountType === "percentage") {
          discountAmount =
            (subTotal * cartItems[0]?.couponApplied.discountValue) / 100;
          if (discountAmount > cartItems[0]?.couponApplied.maxDiscountAmount) {
            discountAmount = cartItems[0]?.couponApplied.maxDiscountAmount;
          }
        } else {
          discountAmount = cartItems[0]?.couponApplied.discountValue;
        }
        if (cartItems[0].couponApplied.name === "REFERRALCOUPON") {
          await Coupon.deleteOne({ _id: cartItems[0].couponApplied._id });
        } else {
          userUsedCoupon = new usedCoupon({
            couponId: cartItems[0].couponApplied._id,
            userId: user._id,
          });
        }
      } else {
        if (cartItems[0].couponApplied.name === "REFERRALCOUPON") {
          await Coupon.deleteOne({ _id: cartItems[0].couponApplied._id });
          await Cart.updateMany({ userId: user._id }, { couponApplied: null });
        } else {
          await Cart.updateMany({ userId: user._id }, { couponApplied: null });
        }
        message =
          "Coupon expired. Select another coupon or proceed to checkout.";
        return { success: false, message, redirect: "/cart" };
      }

      if (bodyPaymentMethod === "Pay with Stripe") {
        stripeCoupon = await stripe.coupons.create({
          amount_off: Math.round(Number(discountAmount.toFixed(2)) * 100),
          duration: "once",
          currency: "usd",
          name: cartItems[0]?.couponApplied.name,
        });
      }
    }
  }
  tax = (subTotal - discountAmount) * 0.05;
  grandTotal =
    Math.round((subTotal - discountAmount + tax + shipping) * 100) / 100;
  if (bodyPaymentMethod === "Cash on Delivery") {
    if (grandTotal > 100) {
      message =
        "Order amount greater than $100 will not be eligible for Cash on Delivery";
      return { success: false, message, redirect: "/checkout" };
    }
  }

  let address = await Address.findOne({ _id: bodyAddressId });
  let addressObj = {
    firstName: address.firstName,
    lastName: address.lastName,
    country: address.country,
    state: address.state,
    city: address.city,
    address: address.address,
    pincode: address.pincode,
    mobileNo: address.mobileNo,
  };

  let order = new Order({
    orderId: orderIdGenerator(),
    userId: user._id,
    address: addressObj,
    items: items,
    subTotal: subTotal,
    shipping: shipping,
    tax: tax,
    discount: discountAmount,
    couponCode: discountAmount > 0 ? cartItems[0].couponApplied.name : null,
    grandTotal: grandTotal,
    paymentId: null,
  });
  let confirmedOrder = await order.save();
  let payment = new Payment({
    userId: user._id,
    orderId: confirmedOrder._id,
    amountToBePaid: grandTotal,
    amountPaid: 0,
    paymentMethod: bodyPaymentMethod,
    status: "Pending",
    relatedTo: "Order",
  });
  if (userUsedCoupon !== null) {
    await userUsedCoupon.save();
  }
  let savedPayment = await payment.save();
  confirmedOrder.paymentId = savedPayment._id;
  await confirmedOrder.save();
  if (bodyPaymentMethod === "Cash on Delivery") {
    for (let j = 0; j < items.length; j++) {
      await decreaseProductStock(items[j]);
    }
    await Cart.deleteMany({ userId: user._id });
    confirmedOrder = await Order.findOne({ _id: confirmedOrder._id }).populate(
      "paymentId"
    );

    return {
      success: true,
      redirect: `/order-confirmation/${confirmedOrder._id}`,
    };
  } else if (bodyPaymentMethod === "Pay with Stripe") {
    try {
      let startDate = new Date();
      savedPayment.orderWillBeCancelledAt = new Date(
        startDate.getTime() + 48 * 60 * 60 * 1000
      );
      confirmedOrder.willBeCancelledAt = new Date(
        startDate.getTime() + 48 * 60 * 60 * 1000
      );
      await confirmedOrder.save();
      await savedPayment.save();
      const sessionConfig = {
        mode: "payment",
        line_items: lineItems,
        shipping_options: [
          {
            shipping_rate_data: {
              type: "fixed_amount",
              fixed_amount: { amount: 1000, currency: "usd" },
              display_name: "Ground Shipping",
              delivery_estimate: {
                minimum: { unit: "business_day", value: 5 },
                maximum: { unit: "business_day", value: 7 },
              },
            },
          },
        ],
        success_url: `https://novamart.click/checkout/payment-processing/${confirmedOrder._id}`,
        cancel_url: `https://novamart.click/order-confirmation/${confirmedOrder._id}?paymentId=${savedPayment._id}&status=Cancelled`,
        customer_email: user.email,
        metadata: {
          user: user._id.toString(),
          payment: savedPayment._id.toString(),
          for: "Order",
        },
        payment_intent_data: {
          metadata: {
            user: user._id.toString(),
            payment: savedPayment._id.toString(),
            for: "Order",
          },
        },
      };

      // Add discount only if valid
      if (stripeCoupon !== null && bodyPaymentMethod === "Pay with Stripe") {
        sessionConfig.discounts = [{ coupon: stripeCoupon.id }];
      }
      await Cart.deleteMany({ userId: user._id });
      const session = await stripe.checkout.sessions.create(sessionConfig);
      return { success: true, redirect: session.url };
    } catch (error) {
      console.log(error);
    }
  } else if (bodyPaymentMethod === "Pay with NovaWallet") {
    let wallet = await Wallet.findOne({
      userId: new mongoose.Types.ObjectId(user._id),
    });
    if (wallet.walletBalance < confirmedOrder.grandTotal) {
      await Order.findByIdAndDelete(confirmedOrder._id);
      await Payment.findByIdAndUpdate(savedPayment._id, {
        status: "Payment Failed",
      });
      message =
        "Insufficient Balance in NovaWallet, Please Top-up the wallet or Pay with Card";
      return { success: false, message, redirect: "/checkout" };
    }

    wallet.walletBalance -= savedPayment.amountToBePaid;
    wallet.transactions.push({
      paymentId: savedPayment._id,
      transactionType: "Debit",
      transactionReason: "Novamart Purchase",
      transactionAmount: savedPayment.amountToBePaid,
    });

    savedPayment.amountPaid = savedPayment.amountToBePaid;
    savedPayment.amountToBePaid = 0;
    savedPayment.status = "Paid Successfully";
    savedPayment.paymentDate = new Date();
    await savedPayment.save();
    await wallet.save();
    for (let j = 0; j < items.length; j++) {
      await decreaseProductStock(items[j]);
    }
    await Cart.deleteMany({ userId: user._id });
    confirmedOrder = await Order.findOne({ _id: confirmedOrder._id }).populate(
      "paymentId"
    );
    return {
      success: true,
      redirect: `/order-confirmation/${confirmedOrder._id}`,
    };
  }
};

const retryPayment = async (user, id) => {
  const lineItems = [];
  const order = await Order.findById(id);
  for (let i = 0; i < order.items.length; i++) {
    if (!order.items[i].isCancelled) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: { name: order.items[i].productName },
          unit_amount: order.items[i].offerPrice * 100,
        },
        quantity: order.items[i].quantity,
        tax_rates: [process.env.STRIPE_TAX_ID],
      });
    }
  }
  let coupon = null;
  if (order.discount > 0) {
    coupon = await stripe.coupons.create({
      amount_off: Math.round(Number(order.discount.toFixed(2)) * 100),
      duration: "once",
      currency: "usd",
      name: order.couponCode,
    });
  }

  const sessionConfig = {
    mode: "payment",
    line_items: lineItems,
    shipping_options: [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: { amount: 1000, currency: "usd" },
          display_name: "Ground Shipping",
          delivery_estimate: {
            minimum: { unit: "business_day", value: 5 },
            maximum: { unit: "business_day", value: 7 },
          },
        },
      },
    ],
    success_url: `https://novamart.click/checkout/payment-processing/${order._id}`,
    cancel_url: `https://novamart.click/order-confirmation/${order._id}?paymentId=${order.paymentId}&status=Cancelled`,
    customer_email: user.email,
    metadata: {
      payment: order.paymentId.toString(),
      for: "Order",
    },
    payment_intent_data: {
      metadata: {
        payment: order.paymentId.toString(),
        for: "Order",
      },
    },
  };
  if (coupon !== null) {
    sessionConfig.discounts = [{ coupon: coupon.id }];
  }

  return await stripe.checkout.sessions.create(sessionConfig);
};
const getOrdersStatus = async (orders) => {
  const statuses = [];
  for (let i = 0; i < orders.length; i++) {
    const items = orders[i].items.filter((item) => item.status !== "Cancelled");
    const statusesList = items.map((item) => item.status);
    const all = (status) => statusesList.every((s) => s === status);
    const some = (status) => statusesList.some((s) => s === status);

    if (items.length === 0) {
      statuses.push("Cancelled");
    } else if (all("Return Requested")) {
      statuses.push("Return Requested");
    } else if (all("Return Request Approved")) {
      statuses.push("Returned");
    } else if (all("Return Request Declined")) {
      statuses.push("Return Declined");
    } else if (some("Return Requested") || some("Return Request Approved")) {
      statuses.push("Partially Returned");
    } else if (all("Delivered")) {
      statuses.push("Delivered");
    } else if (some("Delivered")) {
      statuses.push("Partially Delivered");
    } else if (all("Out for Delivery")) {
      statuses.push("Out for Delivery");
    } else if (some("Shipped") || some("Out for Delivery")) {
      statuses.push("Partially Shipped");
    } else if (all("Processed")) {
      statuses.push("Processed");
    } else if (some("Processed")) {
      statuses.push("Partially Processed");
    } else if (all("Placed")) {
      statuses.push("Placed");
    }
  }
  return statuses;
};

module.exports = {
  placeOrder,
  getOrdersStatus,
  getCartItems,
  retryPayment,
};
