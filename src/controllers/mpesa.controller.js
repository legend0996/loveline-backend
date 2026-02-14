const Transaction = require("../models/Transaction.model");
const User = require("../models/User.model");
const { STATES } = require("../utils/state.util");
const { sendMessage } = require("../services/whatsapp.service");

const mpesaCallback = async (req, res) => {
  try {
    const callback = req.body.Body.stkCallback;

    const { CheckoutRequestID, ResultCode, ResultDesc } = callback;

    const transaction = await Transaction.findOne({
      checkoutRequestID: CheckoutRequestID,
    }).populate("offer");

    if (!transaction) {
      return res.json({ message: "Transaction not found" });
    }

    if (ResultCode === 0) {
      // ✅ SUCCESS
      const metadata = callback.CallbackMetadata?.Item || [];

      const receiptItem = metadata.find(
        (item) => item.Name === "MpesaReceiptNumber",
      );

      transaction.status = "SUCCESS";
      transaction.receiptNumber = receiptItem?.Value || null;
      transaction.mpesaResultCode = ResultCode;
      transaction.mpesaResultDesc = ResultDesc;

      await transaction.save();

      // Reset user state
      const user = await User.findOne({ phone: transaction.phone });
      if (user) {
        user.state = STATES.IDLE;
        user.selectedOffer = null;
        await user.save();
      }

      // 🧾 Build receipt message
      const receiptMessage = `
✅ Payment Successful!

Thank you for buying from Loveline Data Solutions 💙

📦 Offer: ${transaction.offer.name}
💰 Amount: KES ${transaction.amount}
🧾 Receipt: ${transaction.receiptNumber}

Your package is being processed and will be delivered shortly.
You’ll receive an SMS confirmation.

In case of a 1-minute delay, please contact support.

— Loveline Data Solutions 💙
Fast • Secure • Reliable
`;

      // 📤 Send WhatsApp receipt
      await sendMessage(transaction.phone, receiptMessage);

      console.log("✅ Payment Successful:", transaction.receiptNumber);
    } else {
      // ❌ FAILED
      transaction.status = "FAILED";
      transaction.mpesaResultCode = ResultCode;
      transaction.mpesaResultDesc = ResultDesc;

      await transaction.save();

      console.log("❌ Payment Failed:", ResultDesc);

      // Optional: notify user about failure
      await sendMessage(
        transaction.phone,
        "❌ Payment was not completed.\n\nNo money was deducted.\nType menu to try again.",
      );
    }

    res.json({ message: "Callback received successfully" });
  } catch (error) {
    console.error("Callback error:", error.message);
    res.status(500).json({ error: "Callback processing failed" });
  }
};

module.exports = { mpesaCallback };
