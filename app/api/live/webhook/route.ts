import { type NextRequest } from "next/server";
import Stripe from "stripe";
import { env } from "@/src/env";
import { recordSales } from "@/src/features/live/sheets";
import { TRACK_PRICES } from "@/app/live/stripe-prices";

// Reverse map: priceId → { track, session }
const priceMap: Record<string, { track: string; session: string }> = {};
for (const [track, sessions] of Object.entries(TRACK_PRICES)) {
  for (const [session, { priceId }] of Object.entries(sessions)) {
    priceMap[priceId] = { track, session };
  }
}

export async function POST(req: NextRequest) {
  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) {
    return Response.json({ error: "Not configured" }, { status: 503 });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return Response.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const stripe = new Stripe(env.STRIPE_SECRET_KEY);
    event = stripe.webhooks.constructEvent(body, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const stripe = new Stripe(env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(
      event.data.object.id,
      { expand: ["line_items"] },
    );

    const fields = session.custom_fields ?? [];
    const getField = (key: string) =>
      fields.find((f) => f.key === key)?.text?.value ?? "";

    const name = getField("full_name");
    const ticketId = getField("ticket_id");
    const phone = session.customer_details?.phone ?? "";
    const termsAccepted = session.metadata?.terms_accepted === "true";
    const termsAcceptedAt = session.metadata?.terms_accepted_at ?? "";

    const items = (session.line_items?.data ?? [])
      .filter((item) => item.price?.id)
      .map((item) => ({
        track: priceMap[item.price!.id]?.track ?? item.price!.id,
        session: priceMap[item.price!.id]?.session ?? "unknown",
        priceId: item.price!.id,
        amountCents: item.amount_total ?? 0,
      }));

    if (items.length > 0) {
      await recordSales({ stripeSessionId: session.id, name, phone, ticketId, termsAccepted, termsAcceptedAt, items });
    }
  }

  return Response.json({ received: true });
}
