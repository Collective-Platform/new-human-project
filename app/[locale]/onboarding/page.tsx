"use client";

import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AtSign, Bell, CheckCircle } from "lucide-react";
import { completeOnboarding } from "@/src/features/onboarding/actions";

const HANDLE_REGEX = /^[a-z0-9_]{3,30}$/;

export default function OnboardingPage() {
  const t = useTranslations("onboarding");
  const router = useRouter();
  const [handle, setHandle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"handle" | "install">("handle");

  // Install prompt state
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS] = useState(
    () =>
      typeof window !== "undefined" &&
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !("MSStream" in window),
  );
  const [isStandalone] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(display-mode: standalone)").matches,
  );
  const [notifStatus, setNotifStatus] = useState<"idle" | "granted" | "denied">(
    "idle",
  );

  const normalized = handle.trim().toLowerCase();
  const isValid = HANDLE_REGEX.test(normalized);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleSubmit() {
    setError(null);
    if (!isValid) {
      setError(t("usernameInvalid"));
      return;
    }
    setLoading(true);
    try {
      const result = await completeOnboarding({ searchHandle: normalized });
      if (!("error" in result)) {
        setStep("install");
        return;
      }
      if (result.error === "username_taken") {
        setError(t("usernameTaken"));
      } else {
        setError(t("usernameInvalid"));
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleInstall() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }

  async function handleEnableNotifications() {
    if (!("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    setNotifStatus(permission === "granted" ? "granted" : "denied");
  }

  function handleContinue() {
    // Mark A2HS as seen so the floating card in the member area doesn't repeat it
    localStorage.setItem("a2hs-dismissed", "1");
    router.push("/");
    router.refresh();
  }

  if (step === "install") {
    const showInstallSection = (installPrompt || isIOS) && !isStandalone;

    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="space-y-8 max-w-sm w-full">
          <div>
            <h1 className="text-3xl font-bold font-headline text-foreground">
              Set up your experience
            </h1>
            <p className="mt-2 text-foreground/60 leading-relaxed">
              Get the most out of the app with these quick steps.
            </p>
          </div>

          {/* Install section */}
          {showInstallSection && (
            <div className="rounded-xl border border-zinc-100 bg-white p-5 text-left shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📱</span>
                <div>
                  <p className="font-semibold text-sm text-foreground">
                    Add to Home Screen
                  </p>
                  <p className="text-xs text-foreground/60">
                    Access the app like a native app
                  </p>
                </div>
              </div>
              {isIOS ? (
                <p className="text-sm text-foreground/70">
                  Tap the share icon <strong>⎋</strong> in Safari, then tap{" "}
                  <strong>&quot;Add to Home Screen&quot; ➕</strong>
                </p>
              ) : (
                <button
                  onClick={handleInstall}
                  className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white"
                >
                  Add to Home Screen
                </button>
              )}
            </div>
          )}

          {/* Notifications section */}
          {"Notification" in (typeof window !== "undefined" ? window : {}) && (
            <div className="rounded-xl border border-zinc-100 bg-white p-5 text-left shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                <Bell size={24} className="text-primary" />
                <div>
                  <p className="font-semibold text-sm text-foreground">
                    Enable Notifications
                  </p>
                  <p className="text-xs text-foreground/60">
                    Get notified about friend requests and activity
                  </p>
                </div>
              </div>
              {notifStatus === "granted" ? (
                <div className="flex items-center gap-2 text-sm font-medium text-green-600">
                  <CheckCircle size={16} />
                  Notifications enabled
                </div>
              ) : notifStatus === "denied" ? (
                <p className="text-xs text-foreground/40">
                  Blocked — you can enable notifications later in your browser
                  settings.
                </p>
              ) : (
                <button
                  onClick={handleEnableNotifications}
                  className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white"
                >
                  Allow Notifications
                </button>
              )}
            </div>
          )}

          <button
            onClick={handleContinue}
            className="w-full rounded-md bg-zinc-900 py-4 text-white font-semibold text-lg transition-opacity hover:opacity-90"
          >
            Continue →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <div className="space-y-6 max-w-sm w-full">
        <div className="flex items-center justify-center w-20 h-20 mx-auto rounded-full bg-primary/10">
          <AtSign size={40} className="text-primary" />
        </div>
        <h1 className="text-3xl font-bold font-headline text-foreground">
          {t("pickUsernameTitle")}
        </h1>
        <p className="text-foreground/60 leading-relaxed">
          {t("pickUsernameSubtitle")}
        </p>

        <div className="relative text-left">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40">
            @
          </span>
          <input
            type="text"
            value={handle}
            onChange={(e) => {
              setHandle(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (!loading) handleSubmit();
              }
            }}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            maxLength={30}
            disabled={loading}
            placeholder={t("usernamePlaceholder")}
            aria-label={t("pickUsernameTitle")}
            aria-invalid={error ? true : undefined}
            className="w-full rounded-md border border-zinc-200 bg-white py-3 pl-7 pr-3 text-base text-foreground outline-none focus:border-primary disabled:opacity-60"
          />
        </div>

        {error ? (
          <p role="alert" className="text-sm text-red-600 text-left">
            {error}
          </p>
        ) : (
          <p className="text-xs text-foreground/40 text-left">
            {t("usernameRules")}
          </p>
        )}
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading || !isValid}
        className="mt-8 w-full max-w-sm rounded-md bg-primary py-4 text-white font-semibold text-lg transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? t("saving") : t("getStarted")}
      </button>
    </div>
  );
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
