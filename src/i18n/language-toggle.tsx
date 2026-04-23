"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import type { Locale } from "./locale";

function setLocaleCookie(locale: Locale) {
  document.cookie = `locale=${locale};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;
}

export function LanguageToggle() {
  const locale = useLocale();
  const router = useRouter();

  function handleToggle() {
    const next = locale === "en" ? "zh" : "en";
    localStorage.setItem("locale", next);
    setLocaleCookie(next);
    router.refresh();
  }

  return (
    <button
      onClick={handleToggle}
      className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
      aria-label={locale === "en" ? "Switch to Chinese" : "Switch to English"}
    >
      {locale === "en" ? "中文" : "EN"}
    </button>
  );
}
