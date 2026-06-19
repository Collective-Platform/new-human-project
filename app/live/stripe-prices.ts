// Populate by running:
//   STRIPE_SECRET_KEY=sk_live_... node scripts/create-track-products.js
// Then replace the placeholder price_xxx values below with the printed output.

//Live Price
export const TRACK_PRICES: Record<
  string,
  Record<string, { priceId: string; capacity: number }>
> = {
  Hyrox: {
    dawn: { priceId: "price_1TjvWEHJ40gQ7FP8UG2P863o", capacity: 20 },
    dusk: { priceId: "price_1TjvWFHJ40gQ7FP8of0cShES", capacity: 20 },
  },
  Spin: {
    dawn: { priceId: "price_1TjvWFHJ40gQ7FP8plgrncrH", capacity: 25 },
    dusk: { priceId: "price_1TjvWGHJ40gQ7FP8LOnp1CUd", capacity: 25 },
  },
  Run: { dawn: { priceId: "price_1TjvWHHJ40gQ7FP8GzEhugO5", capacity: 30 } },
  PilatesReformer: {
    dawn: { priceId: "price_1TjvWIHJ40gQ7FP8TWh9qkT6", capacity: 10 },
  },
  PilatesChair: {
    dawn: { priceId: "price_1TjvWJHJ40gQ7FP8Yo9vxYTj", capacity: 8 },
  },
  Breathwork: {
    dawn: { priceId: "price_1TjvWJHJ40gQ7FP8BdXER66O", capacity: 24 },
    dusk: { priceId: "price_1TjvWKHJ40gQ7FP8eyE78bpf", capacity: 24 },
  },
};

//Test Price
// export const TRACK_PRICES: Record<
//   string,
//   Record<string, { priceId: string; capacity: number }>
// > = {
//   Hyrox: {
//     dawn: { priceId: "price_1Tjvj1HJ40gQ7FP8Yv9wYP97", capacity: 20 },
//     dusk: { priceId: "price_1Tjvj2HJ40gQ7FP8yXHEXh1f", capacity: 20 },
//   },
//   Spin: {
//     dawn: { priceId: "price_1Tjvj3HJ40gQ7FP8FDv0IBy5", capacity: 25 },
//     dusk: { priceId: "price_1Tjvj4HJ40gQ7FP8zyQML5oG", capacity: 25 },
//   },
//   Run: { dawn: { priceId: "price_1Tjvj5HJ40gQ7FP8WKoFlFZ7", capacity: 30 } },
//   PilatesReformer: {
//     dawn: { priceId: "price_1Tjvj5HJ40gQ7FP8egyhFd2G", capacity: 10 },
//   },
//   PilatesChair: {
//     dawn: { priceId: "price_1Tjvj6HJ40gQ7FP8duxKaNZg", capacity: 8 },
//   },
//   Breathwork: {
//     dawn: { priceId: "price_1Tjvj7HJ40gQ7FP8CxHWNs3o", capacity: 24 },
//     dusk: { priceId: "price_1Tjvj8HJ40gQ7FP8kbnVmKQg", capacity: 24 },
//   },
// };
