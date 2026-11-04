import { setRequestLocale } from "next-intl/server";
import { UiLabClient } from "./ui-lab-client";

export default async function UiLabPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <UiLabClient locale={locale === "zh" ? "zh" : "en"} />;
}
