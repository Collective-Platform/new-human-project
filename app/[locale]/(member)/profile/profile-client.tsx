"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/src/i18n/navigation";
import { User, Settings } from "lucide-react";
import NextImage from "next/image";
import type { ProfileData } from "@/src/features/profile/get-profile-for-user";
import { ActivityFeed, type FeedItem } from "../community/activity-feed";

export function ProfileClient({
  initialData,
  friendCount,
  activities,
  selfUserId,
}: {
  initialData: ProfileData;
  friendCount: number;
  activities: FeedItem[];
  selfUserId: number;
}) {
  const t = useTranslations("profile");
  const { user } = initialData;

  return (
    <div className="min-h-screen bg-surface antialiased">
      <main className="max-w-2xl mx-auto px-6 pt-8 pb-8">
        {/* Profile header */}
        <section className="mb-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-4">
              <h2 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">
                {user.searchHandle ? `@${user.searchHandle}` : t("username")}
              </h2>
              <div className="flex items-center gap-2">
                <Link
                  href="/community/friends"
                  className="inline-flex items-center gap-1.5 px-3 py-1 border border-outline-variant rounded-full text-on-surface-variant hover:bg-surface-container hover:border-primary/30 hover:text-primary transition-all active:scale-95"
                >
                  <User size={14} />
                  <span className="text-xs font-bold font-headline">{friendCount} Friends</span>
                </Link>
                <Link
                  href="/profile/settings"
                  aria-label="Settings"
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-outline-variant text-on-surface-variant hover:bg-surface-container hover:text-primary transition-all active:scale-95"
                >
                  <Settings size={14} />
                </Link>
              </div>
            </div>

            {/* Avatar (display only) */}
            <div className="relative shrink-0">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-surface shadow-xl flex items-center justify-center">
                {user.avatarUrl ? (
                  <NextImage
                    src={user.avatarUrl}
                    alt={user.displayName ?? ""}
                    width={96}
                    height={96}
                    unoptimized
                    className="rounded-full object-cover"
                    style={{ width: 96, height: 96 }}
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-surface-container-highest flex items-center justify-center">
                    <User size={38} className="text-on-surface-variant" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Activities */}
        {activities.length > 0 && (
          <section className="mb-8">
            <h3 className="font-headline text-xl font-bold text-on-surface mb-4 px-1">
              Activities
            </h3>
            <ActivityFeed items={activities} selfUserId={selfUserId} />
          </section>
        )}
      </main>
    </div>
  );
}
