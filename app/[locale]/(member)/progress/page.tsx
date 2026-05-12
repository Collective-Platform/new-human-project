import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import Loading from "./loading";
import { ProgressData } from "./progress-data";

export default async function ProgressPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Suspense fallback={<Loading />}>
      <ProgressData locale={locale as "en" | "zh"} />
    </Suspense>
  );
}
