"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { BadgeGrid } from "./badge-grid";

interface ProfileData {
  user: {
    email: string;
    displayName: string | null;
    searchHandle: string | null;
    avatarUrl: string | null;
    notificationPrefs: {
      daily_reminder: boolean;
      reminder_time: string;
      friend_requests: boolean;
    };
    privacyPublic: boolean;
  };
  badges: {
    name: string;
    description: string | null;
    iconUrl: string | null;
    blockNumber: number;
    earnedAt: string;
  }[];
}

export function ProfileClient() {
  const t = useTranslations("profile");
  const router = useRouter();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/profile");
    if (res.ok) {
      setData(await res.json());
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  if (!data) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const { user, badges } = data;

  return (
    <div className="space-y-4 px-4 pt-4 pb-4">
      {/* User info card */}
      <div className="flex items-center gap-4 rounded-md bg-white p-5 shadow-card">
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.displayName ?? ""}
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-200">
            <span className="material-symbols-outlined text-[28px] text-zinc-500">
              person
            </span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="truncate font-headline text-lg font-bold text-foreground">
            {user.displayName ?? "User"}
          </p>
          <p className="truncate text-sm text-foreground/60">{user.email}</p>
          {user.searchHandle && (
            <p className="truncate text-sm text-foreground/40">
              @{user.searchHandle}
            </p>
          )}
        </div>
      </div>

      {/* Badges */}
      <BadgeGrid badges={badges} title={t("badges")} />

      {/* Menu items */}
      <div className="rounded-md bg-white shadow-card divide-y divide-zinc-100">
        <Link
          href="/profile/mood-history"
          className="flex items-center justify-between px-4 py-3.5"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[20px] text-foreground/50">
              mood
            </span>
            <span className="text-sm font-medium text-foreground">
              {t("moodHistory")}
            </span>
          </div>
          <span className="material-symbols-outlined text-[18px] text-foreground/30">
            chevron_right
          </span>
        </Link>

        <Link
          href="/profile/settings"
          className="flex items-center justify-between px-4 py-3.5"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[20px] text-foreground/50">
              settings
            </span>
            <span className="text-sm font-medium text-foreground">
              Settings
            </span>
          </div>
          <span className="material-symbols-outlined text-[18px] text-foreground/30">
            chevron_right
          </span>
        </Link>
      </div>

      {/* Log out */}
      <button
        onClick={handleLogout}
        disabled={loggingOut}
        className="w-full rounded-md bg-white py-3.5 text-sm font-semibold text-primary shadow-card transition-colors active:bg-zinc-50 disabled:opacity-50"
      >
        {loggingOut ? "Logging out…" : t("logOut")}
      </button>
    </div>
  );
}
