const mongoose = require("mongoose");
const { Schema } = mongoose;

const usedCouponSchema = Schema({
  couponId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Coupon",
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

module.exports = mongoose.model("usedCoupon", usedCouponSchema);
