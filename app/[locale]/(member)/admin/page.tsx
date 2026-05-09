import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { AdminData } from "./admin-data";

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Suspense fallback={null}>
      <AdminData locale={locale} />
    </Suspense>
  );
}
