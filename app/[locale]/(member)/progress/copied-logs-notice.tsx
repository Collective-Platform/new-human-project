"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

const storageKey = (planId: string) => `copied-logs-notice-dismissed:${planId}`;

/**
 * Tells a member who joined a running block why some earlier mood and exercise tasks are
 * already done. It stays until they close it. The choice is saved on this device.
 */
export function CopiedLogsNotice({ planId }: { planId: string }) {
  const t = useTranslations("progress");
  const [visible, setVisible] = useState(false);

  // localStorage exists only in the browser, so the first render stays hidden on both sides.
  useEffect(() => {
    setVisible(localStorage.getItem(storageKey(planId)) === null);
  }, [planId]);

  if (!visible) return null;

  return (
    <div
      role="status"
      className="animate-list-in mb-4 flex items-start gap-3 rounded-control bg-tertiary-container px-4 py-3 text-sm text-on-tertiary-fixed-variant"
    >
      <p className="min-w-0 flex-1">{t("copiedLogsNotice")}</p>
      <button
        type="button"
        onClick={() => {
          localStorage.setItem(storageKey(planId), "1");
          setVisible(false);
        }}
        className="press tap-target shrink-0 rounded-full p-0.5"
        aria-label={t("copiedLogsNoticeClose")}
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
