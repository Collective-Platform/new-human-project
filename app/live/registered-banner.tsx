"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Overlay } from "@/app/components/overlay";

export function RegisteredBanner() {
  const params = useSearchParams();
  const [closed, setClosed] = useState(false);

  if (!params.get("registered")) return null;

  return (
    <Overlay variant="center" open={!closed} onClose={() => setClosed(true)}>
      <div className="relative w-full max-w-md rounded-sheet bg-[#111] p-8">
        <button
          onClick={() => setClosed(true)}
          className="absolute right-5 top-5 text-2xl leading-none text-white/40 hover:text-white"
        >
          ×
        </button>

        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-2xl font-black text-white">
          ✓
        </div>

        <h2 className="mb-1 text-2xl font-black text-white">You&rsquo;re registered!</h2>
        <p className="mb-6 text-white/60">
          See you at Rhythm Live on July 4. A receipt has been sent to your email.
        </p>

        <button
          onClick={() => setClosed(true)}
          className="w-full rounded-full bg-primary py-3 font-bold text-white transition-opacity hover:opacity-90 press"
        >
          Got it
        </button>
      </div>
    </Overlay>
  );
}
