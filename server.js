import express from "express";
import Stripe from "stripe";
import cors from "cors";

const app = express();

// CORS solo para tus dominios
app.use(cors({
  origin: [
    "https://greenpowertech.store",
    "https://www.greenpowertech.store",
    "https://checkout.greenpowertech.store"
  ],
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Accept"]
}));

// Parseo JSON
app.use(express.json());

// ⭐ SIRVE checkout.html y todo lo que esté en /public
app.use(express.static("public"));

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ⭐ PAYMENT INTENT (ESTE ES EL QUE ACTIVA AFFIRM)
async function createPaymentIntentHandler(req, res) {
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

    return res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Error creando PaymentIntent:", error);
    return res.status(500).json({ error: error.message });
  }
}

// ⭐ TU ENDPOINT REAL
app.post("/create-payment-intent", createPaymentIntentHandler);

// ⭐ PARA CUBRIR CUALQUIER LLAMADA VIEJA DE SHOPIFY
app.post("/create-checkout-session", createPaymentIntentHandler);

// Salud
app.get("/", (req, res) => {
  res.send("Backend OK");
});

// Puerto
const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend running on port ${PORT}`);
});
