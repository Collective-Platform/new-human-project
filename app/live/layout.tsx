import type { Metadata } from "next";
import type { ReactNode } from "react";

// Standalone landing layout for the "Rhythm Live" event (live.rhythm.you).
// No NextIntlClientProvider / locale: this is a single-language marketing page
// with no backend. The root app/layout.tsx still provides fonts + globals.css.
export const metadata: Metadata = {
  title: "Rhythm Live II - 3rd October 2026",
  description: "The Wind in the Word: A Deep Dive at Rhythm Live II.",
};

export default function LiveLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage: "url(/live/rhythm-live-texture.png)",
          backgroundRepeat: "repeat",
          backgroundSize: "960px 540px",
          mixBlendMode: "multiply",
          opacity: 0.2,
          pointerEvents: "none",
          zIndex: 9999,
        }}
      />
    </>
  );
}
