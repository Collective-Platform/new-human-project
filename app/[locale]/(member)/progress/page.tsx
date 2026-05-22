import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import Loading from "./loading";
import { ProgressData } from "./progress-data";

export default async function ProgressPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ date?: string; day?: string; task?: string }>;
}) {
  const { locale } = await params;
  const { date, day, task } = await searchParams;
  setRequestLocale(locale);

  return (
    <Suspense fallback={<Loading />}>
      <ProgressData
        locale={locale as "en" | "zh"}
        initialDate={date}
        initialDay={day ? Math.min(Math.max(Number(day), 1), 25) : undefined}
        initialTaskId={task}
      />
    </Suspense>
  );
}
