// server.js - GREENPOWER BACKEND (Express 4 - estable)
import express from "express";
import Stripe from "stripe";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

// ✅ CORS para Shopify + Render
const corsOptions = {
  origin: [
    "https://greenpowertech.store",
    "https://www.greenpowertech.store",
    "https://checkout.greenpowertech.store",
    "https://cdn.shopify.com"
  ],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Accept", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// Preflight OPTIONS (Express 4)
app.options("*", cors(corsOptions));

app.use(express.json());

// STRIPE
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Health check
app.get("/", (req, res) => {
  console.log("✅ GET / - Servidor vivo");
  res.send("GreenPower Backend is alive 🚀");
});

// Ruta de prueba
app.get("/create-payment-intent", (req, res) => {
  console.log("⚠️  GET /create-payment-intent (usa POST)");
  res.send("Este endpoint requiere POST");
});

// ENDPOINT PRINCIPAL
app.post("/create-payment-intent", async (req, res) => {
  console.log("🔥 POST /create-payment-intent RECIBIDO");
  console.log("Body:", req.body);

  try {
    const { price_id, state, zip } = req.body;

    if (!price_id) {
      return res.status(400).json({ error: "Falta price_id" });
    }

    const price = await stripe.prices.retrieve(price_id);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: price.unit_amount,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
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

    console.log("✅ PaymentIntent creado:", paymentIntent.id);
    res.json({ clientSecret: paymentIntent.client_secret });

  } catch (error) {
    console.error("❌ Error creando PaymentIntent:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Catch-all
app.use((req, res) => {
  console.log(`🚨 Request no manejado: ${req.method} ${req.path}`);
  res.status(404).json({ error: "Not found" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT} → https://greenpower-backend.onrender.com`);
});
