import { setRequestLocale } from "next-intl/server";
import { PlansData } from "../plans/plans-data";

export default async function ProgressPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const [{ locale }, { tab }] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);
  return (
    <PlansData
      locale={locale as "en" | "zh"}
      initialTab={tab === "completed" ? "completed" : "active"}
    />
  );
}
