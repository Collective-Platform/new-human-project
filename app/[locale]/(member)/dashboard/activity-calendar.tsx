import { Link } from "@/src/i18n/navigation";
import { formatMonthLabel } from "./month-label";

const r = 17;
const circumference = 2 * Math.PI * r;
const segLength = circumference / 3;
const gap = 6;

const categorySegments: Record<string, { strokeColor: string; offset: number }> = {
  Emotional: {
    strokeColor: "var(--category-emotional)",
    offset: -(gap / 2),
  },
  Physical: {
    strokeColor: "var(--category-physical)",
    offset: -(segLength + gap / 2),
  },
  Mental: {
    strokeColor: "var(--category-mental)",
    offset: -(segLength * 2 + gap / 2),
  },
};

/**
 * One calendar month, Monday to Sunday. It shows the month that holds `monthStartDate`
 * (the member's current month). Days after today stay empty.
 */
export function ActivityCalendar({
  data,
  monthStartDate,
  title,
  locale,
}: {
  data: { date: string; categories: string[] }[];
  /** First day of the month, as YYYY-MM-01. */
  monthStartDate: string;
  title: string;
  locale: string;
}) {
  const dateMap = new Map(data.map((d) => [d.date, d.categories]));

  const start = new Date(monthStartDate + "T00:00:00Z");
  const year = start.getUTCFullYear();
  const month = start.getUTCMonth();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  // Monday is column 0.
  const leadingBlanks = (start.getUTCDay() + 6) % 7;

  const monthLabel = formatMonthLabel(monthStartDate, locale);
  // 1 Jan 2024 was a Monday.
  const weekdayFormat = new Intl.DateTimeFormat(locale, { weekday: "narrow", timeZone: "UTC" });
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    weekdayFormat.format(new Date(Date.UTC(2024, 0, 1 + i))),
  );

  return (
    <div className="rounded-card bg-white py-5 px-5 shadow-card">
      <p className="mb-0 text-xl font-headline tracking-tight font-medium text-on-surface">
        {title}
      </p>
      <p className="mb-3 text-xs text-foreground/40">{monthLabel}</p>

      <div className="mt-4 grid grid-cols-7 gap-1">
        {weekdays.map((label, i) => (
          <span key={i} className="pb-1 text-center text-xs text-foreground/40">
            {label}
          </span>
        ))}
        {Array.from({ length: leadingBlanks }, (_, i) => (
          <div key={`blank-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const dateStr = `${monthStartDate.slice(0, 8)}${String(day).padStart(2, "0")}`;
          const categories = dateMap.get(dateStr) ?? [];
          const hasActivity = categories.length > 0;

          return (
            <Link
              key={day}
              href="/progress"
              className={`flex items-center justify-center rounded-sm p-0.5 transition-colors ${hasActivity ? "hover:bg-on-surface/5" : ""}`}
            >
              <div className="relative flex aspect-square w-full max-w-10 items-center justify-center">
                {hasActivity && (
                  <svg
                    className="absolute inset-0 h-full w-full overflow-visible"
                    viewBox="0 0 40 40"
                  >
                    {categories.map((cat) => {
                      const seg = categorySegments[cat];
                      if (!seg) return null;
                      return (
                        <circle
                          key={cat}
                          cx={20}
                          cy={20}
                          r={r}
                          fill="none"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          strokeDasharray={`${segLength - gap} ${circumference - (segLength - gap)}`}
                          strokeDashoffset={seg.offset}
                          style={{
                            stroke: seg.strokeColor,
                            transform: "rotate(-90deg)",
                            transformOrigin: "20px 20px",
                          }}
                        />
                      );
                    })}
                  </svg>
                )}
                <span className="relative text-sm text-foreground/70">{day}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
