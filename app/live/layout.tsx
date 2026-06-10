import type { Metadata } from "next";
import type { ReactNode } from "react";

// Standalone landing layout for the "Rhythm Live" event (live.rhythm.you).
// No NextIntlClientProvider / locale: this is a single-language marketing page
// with no backend. The root app/layout.tsx still provides fonts + globals.css.
export const metadata: Metadata = {
  title: "Rhythm Live — July 4, 2026",
  description:
    "Rhythm Live: a 5-hour gathering for the rhythm.you community. Mental. Emotional. Physical. Collective, Subang Jaya — July 4, 2026.",
};

export default function LiveLayout({ children }: { children: ReactNode }) {
  return children;
}
