import type { ReactNode } from "react";

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
    a: (
      <div className="space-y-2">
        <p>
          Yes! The full schedule will be revealed as we get closer to the event
          date
        </p>
        <p>There will be breaks in between the sessions.</p>
        <p>
          Do get to the venue early so that we can get you through the check-in
          process swiftly for you to secure the best seat in the venue!
        </p>
      </div>
    ),
  },
  {
    q: "Will there be more speakers?",
    a: "Yes, the speaker line-up will be updated on our website as and when they are confirmed. Be sure to sign up as soon as possible so you don't miss out on anything!",
  },
  {
    q: "How do I get to the venue?",
    a: (
      <div className="space-y-2">
        <p>Here&rsquo;s the location of the event venue.</p>
        <p>
          Address: 3, Jalan SS 13/4, Subang Jaya Industrial Estate, 47500 Subang
          Jaya, Selangor
        </p>
        <p>
          Google Maps:{" "}
          <a
            href="https://maps.app.goo.gl/N8boWPriPJ6VnKK88"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-secondary underline underline-offset-2"
          >
            Collective
          </a>
        </p>
        <p>
          Waze:{" "}
          <a
            href="https://waze.com/ul/hw281rygd4"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-secondary underline underline-offset-2"
          >
            Collective
          </a>
        </p>
      </div>
    ),
  },
  {
    q: "Are there accommodation options nearby?",
    a: (
      <>
        <p>
          Here are a few hotels near the venue with food and shopping options
          close by.
        </p>
        <ul className="list-disc space-y-1 pl-5">
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
      </>
    ),
  },
  {
    q: "Are there parking facilities within the event venue?",
    a: (
      <div className="space-y-2">
        <p>
          There is limited parking space within the venue and they are available
          on a first come first served basis.
        </p>
        <p>
          Alternatively, there is street parking outside the venue or paid
          parking at{" "}
          <a
            href="https://maps.app.goo.gl/iQLMh6BTWVBqXckz9"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-secondary underline underline-offset-2"
          >
            The Grand Subang
          </a>{" "}
          which is just right across the street.
        </p>
      </div>
    ),
  },
  {
    q: "Will meals be provided during the event?",
    a: (
      <div className="space-y-2">
        <p>
          Meals will not be provided during the event but here are some options
          for food and beverages that are in the event venue or within walking
          distance.
        </p>
        <ul className="list-disc space-y-1 pl-5">
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
    q: "Will recordings of the sessions be provided?",
    a: "No, we want the experience to be fully enjoyed live! Block out your time and come fully prepared. We can't wait to see you there.",
  },
  {
    q: "What if I bought the tickets but I am not able to make it?",
    a: (
      <div className="space-y-2">
        <p>
          All ticket purchases are strictly non-refundable and non-deferrable.
        </p>
        <p>
          If you have purchased a ticket but are unable to attend, you may
          consider gifting your ticket to another person. However, your
          registration details must be transferred to the new attendee. Please
          email{" "}
          <a
            href="mailto:admin@collective.my"
            className="font-medium text-secondary underline underline-offset-2"
          >
            admin@collective.my
          </a>{" "}
          and provide us the following:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          {[
            "Your ticket number (located below the QR code).",
            "Your full name, email address and mobile number (as used in your ticket purchase).",
            "The new attendees' full name, email address and mobile number.",
          ].map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    q: "What will I receive after payment of ticket purchase?",
    a: (
      <div className="space-y-2">
        <p>
          E-tickets will be sent to the{" "}
          <strong className="font-semibold text-on-surface">
            BUYER&rsquo;S EMAIL
          </strong>
          . The buyer is responsible to forward/pass the e-ticket to all
          respective attendees.
        </p>
        <p>
          Every successful purchase will receive an SMS from Ticket2u and emails
          from Razer Pay and Ticket2u. The emails contain payment confirmation
          and an e-ticket with embedded QR code.
        </p>
        <p>
          A valid QR code must be produced to enter the event venue. Removing
          any part of and/or, altering and/or defacing the QR code may
          invalidate the ticket.
        </p>
        <p>One (1) ticket admits one (1) person only.</p>
        <p>
          For bulk ticket purchases (more than 1 ticket), the corresponding SMS
          from Ticket2U and emails from Razer Pay and Ticket2u will be sent ONLY
          to the{" "}
          <strong className="font-semibold text-on-surface">
            BUYER&rsquo;S EMAIL
          </strong>
          .
        </p>
      </div>
    ),
  },
  {
    q: "Conditions of sale",
    a: (
      <div className="space-y-3">
        <p className="text-on-surface">
          Please read and understand the conditions of sale before purchasing.
        </p>
        <ul className="list-disc space-y-2 pl-5">
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
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    q: "Payment Methods",
    a: (
      <div className="space-y-2">
        <p>
          Our ticketing platform Ticket2u accepts payment via Local Bank
          Transfers (FPX), VISA and MASTERCARD credit cards (local and
          international). AMEX is currently NOT accepted.
        </p>
        <p>
          International Customers - please ensure that 3D Secure has been
          enabled by the issuer of your respective VISA and/or MASTERCARD.
          Without 3D Secure enabled, your ticket purchase via VISA and/or
          MASTERCARD may not be successful.
        </p>
        <p>
          3D Secure is an authentication scheme that requires the cardholder to
          enter an additional password when they make an online purchase. This
          applies to Visa and Mastercard in any region.
        </p>
      </div>
    ),
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
          The organizers reserve the right to change or amend any of terms and
          conditions at any time as its sole discretion without prior notice.
        </p>
        <p>
          The organizers shall not be liable for any injury, loss of property or
          any other damage or loss suffered as a result of your participation in
          the event. Attendees assume all risks when participating in this event
          as well as agree to use care, good judgment and abide by the rules and
          directions given during the event.
        </p>
        <p>
          You may refer to our{" "}
          <a
            href="https://collective.my/privacy/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-secondary underline underline-offset-2"
          >
            privacy policy
          </a>{" "}
          and{" "}
          <a
            href="https://collective.my/terms/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-secondary underline underline-offset-2"
          >
            terms and condition
          </a>{" "}
          here.
        </p>
      </div>
    ),
  },
  {
    q: "Assistance",
    a: (
      <div className="space-y-2">
        <p>
          If you&rsquo;re facing issues with ticket purchasing/payments, please
          contact Ticket2U customer service. On the Ticket2u event page, click
          the bottom left &ldquo;Live Chat&rdquo; button to start a chat or
          leave a message. A Ticket2u customer service personnel will get back
          to you as soon as possible.
        </p>
        <p>
          Alternatively, you may email{" "}
          <a
            href="mailto:help@ticket2u.com"
            className="font-medium text-secondary underline underline-offset-2"
          >
            help@ticket2u.com
          </a>{" "}
          during office hours (10am-6pm weekdays).
        </p>
        <p>
          If you have questions about the Rhythm Live, please email{" "}
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
          during office hours, Tuesday to Friday (10am-6pm).
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

      <div className="px-6 py-8 md:py-24 md:px-10 lg:px-16">
        <h2
          className="mb-4 md:mb-10 text-4xl md:text-5xl font-black leading-[1.1] text-on-surface"
        >
          Frequently
          <br />
          Asked Questions
        </h2>

        <div className="divide-y divide-outline-variant">
          {FAQ_ITEMS.map(({ q, a }) => (
            <details key={q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-lg md:text-xl leading-tight font-semibold text-on-surface">
                <span>{q}</span>
                <ChevronDown className="mt-0.5 size-5 shrink-0 text-outline transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <div className="mt-3 text-base md:text-lg leading-normal md:leading-relaxed text-black/90">
                {typeof a === "string" ? <p>{a}</p> : a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
