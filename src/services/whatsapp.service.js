const twilio = require("twilio");
const User = require("../models/User.model");
const Offer = require("../models/Offer.model");
const Transaction = require("../models/Transaction.model");
const { formatPhoneNumber } = require("../utils/phone.util");
const { STATES } = require("../utils/state.util");
const { sendSTKPush } = require("./mpesa.service");

/* -------------------- TWILIO SETUP -------------------- */

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
);

/* -------------------- SEND WHATSAPP MESSAGE -------------------- */

const sendMessage = async (phone, text) => {
  try {
    await client.messages.create({
      body: text,
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:+${phone}`,
    });

    console.log(`📤 WhatsApp sent to ${phone}`);
  } catch (error) {
    console.error("Twilio Error:", error.message);
  }
};

/* -------------------- HANDLE INCOMING MESSAGE -------------------- */

const handleIncomingMessage = async (from, message) => {
  message = message.trim().toLowerCase();

  const phone = formatPhoneNumber(from);
  if (!phone) return "⚠️ Invalid phone number format.";

  let user = await User.findOne({ phone });
  if (!user) {
    user = await User.create({ phone });
  }

  // Global Commands
  if (message === "menu") return await sendMenu(user);

  if (message === "cancel") {
    user.state = STATES.IDLE;
    user.selectedOffer = null;
    await user.save();
    return "❌ Transaction cancelled.\n\nType menu to start again.";
  }

  switch (user.state) {
    case STATES.IDLE:
      return "👋 Karibu Loveline Data Solutions 💙\n\nType menu to see available offers.";

    case STATES.MENU_SENT:
      return await handleOfferSelection(user, message);

    case STATES.OFFER_SELECTED:
      return await handlePhoneEntry(user, message);

    case STATES.WAITING_PAYMENT:
      return "⏳ We are still waiting for payment confirmation.\nPlease complete the M-PESA prompt on your phone.";

    default:
      return "Type menu to start.";
  }
};

/* -------------------- SEND MENU -------------------- */

const sendMenu = async (user) => {
  const offers = await Offer.find({ active: true });

  if (!offers.length) {
    return "⚠️ No offers available at the moment.";
  }

  let menuText = "📶 Loveline Data Solutions 💙\n\nChoose an offer:\n";

  offers.forEach((offer, index) => {
    menuText += `${index + 1}️⃣ ${offer.name} - KES ${offer.price}\n`;
  });

  menuText += "\nReply with the number of your choice.";

  user.state = STATES.MENU_SENT;
  await user.save();

  return menuText;
};

/* -------------------- HANDLE OFFER SELECTION -------------------- */

const handleOfferSelection = async (user, message) => {
  const offers = await Offer.find({ active: true });
  const choice = parseInt(message);

  if (isNaN(choice) || choice < 1 || choice > offers.length) {
    return "⚠️ Invalid selection.\nPlease reply with the correct number.";
  }

  const selectedOffer = offers[choice - 1];

  user.selectedOffer = selectedOffer._id;
  user.state = STATES.OFFER_SELECTED;
  await user.save();

  return `🧾 Order Summary\n\n📦 ${selectedOffer.name}\n💰 KES ${selectedOffer.price}\n\nEnter the M-PESA number to pay (07XXXXXXXX):`;
};

/* -------------------- HANDLE PHONE ENTRY -------------------- */

const handlePhoneEntry = async (user, message) => {
  const formattedPhone = formatPhoneNumber(message);

  if (!formattedPhone) {
    return "⚠️ Oops! That doesn’t look like a valid Safaricom number.\nPlease enter again (07XXXXXXXX).";
  }

  const offer = await Offer.findById(user.selectedOffer);

  if (!offer) {
    user.state = STATES.IDLE;
    await user.save();
    return "⚠️ Offer not found. Type menu to start again.";
  }

  try {
    const stkResponse = await sendSTKPush(formattedPhone, offer.price);

    await Transaction.create({
      phone: formattedPhone,
      offer: offer._id,
      amount: offer.price,
      checkoutRequestID: stkResponse.CheckoutRequestID,
      status: "PENDING",
    });

    user.state = STATES.WAITING_PAYMENT;
    await user.save();

    return `⏳ Waiting for payment confirmation...\n\nA payment prompt has been sent to ${formattedPhone}.\nPlease enter your M-PESA PIN to complete payment.`;
  } catch (error) {
    console.error("STK ERROR:", error.response?.data || error.message);
    return "⚠️ Failed to initiate payment.\nPlease try again or type menu to restart.";
  }
};

/* -------------------- EXPORTS -------------------- */

module.exports = {
  handleIncomingMessage,
  sendMessage,
};
