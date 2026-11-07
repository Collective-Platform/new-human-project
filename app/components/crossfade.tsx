import type { ReactNode } from "react";

/**
 * Swaps between two pieces of content with a short crossfade and a touch of blur,
 * so a label change reads as one change, not two overlapping labels.
 * Both layers share one grid cell, so the control keeps the width of the wider one.
 */
export function Crossfade({
  showSecond,
  first,
  second,
}: {
  showSecond: boolean;
  first: ReactNode;
  second: ReactNode;
}) {
  const layer = "col-start-1 row-start-1 inline-flex items-center justify-center gap-1.5";
  const hidden = "opacity-0 blur-[2px]";
  const base = "transition-[opacity,filter] duration-[var(--duration-base)] ease-[var(--ease-out)]";
  return (
    <span className="inline-grid">
      <span className={`${layer} ${base} ${showSecond ? hidden : ""}`} aria-hidden={showSecond}>
        {first}
      </span>
      <span className={`${layer} ${base} ${showSecond ? "" : hidden}`} aria-hidden={!showSecond}>
        {second}
      </span>
    </span>
  );
}
