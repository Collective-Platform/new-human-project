import { getRequestConfig } from "next-intl/server";
import { routing } from "@/src/i18n/routing";
import en from "@/messages/en.json";
import zh from "@/messages/zh.json";

const messages = { en, zh } as const;
type AppLocale = keyof typeof messages;

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale: AppLocale = (routing.locales as readonly string[]).includes(requested ?? "")
    ? (requested as AppLocale)
    : routing.defaultLocale;

  return {
    locale,
    messages: messages[locale],
  };
});
