const formatPhoneNumber = (phone) => {
  if (!phone) return null;

  // Remove spaces
  phone = phone.replace(/\s+/g, "");

  // If starts with 07 → convert to 2547
  if (phone.startsWith("07")) {
    return "254" + phone.substring(1);
  }

  // If already starts with 254
  if (phone.startsWith("2547")) {
    return phone;
  }

  return null; // Invalid format
};

module.exports = { formatPhoneNumber };
