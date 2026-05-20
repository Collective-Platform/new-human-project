import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { CalendarDayData } from "./calendar-day-data";

export default async function CalendarDayPage({
  params,
}: {
  params: Promise<{ locale: string; date: string }>;
}) {
  const { locale, date: dateStr } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex flex-col gap-4 px-4 pt-4">
      <Suspense fallback={<div className="h-6 w-48 rounded bg-zinc-100 animate-pulse" />}>
        <CalendarDayData locale={locale} dateStr={dateStr} />
      </Suspense>
    </div>
  );
}
