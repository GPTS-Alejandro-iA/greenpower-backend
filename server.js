require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");

const app = express();

app.use(cors());
app.use(express.json());

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// ⭐ Payment Intent con métodos manuales (NO dinámicos)
app.post("/create-payment-intent", async (req, res) => {
  try {
    const { price_id, state, zip } = req.body;

    if (!price_id) {
      return res.status(400).json({ error: "Falta price_id" });
    }

    // Obtener el precio desde Stripe
    const price = await stripe.prices.retrieve(price_id, {
      expand: ["product"]
    });

    // Crear PaymentIntent con métodos manuales
    const paymentIntent = await stripe.paymentIntents.create({
      amount: price.unit_amount,
      currency: price.currency,
      payment_method_types: ["card", "affirm", "klarna"], // ⭐ CLAVE
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

const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend running on port ${PORT}`);
});
