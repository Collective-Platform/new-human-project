"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const display = { fontFamily: "var(--font-nowstalgic), serif" } as const;

const PILLARS = [
  {
    id: "mental",
    name: "Mental",
    title: "Renewing The Mind",
    detail:
      "Learn how to cultivate clarity, focus, wisdom, and attention in a world competing for your mind.",
    color: "#d99100",
    rgba: "rgba(217,145,0,0.22)",
  },
  {
    id: "emotional",
    name: "Emotional",
    title: "Forming The Heart",
    detail:
      "Discover how emotional honesty, resilience, and healthy inner rhythms can lead to deeper freedom and healthier relationships.",
    color: "#256a65",
    rgba: "rgba(37,106,101,0.22)",
  },
  {
    id: "physical",
    name: "Physical",
    title: "Stewarding The Body",
    detail:
      "Explore how movement, recovery, sleep, and physical wellbeing can become acts of stewardship that support every area of life.",
    color: "#3688d8",
    rgba: "rgba(54,136,216,0.22)",
  },
];

const FLOAT_ANIMS = [
  { name: "pillar-float-1", duration: "7s", delay: "0s" },
  { name: "pillar-float-2", duration: "9s", delay: "1.2s" },
  { name: "pillar-float-3", duration: "8s", delay: "0.6s" },
  { name: "pillar-float-4", duration: "6.5s", delay: "1.8s" },
];

// Floating corner positions — fractions of half-viewport (cw, ch).
// fx: -1 = left edge, +1 = right edge. fy: -1 = top, +1 = bottom.
const CORNER_POS_DESKTOP = [
  { fx: -0.75, fy: -0.57 }, // Spiritual  top-left
  { fx: 0.6, fy: -0.47 }, // Mental     top-right
  { fx: -0.67, fy: 0.57 }, // Emotional  bottom-left
  { fx: 0.55, fy: 0.7 }, // Physical   bottom-right
];

const CORNER_POS_MOBILE = [
  { fx: -1, fy: -0.8 }, // Spiritual  top-left
  { fx: 1.2, fy: -0.67 }, // Mental     top-right
  { fx: -0.9, fy: 0.7 }, // Emotional  bottom-left
  { fx: 1.3, fy: 0.8 }, // Physical   bottom-right
];

// Text nudge inside each circle once in Venn — pushes label away from center.
const TEXT_NUDGE = [
  { x: 0, y: 0 }, // Spiritual — unused
  { x: 0, y: -20 }, // Mental    — up
  { x: -20, y: 4 }, // Emotional — down-left
  { x: 20, y: 4 }, // Physical  — down-right
];

// Venn end-positions: offsets from panel center (px, no additional scale).
// Circles are 240px (radius 120px). Equilateral triangle side ≈ 175px → ~65px overlap per pair.
const VENN_OFFSETS = [
  { x: 0, y: 0 }, // Spiritual — fades away, not in Venn
  { x: 0, y: -101 }, // Mental    — top
  { x: -88, y: 51 }, // Emotional — bottom-left
  { x: 88, y: 51 }, // Physical  — bottom-right
];

const CIRCLES = [
  { label: "Spiritual", color: "#1a1a1a", pillarIdx: -1, floatIdx: 0 },
  { label: "Mental", color: PILLARS[0].color, pillarIdx: 0, floatIdx: 1 },
  { label: "Emotional", color: PILLARS[1].color, pillarIdx: 1, floatIdx: 2 },
  { label: "Physical", color: PILLARS[2].color, pillarIdx: 2, floatIdx: 3 },
];

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

// ─────────────────────────────────────────────────────────────────────────────

export function PillarsSection() {
  // DOM refs for direct mutation — no React re-renders on scroll
  const zoneRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const circleRefs = useRef<(HTMLDivElement | null)[]>([
    null,
    null,
    null,
    null,
  ]);
  const floatRefs = useRef<(HTMLDivElement | null)[]>([null, null, null, null]);
  const humanRef = useRef<HTMLDivElement>(null);
  const everythingRef = useRef<HTMLDivElement>(null);

  // Interactive state (hover/tap detail card) — these may re-render the section
  const [activeDetail, setActiveDetail] = useState<number | null>(null);

  // Mutable refs for values shared between scroll + pointer handlers
  const zoneProgressRef = useRef(0);
  const dragsRef = useRef<Record<number, { dx: number; dy: number }>>({});
  const activeDragRef = useRef<{
    id: number;
    startX: number;
    startY: number;
  } | null>(null);
  const winRef = useRef({ w: 0, h: 0 });

  // All scroll-driven transforms applied directly to DOM — no setState
  const applyTransforms = useCallback(() => {
    const { w, h } = winRef.current;
    if (w === 0) return;

    const isMobile = w < 768;
    const circleSize = isMobile ? 120 : 240;
    const cw = (isMobile ? Math.min(w, 200) : w) / 2;
    const ch = h / 2;
    const zp = zoneProgressRef.current;
    const cp = easeInOut(clamp(zp - 1, 0, 1));
    const vennScale = isMobile ? Math.min(1, (Math.min(w, 436) - 32) / 500) : 1;

    const corners = (isMobile ? CORNER_POS_MOBILE : CORNER_POS_DESKTOP).map(
      ({ fx, fy }) => ({
        x: fx * cw,
        y: fy * ch,
      }),
    );

    const vennOffsets = VENN_OFFSETS.map((o) => ({
      x: o.x * vennScale,
      y: o.y * vennScale,
    }));

    // ── Text fade ──────────────────────────────────────────────────────────────
    const textOpacity = clamp(1 - easeInOut(clamp(zp - 0.5, 0, 1)) * 2, 0, 1);
    if (textRef.current) {
      textRef.current.style.opacity = String(textOpacity);
      textRef.current.style.pointerEvents =
        textOpacity < 0.05 ? "none" : "auto";
    }

    // ── Circles ────────────────────────────────────────────────────────────────
    circleRefs.current.forEach((el, i) => {
      if (!el) return;
      const isSpiritual = i === 0;
      const grow = isMobile && !isSpiritual ? 1 + cp * 0.6 : 1;
      const drawnSize = circleSize * grow;
      const drawnHalf = drawnSize / 2;
      el.style.width = `${drawnSize}px`;
      el.style.height = `${drawnSize}px`;
      el.style.marginLeft = `${-drawnHalf}px`;
      el.style.marginTop = `${-drawnHalf}px`;
      const drag = dragsRef.current[i] ?? { dx: 0, dy: 0 };
      const tx = lerp(corners[i].x, vennOffsets[i].x, cp) + drag.dx * (1 - cp);
      const ty = lerp(corners[i].y, vennOffsets[i].y, cp) + drag.dy * (1 - cp);

      const opacity = isSpiritual ? clamp(1 - cp * 2, 0, 1) : 1;
      const scale = isSpiritual ? 1 + cp * 0.3 : 1;

      el.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
      el.style.opacity = String(opacity);
      el.style.zIndex = i > 0 && cp > 0.5 ? "20" : "10";
      el.style.cursor = i > 0 && zp >= 1.8 ? "pointer" : "grab";
      el.classList.toggle("group", i > 0 && zp >= 1.8);

      // Pause float animation once circles start converging
      const floatEl = floatRefs.current[i];
      if (floatEl) {
        floatEl.style.animationPlayState = cp > 0.05 ? "paused" : "running";
      }

      const innerCircle = el.querySelector<HTMLElement>(".pillar-circle-bg");
      if (innerCircle) innerCircle.style.borderColor = "#1a1a1a";

      // Nudge label outward once in Venn
      const span = el.querySelector<HTMLElement>("span");
      if (span && i > 0) {
        const n = TEXT_NUDGE[i];
        span.style.transform = `translate(${n.x * cp}px, ${n.y * cp}px)`;
      }
    });

    // ── Venn labels ────────────────────────────────────────────────────────────
    const labelOpacity = easeInOut(clamp((cp - 0.85) / 0.15, 0, 1));
    if (humanRef.current) humanRef.current.style.opacity = String(labelOpacity);
    if (everythingRef.current)
      everythingRef.current.style.opacity = String(labelOpacity);
  }, []);

  useEffect(() => {
    const updateWin = () => {
      winRef.current = { w: window.innerWidth, h: window.innerHeight };
      applyTransforms();
    };
    updateWin();

    const onScroll = () => {
      const zone = zoneRef.current;
      if (!zone) return;
      zoneProgressRef.current = clamp(
        -zone.getBoundingClientRect().top / window.innerHeight,
        0,
        4,
      );
      applyTransforms();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateWin, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateWin);
    };
  }, [applyTransforms]);

  // ── Drag handlers ────────────────────────────────────────────────────────────
  const handlePointerDown = useCallback(
    (i: number) => (e: React.PointerEvent) => {
      if (zoneProgressRef.current >= 1.8) return;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      const prev = dragsRef.current[i] ?? { dx: 0, dy: 0 };
      activeDragRef.current = {
        id: i,
        startX: e.clientX - prev.dx,
        startY: e.clientY - prev.dy,
      };
      e.stopPropagation();
    },
    [],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const drag = activeDragRef.current;
      if (!drag) return;
      dragsRef.current[drag.id] = {
        dx: e.clientX - drag.startX,
        dy: e.clientY - drag.startY,
      };
      applyTransforms();
    },
    [applyTransforms],
  );

  const handlePointerUp = useCallback(() => {
    activeDragRef.current = null;
  }, []);

  return (
    <section
      className="relative bg-primary"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div ref={zoneRef} style={{ height: "320dvh" }}>
        <div className="sticky top-0 h-screen overflow-hidden">
          <div className="absolute inset-0 bg-primary" />

          {/* ── Phase A: intro text ─────────────────────────────────────────── */}
          <div
            ref={textRef}
            className="absolute inset-0 flex items-center justify-center px-8 text-center"
          >
            <div className="max-w-xl">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-white/60">
                The Three Pillars
              </p>
              <h2
                className="mb-5 text-4xl font-bold leading-[1.1] text-white md:text-5xl"
                style={display}
              >
                Three Pillars.
                <br />
                One Whole Life.
              </h2>
              <p className="text-base leading-relaxed text-white/80 md:text-lg">
                We often separate life into different compartments. <br />
                <strong className="text-white">Spiritual.</strong>{" "}
                <strong className="text-white">Mental.</strong>{" "}
                <strong className="text-white">Emotional.</strong>{" "}
                <strong className="text-white">Physical.</strong>
                <br />
                But God created us as whole people.
                <br />
                At Rhythm Live, we&rsquo;ll explore how every part of our lives
                can become part of our spiritual formation.
              </p>
            </div>
          </div>

          {/* ── Circles (floating → converging) ─────────────────────────────── */}
          <div className="pointer-events-none absolute inset-0">
            {CIRCLES.map((circle, i) => {
              const anim = FLOAT_ANIMS[circle.floatIdx];
              const isVenn = i > 0;
              const pillar = isVenn ? PILLARS[circle.pillarIdx] : null;
              const isActive = activeDetail === i;

              return (
                <div
                  key={circle.label}
                  ref={(el) => {
                    circleRefs.current[i] = el;
                  }}
                  className="pointer-events-auto absolute"
                  style={{
                    left: "50%",
                    top: "50%",
                    width: 240,
                    height: 240,
                    marginLeft: -120,
                    marginTop: -120,
                    willChange: "transform",
                  }}
                  onPointerDown={handlePointerDown(i)}
                  onMouseEnter={() => {
                    if (isVenn && zoneProgressRef.current >= 1.8)
                      setActiveDetail(i);
                  }}
                  onMouseLeave={() => {
                    if (isVenn) setActiveDetail(null);
                  }}
                  onClick={() => {
                    if (isVenn && zoneProgressRef.current >= 1.8)
                      setActiveDetail((p) => (p === i ? null : i));
                  }}
                >
                  {/* Inner wrapper carries the CSS float animation.
                      Since it's a child element, its transform is independent
                      from the outer div's JS-driven position transform. */}
                  <div
                    ref={(el) => {
                      floatRefs.current[i] = el;
                    }}
                    className="absolute inset-0"
                    style={{
                      animation: `${anim.name} ${anim.duration} ease-in-out infinite`,
                      animationDelay: anim.delay,
                    }}
                  >
                    <div
                      className="pillar-circle-bg absolute inset-0 flex items-center justify-center rounded-full bg-transparent transition-colors duration-200 group-hover:bg-black"
                      style={{ border: "2px solid #1a1a1a" }}
                    >
                      <span className="text-base md:text-xl font-semibold tracking-wide text-black transition-colors duration-200 group-hover:text-primary">
                        {circle.label}
                      </span>
                    </div>
                  </div>

                  {/* Hover / tap detail card */}
                  {isVenn && isActive && pillar && (
                    <DetailCard pillar={pillar} index={i} />
                  )}
                </div>
              );
            })}
          </div>

          {/* ── "Everything is Spiritual" ─────────────────────────────────────── */}
          <div
            ref={everythingRef}
            className="pointer-events-none absolute bottom-[12%] left-0 right-0 text-center"
            style={{ opacity: 0, zIndex: 30 }}
          >
            <h2
              className="text-3xl font-bold text-black md:text-4xl"
              style={display}
            >
              Everything is Spiritual
            </h2>
            <p className="mt-2 text-sm text-black/60">
              Hover each circle to explore the pillar
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

const DETAIL_POSITIONS: React.CSSProperties[] = [
  {}, // unused (Spiritual)
  { bottom: "110%", left: "50%", transform: "translateX(-50%)" }, // Mental — above
  { right: "110%", top: "50%", transform: "translateY(-50%)" }, // Emotional — left
  { left: "110%", top: "50%", transform: "translateY(-50%)" }, // Physical — right
];

function DetailCard({
  pillar,
  index,
}: {
  pillar: (typeof PILLARS)[0];
  index: number;
}) {
  return (
    <div
      className="absolute z-50 w-52 rounded-2xl bg-white p-4 shadow-lg"
      style={{
        ...DETAIL_POSITIONS[index],
        border: `1.5px solid ${pillar.color}30`,
        pointerEvents: "none",
      }}
    >
      <p
        className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em]"
        style={{ color: pillar.color }}
      >
        {pillar.name}
      </p>
      <p className="mb-2 text-sm font-bold text-on-surface" style={display}>
        {pillar.title}
      </p>
      <p className="text-xs leading-relaxed text-on-surface-variant">
        {pillar.detail}
      </p>
    </div>
  );
}
