"use client";

function pointOnAxis(
  angle: number,
  percentage: number,
  cx: number,
  cy: number,
  r: number,
) {
  const rad = (angle - 90) * (Math.PI / 180);
  const dist = (percentage / 100) * r;
  return { x: cx + dist * Math.cos(rad), y: cy + dist * Math.sin(rad) };
}

function trianglePath(points: { x: number; y: number }[]) {
  return (
    points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ") + " Z"
  );
}

export function RadarChart({
  mental,
  emotional,
  physical,
  labels,
}: {
  mental: number;
  emotional: number;
  physical: number;
  labels: { mental: string; emotional: string; physical: string };
}) {
  const cx = 100;
  const cy = 105;
  const r = 65;
  const angles = [0, 240, 120];
  const values = [mental, emotional, physical];

  const bgPoints = angles.map((a) => pointOnAxis(a, 100, cx, cy, r));
  const dataPoints = values.map((v, i) => pointOnAxis(angles[i], v, cx, cy, r));

  const gridLevels = [25, 50, 75];

  return (
    <>
      <div className="rounded-md bg-white p-5 shadow-card">
        <svg viewBox="0 0 200 210" className="mx-auto w-full max-w-60">
          {gridLevels.map((level) => {
            const pts = angles.map((a) => pointOnAxis(a, level, cx, cy, r));
            return (
              <path
                key={level}
                d={trianglePath(pts)}
                fill="none"
                stroke="#e5e5e5"
                strokeWidth="0.5"
              />
            );
          })}
          <path
            d={trianglePath(bgPoints)}
            fill="none"
            stroke="#d4d4d4"
            strokeWidth="1"
          />
          {bgPoints.map((p, i) => (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={p.x}
              y2={p.y}
              stroke="#e5e5e5"
              strokeWidth="0.5"
            />
          ))}
          <path
            d={trianglePath(dataPoints)}
            fill="rgba(193, 0, 20, 0.15)"
            stroke="#c10014"
            strokeWidth="2"
          />
          {dataPoints.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="3" fill="#c10014" />
          ))}
        </svg>

        <div className="mt-3 flex justify-between text-xs">
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-category-mental" />
            <span className="text-foreground/70">
              {labels.mental} {Math.round(mental)}%
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-category-emotional" />
            <span className="text-foreground/70">
              {labels.emotional} {Math.round(emotional)}%
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span
              className="h-2 w-2 rounded-full bg-category-physical"
              style={{ border: "1px solid #d4c8a0" }}
            />
            <span className="text-foreground/70">
              {labels.physical} {Math.round(physical)}%
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
