"use client";

import { useEffect, useState } from "react";
import { subscribeToPush } from "@/src/features/notifications/subscribe";

// Side-effect import — must run on the client only, so it lives in an effect.
async function loadPwaInstall() {
  await import("@khmyznikov/pwa-install");
}

export function SwRegister() {
  const [showIOSInstall, setShowIOSInstall] = useState(false);

  useEffect(() => {
    // Reconcile the home-screen badge with the server's unread social count
    // whenever the app is opened or foregrounded. This is the single source of
    // truth, so a stale badge (e.g. left over after dismissing a push) self-
    // corrects — dropping to 0 clears it, matching the in-app bell.
    const reconcileBadge = async () => {
      try {
        const res = await fetch("/api/notifications/unread-count");
        if (!res.ok) return;
        const { count } = await res.json();
        if (typeof count !== "number") return;
        if (count > 0) {
          navigator.setAppBadge?.(count).catch(() => {});
        } else {
          navigator.clearAppBadge?.().catch(() => {});
        }
      } catch {
        // ignore — best-effort
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") reconcileBadge();
    };
    reconcileBadge();
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { updateViaCache: "none" })
        .then(async (registration) => {
          if ("Notification" in window && Notification.permission === "default") {
            const permission = await Notification.requestPermission();
            if (permission === "granted" && registration.pushManager) {
              subscribeToPush(registration);
            }
          } else if (
            "Notification" in window &&
            Notification.permission === "granted" &&
            registration.pushManager
          ) {
            subscribeToPush(registration);
          }
        })
        .catch(() => {});
    };

    if ("requestIdleCallback" in window) {
      requestIdleCallback(register);
    } else {
      setTimeout(register, 1);
    }
  }, []);

  // Only mount the install dialog on iOS (Android browsers surface their own
  // native install UI). Skip when already installed (standalone).
  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    if (!isIOS || isStandalone) return;

    let cancelled = false;
    loadPwaInstall().then(() => {
      if (!cancelled) setShowIOSInstall(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!showIOSInstall) return null;

  // The package's typings expect the literal strings "true"/"false" for its
  // boolean attributes (not React `Booleanish`), so pass them explicitly.
  return (
    <pwa-install
      manifest-url="/manifest.json"
      disable-chrome="true"
      install-description="Add this app to your Home Screen for smooth and easy access."
    />
  );
}
