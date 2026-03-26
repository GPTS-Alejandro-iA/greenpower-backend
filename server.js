require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");

const app = express();

app.use(cors());
app.use(express.json());

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// ⭐ ENDPOINT CORRECTO Y VALIDADO
app.post("/create-payment-intent", async (req, res) => {
  try {
    const {
      price_id,
      name,
      address_line1,
      city,
      state,
      zip
    } = req.body;

    if (!price_id) {
      return res.status(400).json({ error: "Falta price_id" });
    }

    // Obtener precio desde Stripe
    const price = await stripe.prices.retrieve(price_id, {
      expand: ["product"]
    });

    // Crear PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: price.unit_amount,
      currency: price.currency,

      // ⭐ Métodos manuales (NO dinámicos)
      payment_method_types: ["card", "affirm", "klarna"],

      // ⭐ Shipping address para Affirm en PR
      shipping: {
        name: name || "Cliente",
        address: {
          line1: address_line1,
          city: city,
          state: state || "PR",
          postal_code: zip,
          country: "US"
        }
      },

      metadata: {
        price_id,
        state,
        zip
      }
    });

    res.json({ clientSecret: paymentIntent.client_secret });

  } catch (error) {
    console.error("Error creando Payment Intent:", error);
    res.status(500).json({ error: error.message });
  }
});

// ⭐ Puerto
const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend running on port ${PORT}`);
});
