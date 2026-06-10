// Rhythm Live — standalone event landing page (served at live.rhythm.you).
// No backend: the ticket CTA links out to ticket2u. Copy is from the
// Rhythm Live marketing copy.
//
// FUTURE / PERFORMANCE NOTE:
// When you add three.js or heavy animations, build them as a client component
// and load it here with next/dynamic so it ships ONLY on this route and never
// affects the rest of the app. Example (once the package is installed):
//
//   import dynamic from "next/dynamic";
//   const LiveHeroCanvas = dynamic(() => import("./live-hero-canvas"), { ssr: false });
//
// Then drop <LiveHeroCanvas /> into the hero section below.

import type { ReactNode } from "react";
import { CountdownTimer } from "./countdown-timer";
import { FaqSection } from "./faq-section";

const TICKET_URL = "https://www.ticket2u.com.my/event/50219/rhythm-live";

const EVENT_DETAILS = [
  { label: "Date", value: "July 4, 2026" },
  { label: "Time", value: "10AM – 3PM" },
  { label: "Location", value: "Collective" },
  { label: "Ticket", value: "RM109" },
];

const PILLARS = [
  {
    name: "Mental",
    title: "Renewing The Mind",
    detail:
      "Learn how to cultivate clarity, focus, wisdom, and attention in a world competing for your mind.",
    color: "var(--color-category-mental)",
    bg: "var(--color-category-mental-bg)",
    icon: "/icons/Mental.svg",
  },
  {
    name: "Emotional",
    title: "Forming The Heart",
    detail:
      "Discover how emotional honesty, resilience, and healthy inner rhythms can lead to deeper freedom and healthier relationships.",
    color: "var(--color-category-emotional)",
    bg: "var(--color-category-emotional-bg)",
    icon: "/icons/Emotional.svg",
  },
  {
    name: "Physical",
    title: "Stewarding The Body",
    detail:
      "Explore how movement, recovery, sleep, and physical wellbeing can become acts of stewardship that support every area of life.",
    color: "var(--color-category-physical)",
    bg: "var(--color-category-physical-bg)",
    icon: "/icons/Physical.svg",
  },
];

const EXPERIENCES = [
  "Inspiring keynote sessions",
  "Interactive community experiences",
  "Practical activities and activations",
  "Opportunities to connect with fellow members",
  "Partner booths and experiences",
  "Moments of celebration and reflection",
  "Practical next steps for the journey ahead",
];

const display = { fontFamily: "var(--font-nowstalgic), serif" } as const;

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

function ImagePlaceholder({
  label,
  className,
  dark = false,
}: {
  label: string;
  className?: string;
  dark?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 rounded-[--radius-md] ${
        dark ? "bg-white/6" : "bg-surface-container-high"
      } ${className ?? ""}`}
    >
      <CameraIcon
        className={`size-7 ${dark ? "text-white/20" : "text-outline-variant"}`}
      />
      <p
        className={`text-xs font-medium ${dark ? "text-white/25" : "text-outline"}`}
      >
        {label}
      </p>
    </div>
  );
}

function SectionLabel({
  children,
  dark = false,
}: {
  children: ReactNode;
  dark?: boolean;
}) {
  return (
    <p
      className={`mb-3 text-xs font-semibold uppercase tracking-[0.25em] ${
        dark ? "text-white/50" : "text-primary"
      }`}
    >
      {children}
    </p>
  );
}

function CtaButton({
  href,
  children,
  fullWidth = false,
}: {
  href: string;
  children: ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-block rounded-full bg-primary py-4 text-center text-base font-bold text-white  transition-opacity hover:opacity-90 active:scale-[0.98] ${
        fullWidth ? "w-full" : "w-full md:w-auto md:px-12"
      }`}
    >
      {children}
    </a>
  );
}

export default function RhythmLivePage() {
  return (
    <div className="flex flex-col">
      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      {/* Black outer frame gives the "card floating on dark canvas" feel */}
      <div className="bg-black p-6 md:p-4">
        <section className="relative flex min-h-[calc(100vh-24px)] flex-col overflow-hidden rounded-4xl bg-on-surface md:min-h-[calc(100vh-32px)]">
          {/* Hero background video */}
          {/* scale(21/16) zooms past the letterbox bars baked into the 16:9 frame */}
          <video
            className="absolute inset-0 h-full w-full scale-[1.3125] object-cover"
            src="https://mqyxc4xvodvuodmx.public.blob.vercel-storage.com/Rhythm%20Live%20Teaser.mp4"
            autoPlay
            loop
            muted
            playsInline
          />
          {/* Gradient so text at the bottom stays legible */}
          <div className="absolute inset-x-0 bottom-0 h-3/4 bg-linear-to-t from-on-surface via-on-surface/80 to-transparent" />

          {/* Nav bar */}
          <nav className="relative flex items-center justify-between px-6 py-5 md:px-8">
            <span className="font-nowstalgic text-xl font-bold text-primary">
              Rhythm
            </span>
            <div className="flex items-center gap-3 md:gap-5">
              <a
                href="#about"
                className="hidden text-sm font-medium text-white/90 transition-colors hover:text-white md:block"
              >
                About
              </a>
              <a
                href="#speakers"
                className="hidden text-sm font-medium text-white/90 transition-colors hover:text-white md:block"
              >
                Speakers
              </a>
              <a
                href="#faq"
                className="hidden text-sm font-medium text-white/90 transition-colors hover:text-white md:block shadow-black shadow-"
              >
                FAQ
              </a>
              <a
                href={TICKET_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-white  transition-opacity hover:opacity-90 active:scale-[0.98]"
              >
                Get Tickets
              </a>
            </div>
          </nav>

          {/* Content anchored to the bottom */}
          <div className="relative mt-auto px-6 pb-16 text-center md:px-12 md:pb-6">
            <h1
              className="mb-6 text-[2rem] font-bold leading-none tracking-tight text-white md:text-[4rem]"
              style={display}
            >
              Rhythm Live
            </h1>

            <p className="mx-auto mb-4 max-w-2xl text-lg leading-relaxed text-white md:text-lg">
              A one-day gathering where the community comes together to learn,
              grow, worship, connect, and continue the journey together.
            </p>
            <CountdownTimer />
            <CtaButton href={TICKET_URL}>Reserve My Seat</CtaButton>
            <p className="mt-3 text-xs text-white/40">Limited to 300 Members</p>
          </div>
        </section>
      </div>

      {/* ── EVENT DETAILS STRIP ─────────────────────────────────────────────── */}
      <section className="bg-black px-4 py-10 md:px-12">
        <dl className="mx-auto grid max-w-4xl grid-cols-2 gap-6 md:grid-cols-4 text-center">
          {EVENT_DETAILS.map((item) => (
            <div key={item.label} className="flex flex-col gap-1">
              <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-white">
                {item.label}
              </dt>
              <dd className="text-lg font-bold text-white" style={display}>
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ── DRESS CODE ──────────────────────────────────────────────────────── */}
      <section className="px-4 py-24 md:px-12 bg-primary">
        <div className="mx-auto grid max-w-5xl items-center gap-12 md:grid-cols-2">
          <div>
            <SectionLabel dark>Dress Code</SectionLabel>
            <h2
              className="mb-4 text-4xl font-bold leading-[1.1] text-white md:text-5xl"
              style={display}
            >
              Mandatory
              <br />
              Gear Check
            </h2>
            <p className="mb-8 text-base leading-relaxed text-white md:text-lg">
              To fully participate in the Rhythm Live experience, all ticket
              holders must adhere to the dress code. Do not skip this.
            </p>
            <div className="space-y-5">
              {[
                {
                  label: "Arrival Clothing",
                  body: "Arrive in comfortable, casual athleisure wear.",
                },
                {
                  label: "Performance Gear",
                  body: "Pack a dedicated set of activewear and training shoes specifically for the Activation.",
                },
                {
                  label: "Post-Activity Change",
                  body: "Bring a fresh, clean change of lifestyle clothes for the post-workout sessions.",
                },
              ].map(({ label, body }) => (
                <div key={label} className="flex gap-4">
                  <span
                    aria-hidden
                    className="mt-1 size-2 shrink-0 rounded-full bg-white"
                  />
                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.15em] text-black">
                      {label}
                    </p>
                    <p className="mt-1 text-base leading-relaxed text-white">
                      {body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <ImagePlaceholder
            label="Dress code photo placeholder"
            className="aspect-3/4 w-full"
          />
        </div>
      </section>

      {/* ── THREE PILLARS ───────────────────────────────────────────────────── */}
      <section className="px-4 py-24 md:px-12">
        <div className="mx-auto max-w-4xl">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2
              className="mb-4 text-4xl font-bold leading-[1.1] text-on-surface md:text-5xl"
              style={display}
            >
              Three Pillars.
              <br />
              One Whole Life.
            </h2>
            <p className="text-base leading-relaxed text-on-surface-variant md:text-lg">
              We often separate life into different compartments. Spiritual.
              Mental. Emotional. Physical. But God created us as whole people.
              At Rhythm Live, we’ll explore how every part of our lives can
              become part of our spiritual formation.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {PILLARS.map((pillar) => (
              <div
                key={pillar.name}
                className="overflow-hidden rounded-[--radius-md] bg-white"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                {/* Card image area — category tint + icon + photo placeholder badge */}
                <div
                  className="relative flex aspect-4/3 items-center justify-center"
                  style={{ backgroundColor: pillar.bg }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={pillar.icon}
                    alt=""
                    className="size-16 opacity-40"
                  />
                  {/* <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-white/70 px-2.5 py-1 backdrop-blur-sm">
                    <CameraIcon className="size-3 text-outline" />
                    <span className="text-[10px] font-medium text-outline">
                      photo placeholder
                    </span>
                  </div> */}
                </div>

                {/* Card body */}
                <div className="p-6">
                  <p
                    className="mb-1.5 text-xs font-semibold uppercase tracking-[0.2em]"
                    style={{ color: pillar.color }}
                  >
                    {pillar.name}
                  </p>
                  <h3
                    className="mb-3 text-xl font-bold text-on-surface"
                    style={display}
                  >
                    {pillar.title}
                  </h3>
                  <p className="mb-5 text-sm leading-relaxed text-on-surface-variant">
                    {pillar.detail}
                  </p>
                  <div className="border-t border-outline-variant pt-4">
                    {/* <p className="text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant">
                      Speaker
                    </p>
                    <p className="text-base font-medium text-on-surface">
                      [Speaker Name]
                    </p> */}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EXPERIENCE THE DAY ──────────────────────────────────────────────── */}
      <section className="bg-on-surface px-4 py-24 md:px-12">
        <div className="mx-auto grid max-w-5xl items-start gap-12 md:grid-cols-2">
          <div>
            <SectionLabel dark>What To Expect</SectionLabel>
            <h2
              className="mb-4 text-4xl font-bold leading-[1.1] text-white md:text-5xl"
              style={display}
            >
              Experience
              <br />
              Rhythm.You Live
            </h2>
            <ul className="space-y-4">
              {EXPERIENCES.map((item) => (
                <li key={item} className="flex items-start gap-4">
                  <span
                    aria-hidden
                    className="mt-2 size-2 shrink-0 rounded-full bg-primary"
                  />
                  <span className="text-base leading-relaxed text-white/80">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-8 text-sm italic text-white/45">
              This isn&rsquo;t about sitting in a room and taking notes.
              It&rsquo;s about experiencing the movement you&rsquo;re already
              part of.
            </p>
          </div>

          {/* Photo grid placeholder */}
          <div className="flex flex-col gap-4">
            <ImagePlaceholder
              dark
              label="Event photo"
              className="aspect-video w-full"
            />
            <div className="grid grid-cols-2 gap-4">
              <ImagePlaceholder
                dark
                label="Activity photo"
                className="aspect-square w-full"
              />
              <ImagePlaceholder
                dark
                label="Community photo"
                className="aspect-square w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────────── */}
      <FaqSection />

      {/* ── EVENT DETAILS ───────────────────────────────────────────────────── */}
      <section className="border-y border-outline-variant bg-surface-container px-4 py-16 md:px-12">
        <dl className="mx-auto grid max-w-4xl grid-cols-2 gap-8 text-center md:grid-cols-4">
          {EVENT_DETAILS.map((item) => (
            <div key={item.label}>
              <dt className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant">
                {item.label}
              </dt>
              <dd className="text-lg font-bold text-on-surface" style={display}>
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
        <CtaButton href={TICKET_URL}>Get A Ticket</CtaButton>
        <p className="mt-10 text-center text-sm text-on-surface-variant">
          No walk-ins. Once tickets are gone, registration closes.
        </p>
      </section>
    </div>
  );
}
