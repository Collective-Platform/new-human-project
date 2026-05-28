"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/src/i18n/navigation";
import type { Locale } from "./locale";

export function LanguageToggle() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  function handleToggle() {
    const next: Locale = locale === "en" ? "zh" : "en";
    router.replace(pathname, { locale: next });
  }

  return (
    <button
      onClick={handleToggle}
      className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
      aria-label={locale === "en" ? "Switch to Chinese" : "Switch to English"}
    >
      {locale === "en" ? "中文" : "EN"}
    </button>
  );
}
