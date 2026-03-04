const express = require("express");
const Stripe = require("stripe");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.post("/create-checkout-session", async (req, res) => {
  try {
    const { price_id } = req.body;

    if (!price_id) {
      return res.status(400).json({ error: "Missing price_id" });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",

      payment_method_types: [
        "card",
        "affirm",
        "klarna",
        "amazon_pay"
      ],

      shipping_address_collection: {
        allowed_countries: ["US"]
      },

      billing_address_collection: "required",
      locale: "auto",

      line_items: [
        {
          price: price_id,
          quantity: 1
        }
      ],

      success_url: "https://greenpowertech.store",
      cancel_url: "https://greenpowertech.store"
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("Stripe error:", error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});

