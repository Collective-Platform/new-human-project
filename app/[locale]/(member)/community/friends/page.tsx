import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { FriendsData } from "./friends-data";

function Loading() {
  return (
    <div className="animate-pulse space-y-3 px-6 pt-6">
      {Array.from({ length: 6 }, (_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-[0_4px_16px_rgba(53,50,47,0.03)]"
        >
          <div className="h-12 w-12 shrink-0 rounded-full bg-zinc-200" />
          <div className="h-4 w-40 rounded bg-zinc-100" />
        </div>
      ))}
    </div>
  );
}

export default async function FriendsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Suspense fallback={<Loading />}>
      <FriendsData />
    </Suspense>
  );
}
