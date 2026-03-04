const express = require("express");
const Stripe = require("stripe");

const app = express();
app.use(express.json());

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.post("/create-checkout-session", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: [
        "card",
        "affirm",
        "klarna",
        "us_bank_account"
      ],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Green Power Tech Store – Producto"
            },
            unit_amount: 10000
          },
          quantity: 1
        }
      ],
      success_url: "https://greenpowertech.store/success",
      cancel_url: "https://greenpowertech.store/cancel"
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
