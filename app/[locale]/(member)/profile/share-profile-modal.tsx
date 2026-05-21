"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import QRCode from "react-qr-code";
import { X, Copy, Check, Share2 } from "lucide-react";

export function ShareProfileModal({
  handle,
  isOpen,
  onCloseAction,
}: {
  handle: string;
  isOpen: boolean;
  onCloseAction: () => void;
}) {
  const locale = useLocale();
  const t = useTranslations("profile");
  const [copied, setCopied] = useState(false);

  // Return early before accessing browser APIs — by the time isOpen is true,
  // we're always on the client (it's set via user interaction).
  if (!isOpen) return null;

  const profileUrl = `${window.location.origin}/${locale}/community/${handle}`;
  const canShare = "share" in navigator;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    await navigator.share({ title: `@${handle} on Rhythm`, url: profileUrl });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onCloseAction}
    >
      <div
        className="relative mx-4 w-full max-w-sm rounded-2xl bg-surface p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onCloseAction}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container transition-colors"
        >
          <X size={16} />
        </button>

        <h2 className="mb-6 text-center font-headline text-lg font-bold text-on-surface">
          {t("shareProfile")}
        </h2>

        <div className="mb-4 flex justify-center">
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <QRCode value={profileUrl} size={180} />
          </div>
        </div>

        <p className="mb-6 text-center font-headline text-base font-semibold text-on-surface">
          @{handle}
        </p>

        <div className="flex gap-3">
          <button
            onClick={handleCopy}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-outline-variant bg-surface-container px-4 py-3 text-sm font-medium text-on-surface transition-all active:scale-95"
          >
            {copied ? <Check size={16} className="text-primary" /> : <Copy size={16} />}
            {copied ? t("copied") : t("copyLink")}
          </button>

          {canShare && (
            <button
              onClick={handleShare}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-on-primary transition-all active:scale-95"
            >
              <Share2 size={16} />
              {t("shareVia")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
