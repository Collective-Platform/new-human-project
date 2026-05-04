"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function LoginForm({ initialEmail = "" }: { initialEmail?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notExists, setNotExists] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotExists(false);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, mode: "login" }),
      });

      if (res.status === 429) {
        setError("Too many attempts. Please try again later.");
        return;
      }

      if (res.status === 404) {
        const data = await res.json().catch(() => ({}));
        if (data?.code === "NOT_EXISTS") {
          setNotExists(true);
          return;
        }
        setError("No account found for this email.");
        return;
      }

      if (!res.ok) {
        setError("Something went wrong. Please try again.");
        return;
      }

      router.push(`/login/verify?email=${encodeURIComponent(email)}`);
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
      {notExists && (
        <p className="text-sm text-primary text-center">
          No account found for this email.
          <br />
          <Link
            href={`/signup?email=${encodeURIComponent(email)}`}
            className="underline font-medium"
          >
            Sign up instead?
          </Link>
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-sm bg-primary py-3 text-white font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Sending code…" : "Continue"}
      </button>
    </form>
  );
}
