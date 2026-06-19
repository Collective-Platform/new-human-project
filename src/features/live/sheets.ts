import { google } from "googleapis";
import { env } from "@/src/env";

function getSheets() {
  const auth = new google.auth.JWT({
    email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

type SaleItem = {
  track: string;
  session: string;
  priceId: string;
  amountCents: number;
};

/** Append sale rows for one checkout session. Idempotent — skips if sessionId already exists. */
export async function recordSales(params: {
  stripeSessionId: string;
  name: string;
  phone: string;
  ticketId: string;
  termsAccepted: boolean;
  termsAcceptedAt: string;
  items: SaleItem[];
}) {
  const sheets = getSheets();
  const sheetId = env.LIVE_TRACK_SHEET_ID;

  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "Sheet1!A:A",
  });
  const ids = (existing.data.values ?? []).flat();
  if (ids.includes(params.stripeSessionId)) return;

  const createdAt = new Date().toISOString();
  const rows = params.items.map((item) => [
    params.stripeSessionId,
    params.name,
    params.phone,
    params.ticketId,
    item.track,
    item.session === "dawn" ? "Dawn Track (7:00 AM)" : "Dusk Track (4:00 PM)",
    `RM${(item.amountCents / 100).toFixed(0)}`,
    item.priceId,
    createdAt,
    params.termsAccepted ? "Yes" : "No",
    params.termsAcceptedAt,
  ]);

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: "Sheet1!A:K",
    valueInputOption: "RAW",
    requestBody: { values: rows },
  });
}

/** Returns sold count per priceId across all rows. */
export async function getSoldCounts(): Promise<Record<string, number>> {
  const sheets = getSheets();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: env.LIVE_TRACK_SHEET_ID,
    range: "Sheet1!A:H", // session_id … price_id (col H = index 7)
  });

  const rows = res.data.values ?? [];
  const soldByPrice: Record<string, number> = {};

  for (const row of rows) {
    const priceId = row[7] as string | undefined;
    if (!priceId || priceId === "price_id") continue; // skip header/empty
    soldByPrice[priceId] = (soldByPrice[priceId] ?? 0) + 1;
  }

  return soldByPrice;
}
