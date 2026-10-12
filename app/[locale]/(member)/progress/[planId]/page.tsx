import { setRequestLocale } from "next-intl/server";
import { PlanProgressData } from "../../plans/[planId]/plan-progress-data";

export default async function PlanProgressPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; planId: string }>;
  searchParams: Promise<{ day?: string }>;
}) {
  const [{ locale, planId }, { day }] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);
  const parsedDay = Number(day);
  return (
    <PlanProgressData
      locale={locale as "en" | "zh"}
      planId={planId}
      initialDay={Number.isInteger(parsedDay) ? parsedDay : undefined}
    />
  );
}
