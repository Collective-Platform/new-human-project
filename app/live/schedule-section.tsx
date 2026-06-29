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
  {
    time: "7:00",
    segment: "Dawn Activation Track",
    type: "track",
    note: "*Pre-registration required (see below)",
  },
  { time: "8:30", segment: "Break", type: "break" },
  { time: "9:30", segment: "Registration", type: "logistics" },
  { time: "10:15", segment: "Doors Open", type: "logistics" },
  { time: "10:30", segment: "Praise & Worship", type: "session" },
  {
    time: "10:50",
    segment: "Intro - Rev Kevin Loo",
    type: "keynote",
  },
  {
    time: "11:10",
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
  { time: "13:30", segment: "Doors Open", type: "logistics" },
  {
    time: "13:45",
    segment: "Panel - Tim Tiah & Kysern Lim",
    type: "panel",
  },
  {
    time: "14:30",
    segment: "Keynote - CJ Lee",
    type: "keynote",
  },
  {
    time: "15:30",
    segment: "Closing - Rev Kevin Loo",
    type: "keynote",
  },

  {
    time: "16:00",
    segment: "Dusk Activation Track",
    type: "track",
    note: "*Pre-registration required (see below)",
  },
];

function ScheduleRow({ item }: { item: ScheduleItem }) {
  const isTrack = item.type === "track";

  return (
    <div
      className={`flex items-start gap-4 py-4 ${!item.noBorderBottom ? "border-b border-white/10" : ""} ${!item.time ? "pt-0" : ""}`}
    >
      <span className="w-14 shrink-0 tabular-nums text-sm font-semibold text-white md:w-18">
        {item.time}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`text-base leading-snug text-white ${isTrack ? "font-black" : "font-semibold"}`}
          >
            {item.segment}
          </span>

          {isTrack && (
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold text-white">
              Optional
            </span>
          )}
        </div>
        {item.note && (
          <span className="text-sm text-white/60">{item.note}</span>
        )}
      </div>
    </div>
  );
}

export function ScheduleSection() {
  return (
    <section id="schedule" className="bg-primary px-4 py-24 md:px-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-black leading-[1.1] text-white md:text-5xl">
            The Schedule
          </h2>
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
