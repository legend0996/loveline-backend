const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      index: true,
    },
    offer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Offer",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    receiptNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    checkoutRequestID: {
      type: String,
      unique: true,
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED"],
      default: "PENDING",
    },
    mpesaResultCode: {
      type: Number,
      default: null,
    },
    mpesaResultDesc: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Transaction", transactionSchema);
