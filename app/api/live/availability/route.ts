import { TRACK_PRICES } from "@/app/live/stripe-prices";
import { getSoldCounts } from "@/src/features/live/sheets";

export async function GET() {
  const soldByPrice = await getSoldCounts();

  const availability: Record<string, Record<string, { sold: number; capacity: number }>> = {};
  for (const [track, sessions] of Object.entries(TRACK_PRICES)) {
    availability[track] = {};
    for (const [session, { priceId, capacity }] of Object.entries(sessions)) {
      availability[track][session] = { sold: soldByPrice[priceId] ?? 0, capacity };
    }
  }

  return Response.json(availability, {
    headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
  });
}
