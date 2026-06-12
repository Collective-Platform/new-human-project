// Rhythm Live — standalone event landing page (served at live.rhythm.you).
// No backend: the ticket CTA links out to ticket2u. Copy is from the
// Rhythm Live marketing copy.
//

import Image from "next/image";
import type { ReactNode } from "react";
import { CountdownTimer } from "./countdown-timer";
import { DressCodeSection } from "./dress-code-section";
import { FaqSection } from "./faq-section";
import { PillarsSection } from "./pillars-section";
import { SpeakersSection } from "./speakers-section";

const TICKET_URL = "https://www.ticket2u.com.my/event/50219/rhythm-live";

const EVENT_DETAILS = [
  { label: "Date", value: "July 4, 2026" },
  { label: "Time", value: "10AM – 3PM" },
  { label: "Location", value: "Collective" },
  { label: "Ticket", value: "RM109" },
];

const EXPERIENCES = [
  "Inspiring keynote sessions.",
  "Interactive community experiences.",
  "Practical activations.",
  "Opportunities to connect with like-minded participants.",
  "Moments of celebration and reflection.",
  "Practical next steps for the journey ahead.",
];

const display = { fontFamily: "var(--font-nowstalgic), serif" } as const;

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
      <div className="bg-black p-3 md:p-4">
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
          <div className="relative mt-auto px-6 pb-5 text-center md:px-12 md:pb-6">
            <h1
              className="mb-6 text-[2.5rem] font-bold leading-none tracking-tight text-white md:text-[4rem]"
              style={display}
            >
              Rhythm Live
            </h1>

            <p className="mx-auto mb-3 max-w-2xl text-base md:text-lg leading-normal md:leading-relaxed text-white">
              A one-day gathering where the community comes together to learn,
              grow, worship, connect, and continue the journey together.
            </p>
            <CountdownTimer />
            <CtaButton href={TICKET_URL}>Reserve My Seat</CtaButton>
            <p className="mt-3 text-sm text-white/60">Limited to 300 Members</p>
          </div>
        </section>
      </div>

      {/* ── EVENT DETAILS STRIP ─────────────────────────────────────────────── */}
      <section className="bg-black px-4 py-10 md:px-12">
        <dl className="mx-auto grid max-w-4xl grid-cols-2 gap-6 md:grid-cols-4 text-center">
          {EVENT_DETAILS.map((item) => (
            <div key={item.label} className="flex flex-col gap-1">
              <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
                {item.label}
              </dt>
              <dd className="text-lg font-bold text-white" style={display}>
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ── THREE PILLARS ───────────────────────────────────────────────────── */}
      <PillarsSection />

      {/* ── SPEAKERS ────────────────────────────────────────────────────────── */}
      <SpeakersSection />

      {/* ── DRESS CODE ──────────────────────────────────────────────────────── */}
      <DressCodeSection />

      {/* ── EXPERIENCE THE DAY ──────────────────────────────────────────────── */}
      <section className="bg-black px-4 py-24 md:px-12">
        <div className="mx-auto grid max-w-5xl items-center gap-12 md:grid-cols-2">
          <div>
            <h2
              className="mb-8 text-4xl md:text-5xl font-bold leading-[1.1] text-white"
              style={display}
            >
              Experience
              <br />
              Rhythm.You Live
            </h2>
            <ul className="list-disc space-y-4 pl-5">
              {EXPERIENCES.map((item) => (
                <li
                  key={item}
                  className="text-base md:text-lg leading-normal md:leading-relaxed text-white"
                >
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-8 text-base md:text-lg leading-normal md:leading-relaxed italic text-white">
              This isn&rsquo;t about sitting in a room and taking notes.
              It&rsquo;s about experiencing the movement you&rsquo;re already
              part of.
            </p>
            <div className="mt-8">
              <CtaButton href={TICKET_URL}>Reserve My Seat</CtaButton>
            </div>
          </div>

          {/* Photo grid */}
          <div className="flex flex-col gap-4">
            <div className="relative aspect-video w-full overflow-hidden rounded-[--radius-md]">
              <Image
                src="/live/speaker.jpg"
                alt="Speaker presenting at Rhythm Live event"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative aspect-square w-full overflow-hidden rounded-[--radius-md]">
                <Image
                  src="/live/interaction.jpg"
                  alt="Community interaction at Rhythm Live"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              </div>
              <div className="relative aspect-square w-full overflow-hidden rounded-[--radius-md]">
                <Image
                  src="/live/speaking.jpg"
                  alt="Panel discussion at Rhythm Live"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────────── */}
      <div className="bg-black px-4 md:px-24 py-4">
        <FaqSection />
      </div>

      {/* ── EVENT DETAILS ───────────────────────────────────────────────────── */}
      <section className="bg-black px-4 py-16 md:px-12 text-center">
        <dl className="mx-auto grid max-w-4xl grid-cols-2 gap-8 text-center md:grid-cols-4 mb-10">
          {EVENT_DETAILS.map((item) => (
            <div key={item.label}>
              <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
                {item.label}
              </dt>
              <dd className="text-lg font-bold text-white" style={display}>
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
        <div className="flex justify-center">
          <CtaButton href={TICKET_URL}>Reserve My Seat</CtaButton>
        </div>
        <p className="mt-6 text-sm text-white/80">
          No walk-ins. Once tickets are gone, registration closes.
        </p>
      </section>
    </div>
  );
}
