// Rhythm Live — standalone event landing page (served at live.rhythm.you).
// Ticketing is handled by the external Ticket2U sign-up page.
//

import Image from "next/image";
import { FaqSection } from "./faq-section";
import { ScheduleSection } from "./schedule-section";
import { TiltBookSection } from "./tilt-book-section";

const EVENT_DETAILS = [
  { label: "Date", value: "3rd October 2026" },
  { label: "Time", value: "9:00AM - 12:00PM" },
  { label: "Location", value: "Collective" },
  { label: "Ticket", value: "RM49" },
];

const PROGRAMME_HIGHLIGHTS = [
  "Teaching: Spirit & Scripture Unpacked",
  "Interactive Q&A: Questions & Discussions",
  "Practical Handles: Rhythms for Daily Life",
];

export default function RhythmLivePage() {
  return (
    <div className="flex flex-col">
      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <div className="bg-[#F1A100] p-3 md:p-4">
        <section className="relative flex min-h-[calc(100vh-24px)] flex-col overflow-hidden rounded-4xl bg-[#F1A100] md:min-h-[calc(100vh-32px)]">
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
                href="#faq"
                className="text-sm font-medium text-black/80 transition-colors hover:text-black"
              >
                FAQ
              </a>
            </div>
          </nav>

          <div className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-2 px-6 pb-5 text-center md:grid-cols-[1.15fr_0.85fr] md:gap-12 md:px-12 md:pb-6 md:text-left">
            <div>
              <h1 className="font-nowstalgic text-5xl font-black leading-none text-black md:text-7xl">
                Rhythm Live II
              </h1>

              <p className="mt-4 text-2xl font-black leading-tight text-black md:text-4xl">
                THE WIND IN THE WORD: A DEEP DIVE
              </p>
              <p className="mx-auto mt-3 max-w-3xl text-sm leading-normal text-black md:mx-0 md:text-lg md:leading-relaxed">
                The Scripture isn&rsquo;t just a book to study, it&rsquo;s a living word breathed by
                the Holy Spirit. We&rsquo;re gathering for a deep dive into the relationship between
                the Spirit and the Word.
              </p>
              <dl className="mx-auto mt-5 grid max-w-4xl grid-cols-2 gap-x-6 gap-y-3 md:mx-0 md:grid-cols-4">
                {EVENT_DETAILS.map((item) => (
                  <div key={item.label} className="flex flex-col gap-1">
                    <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-black/65">
                      {item.label}
                    </dt>
                    <dd className="text-base font-bold text-black">{item.value}</dd>
                  </div>
                ))}
              </dl>
              <a
                href="https://www.ticket2u.com.my/event/51871_f6ead535ca2b4ceb9801fbb68554b516"
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex rounded-full bg-black px-6 py-3 text-sm font-semibold text-[#F1A100] transition-colors hover:bg-black/85"
              >
                Sign up now
              </a>
            </div>
            <TiltBookSection compact />
          </div>
        </section>
      </div>

      {/* ── SPEAKER ─────────────────────────────────────────────────────────── */}
      <section className="overflow-hidden bg-[#F1A100] px-6 py-20 md:px-12 md:py-28">
        <div className="mx-auto grid max-w-6xl items-end gap-10 md:grid-cols-[1fr_minmax(19rem,0.72fr)] md:gap-16">
          <div className="pb-2 text-center md:text-left">
            <h2 className="max-w-3xl text-4xl font-black leading-[1.04] text-black md:text-6xl">
              The Wind In The Word: A Deep Dive
            </h2>
            <div className="mt-8">
              <p className="text-2xl font-black leading-tight text-black md:text-3xl">
                Dr Victor Lee
              </p>
              <p className="mt-2 text-base font-medium text-black/75 md:text-lg">
                President, Bible College Malaysia
              </p>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-[26rem] self-end">
            <Image
              src="/live/victor-lee.png"
              alt="Dr Victor Lee, President of Bible College Malaysia"
              width={899}
              height={1132}
              sizes="(max-width: 767px) 85vw, 35vw"
              className="h-auto w-full"
            />
          </div>
        </div>
      </section>

      {/* ── SCHEDULE ────────────────────────────────────────────────────────── */}
      <ScheduleSection />

      {/* ── PROGRAMME HIGHLIGHTS ────────────────────────────────────────────── */}
      <section className="bg-[#F1A100] px-4 py-24 md:px-12">
        <div className="mx-auto grid max-w-5xl items-center gap-12 md:grid-cols-2">
          <div>
            <h2 className="mb-8 text-4xl md:text-5xl font-black leading-[1.1] text-black">
              What to
              <br />
              expect
            </h2>
            <ul className="list-disc space-y-4 pl-5">
              {PROGRAMME_HIGHLIGHTS.map((item) => (
                <li
                  key={item}
                  className="text-base md:text-lg leading-normal md:leading-relaxed text-black"
                >
                  {item}
                </li>
              ))}
            </ul>
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
      <div className="bg-[#F1A100] px-4 py-4 md:px-24">
        <FaqSection />
      </div>

      {/* ── EVENT DETAILS ───────────────────────────────────────────────────── */}
      <section className="bg-[#F1A100] px-4 py-16 text-center md:px-12">
        <dl className="mx-auto grid max-w-4xl grid-cols-2 gap-8 text-center md:grid-cols-4 mb-10">
          {EVENT_DETAILS.map((item) => (
            <div key={item.label}>
              <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-black/65">
                {item.label}
              </dt>
              <dd className="text-lg font-bold text-black">{item.value}</dd>
            </div>
          ))}
        </dl>
        <a
          href="https://www.ticket2u.com.my/event/51871_f6ead535ca2b4ceb9801fbb68554b516"
          target="_blank"
          rel="noreferrer"
          className="inline-flex rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-black/90"
        >
          Sign up now
        </a>
      </section>
    </div>
  );
}
