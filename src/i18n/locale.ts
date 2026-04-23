"use client";

import { useState, useCallback, useEffect } from "react";

export type Locale = "en" | "zh";

function getLocaleCookie(): Locale {
  if (typeof document === "undefined") return "en";
  const match = document.cookie.match(/(?:^|;\s*)locale=(\w+)/);
  return match?.[1] === "zh" ? "zh" : "en";
}

function setLocaleCookie(locale: Locale) {
  document.cookie = `locale=${locale};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;
}

export function useLocale() {
  // Initialize from the cookie so it matches what the server read in request.ts
  const [locale, setLocaleState] = useState<Locale>(getLocaleCookie);

  // Sync localStorage → cookie on mount (in case they diverged)
  useEffect(() => {
    const stored = localStorage.getItem("locale");
    if (stored === "zh" || stored === "en") {
      if (stored !== locale) {
        setLocaleCookie(stored);
        setLocaleState(stored);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
