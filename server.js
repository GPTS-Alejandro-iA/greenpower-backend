// server.js
import express from "express";
import cors from "cors";
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// Middleware básico
app.use(cors());
app.use(express.json());

// Clave secreta de Stripe desde .env
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20", // o la versión que tengas activa en tu cuenta
});

// Endpoint mínimo y estable para crear sesión de Checkout
app.post("/create-checkout-session", async (req, res) => {
  try {
    // Si viene algo del frontend, lo puedes usar; si no, usamos un fallback estable
    const { line_items } = req.body || {};

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      // Si no vienen line_items válidos, usamos un producto fijo de prueba
      line_items:
        line_items && Array.isArray(line_items) && line_items.length > 0
          ? line_items
          : [
              {
                price_data: {
                  currency: "usd",
                  product_data: {
                    name: "Green Power Test Item",
                  },
                  unit_amount: 10000, // 100.00 USD
                },
                quantity: 1,
              },
            ],
      success_url: "https://greenpowertechstore.com/pages/success",
      cancel_url: "https://greenpowertechstore.com/pages/cancel",
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error("Error creando sesión de checkout:", error);
    return res.status(500).json({ error: "No se pudo crear la sesión" });
  }
});

// Puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend escuchando en puerto ${PORT}`);
});
