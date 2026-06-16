"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Link, useRouter } from "@/src/i18n/navigation";
import NextLink from "next/link";

export function SignupForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [alreadyExists, setAlreadyExists] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const t = setInterval(() => setCooldownSeconds((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [cooldownSeconds]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setAlreadyExists(false);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, mode: "signup" }),
      });

      if (res.status === 429) {
        setError("Too many attempts. Please wait 5 minutes before trying again.");
        return;
      }

      if (res.status === 503) {
        setError("We're experiencing high volume. Please wait a moment and try again.");
        setCooldownSeconds(30);
        return;
      }

      if (res.status === 409) {
        const data = await res.json().catch(() => ({}));
        if (data?.code === "ALREADY_EXISTS") {
          setAlreadyExists(true);
          return;
        }
        setError("An account with this email already exists.");
        return;
      }

      if (!res.ok) {
        setError("Failed to send verification code. Please try again.");
        setCooldownSeconds(30);
        return;
      }

      const data = await res.json().catch(() => ({}));
      const base = `/signup/verify?email=${encodeURIComponent(email)}`;
      router.push(data.queued ? `${base}&queued=true` : base);
    } catch {
      setError("Failed to send verification code. Please try again.");
      setCooldownSeconds(30);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      <div>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email..."
          className="w-full rounded-sm border border-foreground/10 bg-white px-4 py-3 text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
      </div>

      {error && <p className="text-sm text-primary text-center">{error}</p>}
      {alreadyExists && (
        <p className="text-sm text-primary text-center">
          An account with this email already exists.
          <br />
          <Link
            href={`/login?email=${encodeURIComponent(email)}`}
            className="underline font-medium"
          >
            Log in instead?
          </Link>
        </p>
      )}

      <button
        type="submit"
        disabled={loading || cooldownSeconds > 0}
        className="w-full rounded-sm bg-primary py-3 text-white font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {cooldownSeconds > 0
          ? `Try again in ${cooldownSeconds}s`
          : loading
            ? "Sending code…"
            : "Create account"}
      </button>

      <p className="text-center text-xs font-light text-foreground/60">
        By signing up, you agree to our <br />
        <NextLink href="https://collective.my/terms/" className="text-primary hover:underline">
          Terms of Use
        </NextLink>
        {" and "}
        <NextLink href="https://collective.my/privacy/" className="text-primary hover:underline">
          Privacy Policy
        </NextLink>
      </p>
    </form>
  );
}
