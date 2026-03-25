import express from "express";
import Stripe from "stripe";
import cors from "cors";

const app = express();

// CORS CORRECTO PARA SHOPIFY
app.use(cors({
  origin: [
    "https://greenpowertech.store",
    "https://www.greenpowertech.store",
    "https://checkout.greenpowertech.store"
  ],
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Accept"]
}));

app.use(express.json());

// STRIPE
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ENDPOINT PRINCIPAL
app.post("/create-payment-intent", async (req, res) => {
  try {
    const { price_id, state, zip } = req.body;

    if (!price_id) {
      return res.status(400).json({ error: "Falta price_id" });
    }

    const price = await stripe.prices.retrieve(price_id);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: price.unit_amount,
      currency: "usd",
      payment_method_types: ["card", "affirm", "klarna"],
      shipping: {
        name: "Cliente",
        address: {
          line1: "Dirección",
          city: "Ciudad",
          state: state || "PR",
          postal_code: zip || "00901",
          country: "US"
        }
      },
      metadata: { price_id }
    });

    res.json({ clientSecret: paymentIntent.client_secret });

  } catch (error) {
    console.error("Error creando PaymentIntent:", error);
    res.status(500).json({ error: error.message });
  }
});

// *** PUERTO CORRECTO PARA RENDER — SIN FALLBACK ***
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
