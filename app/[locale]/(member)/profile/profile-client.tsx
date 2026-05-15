"use client";

import { useEffect, useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/src/i18n/navigation";
import { Link } from "@/src/i18n/navigation";
import { User, Camera, Pencil } from "lucide-react";
import NextImage from "next/image";
import type { ProfileData } from "@/src/features/profile/get-profile-for-user";
import { updateProfile } from "@/src/features/profile/actions";
import { ActivityFeed, type FeedItem } from "../community/activity-feed";

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

  const scale = Math.min(1, MAX_AVATAR_DIMENSION / Math.max(img.width, img.height));
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
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [editingHandle, setEditingHandle] = useState(false);
  const [handleValue, setHandleValue] = useState("");
  const [savingHandle, setSavingHandle] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingHandle && handleInputRef.current) {
      handleInputRef.current.focus();
      handleInputRef.current.select();
    }
  }, [editingHandle]);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  function startEditingHandle() {
    setHandleValue(initialData?.user.searchHandle ?? "");
    setEditingHandle(true);
    setError(null);
  }

  function cancelEditingHandle() {
    setEditingHandle(false);
    setError(null);
  }

  async function saveHandle() {
    const normalized = handleValue.trim().toLowerCase();
    if (!normalized) {
      setError(t("usernameRequired"));
      return;
    }
    if (!HANDLE_REGEX.test(normalized)) {
      setError(t("usernameInvalid"));
      return;
    }
    if (normalized === initialData?.user.searchHandle) {
      setEditingHandle(false);
      return;
    }
    setSavingHandle(true);
    setError(null);
    try {
      const result = await updateProfile({ searchHandle: normalized });
      if ("error" in result) {
        if (result.error === "username_taken") {
          setError(t("usernameTaken"));
        } else {
          setError(t("usernameInvalid"));
        }
        return;
      }
      setEditingHandle(false);
      router.refresh();
    } finally {
      setSavingHandle(false);
    }
  }

  function triggerFileSelect() {
    fileInputRef.current?.click();
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
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
      const result = await updateProfile({ avatarUrl: dataUrl });
      if ("error" in result) {
        throw new Error(result.error ?? "Failed to upload avatar");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
    }
  }

  const { user } = initialData;

  return (
    <div className="min-h-screen bg-surface antialiased">
      <main className="max-w-2xl mx-auto px-6 pt-8 pb-8">
        {/* Profile header */}
        <section className="mb-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-4">
              {editingHandle ? (
                <div className="space-y-2">
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 font-headline text-lg font-bold text-on-surface/40">
                      @
                    </span>
                    <input
                      ref={handleInputRef}
                      type="text"
                      value={handleValue}
                      onChange={(e) => setHandleValue(e.target.value.toLowerCase())}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          saveHandle();
                        } else if (e.key === "Escape") {
                          e.preventDefault();
                          cancelEditingHandle();
                        }
                      }}
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      maxLength={30}
                      disabled={savingHandle}
                      aria-label={t("username")}
                      className="w-full rounded-md border border-outline-variant bg-surface pl-6 pr-2 py-1 font-headline text-lg font-bold text-on-surface focus:border-primary focus:outline-none disabled:opacity-60"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={saveHandle}
                      disabled={savingHandle}
                      className="rounded-md bg-primary px-3 py-1 text-xs font-semibold text-surface disabled:opacity-60"
                    >
                      {savingHandle ? t("saving") : t("save")}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditingHandle}
                      disabled={savingHandle}
                      className="rounded-md bg-surface-container px-3 py-1 text-xs font-semibold text-on-surface-variant disabled:opacity-60"
                    >
                      {t("cancel")}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <h2 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">
                      {user.searchHandle ? `@${user.searchHandle}` : t("username")}
                    </h2>
                    <button
                      type="button"
                      onClick={startEditingHandle}
                      aria-label={t("editUsername")}
                      title={t("editUsername")}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface-variant transition-colors hover:bg-surface-container-high"
                    >
                      <Pencil size={16} />
                    </button>
                  </div>
                  <Link
                    href="/community/friends"
                    className="self-start mt-4 inline-flex items-center gap-1.5 px-3 py-1 border border-outline-variant rounded-full text-on-surface-variant hover:bg-surface-container hover:border-primary/30 hover:text-primary transition-all active:scale-95"
                  >
                    <User size={14} />
                    <span className="text-xs font-bold font-headline">{friendCount} Friends</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Avatar with camera button */}
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
              <button
                type="button"
                onClick={triggerFileSelect}
                disabled={uploadingAvatar}
                aria-label={t("changePhoto")}
                title={t("changePhoto")}
                className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-surface shadow ring-2 ring-white transition-colors active:bg-primary/90 disabled:opacity-60"
              >
                {uploadingAvatar ? (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-surface border-t-transparent" />
                ) : (
                  <Camera size={16} />
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
          </div>

          {error && (
            <div role="alert" className="mt-3 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
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

      {/* Logout */}
      <div className="max-w-2xl mx-auto px-6 pb-8">
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full rounded-2xl bg-white py-3.5 text-sm font-semibold text-primary shadow-[0_4px_20px_rgba(53,50,47,0.04)] transition-colors active:bg-surface-container disabled:opacity-50"
        >
          {loggingOut ? "Logging out…" : t("logOut")}
        </button>
      </div>
    </div>
  );
}
