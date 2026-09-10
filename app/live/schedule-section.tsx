type ScheduleItem = {
  time: string;
  segment: string;
};

const SCHEDULE: ScheduleItem[] = [
  { time: "8:30 AM", segment: "Registration" },
  { time: "8:45 AM", segment: "Doors Open" },
  { time: "9:00 AM", segment: "Praise & Worship" },
  { time: "9:30 AM", segment: "Session 1" },
  { time: "10:30 AM", segment: "Break" },
  { time: "10:45 AM", segment: "Session 2" },
  { time: "11:45 AM", segment: "Ask the expert - Q&A" },
];

function ScheduleRow({ item }: { item: ScheduleItem }) {
  return (
    <div className="flex items-start gap-4 border-b border-black/20 py-4">
      <span className="w-20 shrink-0 whitespace-nowrap tabular-nums text-sm font-semibold text-black md:w-24">
        {item.time}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-base leading-snug font-semibold text-black">{item.segment}</span>
        </div>
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
