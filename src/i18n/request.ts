import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import en from "@/messages/en.json";
import zh from "@/messages/zh.json";

const messages = { en, zh } as const;

export default getRequestConfig(async () => {
  const store = await cookies();
  const locale = (store.get("locale")?.value === "zh" ? "zh" : "en") as keyof typeof messages;

  return {
    locale,
    messages: messages[locale],
  };
});
