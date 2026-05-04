"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useRouter } from "next/navigation";

const HANDLE_REGEX = /^[a-z0-9_]{3,30}$/;

export default function OnboardingPage() {
  const t = useTranslations("onboarding");
  const router = useRouter();
  const [handle, setHandle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalized = handle.trim().toLowerCase();
  const isValid = HANDLE_REGEX.test(normalized);

  async function handleSubmit() {
    setError(null);
    if (!isValid) {
      setError(t("usernameInvalid"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ searchHandle: normalized }),
      });
      if (res.ok) {
        router.push("/");
        router.refresh();
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (res.status === 409 || data?.error === "username_taken") {
        setError(t("usernameTaken"));
      } else {
        setError(t("usernameInvalid"));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <div className="space-y-6 max-w-sm w-full">
        <div className="flex items-center justify-center w-20 h-20 mx-auto rounded-full bg-primary/10">
          <span className="material-symbols-outlined text-[40px] text-primary">
            alternate_email
          </span>
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
