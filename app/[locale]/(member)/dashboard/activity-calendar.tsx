import { Link } from "@/src/i18n/navigation";

const r = 11;
const circumference = 2 * Math.PI * r;
const segLength = circumference / 3;
const gap = 4;

const categorySegments: Record<
  string,
  { strokeColor: string; offset: number }
> = {
  Emotional: { strokeColor: "var(--category-emotional)", offset: -(gap / 2) },
  Physical: {
    strokeColor: "var(--category-physical)",
    offset: -(segLength + gap / 2),
  },
  Mental: {
    strokeColor: "var(--category-mental)",
    offset: -(segLength * 2 + gap / 2),
  },
};

const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];

export function ActivityCalendar({
  data,
  month,
  year,
  title,
}: {
  data: { date: string; categories: string[] }[];
  month: number;
  year: number;
  title: string;
}) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const dateMap = new Map(data.map((d) => [d.date, d.categories]));

  return (
    <div className="rounded-md bg-white py-5 px-8 shadow-card">
      <p className="mb-3 text-lg font-headline tracking-tight font-medium text-on-surface">
        {title}
      </p>

      <div className="mb-2 grid grid-cols-7 gap-1">
        {dayLabels.map((label, i) => (
          <div
            key={i}
            className="text-center text-[10px] font-medium text-foreground/40"
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDay }, (_, i) => (
          <div key={`e-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const categories = dateMap.get(dateStr) ?? [];
          const hasActivity = categories.length > 0;

          return (
            <Link
              key={day}
              href={hasActivity ? `/progress?date=${dateStr}` : "#"}
              className={`flex items-center justify-center rounded-sm p-0.5 transition-colors ${hasActivity ? "hover:bg-zinc-50" : ""}`}
            >
              <div className="relative flex h-6 w-6 items-center justify-center">
                {hasActivity && (
                  <svg
                    className="absolute inset-0 overflow-visible"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                  >
                    {categories.map((cat) => {
                      const seg = categorySegments[cat];
                      if (!seg) return null;
                      return (
                        <circle
                          key={cat}
                          cx={12}
                          cy={12}
                          r={r}
                          fill="none"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeDasharray={`${segLength - gap} ${circumference - (segLength - gap)}`}
                          strokeDashoffset={seg.offset}
                          style={{
                            stroke: seg.strokeColor,
                            transform: "rotate(-90deg)",
                            transformOrigin: "12px 12px",
                          }}
                        />
                      );
                    })}
                  </svg>
                )}
                <span className="relative text-xs text-foreground/70">
                  {day}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
