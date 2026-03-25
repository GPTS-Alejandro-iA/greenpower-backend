require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");

const app = express();

// ⭐ Configurar CORS para permitir tu dominio de Shopify
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  credentials: true
}));
app.use(express.json());

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// ⭐ Payment Intent con métodos manuales (NO dinámicos)
app.post("/create-payment-intent", async (req, res) => {
  try {
    const { price_id, name, address_line1, city, state, zip } = req.body;

    if (!price_id) {
      return res.status(400).json({ error: "Falta price_id" });
    }

    // Obtener el precio desde Stripe
    const price = await stripe.prices.retrieve(price_id, {
      expand: ["product"]
    });

    // Crear PaymentIntent con dirección de envío
    const paymentIntent = await stripe.paymentIntents.create({
      amount: price.unit_amount,
      currency: price.currency,
      payment_method_types: ["card", "affirm", "klarna"],
      shipping: {  // ⭐ CLAVE: Agregar shipping address
        name: name || 'Cliente',
        address: {
          line1: address_line1,
          city: city,
          state: state || 'PR',
          postal_code: zip,
          country: 'US'  // ⭐ CRÍTICO: Siempre US para Puerto Rico
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

    res.json({ clientSecret: paymentIntent.client_secret });

  } catch (error) {
    console.error("Error creando Payment Intent:", error);
    res.status(500).json({ error: error.message });
  }
});

// ⭐ Endpoint de salud para verificar que el servidor está funcionando
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend running on port ${PORT}`);
});
