"use client";

import { useEffect, useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/src/i18n/navigation";
import {
  ArrowLeft,
  // Bell, // unused while daily reminder is disabled
  // Clock, // unused while daily reminder is disabled
  UserPlus,
  Eye,
  Smartphone,
  Camera,
  User,
  Heart,
  type LucideIcon,
  Bell,
  Clock,
} from "lucide-react";
import NextImage from "next/image";
import { updateProfile } from "@/src/features/profile/actions";
import {
  subscribeToPush,
  getPushSubscription,
} from "@/src/features/notifications/subscribe";

const HANDLE_REGEX = /^[a-z0-9_]{3,30}$/;
const MAX_AVATAR_DIMENSION = 256;
const MAX_AVATAR_FILE_BYTES = 5 * 1024 * 1024;
const MAX_AVATAR_FILE_MB = 5;

async function fileToResizedDataUrl(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load image"));
    image.src = dataUrl;
  });

  const scale = Math.min(
    1,
    MAX_AVATAR_DIMENSION / Math.max(img.width, img.height),
  );
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.85);
}

interface NotificationPrefs {
  daily_reminder: boolean;
  reminder_time: string;
  reminder_timezone?: string;
  friend_requests: boolean;
  likes: boolean;
}

export function SettingsClient() {
  const t = useTranslations("profile");
  const st = useTranslations("settings");
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.replace("/login");
    }
  }

  // Profile fields
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [handleValue, setHandleValue] = useState("");
  const [email, setEmail] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Notification prefs
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    daily_reminder: true,
    reminder_time: "08:00",
    friend_requests: true,
    likes: true,
  });
  const [privacyPublic, setPrivacyPublic] = useState(true);
  const [loading, setLoading] = useState(true);
  const [pushStatus, setPushStatus] = useState<
    "loading" | "unsupported" | "denied" | "not-subscribed" | "subscribed"
  >("loading");
  const [testingSend, setTestingSend] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setAvatarUrl(data.user.avatarUrl ?? null);
          setHandleValue(data.user.searchHandle ?? "");
          setEmail(data.user.email ?? "");
          setPrefs(data.user.notificationPrefs);
          setPrivacyPublic(data.user.privacyPublic);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !("Notification" in window)
    ) {
      setPushStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setPushStatus("denied");
      return;
    }
    getPushSubscription()
      .then((sub) => setPushStatus(sub ? "subscribed" : "not-subscribed"))
      .catch(() => setPushStatus("unsupported"));
  }, []);

  async function sendTestNotification() {
    setTestingSend("sending");
    try {
      const res = await fetch("/api/notifications/test", { method: "POST" });
      setTestingSend(res.ok ? "sent" : "error");
    } catch {
      setTestingSend("error");
    }
    setTimeout(() => setTestingSend("idle"), 3000);
  }

  async function enablePush() {
    if (!("serviceWorker" in navigator)) return;
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setPushStatus("denied");
      return;
    }
    const registration = await navigator.serviceWorker.ready;
    const ok = await subscribeToPush(registration);
    if (ok) setPushStatus("subscribed");
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setProfileError(t("invalidImage"));
      return;
    }
    if (file.size > MAX_AVATAR_FILE_BYTES) {
      setProfileError(t("imageTooLarge", { max: MAX_AVATAR_FILE_MB }));
      return;
    }
    setUploadingAvatar(true);
    setProfileError(null);
    try {
      const dataUrl = await fileToResizedDataUrl(file);
      const result = await updateProfile({ avatarUrl: dataUrl });
      if ("error" in result)
        throw new Error(result.error ?? "Failed to upload");
      setAvatarUrl(dataUrl);
    } catch (err) {
      setProfileError(
        err instanceof Error ? err.message : "Failed to upload avatar",
      );
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function saveProfile() {
    setProfileError(null);
    const trimmedHandle = handleValue.trim().toLowerCase();
    if (trimmedHandle && !HANDLE_REGEX.test(trimmedHandle)) {
      setProfileError(t("usernameInvalid"));
      return;
    }
    setSavingProfile(true);
    try {
      const result = await updateProfile({
        searchHandle: trimmedHandle || undefined,
      });
      if ("error" in result) {
        setProfileError(
          result.error === "username_taken" ? t("usernameTaken") : result.error,
        );
      }
    } finally {
      setSavingProfile(false);
    }
  }

  async function updatePrefs(updated: NotificationPrefs) {
    setPrefs(updated);
    await updateProfile({ notificationPrefs: updated });
  }

  async function updatePrivacy(value: boolean) {
    setPrivacyPublic(value);
    await updateProfile({ privacyPublic: value });
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="px-3 pt-4 pb-4 space-y-4">
      <div className="flex items-center gap-3">
        <Link
          href="/profile"
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-zinc-100"
        >
          <ArrowLeft size={20} className="text-foreground/60" />
        </Link>
        <h1 className="font-headline text-lg font-bold text-foreground">
          {st("title")}
        </h1>
      </div>

      {/* Profile */}
      <div className="rounded-md bg-white shadow-card divide-y divide-zinc-100">
        <div className="px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wider text-foreground/50">
            {st("profileSection")}
          </p>
        </div>

        {/* Avatar + Username side by side */}
        <div className="flex items-center gap-4 px-4 py-4">
          {/* Photo on the left */}
          <div className="relative shrink-0">
            <div className="h-14 w-14 overflow-hidden rounded-full border border-zinc-200 bg-zinc-100 flex items-center justify-center">
              {avatarUrl ? (
                <NextImage
                  src={avatarUrl}
                  alt="Avatar"
                  width={56}
                  height={56}
                  unoptimized
                  className="rounded-full object-cover"
                  style={{ width: 56, height: 56 }}
                />
              ) : (
                <User size={24} className="text-zinc-400" />
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              aria-label="Change photo"
              className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white shadow ring-2 ring-white disabled:opacity-60"
            >
              {uploadingAvatar ? (
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Camera size={12} />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          {/* Username on the right */}
          <div className="flex-1 space-y-1">
            <label className="text-xs text-foreground/50">
              {st("usernameLabel")}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-foreground/40">
                @
              </span>
              <input
                type="text"
                value={handleValue}
                onChange={(e) => setHandleValue(e.target.value.toLowerCase())}
                autoCapitalize="none"
                autoCorrect="off"
                maxLength={30}
                placeholder="yourhandle"
                className="w-full rounded-md border border-zinc-200 bg-zinc-50 py-2 pl-7 pr-3 text-sm text-foreground outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* Email (read-only) */}
        <div className="px-4 py-3.5 space-y-1">
          <label className="text-xs text-foreground/50">
            {st("emailLabel")}
          </label>
          <p className="text-sm text-foreground/70">{email}</p>
        </div>

        {profileError && (
          <div className="px-4 py-2">
            <p className="text-xs text-red-600">{profileError}</p>
          </div>
        )}

        <div className="px-4 py-3">
          <button
            onClick={saveProfile}
            disabled={savingProfile}
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {savingProfile ? t("saving") : st("saveProfile")}
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
        {/* Push subscription status */}
        <div className="flex items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-3">
            <Smartphone size={20} className="text-foreground/50" />
            <span className="text-sm font-medium text-foreground">
              {st("pushNotifications")}
            </span>
          </div>
          {pushStatus === "loading" && (
            <span className="text-xs text-foreground/40">
              {st("pushChecking")}
            </span>
          )}
          {pushStatus === "subscribed" && (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs font-medium text-green-600">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                {st("pushActive")}
              </span>
              <button
                onClick={sendTestNotification}
                disabled={testingSend === "sending"}
                className="rounded-full border border-zinc-200 px-2.5 py-1 text-xs font-medium text-foreground/60 hover:bg-zinc-50 disabled:opacity-50"
              >
                {testingSend === "sending"
                  ? st("pushSending")
                  : testingSend === "sent"
                    ? st("pushSent")
                    : testingSend === "error"
                      ? st("pushFailed")
                      : st("pushTest")}
              </button>
            </div>
          )}
          {pushStatus === "not-subscribed" && (
            <button
              onClick={enablePush}
              className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white"
            >
              {st("pushEnable")}
            </button>
          )}
          {pushStatus === "denied" && (
            <span className="text-xs text-foreground/40">
              {st("pushBlocked")}
            </span>
          )}
          {pushStatus === "unsupported" && (
            <span className="text-xs text-foreground/40">
              {st("pushUnsupported")}
            </span>
          )}
        </div>
        <ToggleRow
          Icon={Bell}
          label={st("dailyReminders")}
          checked={prefs.daily_reminder}
          onChange={(v) => updatePrefs({ ...prefs, daily_reminder: v })}
        />
        {prefs.daily_reminder && (
          <div className="flex items-center justify-between px-4 py-3.5">
            <div className="flex items-center gap-3">
              <Clock size={20} className="text-foreground/50" />
              <span className="text-sm font-medium text-foreground">
                {st("reminderTime")}
              </span>
            </div>
            <input
              type="time"
              value={prefs.reminder_time}
              onChange={(e) =>
                updatePrefs({
                  ...prefs,
                  reminder_time: e.target.value,
                  reminder_timezone:
                    Intl.DateTimeFormat().resolvedOptions().timeZone,
                })
              }
              className="rounded-md bg-zinc-100 px-2 py-1 text-xs text-foreground"
            />
          </div>
        )}
        <ToggleRow
          Icon={UserPlus}
          label={st("friendRequests")}
          checked={prefs.friend_requests}
          onChange={(v) => updatePrefs({ ...prefs, friend_requests: v })}
        />
        <ToggleRow
          Icon={Heart}
          label={st("likeNotifications")}
          checked={prefs.likes}
          onChange={(v) => updatePrefs({ ...prefs, likes: v })}
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
          Icon={Eye}
          label={st("activityVisible")}
          checked={privacyPublic}
          onChange={updatePrivacy}
        />
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        disabled={loggingOut}
        className="w-full rounded-2xl bg-white py-3.5 text-sm font-semibold text-primary shadow-[0_4px_20px_rgba(53,50,47,0.04)] transition-colors active:bg-surface-container disabled:opacity-50"
      >
        {loggingOut ? st("loggingOut") : t("logOut")}
      </button>
    </div>
  );
}

function ToggleRow({
  Icon,
  label,
  checked,
  onChange,
}: {
  Icon: LucideIcon;
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5">
      <div className="flex items-center gap-3">
        <Icon size={20} className="text-foreground/50" />
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
