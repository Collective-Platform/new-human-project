import { type NextRequest } from "next/server";
import Stripe from "stripe";
import { env } from "@/src/env";
import { getSoldCounts } from "@/src/features/live/sheets";
import { TRACK_PRICES } from "@/app/live/stripe-prices";

type CartItem = { track: string; session: string };

export async function POST(req: NextRequest) {
  if (!env.STRIPE_SECRET_KEY) {
    return Response.json({ error: "Payments not configured" }, { status: 503 });
  }

  const { items } = (await req.json()) as { items: CartItem[] };

  if (!Array.isArray(items) || items.length === 0) {
    return Response.json({ error: "No items selected" }, { status: 400 });
  }

  // Validate all items before hitting Stripe
  for (const item of items) {
    if (!TRACK_PRICES[item.track]?.[item.session]) {
      return Response.json(
        { error: `Unknown track: ${item.track} ${item.session}` },
        { status: 400 },
      );
    }
  }

  // Capacity check — read from Google Sheet (written by webhook)
  const soldByPrice = await getSoldCounts();

  for (const item of items) {
    const entry = TRACK_PRICES[item.track][item.session];
    const sold = soldByPrice[entry.priceId] ?? 0;
    if (sold >= entry.capacity) {
      return Response.json(
        { error: "Sold out", track: item.track, session: item.session },
        { status: 409 },
      );
    }
  }

  const stripe = new Stripe(env.STRIPE_SECRET_KEY);

  const origin = new URL(req.url).origin;
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: items.map((item) => ({
      price: TRACK_PRICES[item.track][item.session].priceId,
      quantity: 1,
    })),
    phone_number_collection: { enabled: true },
    custom_fields: [
      {
        key: "full_name",
        label: { type: "custom", custom: "Full Name" },
        type: "text",
        optional: false,
      },
      {
        key: "ticket_id",
        label: {
          type: "custom",
          custom: "Rhythm Live Ticket Number (from Ticket2U)",
        },
        type: "text",
        optional: false,
      },
    ],
    consent_collection: { terms_of_service: "required" },
    custom_text: {
      terms_of_service_acceptance: {
        message:
          "This track is open to Rhythm Live participants ONLY and is NON-REFUNDABLE. By purchasing this I confirm that I am a registered participant of Rhythm Live.",
      },
    },
    success_url: `${origin}/live?registered=true`,
    cancel_url: `${origin}/live#tracks`,
  });

  return Response.json({ url: session.url });
}
