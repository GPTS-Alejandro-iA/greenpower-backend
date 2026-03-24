require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");

const app = express();

app.use(cors({
  origin: [
    "https://greenpowertech.store",
    "https://www.greenpowertech.store"
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

      // 🔥 ESTA ES LA CLAVE PARA QUE AFFIRM NO REBOTE
      return_url: "https://greenpowertech.store/pages/thank-you",

      payment_method_options: {
        affirm: {
          capture_method: "automatic",
          preferred_locale: "en-US",
          // 🔥 Affirm NECESITA ESTO para completar el flujo
          return_url: "https://greenpowertech.store/pages/thank-you"
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

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
