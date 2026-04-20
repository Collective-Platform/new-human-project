"use client";

import { useEffect, useState } from "react";

export function SwRegister() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showA2HS, setShowA2HS] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // Register service worker
    navigator.serviceWorker
      .register("/sw.js")
      .then(async (registration) => {
        // Request notification permission
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

    // Add to Home Screen prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      // Show after a short delay so it doesn't block initial experience
      const dismissed = localStorage.getItem("a2hs-dismissed");
      if (!dismissed) {
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

  if (!showA2HS) return null;

  return (
    <div className="fixed bottom-28 inset-x-4 z-50 rounded-md bg-white p-4 shadow-card">
      <div className="flex items-center gap-3">
        <span className="text-2xl">📱</span>
        <div className="flex-1">
          <p className="font-headline text-sm font-semibold text-foreground">
            Add to Home Screen
          </p>
          <p className="text-xs text-foreground/60">
            Install for the best experience
          </p>
        </div>
        <button
          onClick={handleInstall}
          className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-white"
        >
          Install
        </button>
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

async function subscribeToPush(registration: ServiceWorkerRegistration) {
  try {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) return;

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
      });
    }

    // Send subscription to server
    await fetch("/api/notifications/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription: subscription.toJSON() }),
    });
  } catch {
    // Push subscription not supported or permission denied
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Type for the beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
