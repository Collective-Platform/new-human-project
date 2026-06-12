"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const display = { fontFamily: "var(--font-nowstalgic), serif" } as const;

const STACK_TOP_BASE = 24;
const TITLE_HEIGHT = 56;
// const CARD_BG = "var(--color-primary)";

const DRESS_CODE_ITEMS = [
  {
    label: "Arrival Clothing",
    body: "Arrive in comfortable, casual athleisure wear.",
    image: "/live/outfit-1.png",
    imageAlt: "Casual athleisure arrival outfit",
  },
  {
    label: "Performance Gear",
    body: "Pack a dedicated set of activewear and training shoes specifically for the Activation.",
    image: "/live/outfit-2.png",
    imageAlt: "Performance activewear and training shoes",
  },
  {
    label: "Post-Activity Change",
    body: "Bring a fresh, clean change of clothes for the post-workout sessions.",
    image: "/live/outfit-3.png",
    imageAlt: "Fresh clothes for post-activity",
  },
];

function ImageSlot({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative aspect-square w-full ">
      <Image
        src={src}
        alt={alt}
        fill
        className="object-contain p-6"
        sizes="(max-width: 768px) 100vw, 340px"
      />
    </div>
  );
}

export function DressCodeSection() {
  const mobileZoneRef = useRef<HTMLDivElement>(null);
  const [cardProgress, setCardProgress] = useState([0, 0, 0]);
  const vhRef = useRef(0);

  useEffect(() => {
    vhRef.current = window.innerHeight;

    const onScroll = () => {
      const zone = mobileZoneRef.current;
      if (!zone) return;
      const zoneScroll = -zone.getBoundingClientRect().top;
      const vh = vhRef.current;
      setCardProgress(
        DRESS_CODE_ITEMS.map((_, i) =>
          i === 0
            ? 1
            : Math.max(0, Math.min(1, (zoneScroll - (i - 1) * vh) / vh)),
        ),
      );
    };
    const onOrientationChange = () => {
      vhRef.current = window.innerHeight;
      onScroll();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("orientationchange", onOrientationChange);
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("orientationchange", onOrientationChange);
    };
  }, []);

  return (
    <section className="bg-primary">
      <div className="px-4 pb-32 pt-24 md:px-12">
        {/* Heading + paragraph */}
        <div className="mx-auto mb-4 md:mb-8 max-w-2xl text-center">
          <h2
            className="mb-5 text-4xl md:text-5xl font-bold leading-[1.1] text-white"
            style={display}
          >
            Mandatory <br /> Gear Check
          </h2>
          <p className="text-base md:text-lg leading-normal md:leading-relaxed text-white">
            To fully participate in the Rhythm Live experience, all ticket
            holders must adhere to the dress code.{" "}
            <strong className="text-white">Do not skip this.</strong>
          </p>
        </div>

        {/* ── Desktop: 3-column grid ───────────────────────────────────────── */}
        <div className="mx-auto hidden max-w-5xl gap-6 md:grid md:grid-cols-3">
          {DRESS_CODE_ITEMS.map(({ label, body, image, imageAlt }) => (
            <div
              key={label}
              className="overflow-hidden text-center rounded-2xl bg-[#242422]"
            >
              <div className="px-6 pt-5 pb-5">
                <p className="text-base font-bold uppercase tracking-[0.2em] text-white">
                  {label}
                </p>
              </div>
              <ImageSlot src={image} alt={imageAlt} />
              <div className="px-6 pb-5">
                <p className="text-base md:text-lg leading-normal md:leading-relaxed text-white">
                  {body}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Mobile: single sticky panel ──────────────────────────────────────
            The outer div is the scroll zone (3 × 100svh = one screen per card).
            The inner sticky div holds the paragraph AND all cards as one unit,
            so when the zone ends they all scroll away together — no smashing. */}
        <div
          ref={mobileZoneRef}
          className="md:hidden"
          style={{ height: `${DRESS_CODE_ITEMS.length * 100}svh` }}
        >
          <div
            className="sticky top-1 overflow-hidden"
            style={{ height: "calc(100svh - 1.5rem)" }}
          >
            {/* Cards slide up from off-screen and stack */}
            {DRESS_CODE_ITEMS.map(({ label, body, image, imageAlt }, i) => {
              const raw = cardProgress[i];
              const eased = 1 - Math.pow(1 - raw, 3);
              const stackedTop = STACK_TOP_BASE + i * TITLE_HEIGHT;

              return (
                <div
                  key={label}
                  className="absolute left-0 right-0 overflow-hidden rounded-2xl bg-[#2d2d2b]"
                  style={{
                    top: stackedTop,
                    transform: `translateY(calc(${1 - eased} * 100svh))`,
                    zIndex: (i + 1) * 10,

                    willChange: "transform",
                    boxShadow: "0 -2px 12px rgba(0,0,0,0.4)",
                  }}
                >
                  <div
                    className="flex items-center px-6"
                    style={{ height: TITLE_HEIGHT }}
                  >
                    <p className="text-sm font-bold uppercase tracking-[0.2em] text-white">
                      {label}
                    </p>
                  </div>
                  <ImageSlot src={image} alt={imageAlt} />
                  <div className="px-6 pt-4 pb-8">
                    <p className="text-base md:text-lg leading-normal md:leading-relaxed text-white">
                      {body}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
