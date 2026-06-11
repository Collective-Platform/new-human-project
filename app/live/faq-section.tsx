// Adapted from the Collective Conference 2024 FAQ.
// Accordion uses native <details>/<summary> — no client JS needed.
// On desktop, the left image is sticky while only the right accordion scrolls.

import Image from "next/image";
import type { ReactNode } from "react";

const display = { fontFamily: "var(--font-nowstalgic), serif" } as const;

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

type FaqItem = { q: string; a: ReactNode };

const FAQ_ITEMS: FaqItem[] = [
  {
    q: "Will the full schedule be revealed?",
    a: "Yes! The full schedule will be revealed as we get closer to the event date. There will be breaks in between the sessions. Do get to the venue early so that we can get you through the check-in process swiftly for you to secure the best seat in the venue!",
  },
  {
    q: "Will there be more speakers?",
    a: "Yes, the speaker line-up will be updated as they are confirmed. Be sure to grab your ticket as soon as possible so you don't miss out!",
  },
  {
    q: "How do I get to the venue?",
    a: (
      <div className="space-y-2">
        <p>
          <strong className="font-semibold text-on-surface">
            Collective, Subang Jaya
          </strong>
          <br />
          3, Jalan SS 13/4, Subang Jaya Industrial Estate, 47500 Subang Jaya,
          Selangor
        </p>
        <p className="flex gap-3">
          <a
            href="https://maps.app.goo.gl/N8boWPriPJ6VnKK88"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-secondary underline underline-offset-2"
          >
            Google Maps
          </a>
          <a
            href="https://waze.com/ul/hw281rygd4"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-secondary underline underline-offset-2"
          >
            Waze
          </a>
        </p>
      </div>
    ),
  },
  {
    q: "Are there accommodation options nearby?",
    a: (
      <ul className="space-y-1">
        {[
          {
            label: "Sunway Lagoon Hotel",
            href: "https://www.sunwayhotels.com/sunway-lagoon",
          },
          {
            label: "Sunway Resort Hotel",
            href: "https://www.sunwayhotels.com/sunway-resort",
          },
          {
            label: "Grand Dorsett Subang Jaya",
            href: "https://www.dorsetthotels.com/dorsett-grand-subang/index.html",
          },
        ].map(({ label, href }) => (
          <li key={label}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-secondary underline underline-offset-2"
            >
              {label}
            </a>
          </li>
        ))}
      </ul>
    ),
  },
  {
    q: "Is there parking at the venue?",
    a: (
      <p>
        There is limited parking within the venue on a first come, first served
        basis. Alternatively, street parking is available outside, or paid
        parking at{" "}
        <a
          href="https://maps.app.goo.gl/iQLMh6BTWVBqXckz9"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-secondary underline underline-offset-2"
        >
          The Grand Subang
        </a>{" "}
        directly across the street.
      </p>
    ),
  },
  {
    q: "Will meals be provided?",
    a: (
      <div className="space-y-2">
        <p>
          Meals will not be provided, but there are great food options at or
          within walking distance of the venue:
        </p>
        <ul className="space-y-1">
          {[
            {
              label: "Rinjin Shokudo",
              href: "https://maps.app.goo.gl/9gY4Kx8vD7emtoYM6",
            },
            {
              label: "GreySkyMorning",
              href: "https://www.instagram.com/greyskymorningkl/",
            },
            {
              label: "Restaurant New Sea View",
              href: "https://maps.app.goo.gl/F7qUyYNooTz4Rmd19",
            },
            {
              label: "Restaurant Al-Baik",
              href: "https://maps.app.goo.gl/5TBfhFdRhmr9h4aa8",
            },
          ].map(({ label, href }) => (
            <li key={label}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-secondary underline underline-offset-2"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    q: "Will the sessions be recorded?",
    a: "No, we want the experience to be fully enjoyed live! Block out your time and come fully prepared. We can't wait to see you there.",
  },
  {
    q: "What if I bought a ticket but can't make it?",
    a: (
      <div className="space-y-2">
        <p>
          All ticket purchases are strictly non-refundable and non-deferrable.
        </p>
        <p>
          You may transfer your ticket to another person by emailing{" "}
          <a
            href="mailto:admin@collective.my"
            className="font-medium text-secondary underline underline-offset-2"
          >
            admin@collective.my
          </a>{" "}
          with your ticket number, your full name and contact details, and the
          new attendee&rsquo;s full name and contact details.
        </p>
      </div>
    ),
  },
  {
    q: "What will I receive after purchasing my ticket?",
    a: "E-tickets are sent to your email after purchase. A valid QR code must be shown at the venue entrance — do not alter or deface it. One ticket admits one person only.",
  },
  {
    q: "Conditions of sale",
    a: (
      <div className="space-y-3">
        <p className="text-on-surface">
          Please read and understand the conditions of sale before purchasing.
        </p>
        <ul className="space-y-2">
          {[
            "By purchasing you are agreeing to our terms & conditions.",
            "This event is open to non-Muslims only.",
            "All tickets are made available on a first-come, first-serve basis.",
            "All tickets are sold online and issued electronically only.",
            "All ticket purchases are strictly non-refundable and non-deferrable.",
            "The price of the ticket shall be the price set at the time the order for the ticket is accepted.",
            "The organizer will not be held responsible for any ticket that is lost, stolen, damaged or destroyed.",
            "This is an open seating event, and seats are available on a first-come, first-serve basis. We encourage you to come early to get your preferred seat on the event day.",
          ].map((item) => (
            <li key={item} className="flex gap-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-outline-variant" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    q: "What payment methods are accepted?",
    a: "Ticket2u accepts Local Bank Transfers (FPX), VISA, and Mastercard (local and international). AMEX is not accepted. International customers — please ensure 3D Secure is enabled on your card.",
  },
  {
    q: "Disclaimer",
    a: (
      <div className="space-y-3">
        <p>
          The Rhythm Live event will be captured in photographs and audio and
          visual footage. The organizers reserve the right to use this material
          for any purposes in perpetuity.
        </p>
        <p>
          The organizers reserve the right to change or amend any of the terms
          &amp; conditions at any time at their sole discretion without prior
          notice.
        </p>
        <p>
          The organizers shall not be liable for any injury, loss of property or
          any other damage or loss suffered as a result of your participation in
          the event. Attendees assume all risks when participating in this event
          and agree to use care, good judgment and abide by the rules and
          directions given during the event.
        </p>
      </div>
    ),
  },
  {
    q: "Need help?",
    a: (
      <div className="space-y-2">
        <p>
          <strong className="font-semibold text-on-surface">
            Ticket issues:
          </strong>{" "}
          Contact Ticket2U via Live Chat on the event page, or email{" "}
          <a
            href="mailto:help@ticket2u.com"
            className="font-medium text-secondary underline underline-offset-2"
          >
            help@ticket2u.com
          </a>{" "}
          (10am–6pm weekdays).
        </p>
        <p>
          <strong className="font-semibold text-on-surface">
            Event questions:
          </strong>{" "}
          Email{" "}
          <a
            href="mailto:admin@collective.my"
            className="font-medium text-secondary underline underline-offset-2"
          >
            admin@collective.my
          </a>{" "}
          or call{" "}
          <a
            href="tel:+60356387573"
            className="font-medium text-secondary underline underline-offset-2"
          >
            +603-5638 7573
          </a>{" "}
          (Tue–Fri, 10am–6pm).
        </p>
      </div>
    ),
  },
];

export function FaqSection() {
  return (
    <section id="faq" className="overflow-clip rounded-4xl bg-white">
      {/*
        Desktop: 2-col grid. Left image is sticky top-0 h-screen so it pins
        while the right accordion scrolls. Once the section ends (accordion
        exhausted), both columns leave the viewport together — natural un-stick.
        Mobile: single column, image hidden.
      */}
      <div className="grid md:grid-cols-2">
        {/* ── LEFT — sticky image ─────────────────────────────────────────── */}
        <div className="hidden md:block">
          <div className="sticky top-0 flex h-screen items-center p-10 lg:p-16">
            <div className="relative h-full max-h-170 w-full overflow-hidden rounded-[--radius-md]">
              <Image
                src="/live/faq.jpg"
                alt="Attendees connecting at Collective"
                fill
                className="object-cover"
                sizes="50vw"
              />
            </div>
          </div>
        </div>

        {/* ── RIGHT — accordion ───────────────────────────────────────────── */}
        <div className="px-6 py-8 md:py-24 md:px-10 lg:px-16">
          <h2
            className="mb-4 md:mb-10 text-4xl font-bold leading-[1.1] text-on-surface md:text-5xl"
            style={display}
          >
            Frequently
            <br />
            Asked Questions
          </h2>

          <div className="divide-y divide-outline-variant">
            {FAQ_ITEMS.map(({ q, a }) => (
              <details key={q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-base font-semibold text-on-surface">
                  <span>{q}</span>
                  <ChevronDown className="mt-0.5 size-5 shrink-0 text-outline transition-transform duration-200 group-open:rotate-180" />
                </summary>
                <div className="mt-3 text-sm leading-relaxed text-on-surface-variant">
                  {typeof a === "string" ? <p>{a}</p> : a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
