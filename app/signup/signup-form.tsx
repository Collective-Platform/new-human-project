"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function SignupForm({ initialEmail = "" }: { initialEmail?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [alreadyExists, setAlreadyExists] = useState(false);

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
        setError("Too many attempts. Please try again later.");
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
        setError("Something went wrong. Please try again.");
        return;
      }

      router.push(`/signup/verify?email=${encodeURIComponent(email)}`);
    } catch {
      setError("Something went wrong. Please try again.");
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

      {error && <p className="text-sm text-primary">{error}</p>}
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
        disabled={loading}
        className="w-full rounded-sm bg-primary py-3 text-white font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Sending code…" : "Create account"}
      </button>

      <p className="text-center text-sm text-foreground/60">
        By signing up, you agree to our <br />
        <Link
          href="https://collective.my/terms/"
          className="text-secondary hover:underline font-medium"
        >
          Terms of Use
        </Link>
        {" and "}
        <Link
          href="https://collective.my/privacy/"
          className="text-secondary hover:underline font-medium"
        >
          Privacy Policy
        </Link>
      </p>
    </form>
  );
}
