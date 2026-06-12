"use client";

import { useEffect, useRef, useState } from "react";

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
  { name: "pillar-float-2", duration: "9s", delay: "1.2s" },
  { name: "pillar-float-3", duration: "8s", delay: "0.6s" },
  { name: "pillar-float-4", duration: "6.5s", delay: "1.8s" },
];

// Floating corner positions — fractions of half-viewport (cw, ch).
// fx: -1 = left edge, +1 = right edge. fy: -1 = top, +1 = bottom.
const CORNER_POS_DESKTOP = [
  { fx: 0.6, fy: -0.57 }, // Mental     top-right
  { fx: -0.67, fy: 0.57 }, // Emotional  bottom-left
  { fx: 0.55, fy: 0.7 }, // Physical   bottom-right
];

const CORNER_POS_MOBILE = [
  { fx: 0.5, fy: -0.67 }, // Mental     top-right
  { fx: -0.9, fy: 0.7 }, // Emotional  bottom-left
  { fx: 1.3, fy: 0.8 }, // Physical   bottom-right
];

// Text nudge inside each circle once in Venn — pushes label away from center.
const TEXT_NUDGE = [
  { x: 0, y: -20 }, // Mental    — up
  { x: -20, y: 4 }, // Emotional — down-left
  { x: 20, y: 4 }, // Physical  — down-right
];

// Venn end-positions as fractions of the circle's current radius.
// Equilateral triangle: side s = r * 1.458
// Top: (0, -s/√3) = (0, -r*0.842)  BL: (-s/2, s/(2√3)) = (-r*0.729, r*0.421)
const VENN_FRACTIONS = [
  { rx: 0, ry: -0.842 }, // Mental    — top
  { rx: -0.729, ry: 0.421 }, // Emotional — bottom-left
  { rx: 0.729, ry: 0.421 }, // Physical  — bottom-right
];

const CIRCLES = [
  { label: "Mental", color: PILLARS[0].color, pillarIdx: 0, floatIdx: 0 },
  { label: "Emotional", color: PILLARS[1].color, pillarIdx: 1, floatIdx: 1 },
  { label: "Physical", color: PILLARS[2].color, pillarIdx: 2, floatIdx: 2 },
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
  const circleRefs = useRef<(HTMLDivElement | null)[]>([null, null, null]);
  const floatRefs = useRef<(HTMLDivElement | null)[]>([null, null, null]);
  const humanRef = useRef<HTMLDivElement>(null);
  const everythingRef = useRef<HTMLDivElement>(null);

  // Interactive state (hover/tap detail card) — these may re-render the section
  const [activeDetail, setActiveDetail] = useState<number | null>(null);
  const [isMobileView, setIsMobileView] = useState(false);

  // Mutable refs for values shared between scroll handler and render
  const zoneProgressRef = useRef(0);
  const winRef = useRef({ w: 0, h: 0 });

  // All scroll-driven transforms applied directly to DOM — no setState
  const applyTransforms = () => {
    const { w, h } = winRef.current;
    if (w === 0) return;

    const isMobile = w < 768;
    const circleSize = isMobile ? 120 : 240;
    const cw = (isMobile ? Math.min(w, 200) : w) / 2;
    const ch = h / 2;
    const zp = zoneProgressRef.current;
    const cp = easeInOut(clamp(zp - 1, 0, 1));

    const corners = (isMobile ? CORNER_POS_MOBILE : CORNER_POS_DESKTOP).map(
      ({ fx, fy }) => ({
        x: fx * cw,
        y: fy * ch,
      }),
    );

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
      const grow = isMobile ? 1 + cp * 0.6 : 1;
      const drawnSize = circleSize * grow;
      const drawnHalf = drawnSize / 2;
      el.style.width = `${drawnSize}px`;
      el.style.height = `${drawnSize}px`;
      el.style.marginLeft = `${-drawnHalf}px`;
      el.style.marginTop = `${-drawnHalf}px`;
      const r = drawnSize / 2;
      const vennX = VENN_FRACTIONS[i].rx * r;
      const vennY = VENN_FRACTIONS[i].ry * r;
      const tx = lerp(corners[i].x, vennX, cp);
      const ty = lerp(corners[i].y, vennY, cp);

      const opacity = 1;
      const scale = 1;

      el.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
      el.style.opacity = String(opacity);
      el.style.zIndex = cp > 0.5 ? "20" : "10";
      el.style.cursor = zp >= 1.8 ? "pointer" : "default";
      el.classList.toggle("group", zp >= 1.8);

      // Pause float animation once circles start converging
      const floatEl = floatRefs.current[i];
      if (floatEl) {
        floatEl.style.animationPlayState = cp > 0.05 ? "paused" : "running";
      }

      const innerCircle = el.querySelector<HTMLElement>(".pillar-circle-bg");
      if (innerCircle) innerCircle.style.borderColor = "#1a1a1a";

      // Nudge label outward once in Venn
      const span = el.querySelector<HTMLElement>("span");
      if (span) {
        const n = TEXT_NUDGE[i];
        span.style.transform = `translate(${n.x * cp}px, ${n.y * cp}px)`;
      }
    });

    // ── Venn labels ────────────────────────────────────────────────────────────
    const labelOpacity = easeInOut(clamp((cp - 0.85) / 0.15, 0, 1));
    if (humanRef.current) humanRef.current.style.opacity = String(labelOpacity);
    if (everythingRef.current)
      everythingRef.current.style.opacity = String(labelOpacity);
  };

  useEffect(() => {
    const check = () => setIsMobileView(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check, { passive: true });
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (isMobileView && activeDetail !== null) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileView, activeDetail]);

  useEffect(() => {
    winRef.current = { w: window.innerWidth, h: window.innerHeight };
    applyTransforms();

    const onResize = () => {
      winRef.current = { ...winRef.current, w: window.innerWidth };
      applyTransforms();
    };
    const onOrientationChange = () => {
      winRef.current = { w: window.innerWidth, h: window.innerHeight };
      applyTransforms();
    };

    const onScroll = () => {
      const zone = zoneRef.current;
      if (!zone) return;
      zoneProgressRef.current = clamp(
        -zone.getBoundingClientRect().top / winRef.current.h,
        0,
        4,
      );
      applyTransforms();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("orientationchange", onOrientationChange);
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onOrientationChange);
    };
  }, []);

  return (
    <section className="relative bg-primary">
      <div ref={zoneRef} style={{ height: "320svh" }}>
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
                  onPointerEnter={(e) => {
                    if (
                      zoneProgressRef.current >= 1.8 &&
                      e.pointerType !== "touch"
                    )
                      setActiveDetail(i);
                  }}
                  onPointerLeave={(e) => {
                    if (e.pointerType !== "touch") setActiveDetail(null);
                  }}
                  onClick={() => {
                    if (zoneProgressRef.current >= 1.8)
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
                      style={{
                        border: "2px solid #1a1a1a",
                        ...(isActive ? { backgroundColor: "black" } : {}),
                      }}
                    >
                      <span
                        className="text-base md:text-xl font-semibold tracking-wide text-black transition-colors duration-200 group-hover:text-primary"
                        style={
                          isActive
                            ? { color: "var(--color-primary)" }
                            : undefined
                        }
                      >
                        {circle.label}
                      </span>
                    </div>
                  </div>
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
              className="text-3xl font-bold text-black md:text-5xl"
              style={display}
            >
              Everything is Spiritual
            </h2>
            <p className="mt-2 md:mt-6 text-lg md:text-xl text-black/60">
              <span className="md:hidden">
                Tap each circle to explore the pillar
              </span>
              <span className="hidden md:inline">
                Hover each circle to explore the pillar
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* ── Desktop detail card — rendered at root so z-index escapes circle stacking contexts ── */}
      {!isMobileView && activeDetail !== null && (
        <DetailCard pillar={PILLARS[CIRCLES[activeDetail].pillarIdx]} />
      )}

      {/* ── Mobile modal (tap on circle) ──────────────────────────────────── */}
      {isMobileView &&
        activeDetail !== null &&
        (() => {
          const activePillar = PILLARS[CIRCLES[activeDetail].pillarIdx];
          return (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
              onClick={() => setActiveDetail(null)}
            >
              <div
                className="relative mx-4 w-full max-w-sm rounded-2xl bg-white p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setActiveDetail(null)}
                  className="absolute right-4 top-4 text-xl leading-none text-on-surface/40 hover:text-on-surface"
                >
                  ×
                </button>
                <p
                  className="mb-1 text-xs font-bold uppercase tracking-[0.2em]"
                  style={{ color: activePillar.color }}
                >
                  {activePillar.name}
                </p>
                <p
                  className="mb-3 text-xl font-bold text-on-surface"
                  style={display}
                >
                  {activePillar.title}
                </p>
                <p className="text-sm leading-relaxed text-on-surface-variant">
                  {activePillar.detail}
                </p>
              </div>
            </div>
          );
        })()}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function DetailCard({ pillar }: { pillar: (typeof PILLARS)[0] }) {
  return (
    <div
      className="z-9999 w-72 rounded-2xl bg-white p-5 shadow-lg"
      style={{
        position: "fixed",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        border: `1.5px solid ${pillar.color}30`,
        pointerEvents: "none",
      }}
    >
      <p
        className="mb-1 text-xs font-bold uppercase tracking-[0.2em]"
        style={{ color: pillar.color }}
      >
        {pillar.name}
      </p>
      <p className="mb-3 text-xl font-bold text-on-surface" style={display}>
        {pillar.title}
      </p>
      <p className="text-base leading-relaxed text-on-surface-variant">
        {pillar.detail}
      </p>
    </div>
  );
}
