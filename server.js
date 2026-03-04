const express = require("express");
const Stripe = require("stripe");

const app = express();
app.use(express.json());

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.post("/create-checkout-session", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",

      // Métodos de pago explícitos (estables para PR)
      payment_method_types: [
        "card",
        "affirm",
        "klarna",
        "amazon_pay"
      ],

      // País fijo en Estados Unidos
      shipping_address_collection: {
        allowed_countries: ["US"]
      },

      // Dirección de facturación con checkbox "Same as shipping"
      billing_address_collection: "required",

      // Idioma automático ES / EN
      locale: "auto",

      // Producto con PRICE ID FIJO (NO dinámico)
      line_items: [
        {
          price: "price_XXXXXXXXXXXX", // ← reemplaza con tu Price ID real
          quantity: 1
        }
      ],

      success_url: "https://greenpowertech.store",
      cancel_url: "https://greenpowertech.store"
    });

    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});



