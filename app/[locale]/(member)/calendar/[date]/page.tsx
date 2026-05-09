import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";
import { CalendarDayData } from "./calendar-day-data";

export default async function CalendarDayPage({
  params,
}: {
  params: Promise<{ locale: string; date: string }>;
}) {
  const { locale, date: dateStr } = await params;
  setRequestLocale(locale);

  return (
    <div className="px-4 pt-4">
      <div className="mb-4 flex items-center gap-3">
        <Link
          href="/"
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-zinc-100"
        >
          <ArrowLeft size={20} className="text-foreground" />
        </Link>
        <Suspense
          fallback={
            <div className="h-6 w-48 rounded bg-zinc-100 animate-pulse" />
          }
        >
          <CalendarDayData locale={locale} dateStr={dateStr} />
        </Suspense>
      </div>
    </div>
  );
}
