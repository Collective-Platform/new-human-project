import { getTranslations } from "next-intl/server";
import { LanguageToggle } from "@/src/i18n/language-toggle";
import { NotificationBell } from "@/src/features/notifications/notification-bell";

export async function AppHeader() {
  const t = await getTranslations("nav");
  return (
    <header className="">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 sm:px-6 md:px-8 py-3">
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
