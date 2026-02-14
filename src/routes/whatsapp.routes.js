const express = require("express");
const router = express.Router();
const { receiveMessage } = require("../controllers/whatsapp.controller");

router.post("/webhook", receiveMessage);

module.exports = router;
