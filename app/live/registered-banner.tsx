"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

export function RegisteredBanner() {
  const params = useSearchParams();
  const [closed, setClosed] = useState(false);

  if (!params.get("registered") || closed) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={() => setClosed(true)}
    >
      <div
        className="relative w-full max-w-md rounded-3xl bg-[#111] p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setClosed(true)}
          className="absolute right-5 top-5 text-2xl leading-none text-white/40 hover:text-white"
        >
          ×
        </button>

        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-2xl font-black text-white">
          ✓
        </div>

        <h2 className="mb-1 text-2xl font-black text-white">
          You&rsquo;re registered!
        </h2>
        <p className="mb-6 text-white/60">
          See you at Rhythm Live on July 4. A receipt has been sent to your
          email.
        </p>

        <button
          onClick={() => setClosed(true)}
          className="w-full rounded-full bg-primary py-3 font-bold text-white transition-opacity hover:opacity-90 active:scale-[0.98]"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
