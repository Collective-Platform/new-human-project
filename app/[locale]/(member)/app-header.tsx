import { getTranslations } from "next-intl/server";
import { LanguageToggle } from "@/src/i18n/language-toggle";
import { NotificationBell } from "@/src/features/notifications/notification-bell";

export async function AppHeader() {
  const t = await getTranslations("nav");
  return (
    <header className="sticky top-0 z-40 bg-white">
      <div className="mx-auto flex max-w-93.75 items-center justify-between px-3 py-3">
        <div
          className="flex items-center font-bold text-xl text-primary"
          style={{ fontFamily: "var(--font-nowstalgic), sans-serif" }}
        >
          {t("appName")}
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <LanguageToggle />
        </div>
      </div>
    </header>
  );
}
