/**
 * One-time script: creates 10 Stripe Products + Prices for Rhythm Live tracks.
 * Run once, then paste the printed TRACK_PRICES block into app/live/stripe-prices.ts.
 *
 * Usage:
 *   STRIPE_SECRET_KEY=sk_live_... node scripts/create-track-products.js
 */

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const TRACKS = [
  { name: "Hyrox",           capacity: 20, price: 2000, sessions: ["dawn", "dusk"] },
  { name: "Spin",            capacity: 30, price: 2000, sessions: ["dawn", "dusk"] },
  { name: "Run",             capacity: 30, price: 1000, sessions: ["dawn"] },
  { name: "PilatesReformer", capacity: 10, price: 2000, sessions: ["dawn"], label: "Reformer Pilates" },
  { name: "PilatesChair",    capacity: 8,  price: 2000, sessions: ["dawn"], label: "Chair Pilates" },
  { name: "Breathwork",      capacity: 24, price: 2000, sessions: ["dawn", "dusk"] },
];

const SESSION_LABELS = {
  dawn: "Dawn Track (7:00 AM)",
  dusk: "Dusk Track (4:00 PM)",
};

async function main() {
  console.log("Creating Stripe products and prices...\n");

  const result = {};

  for (const track of TRACKS) {
    result[track.name] = {};
    for (const sessionId of track.sessions) {
      const displayName = track.label ?? track.name;
      const product = await stripe.products.create({
        name: `${displayName} – ${SESSION_LABELS[sessionId]}`,
        description: "Rhythm Live · July 4, 2026",
        metadata: {
          track: track.name,
          session: sessionId,
          capacity: String(track.capacity),
        },
      });

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: track.price,
        currency: "myr",
      });

      result[track.name][sessionId] = { priceId: price.id, capacity: track.capacity };
      console.log(`${track.name} ${sessionId}: ${price.id}`);
    }
  }

  console.log("\n--- Paste this into app/live/stripe-prices.ts ---\n");
  console.log(
    "export const TRACK_PRICES: Record<string, Record<string, { priceId: string; capacity: number }>> = {",
  );
  for (const [name, sessions] of Object.entries(result)) {
    const entries = Object.entries(sessions)
      .map(([sid, { priceId, capacity }]) => `${sid}: { priceId: "${priceId}", capacity: ${capacity} }`)
      .join(", ");
    console.log(`  ${name.padEnd(16)}: { ${entries} },`);
  }
  console.log("};");
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
