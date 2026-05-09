import { LanguageToggle } from "@/src/i18n/language-toggle";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-93.75 items-center justify-between px-4 py-3">
        <div className="flex items-center font-bold text-xl">Rhythm</div>

        <LanguageToggle />
      </div>
    </header>
  );
}
