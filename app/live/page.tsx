// Rhythm Live — standalone event landing page (served at live.rhythm.you).
// The July 4, 2026 event has ended; this page is now a post-event recap /
// "see you next time" holding state. Ticketing/checkout CTAs are removed and
// the live backend (Stripe + Google Sheets) is disabled via env vars in Vercel.
// Kept intact so it can be re-activated for the next Rhythm Live.
//

import Image from "next/image";
import { DressCodeSection } from "./dress-code-section";
import { FaqSection } from "./faq-section";
import { PartnersSection } from "./partners-section";
import { PillarsSection } from "./pillars-section";
import { ScheduleSection } from "./schedule-section";
import { SpeakersSection } from "./speakers-section";
import { TrackSection } from "./track-section";

// Event-details strips are commented out post-event (see the two sections below).
// Restore this and those sections to re-activate for the next Rhythm Live.
const EVENT_DETAILS = [
  { label: "Date", value: "July 4, 2026" },
  { label: "Time", value: "10AM – 4PM" },
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
            <div className="relative h-7 md:w-24 w-20">
              <Image
                src="/live/rhythm-logo.png"
                alt="Rhythm"
                fill
                sizes="96px"
                className="object-contain object-left"
                priority
              />
            </div>
            <div className="flex items-center gap-3 md:gap-5">
              <a
                href="#speakers"
                className="hidden text-sm font-medium text-white/90 transition-colors hover:text-white md:block"
              >
                Speakers
              </a>
              <a
                href="#tracks"
                className="hidden text-sm font-medium text-white/90 transition-colors hover:text-white md:block"
              >
                Activation Tracks
              </a>
              <a
                href="#faq"
                className="text-sm font-medium text-white/90 transition-colors hover:text-white shadow-black shadow-"
              >
                FAQ
              </a>
            </div>
          </nav>

          {/* Content anchored to the bottom */}
          <div className="relative mt-auto px-6 pb-5 text-center md:px-12 md:pb-6">
            <div className="relative mx-auto h-16 w-72 md:h-24 md:w-120">
              <Image
                src="/live/rhythm-live-title.png"
                alt="Rhythm Live"
                fill
                className="object-contain"
                priority
              />
            </div>

            <p className="mx-auto mb-3 max-w-2xl text-base md:text-lg leading-normal md:leading-relaxed text-white">
              A one-day gathering where the community comes together to learn, grow, worship,
              connect, and continue the journey together.
            </p>
            <p className="mx-auto mt-5 max-w-2xl text-lg md:text-xl font-bold text-white">
              See you at the next Rhythm Live.
            </p>
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
              <dd className="text-lg font-bold text-white">{item.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ── THREE PILLARS ───────────────────────────────────────────────────── */}
      <PillarsSection />

      {/* ── SPEAKERS ────────────────────────────────────────────────────────── */}
      <SpeakersSection />

      {/* ── SCHEDULE ────────────────────────────────────────────────────────── */}
      <ScheduleSection />

      {/* ── TRACKS ──────────────────────────────────────────────────────────── */}
      <TrackSection />

      {/* ── OUR PARTNERS ────────────────────────────────────────────────────── */}
      <PartnersSection />

      {/* ── DRESS CODE ──────────────────────────────────────────────────────── */}
      <DressCodeSection />

      {/* ── EXPERIENCE THE DAY ──────────────────────────────────────────────── */}
      <section className="bg-black px-4 py-24 md:px-12">
        <div className="mx-auto grid max-w-5xl items-center gap-12 md:grid-cols-2">
          <div>
            <h2 className="mb-8 text-4xl md:text-5xl font-black leading-[1.1] text-white">
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
              This isn&rsquo;t about sitting in a room and taking notes. It&rsquo;s about
              experiencing the movement you&rsquo;re already part of.
            </p>
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
              <dd className="text-lg font-bold text-white">{item.value}</dd>
            </div>
          ))}
        </dl>
        <p className="mx-auto max-w-2xl text-lg md:text-xl font-bold text-white">
          See you at the next Rhythm Live.
        </p>
      </section>
    </div>
  );
}
