"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useLocale } from "@/src/i18n/locale";
import Link from "next/link";

interface NotificationPrefs {
  daily_reminder: boolean;
  reminder_time: string;
  friend_requests: boolean;
}

export function SettingsClient() {
  const t = useTranslations("profile");
  const router = useRouter();
  const { locale, toggleLocale } = useLocale();

  const [prefs, setPrefs] = useState<NotificationPrefs>({
    daily_reminder: true,
    reminder_time: "08:00",
    friend_requests: true,
  });
  const [privacyPublic, setPrivacyPublic] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setPrefs(data.user.notificationPrefs);
          setPrivacyPublic(data.user.privacyPublic);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function updatePrefs(updated: NotificationPrefs) {
    setPrefs(updated);
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationPrefs: updated }),
    });
  }

  async function updatePrivacy(value: boolean) {
    setPrivacyPublic(value);
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ privacyPublic: value }),
    });
  }

  function handleLanguageToggle() {
    toggleLocale();
    router.refresh();
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-4 space-y-4">
      <div className="flex items-center gap-3">
        <Link
          href="/profile"
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-zinc-100"
        >
          <span className="material-symbols-outlined text-[20px] text-foreground/60">
            arrow_back
          </span>
        </Link>
        <h1 className="font-headline text-lg font-bold text-foreground">
          Settings
        </h1>
      </div>

      {/* Language */}
      <div className="rounded-md bg-white shadow-card">
        <div className="flex items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[20px] text-foreground/50">
              language
            </span>
            <span className="text-sm font-medium text-foreground">
              {t("language")}
            </span>
          </div>
          <button
            onClick={handleLanguageToggle}
            className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700"
          >
            {locale === "en" ? "English" : "中文"}
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="rounded-md bg-white shadow-card divide-y divide-zinc-100">
        <div className="px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wider text-foreground/50">
            {t("notifications")}
          </p>
        </div>

        <ToggleRow
          icon="notifications"
          label="Daily Reminders"
          checked={prefs.daily_reminder}
          onChange={(v) => updatePrefs({ ...prefs, daily_reminder: v })}
        />

        {prefs.daily_reminder && (
          <div className="flex items-center justify-between px-4 py-3.5">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[20px] text-foreground/50">
                schedule
              </span>
              <span className="text-sm font-medium text-foreground">
                Reminder Time
              </span>
            </div>
            <input
              type="time"
              value={prefs.reminder_time}
              onChange={(e) =>
                updatePrefs({ ...prefs, reminder_time: e.target.value })
              }
              className="rounded-md bg-zinc-100 px-2 py-1 text-xs text-foreground"
            />
          </div>
        )}

        <ToggleRow
          icon="person_add"
          label="Friend Requests"
          checked={prefs.friend_requests}
          onChange={(v) => updatePrefs({ ...prefs, friend_requests: v })}
        />
      </div>

      {/* Privacy */}
      <div className="rounded-md bg-white shadow-card">
        <div className="px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wider text-foreground/50">
            {t("privacy")}
          </p>
        </div>
        <ToggleRow
          icon="visibility"
          label="Activity visible to friends"
          checked={privacyPublic}
          onChange={updatePrivacy}
        />
      </div>
    </div>
  );
}

function ToggleRow({
  icon,
  label,
  checked,
  onChange,
}: {
  icon: string;
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-[20px] text-foreground/50">
          {icon}
        </span>
        <span className="text-sm font-medium text-foreground">{label}</span>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition-colors ${
          checked ? "bg-primary" : "bg-zinc-300"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
