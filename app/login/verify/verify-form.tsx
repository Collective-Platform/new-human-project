"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Mode = "login" | "signup";

export function VerifyForm({ email, mode = "login" }: { email: string; mode?: Mode }) {
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
        setError("Too many attempts. Please try again later.");
        return;
      }

      setResent(true);
    } catch {
      setError("Failed to resend code.");
    } finally {
      setResending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      <div>
        <label
          htmlFor="otp"
          className="block text-sm font-medium text-foreground/70 mb-1"
        >
          Verification code
        </label>
        <input
          id="otp"
          type="text"
          inputMode="numeric"
          pattern="[0-9]{6}"
          maxLength={6}
          required
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
          placeholder="000000"
          className="w-full rounded-sm border border-foreground/10 bg-white px-4 py-3 text-center text-2xl tracking-[0.3em] font-mono text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
      </div>

      {error && <p className="text-sm text-primary">{error}</p>}
      {resent && (
        <p className="text-sm text-secondary">A new code has been sent.</p>
      )}

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
          className="text-sm text-secondary hover:underline disabled:opacity-50"
        >
          {resending ? "Sending…" : "Resend code"}
        </button>
      </div>
    </form>
  );
}
