"use client";

import { useLocale } from "./locale";
import { useRouter } from "next/navigation";

export function LanguageToggle() {
  const { locale, toggleLocale } = useLocale();
  const router = useRouter();

  function handleToggle() {
    toggleLocale();
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
