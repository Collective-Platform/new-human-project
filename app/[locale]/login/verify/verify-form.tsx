"use client";

import { OTPInput, type SlotProps } from "input-otp";
import { useState } from "react";
import { useRouter } from "@/src/i18n/navigation";

type Mode = "login" | "signup";

function FakeCaret() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center animate-[blink_1s_steps(1,end)_infinite]">
      <div className="h-1/2 w-px bg-foreground" />
    </div>
  );
}

function Slot({ isActive, char, hasFakeCaret }: SlotProps) {
  return (
    <div
      className={[
        "relative flex aspect-square items-center justify-center bg-surface-container-lowest",
        "border-y border-r border-outline-variant/85 first:border-l first:rounded-l-sm last:rounded-r-sm",
        isActive ? "z-10 ring-1 ring-inset ring-primary transition-all" : "",
      ].join(" ")}
    >
      {char !== null && <span className="font-mono text-lg text-foreground">{char}</span>}
      {hasFakeCaret && <FakeCaret />}
    </div>
  );
}

export function VerifyForm({
  email,
  mode = "login",
  queued = false,
}: {
  email: string;
  mode?: Mode;
  queued?: boolean;
}) {
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [resent, setResent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, mode }),
      });

      if (res.status === 429) {
        setError("Too many attempts. Please try again later.");
        return;
      }

      if (res.status === 401) {
        setError("Invalid or expired code. Please try again.");
        return;
      }

      if (!res.ok) {
        setError("Something went wrong. Please try again.");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setError("");
    setResent(false);

    try {
      const res = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, mode }),
      });

      if (res.status === 429) {
        setError("Too many attempts. Please wait 5 minutes before trying again.");
        return;
      }

      if (res.status === 503) {
        setError("We're experiencing high volume. Please try again in a moment.");
        return;
      }

      if (!res.ok) {
        setError("Failed to resend code. Please try again.");
        return;
      }

      setResent(true);
    } catch {
      setError("Failed to resend code. Please try again.");
    } finally {
      setResending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      {queued && (
        <p className="text-sm border-category-mental bg-category-mental-bg border rounded-xl text-foreground text-center px-4 py-2 mt-4">
          Due to high volume, your code will arrive in
          <br></br>
          <strong>1 minute</strong>. Thank you for your patience 🙏🏻
        </p>
      )}

      <div>
        <label className="block text-sm font-medium text-foreground/70 mb-3">
          Verification code
        </label>
        <OTPInput
          value={otp}
          onChange={setOtp}
          maxLength={6}
          className="w-full"
          render={({ slots }) => (
            <div className="grid w-full auto-rows-fr grid-cols-6">
              {slots.map((slot, i) => (
                <Slot key={i} {...slot} />
              ))}
            </div>
          )}
        />
      </div>

      {error && <p className="text-sm text-primary text-center">{error}</p>}
      {resent && <p className="text-sm text-secondary">A new code has been sent.</p>}

      <button
        type="submit"
        disabled={loading || otp.length !== 6}
        className="w-full rounded-sm bg-primary py-3 text-white font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Verifying…" : "Verify"}
      </button>

      <div className="text-center">
        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="text-sm text-primary hover:underline disabled:opacity-50"
        >
          {resending ? "Sending…" : "Resend code"}
        </button>
      </div>
    </form>
  );
}
