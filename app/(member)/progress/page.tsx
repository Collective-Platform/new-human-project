import { cookies } from "next/headers";
import { ProgressClient } from "./progress-client";

export default async function ProgressPage() {
  const store = await cookies();
  const locale = store.get("locale")?.value === "zh" ? "zh" : "en";

  return <ProgressClient locale={locale} />;
}
