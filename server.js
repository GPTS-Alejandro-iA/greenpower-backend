require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");

const app = express();
app.use(cors());
app.use(express.json());

// 🔥 ESTA LÍNEA ES CRÍTICA PARA SERVIR checkout.html
app.use(express.static("public"));

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Crear PaymentIntent para Payment Element
app.post("/create-payment-intent", async (req, res) => {
  try {
    const { amount, currency, customer_email, description, metadata } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      description,
      receipt_email: customer_email,
      metadata,

      // Métodos de pago permitidos
      payment_method_types: [
        "card",
        "affirm",
        "klarna",
        "afterpay_clearpay",
        "us_bank_account"
      ],

      // Configuración especial para Affirm
      payment_method_options: {
        affirm: {
          capture_method: "automatic"
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

// Puerto
const PORT = process.env.PORT || 4242;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
