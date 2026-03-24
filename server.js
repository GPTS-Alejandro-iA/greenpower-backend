require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");

const app = express();

// 🔥 CORS CORREGIDO — AGREGO TU BACKEND
app.use(cors({
  origin: [
    "https://greenpowertech.store",
    "https://www.greenpowertech.store",
    "https://greenpower-backend.onrender.com"
  ],
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());
app.use(express.static("public"));

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

app.post("/create-payment-intent", async (req, res) => {
  try {
    const { amount, currency, customer_email, description, metadata } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      description,
      receipt_email: customer_email,
      metadata,

      payment_method_types: [
        "card",
        "affirm",
        "klarna",
        "afterpay_clearpay",
        "us_bank_account"
      ],

      // 🔥 ESTE return_url SÍ ES VÁLIDO
      return_url: "https://greenpowertech.store/pages/thank-you",

      // 🔥 Affirm YA NO PERMITE return_url AQUÍ
      payment_method_options: {
        affirm: {
          capture_method: "automatic",
          preferred_locale: "en-US"
        }
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret
    });

  } catch (error) {
    console.error("Error creando PaymentIntent:", error);
    res.status(500).json({ error: error.message });
  }
});

// 🔥 PUERTO CORRECTO PARA RENDER
const PORT = process.env.PORT;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend running on port ${PORT}`);
});

