"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

type MotionPermissionEvent = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};
type Frame = { lines: Element[]; paths: Element[] };
type Highlight = "centre" | "left" | "right";

const FRAME_URLS = [
  "/live/tilt-book/book-left.svg",
  "/live/tilt-book/book-center.svg",
  "/live/tilt-book/book-right.svg",
] as const;

const clamp = (value: number) => Math.max(-1, Math.min(1, value));
const between = (from: number, to: number, progress: number) => from + (to - from) * progress;
const MOTION_EASING = 0.03;
const HIGHLIGHTS: Record<Highlight, string> = {
  centre: "Teaching: Spirit & Scripture Unpacked",
  left: "Interactive Q&A: Questions & Discussions",
  right: "Practical Handles: Rhythms for Daily Life",
};

function highlightForTilt(tilt: number, active: Highlight): Highlight {
  if (active === "left") return tilt < -0.14 ? "left" : "centre";
  if (active === "right") return tilt > 0.14 ? "right" : "centre";
  if (tilt < -0.26) return "left";
  if (tilt > 0.26) return "right";
  return "centre";
}

function numbers(path: string) {
  return path.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
}

export function TiltBookSection({ compact = false }: { compact?: boolean }) {
  const bookRef = useRef<HTMLButtonElement>(null);
  const drawingRef = useRef<SVGSVGElement>(null);
  const framesRef = useRef<Frame[] | null>(null);
  const currentTiltRef = useRef(0);
  const targetTiltRef = useRef(0);
  const animationRef = useRef<number | null>(null);
  const orientationListenerRef = useRef<((event: DeviceOrientationEvent) => void) | null>(null);
  const orientationEnabledRef = useRef(false);
  const orientationRequestPendingRef = useRef(false);
  const permissionGestureRef = useRef(false);
  const manualPositionRef = useRef(false);
  const touchStartRef = useRef<number | null>(null);
  const touchMovedRef = useRef(false);
  const bookVisibleRef = useRef(false);
  const lastMouseXRef = useRef<number | null>(null);
  const activeHighlightRef = useRef<Highlight>("centre");
  const [ready, setReady] = useState(false);
  const [activeHighlight, setActiveHighlight] = useState<Highlight>("centre");

  useEffect(() => {
    let cancelled = false;

    async function loadFrames() {
      const documents = await Promise.all(
        FRAME_URLS.map(async (url) =>
          new DOMParser().parseFromString(await (await fetch(url)).text(), "image/svg+xml"),
        ),
      );
      if (cancelled || !drawingRef.current) return;

      const centre = documents[1].documentElement;
      drawingRef.current.innerHTML = centre.innerHTML;
      framesRef.current = documents.map((document) => ({
        lines: Array.from(document.querySelectorAll("line")),
        paths: Array.from(document.querySelectorAll("path")),
      }));
      setReady(true);
    }

    void loadFrames();
    return () => {
      cancelled = true;
    };
  }, []);

  const paint = useCallback((tilt: number) => {
    const drawing = drawingRef.current;
    const frames = framesRef.current;
    if (!drawing || !frames) return;

    const progress = Math.abs(tilt);
    const target = frames[tilt < 0 ? 0 : 2];
    const centre = frames[1];
    const lines = drawing.querySelectorAll("line");
    const coordinates = ["x1", "y1", "x2", "y2"] as const;

    lines.forEach((line, index) => {
      coordinates.forEach((coordinate) => {
        line.setAttribute(
          coordinate,
          `${between(
            Number(centre.lines[index].getAttribute(coordinate)),
            Number(target.lines[index].getAttribute(coordinate)),
            progress,
          )}`,
        );
      });
    });

    drawing.querySelectorAll("path").forEach((path, index) => {
      const start = numbers(centre.paths[index].getAttribute("d") ?? "");
      const end = numbers(target.paths[index].getAttribute("d") ?? "");
      path.setAttribute(
        "d",
        `M${between(start[0], end[0], progress)} ${between(start[1], end[1], progress)}L${between(start[2], end[2], progress)} ${between(start[3], end[3], progress)}`,
      );
    });
  }, []);

  const setBookPosition = useCallback(
    (position: number) => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      targetTiltRef.current = clamp(position);
      if (animationRef.current) return;

      const animate = () => {
        const next = between(currentTiltRef.current, targetTiltRef.current, MOTION_EASING);
        currentTiltRef.current =
          Math.abs(next - targetTiltRef.current) < 0.002 ? targetTiltRef.current : next;
        paint(currentTiltRef.current);
        const nextHighlight = highlightForTilt(currentTiltRef.current, activeHighlightRef.current);
        if (nextHighlight !== activeHighlightRef.current) {
          activeHighlightRef.current = nextHighlight;
          setActiveHighlight(nextHighlight);
        }
        if (currentTiltRef.current !== targetTiltRef.current) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          animationRef.current = null;
        }
      };
      animationRef.current = requestAnimationFrame(animate);
    },
    [paint],
  );

  const enableOrientation = useCallback(async () => {
    if (orientationEnabledRef.current || orientationRequestPendingRef.current) return;
    orientationRequestPendingRef.current = true;
    const orientation = window.DeviceOrientationEvent as MotionPermissionEvent;
    try {
      if (typeof orientation.requestPermission === "function") {
        if ((await orientation.requestPermission()) !== "granted") {
          return;
        }
      }

      orientationEnabledRef.current = true;
      const listener = (event: DeviceOrientationEvent) => {
        if (!manualPositionRef.current) setBookPosition((event.gamma ?? 0) / 18);
      };
      orientationListenerRef.current = listener;
      window.addEventListener("deviceorientation", listener, { passive: true });
    } catch {
      // Touch controls remain available when the device blocks sensor access.
    } finally {
      orientationRequestPendingRef.current = false;
    }
  }, [setBookPosition]);

  useEffect(
    () => () => {
      if (orientationListenerRef.current)
        window.removeEventListener("deviceorientation", orientationListenerRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    },
    [],
  );

  const moveWithPointer = (clientX: number) => {
    const bounds = bookRef.current?.getBoundingClientRect();
    if (bounds) setBookPosition(((clientX - bounds.left) / bounds.width) * 2 - 1);
  };

  useEffect(() => {
    const book = bookRef.current;
    if (!book || !window.matchMedia("(pointer: fine)").matches) return;

    const updateFromMouse = (clientX: number) => {
      const bounds = book.getBoundingClientRect();
      setBookPosition(((clientX - bounds.left) / bounds.width) * 2 - 1);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      lastMouseXRef.current = event.clientX;
      if (bookVisibleRef.current) updateFromMouse(event.clientX);
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        bookVisibleRef.current = entry.isIntersecting;
        if (entry.isIntersecting && lastMouseXRef.current !== null) {
          updateFromMouse(lastMouseXRef.current);
        }
      },
      { threshold: 0.2 },
    );

    observer.observe(book);
    document.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => {
      observer.disconnect();
      document.removeEventListener("pointermove", onPointerMove);
    };
  }, [setBookPosition]);

  const moveToTappedPosition = (clientX: number) => {
    const bounds = bookRef.current?.getBoundingClientRect();
    if (!bounds) return;

    const position = (clientX - bounds.left) / bounds.width;
    manualPositionRef.current = true;
    setBookPosition(position < 1 / 3 ? -1 : position > 2 / 3 ? 1 : 0);
  };

  const resetToTiltControl = () => {
    manualPositionRef.current = false;
    setBookPosition(0);
  };

  const isVisibleBookArea = (clientY: number) => {
    const bounds = bookRef.current?.getBoundingClientRect();
    return bounds ? (clientY - bounds.top) / bounds.height >= 0.55 : false;
  };

  return (
    <section
      className={compact ? "flex w-full justify-center" : "bg-[#F1A100] px-3 py-3 md:px-4"}
      onPointerUp={(event) => {
        if (event.pointerType !== "touch" || bookRef.current?.contains(event.target as Node))
          return;
        resetToTiltControl();
      }}
    >
      <div
        className={
          compact
            ? "relative flex w-full flex-col items-center justify-center"
            : "relative mx-auto flex min-h-[44rem] max-w-6xl flex-col items-center justify-center overflow-hidden rounded-4xl bg-[#F1A100] px-5 py-10 md:min-h-[48rem]"
        }
      >
        <button
          ref={bookRef}
          type="button"
          aria-label="Interactive open-book illustration"
          className={
            compact
              ? "relative w-[90%] aspect-[393/852] cursor-grab touch-pan-y select-none outline-none active:cursor-grabbing focus-visible:ring-4 focus-visible:ring-black/75 focus-visible:ring-offset-4 focus-visible:ring-offset-[#F1A100] md:h-[min(60vh,40rem)] md:w-auto"
              : "relative aspect-[393/852] w-full max-w-[24.5625rem] cursor-grab touch-pan-y select-none outline-none active:cursor-grabbing focus-visible:ring-4 focus-visible:ring-black/75 focus-visible:ring-offset-4 focus-visible:ring-offset-[#F1A100]"
          }
          onClick={enableOrientation}
          onPointerDown={(event) => {
            if (event.pointerType === "touch") {
              event.currentTarget.setPointerCapture(event.pointerId);
              touchStartRef.current = event.clientX;
              touchMovedRef.current = false;
              permissionGestureRef.current = !orientationEnabledRef.current;
              void enableOrientation();
            }
          }}
          onPointerMove={(event) => {
            if (event.pointerType === "mouse") {
              moveWithPointer(event.clientX);
              return;
            }
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
              if (Math.abs(event.clientX - (touchStartRef.current ?? event.clientX)) > 12) {
                touchMovedRef.current = true;
              }
              if (touchMovedRef.current) {
                manualPositionRef.current = true;
                moveWithPointer(event.clientX);
              }
            }
          }}
          onPointerUp={(event) => {
            if (event.pointerType === "touch" && !touchMovedRef.current) {
              if (permissionGestureRef.current) {
                permissionGestureRef.current = false;
                resetToTiltControl();
              } else if (isVisibleBookArea(event.clientY)) {
                moveToTappedPosition(event.clientX);
              } else {
                resetToTiltControl();
              }
            }
            if (event.pointerType === "touch") permissionGestureRef.current = false;
            touchStartRef.current = null;
          }}
          onPointerCancel={() => {
            permissionGestureRef.current = false;
            touchStartRef.current = null;
            touchMovedRef.current = false;
          }}
        >
          {!ready && (
            <Image
              src="/live/tilt-book/book-center.svg"
              alt=""
              fill
              priority
              className="pointer-events-none object-contain"
            />
          )}
          <svg
            ref={drawingRef}
            viewBox="0 0 393 852"
            className="absolute inset-0 h-full w-full"
            aria-hidden="true"
          />
          <h2 className="pointer-events-none absolute left-1/2 top-[19%] w-[90vw] -translate-x-1/2 text-center text-4xl font-black leading-[1.1] text-black md:text-5xl">
            What to Expect
          </h2>
          <span
            key={activeHighlight}
            className="pointer-events-none absolute left-1/2 top-[40%] w-[90vw] -translate-x-1/2 px-4 text-center text-2xl font-black leading-[1.08] text-black motion-safe:animate-[live-highlight-in_360ms_cubic-bezier(0.16,1,0.3,1)] md:text-3xl"
          >
            {HIGHLIGHTS[activeHighlight]}
          </span>
        </button>
        <div className="mt-4 w-[90vw] px-4 text-center md:hidden">
          <p className="text-xs font-semibold text-black/70">Tilt or tap to explore</p>
        </div>
      </div>
    </section>
  );
}
