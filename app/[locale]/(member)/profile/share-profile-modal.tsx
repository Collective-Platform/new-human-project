"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import QRCode from "react-qr-code";
import { X, Copy, Check, Share2 } from "lucide-react";
import { Overlay } from "@/app/components/overlay";

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

  // Browser-only values. The overlay renders nothing until isOpen is true, which
  // only happens after a user action, so we are always on the client by then.
  const profileUrl = `${typeof window === "undefined" ? "" : window.location.origin}/${locale}/community/${handle}`;
  const canShare = typeof navigator !== "undefined" && "share" in navigator;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    await navigator.share({ title: `@${handle} on Rhythm`, url: profileUrl });
  };

  return (
    <Overlay variant="center" open={isOpen} onClose={onCloseAction}>
      <div className="relative w-full max-w-sm rounded-sheet bg-surface p-6 shadow-float">
        <button
          onClick={onCloseAction}
          aria-label="Close"
          className="tap-target press absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant hover:bg-on-surface/5 transition-colors"
        >
          <X size={16} />
        </button>

        <h2 className="mb-6 text-center font-headline text-lg font-semibold text-on-surface">
          {t("shareProfile")}
        </h2>

        <div className="mb-4 flex justify-center">
          <div className="rounded-control bg-white p-4 shadow-card">
            <QRCode value={profileUrl} size={180} />
          </div>
        </div>

        <p className="mb-6 text-center font-headline text-base font-semibold text-on-surface">
          @{handle}
        </p>

        <div className="flex gap-3">
          <button
            onClick={handleCopy}
            className="flex flex-1 items-center justify-center gap-2 rounded-control border border-outline-variant bg-surface-container px-4 py-3 text-sm font-medium text-on-surface transition-all press"
          >
            {copied ? <Check size={16} className="text-primary" /> : <Copy size={16} />}
            {copied ? t("copied") : t("copyLink")}
          </button>

          {canShare && (
            <button
              onClick={handleShare}
              className="flex flex-1 items-center justify-center gap-2 rounded-control bg-primary px-4 py-3 text-sm font-medium text-on-primary transition-all press"
            >
              <Share2 size={16} />
              {t("shareVia")}
            </button>
          )}
        </div>
      </div>
    </Overlay>
  );
}
