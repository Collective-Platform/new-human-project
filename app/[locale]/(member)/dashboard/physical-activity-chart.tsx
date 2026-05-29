import Image from "next/image";

const BAR_HEIGHT = 96; // px — explicit so percentage calculations are reliable

function formatMins(totalMinutes: number): string {
  if (totalMinutes === 0) return "—";
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h${m}m`;
}

export function PhysicalActivityChart({
  activityByDay,
  blockLabel,
  title,
  emptyLabel,
}: {
  activityByDay: { day: number; totalMinutes: number }[];
  blockLabel: string;
  title: string;
  emptyLabel: string;
}) {
  const totalMinutes = activityByDay.reduce((s, d) => s + d.totalMinutes, 0);
  const maxMinutes = Math.max(...activityByDay.map((d) => d.totalMinutes), 1);

  return (
    <div className="rounded-3xl bg-white shadow-card px-8 py-5 overflow-hidden flex flex-col">
      <div className="mb-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Image src="/icons/Physical.svg" alt="" width={28} height={28} />
            <div>
              <h3 className="text-xl font-headline tracking-tight font-medium text-category-physical">
                {title}
              </h3>
              <p className="text-xs text-foreground/40">{blockLabel}</p>
            </div>
          </div>
          {totalMinutes > 0 && (
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-foreground/40">
                Total hours
              </span>
              <span className="text-sm font-medium text-category-physical">
                {formatMins(totalMinutes)}
              </span>
            </div>
          )}
        </div>
      </div>

      {totalMinutes === 0 ? (
        <p className="mt-auto text-center text-sm text-outline py-3">{emptyLabel}</p>
      ) : (
        <div className="mt-auto overflow-x-auto -mx-8 px-8">
          {/* Bars with duration label floating just above each bar */}
          <div className="flex gap-1" style={{ minWidth: "max-content" }}>
            {activityByDay.map(({ day, totalMinutes: mins }) => {
              const barH =
                mins > 0 ? Math.max((mins / maxMinutes) * BAR_HEIGHT, 6) : 2;
              return (
                <div
                  key={day}
                  className="w-7 shrink-0 flex flex-col justify-end items-center gap-0.5"
                  style={{ height: BAR_HEIGHT }}
                >
                  {mins > 0 && (
                    <span className="text-[9px] text-foreground/50 leading-none">
                      {formatMins(mins)}
                    </span>
                  )}
                  <div
                    className="w-2 bg-(--color-category-physical) rounded-t-md transition-all duration-500"
                    style={{ height: barH, opacity: mins > 0 ? 1 : 0.12 }}
                  />
                </div>
              );
            })}
          </div>

          {/* Day number labels */}
          <div className="flex gap-1 mt-2" style={{ minWidth: "max-content" }}>
            {activityByDay.map(({ day }) => (
              <div key={day} className="w-7 shrink-0 flex justify-center">
                <span className="text-[10px] text-foreground/40">{day}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
