import { setRequestLocale } from "next-intl/server";
import { MoodHistoryClient } from "./mood-history-client";

export default async function MoodHistoryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <MoodHistoryClient />;
}
