import { cookies } from "next/headers";
import { getSessionUser } from "@/src/features/auth";
import { getCurrentDay, getVerseOfTheDay } from "@/src/features/dashboard";
import { DashboardClient } from "./dashboard/dashboard-client";

export default async function HomePage() {
  const user = await getSessionUser();
  if (!user?.onboardedAt) return null;

  const currentDay = getCurrentDay(user.onboardedAt);
  const verseTask = await getVerseOfTheDay(1, currentDay);

  const store = await cookies();
  const locale = (store.get("locale")?.value === "zh" ? "zh" : "en") as
    | "en"
    | "zh";

  let verse: { reference: string; text: string } | null = null;

  if (verseTask?.content) {
    const content = verseTask.content as Record<string, unknown>;
    const ref = (content.memory_verse_reference as string) ?? "";
    const textField = content.memory_verse_text;
    let text = "";
    if (typeof textField === "object" && textField !== null) {
      const localized = textField as Record<string, string>;
      text = localized[locale] ?? localized.en ?? "";
    } else if (typeof textField === "string") {
      text = textField;
    }
    verse = { reference: ref, text };
  }

  return <DashboardClient verse={verse} />;
}
