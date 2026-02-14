const express = require("express");
const router = express.Router();
const { mpesaCallback } = require("../controllers/mpesa.controller");

router.post("/callback", mpesaCallback);

module.exports = router;
