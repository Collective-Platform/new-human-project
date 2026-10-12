import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

export default async function PlansPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const [{ locale }, { tab }] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);
  redirect(`/${locale}/progress${tab === "completed" ? "?tab=completed" : ""}`);
}
