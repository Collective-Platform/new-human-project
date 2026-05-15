import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { ProfileData } from "./profile-data";

function Loading() {
  return (
    <div className="animate-pulse max-w-2xl mx-auto px-6 pt-8 space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <div className="h-8 w-40 rounded bg-zinc-200" />
          <div className="h-6 w-24 rounded-full bg-zinc-100" />
          <div className="h-10 w-28 rounded-full bg-zinc-200" />
        </div>
        <div className="w-24 h-24 rounded-full bg-zinc-200" />
      </div>
      <div className="space-y-3 pt-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-2xl bg-white p-5">
            <div className="w-14 h-14 rounded-full bg-zinc-200 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-1/4 rounded bg-zinc-100" />
              <div className="h-4 w-3/5 rounded bg-zinc-200" />
              <div className="h-3 w-1/5 rounded bg-zinc-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function FriendProfilePage({
  params,
}: {
  params: Promise<{ locale: string; handle: string }>;
}) {
  const { locale, handle } = await params;
  setRequestLocale(locale);

  return (
    <Suspense fallback={<Loading />}>
      <ProfileData handle={handle} />
    </Suspense>
  );
}
