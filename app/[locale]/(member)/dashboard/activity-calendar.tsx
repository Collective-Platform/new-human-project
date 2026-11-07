import { Link } from "@/src/i18n/navigation";

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

export function ActivityCalendar({
  data,
  startDate,
  title,
  blockLabel,
  planId,
  labelByDate = false,
}: {
  data: { date: string; categories: string[] }[];
  startDate: string;
  title: string;
  blockLabel?: string;
  planId?: string;
  /** Label each cell with its day of the month, not its block day number. */
  labelByDate?: boolean;
}) {
  const dateMap = new Map(data.map((d) => [d.date, d.categories]));

  const start = new Date(startDate + "T00:00:00Z");

  return (
    <div className="rounded-card bg-white py-5 px-8 shadow-card">
      <p className="mb-0 text-xl font-headline tracking-tight font-medium text-on-surface">
        {title}
      </p>
      {blockLabel ? (
        <p className="mb-3 text-xs text-foreground/40">{blockLabel}</p>
      ) : (
        <div className="mb-3" />
      )}

      <div className="mt-4 grid grid-cols-5 gap-2">
        {Array.from({ length: 25 }, (_, i) => {
          const day = i + 1;
          const d = new Date(start);
          d.setUTCDate(d.getUTCDate() + i);
          const dateStr = d.toISOString().slice(0, 10);
          const categories = dateMap.get(dateStr) ?? [];
          const hasActivity = categories.length > 0;

          return (
            <Link
              key={day}
              href={planId ? `/progress/${planId}?day=${day}` : "/progress"}
              className={`flex items-center justify-center rounded-sm p-0.5 transition-colors ${hasActivity ? "hover:bg-on-surface/5" : ""}`}
            >
              <div className="relative flex h-10 w-10 items-center justify-center">
                {hasActivity && (
                  <svg
                    className="absolute inset-0 overflow-visible"
                    width="40"
                    height="40"
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
                <span className="relative text-base text-foreground/70">
                  {labelByDate ? d.getUTCDate() : day}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
