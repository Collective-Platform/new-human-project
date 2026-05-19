"use client";

import { useEffect, useState } from "react";
import { subscribeToPush } from "@/src/features/notifications/subscribe";

export function SwRegister() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS] = useState(
    () => /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window),
  );
  const [isStandalone] = useState(() => window.matchMedia("(display-mode: standalone)").matches);
  const [showA2HS, setShowA2HS] = useState(() => {
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    return ios && !standalone && !localStorage.getItem("a2hs-dismissed");
  });

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        navigator.clearAppBadge?.().catch(() => {});
      }
    };
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

    // Add to Home Screen prompt — listen immediately, not deferred.
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      if (!localStorage.getItem("a2hs-dismissed")) {
        setShowA2HS(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    setShowA2HS(false);
    setInstallPrompt(null);
  }

  function handleDismissA2HS() {
    localStorage.setItem("a2hs-dismissed", "1");
    setShowA2HS(false);
  }

  if (!showA2HS || isStandalone) return null;

  return (
    <div className="fixed bottom-28 inset-x-4 z-50 rounded-md bg-white p-4 shadow-card">
      <div className="flex items-center gap-3">
        <span className="text-2xl">📱</span>
        <div className="flex-1">
          <p className="font-headline text-sm font-semibold text-foreground">Add to Home Screen</p>
          {isIOS ? (
            <p className="text-xs text-foreground/60">
              Tap the share icon ⎋ then &quot;Add to Home Screen&quot; ➕
            </p>
          ) : (
            <p className="text-xs text-foreground/60">Install for the best experience</p>
          )}
        </div>
        {!isIOS && (
          <button
            onClick={handleInstall}
            className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-white"
          >
            Install
          </button>
        )}
        <button
          onClick={handleDismissA2HS}
          className="text-foreground/40 hover:text-foreground/70"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// Type for the beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
