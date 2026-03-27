const express = require("express");
const Stripe = require("stripe");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// ------------------------------
// 🔥 NUEVO: Variables para Meta y Google
// ------------------------------
const META_PIXEL_ID = process.env.META_PIXEL_ID;
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

const GA4_MEASUREMENT_ID = process.env.GA4_MEASUREMENT_ID;
const GA4_API_SECRET = process.env.GA4_API_SECRET;

// ------------------------------
// 🔥 NUEVO: Helpers para enviar eventos
// ------------------------------
async function sendMetaEvent(eventName, payload = {}) {
  try {
    const url = `https://graph.facebook.com/v18.0/${META_PIXEL_ID}/events`;

    const body = {
      data: [
        {
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          action_source: "website",
          ...payload
        }
      ]
    };

    await fetch(url + `?access_token=${META_ACCESS_TOKEN}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
  } catch (err) {
    console.error("Meta CAPI error:", err);
  }
}

async function sendGA4Event(eventName, clientId, params = {}) {
  try {
    const url = `https://www.google-analytics.com/mp/collect?measurement_id=${GA4_MEASUREMENT_ID}&api_secret=${GA4_API_SECRET}`;

    const body = {
      client_id: clientId || `gpts_${Date.now()}`,
      events: [
        {
          name: eventName,
          params
        }
      ]
    };

    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
  } catch (err) {
    console.error("GA4 error:", err);
  }
}

// ------------------------------
// 🔥 FIN DE LOS BLOQUES NUEVOS
// ------------------------------

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.get("/", (req, res) => {
  res.send("Green Power Tech Backend is running");
});

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

    // ------------------------------
    // 🔥 NUEVO: Enviar eventos de inicio de checkout
    // ------------------------------
    const value = session.amount_total ? session.amount_total / 100 : undefined;
    const currency = session.currency ? session.currency.toUpperCase() : "USD";

    sendMetaEvent("InitiateCheckout", {
      custom_data: { value, currency }
    });

    sendGA4Event("begin_checkout", null, {
      value,
      currency
    });
    // ------------------------------

    res.json({ url: session.url });
  } catch (error) {
    console.error("Stripe error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ------------------------------
// 🔥 NUEVO: Webhook de Stripe para Purchase
// ------------------------------
app.post("/stripe-webhook", express.raw({ type: "application/json" }), (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed.", err.message);
    return res.sendStatus(400);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    const value = session.amount_total ? session.amount_total / 100 : undefined;
    const currency = session.currency ? session.currency.toUpperCase() : "USD";

    // META: Purchase
    sendMetaEvent("Purchase", {
      custom_data: { value, currency }
    });

    // GA4: purchase
    sendGA4Event("purchase", null, {
      value,
      currency
    });
  }

  res.sendStatus(200);
});
// ------------------------------

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});

