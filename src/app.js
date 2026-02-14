const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const whatsappRoutes = require("./routes/whatsapp.routes");
const mpesaRoutes = require("./routes/mpesa.routes");

const app = express();

/* -------------------- MIDDLEWARES -------------------- */

// Twilio sends form-urlencoded data
app.use(express.urlencoded({ extended: false }));

// For JSON APIs (Postman, frontend, etc.)
app.use(express.json());

// Security
app.use(helmet());

// Enable CORS
app.use(cors());

/* -------------------- ROUTES -------------------- */

app.use("/whatsapp", whatsappRoutes);
app.use("/mpesa", mpesaRoutes);

/* -------------------- TEST ROUTE -------------------- */

app.get("/", (req, res) => {
  res.send("Loveline Backend Running ✅");
});

/* -------------------- EXPORT -------------------- */

module.exports = app;
