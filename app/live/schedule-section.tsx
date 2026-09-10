type Pillar = "Mental" | "Emotional" | "Physical";

type ScheduleItem = {
  time: string;
  segment: string;
  type: "track" | "break" | "session" | "keynote" | "panel" | "logistics";
  pillar?: Pillar;
  note?: string;
  noBorderBottom?: boolean;
};

const SCHEDULE: ScheduleItem[] = [
  { time: "8:30", segment: "Registration", type: "logistics" },
  { time: "8:45", segment: "Doors Open", type: "logistics" },
  { time: "9:00", segment: "Praise & Worship", type: "session" },
  {
    time: "9:30",
    segment: "Keynote - Dr. Victor Lee",
    type: "keynote",
    noBorderBottom: true,
  },
  {
    time: "",
    segment: "Keynote - Dr. Andrew Lim 林岭啸博士 (Chinese)",
    type: "keynote",
  },
  { time: "12:00", segment: "Lunch Break", type: "break" },
];

function ScheduleRow({ item }: { item: ScheduleItem }) {
  const isTrack = item.type === "track";

  return (
    <div
      className={`flex items-start gap-4 py-4 ${!item.noBorderBottom ? "border-b border-black/20" : ""} ${!item.time ? "pt-0" : ""}`}
    >
      <span className="w-14 shrink-0 tabular-nums text-sm font-semibold text-black md:w-18">
        {item.time}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`text-base leading-snug text-black ${isTrack ? "font-black" : "font-semibold"}`}
          >
            {item.segment}
          </span>

          {isTrack && (
            <span className="rounded-full bg-black px-2 py-0.5 text-xs font-semibold text-[#F1A100]">
              Optional
            </span>
          )}
        </div>
        {item.note && <span className="text-sm text-black/65">{item.note}</span>}
      </div>
    </div>
  );
}

export function ScheduleSection() {
  return (
    <section id="schedule" className="bg-[#F1A100] px-4 py-24 md:px-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-black leading-[1.1] text-black md:text-5xl">The Schedule</h2>
        </div>

        <div className="mx-auto max-w-2xl">
          {SCHEDULE.map((item, i) => (
            <ScheduleRow key={i} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
