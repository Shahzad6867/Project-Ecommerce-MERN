const mongoose = require("mongoose");
const { Schema } = mongoose;

const transactionSchema = Schema(
  {
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      default : null
    },
    transactionType: {
      type: String,
      enum: ["Debit", "Credit"],
    },
    transactionReason: {
      type: String,
      enum: ["Wallet Top-up", "Novamart Purchase", "Order Refund","Referral Reward"],
    },
    transactionAmount: {
      type: Number,
    },
  },
  { timestamps: true, _id: false }
);

const walletSchema = Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    walletBalance: {
      type: Number,
      default: 0,
    },
    transactions: [transactionSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Wallet", walletSchema);
