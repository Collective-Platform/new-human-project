"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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

const MAX_AVATAR_DIMENSION = 256;
const MAX_AVATAR_FILE_BYTES = 5 * 1024 * 1024; // 5 MB — standard for profile photos
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
    MAX_AVATAR_DIMENSION / Math.max(img.width, img.height)
  );
  const targetW = Math.round(img.width * scale);
  const targetH = Math.round(img.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(img, 0, 0, targetW, targetH);
  return canvas.toDataURL("image/jpeg", 0.85);
}

export function ProfileClient() {
  const t = useTranslations("profile");
  const router = useRouter();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/profile");
    if (res.ok) {
      setData(await res.json());
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (editingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [editingName]);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  function startEditingName() {
    setNameValue(data?.user.displayName ?? "");
    setEditingName(true);
    setError(null);
  }

  function cancelEditingName() {
    setEditingName(false);
    setError(null);
  }

  async function saveName() {
    const trimmed = nameValue.trim();
    if (!trimmed) {
      setError(t("nameRequired"));
      return;
    }
    if (trimmed.length > 50) {
      setError(t("nameTooLong"));
      return;
    }
    if (trimmed === data?.user.displayName) {
      setEditingName(false);
      return;
    }
    setSavingName(true);
    setError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: trimmed }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to update name");
      }
      setEditingName(false);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update name");
    } finally {
      setSavingName(false);
    }
  }

  function triggerFileSelect() {
    fileInputRef.current?.click();
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting same file later
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError(t("invalidImage"));
      return;
    }
    if (file.size > MAX_AVATAR_FILE_BYTES) {
      setError(t("imageTooLarge", { max: MAX_AVATAR_FILE_MB }));
      return;
    }

    setUploadingAvatar(true);
    setError(null);
    try {
      const dataUrl = await fileToResizedDataUrl(file);
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: dataUrl }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to upload avatar");
      }
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
    }
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
        {/* Avatar with camera button */}
        <div className="relative shrink-0">
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
          <button
            type="button"
            onClick={triggerFileSelect}
            disabled={uploadingAvatar}
            aria-label={t("changePhoto")}
            title={t("changePhoto")}
            className="absolute -bottom-0.5 -right-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white shadow ring-2 ring-white transition-colors active:bg-primary/90 disabled:opacity-60"
          >
            {uploadingAvatar ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <span className="material-symbols-outlined text-[16px]">
                photo_camera
              </span>
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

        {/* Name + edit */}
        <div className="flex-1 min-w-0">
          {editingName ? (
            <div className="space-y-2">
              <input
                ref={nameInputRef}
                type="text"
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    saveName();
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    cancelEditingName();
                  }
                }}
                maxLength={50}
                disabled={savingName}
                aria-label={t("displayName")}
                className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1 font-headline text-lg font-bold text-foreground focus:border-primary focus:outline-none disabled:opacity-60"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={saveName}
                  disabled={savingName}
                  className="rounded-md bg-primary px-3 py-1 text-xs font-semibold text-white disabled:opacity-60"
                >
                  {savingName ? t("saving") : t("save")}
                </button>
                <button
                  type="button"
                  onClick={cancelEditingName}
                  disabled={savingName}
                  className="rounded-md bg-zinc-100 px-3 py-1 text-xs font-semibold text-foreground/70 disabled:opacity-60"
                >
                  {t("cancel")}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="truncate font-headline text-lg font-bold text-foreground">
                {user.displayName ?? "User"}
              </p>
              <button
                type="button"
                onClick={startEditingName}
                aria-label={t("editName")}
                title={t("editName")}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-foreground/60 transition-colors hover:bg-zinc-200"
              >
                <span className="material-symbols-outlined text-[16px]">
                  edit
                </span>
              </button>
            </div>
          )}
          <p className="truncate text-sm text-foreground/60">{user.email}</p>
          {user.searchHandle && (
            <p className="truncate text-sm text-foreground/40">
              @{user.searchHandle}
            </p>
          )}
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-700"
        >
          {error}
        </div>
      )}

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
