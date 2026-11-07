import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { isBoardEnabled } from "@/src/dev-board/enabled";
import { UiLabClient } from "./ui-lab-client";

// Dev only — returns 404 in production, like the design board.
export default async function UiLabPage({ params }: { params: Promise<{ locale: string }> }) {
  if (!isBoardEnabled()) notFound();
  const { locale } = await params;
  setRequestLocale(locale);

  return <UiLabClient locale={locale === "zh" ? "zh" : "en"} />;
}
