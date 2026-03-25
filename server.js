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

// ⭐ SIRVE ARCHIVOS ESTÁTICOS (AQUÍ VIVE checkout.html)
app.use(express.static("public"));

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Handler reutilizable para crear PaymentIntent
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

// Tu endpoint original para el checkout custom
app.post("/create-payment-intent", createPaymentIntentHandler);

// Endpoint extra para cubrir cualquier llamada a /create-checkout-session
app.post("/create-checkout-session", createPaymentIntentHandler);

// Salud
app.get("/", (req, res) => {
  console.log("✅ GET / - Servidor vivo");
  res.send("Backend OK");
});

// Puerto
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT} → https://greenpower-backend.onrender.com`);
});
