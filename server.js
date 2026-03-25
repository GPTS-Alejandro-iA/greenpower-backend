require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");

const app = express();

app.use(express.static("public"));
app.use(cors());
app.use(express.json());

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// ⭐ CREA PAYMENT INTENT USANDO price_id (NO Checkout Session)
app.post("/create-payment-intent", async (req, res) => {
  try {
    const { price_id, state, zip } = req.body;

    if (!price_id) {
      return res.status(400).json({ error: "Falta price_id" });
    }

    // ⭐ OBTENER EL MONTO REAL DESDE price_id
    const price = await stripe.prices.retrieve(price_id);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: price.unit_amount,
      currency: "usd",

      // ⭐ NECESARIO PARA Affirm, Klarna, Afterpay, Apple Pay, Google Pay
      automatic_payment_methods: { enabled: true },

      shipping: {
        address: {
          country: "US",   // ⭐ Esto desbloquea Affirm en PR
          state: state || "PR",
          postal_code: zip || "00901"
        }
      },

      metadata: {
        price_id
      }
    });

    res.json({ clientSecret: paymentIntent.client_secret });

  } catch (error) {
    console.error("Error creando PaymentIntent:", error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend running on port ${PORT}`);
});
