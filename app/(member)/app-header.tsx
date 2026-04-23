"use client";

import { LanguageToggle } from "@/src/i18n/language-toggle";
import Link from "next/link";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-200">
            <span className="material-symbols-outlined text-[20px] text-zinc-500">
              person
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <LanguageToggle />
          <Link
            href="/profile"
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-zinc-100 transition-colors"
            aria-label="Settings"
          >
            <span className="material-symbols-outlined text-[22px] text-zinc-600">
              settings
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
