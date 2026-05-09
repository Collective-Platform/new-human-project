import { redirect } from "next/navigation";
import { getSessionUser } from "@/src/features/auth";
import { getDayCompletions } from "@/src/features/dashboard";

const categoryDotColor: Record<string, string> = {
  Mental: "bg-category-mental",
  Emotional: "bg-category-emotional",
  Physical: "bg-category-physical border border-[#d4c8a0]",
};

export async function CalendarDayData({
  locale,
  dateStr,
}: {
  locale: string;
  dateStr: string;
}) {
  const user = await getSessionUser();
  if (!user) redirect(`/${locale}/login`);
  if (!user.onboardedAt) redirect(`/${locale}`);

  const date = new Date(dateStr + "T00:00:00");
  if (isNaN(date.getTime())) redirect(`/${locale}`);

  const completions = await getDayCompletions(user.id, date, user.onboardedAt);

  const formatted = date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <h1 className="font-headline text-lg font-bold">{formatted}</h1>

      {completions.length === 0 ? (
        <div className="rounded-md bg-white p-6 shadow-card text-center text-sm text-foreground/50">
          No completions for this day
        </div>
      ) : (
        <div className="rounded-md bg-white shadow-card divide-y divide-zinc-100">
          {completions.map((item, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-4">
              <span
                className={`h-3 w-3 shrink-0 rounded-full ${categoryDotColor[item.category] ?? "bg-zinc-300"}`}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">
                  {item.name}
                </p>
                <p className="text-xs text-foreground/50">{item.category}</p>
              </div>
              <span className="text-xs text-foreground/40">
                {item.completedAt.toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
