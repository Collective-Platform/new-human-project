"use client";

import { useState, useCallback, useEffect } from "react";

export type Locale = "en" | "zh";

function getStoredLocale(): Locale {
  if (typeof window === "undefined") return "en";
  const stored = localStorage.getItem("locale");
  return stored === "zh" ? "zh" : "en";
}

function setLocaleCookie(locale: Locale) {
  document.cookie = `locale=${locale};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;
}

export function useLocale() {
  const [locale, setLocaleState] = useState<Locale>(getStoredLocale);

  useEffect(() => {
    setLocaleCookie(locale);
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    localStorage.setItem("locale", l);
    setLocaleCookie(l);
    setLocaleState(l);
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === "en" ? "zh" : "en");
  }, [locale, setLocale]);

  return { locale, setLocale, toggleLocale } as const;
}
