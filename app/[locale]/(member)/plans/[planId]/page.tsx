import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

export default async function PlanPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; planId: string }>;
  searchParams: Promise<{ day?: string }>;
}) {
  const [{ locale, planId }, { day }] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);
  redirect(`/${locale}/progress/${planId}${day ? `?day=${day}` : ""}`);
}
