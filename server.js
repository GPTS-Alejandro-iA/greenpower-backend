require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");

const app = express();

app.use(express.static("public"));
app.use(cors());
app.use(express.json());

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// ⭐ ENDPOINT PARA TU CHECKOUT.HTML (PaymentIntent)
app.post("/create-payment-intent", async (req, res) => {
  try {
    const { price_id, state, zip } = req.body;

    if (!price_id) {
      return res.status(400).json({ error: "Falta price_id" });
    }

    // Obtener monto real desde price_id
    const price = await stripe.prices.retrieve(price_id);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: price.unit_amount,
      currency: "usd",

      automatic_payment_methods: { enabled: true },

      shipping: {
        address: {
          country: "US",      // ⭐ Esto desbloquea Affirm en PR
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

// ⭐ ENDPOINT PARA Checkout Session (si lo quieres mantener)
app.post("/create-checkout-session", async (req, res) => {
  try {
    const { price_id, product_name, quantity } = req.body;

    if (!price_id) {
      return res.status(400).json({ error: "Falta price_id" });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",

      line_items: [
        {
          price: price_id,
          quantity: quantity || 1
        }
      ],

      success_url: "https://greenpowertech.store/pages/confirmacion?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "https://greenpowertech.store/products",

      metadata: {
        product_name: product_name || "Producto",
        price_id,
        quantity: quantity || 1
      }
    });

    res.json({ url: session.url });

  } catch (error) {
    console.error("Error creando Checkout Session:", error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend running on port ${PORT}`);
});
