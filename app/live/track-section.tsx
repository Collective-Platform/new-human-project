"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type Availability = Record<
  string,
  Record<string, { sold: number; capacity: number }>
>;

const TRACKS = [
  {
    name: "Hyrox",
    stripeKey: "Hyrox",
    description:
      "A 1 hour hybrid fitness training session that combines cardio with functional strength exercises.",
    image: "/live/tracks/crossfit.jpg",
    capacity: 20,
    price: 20,
    sessions: ["dawn", "dusk"],
    times: { dawn: "7:00 AM", dusk: "4:00 PM" },
  },
  {
    name: "5k Run",
    stripeKey: "Run",
    description: "5k outdoor run around church.",
    image: "/live/tracks/run.jpg",
    capacity: 30,
    price: 10,
    sessions: ["dawn"],
    times: { dawn: "7:00 AM" },
  },
  {
    name: "Breathwork & Ice Plunge",
    stripeKey: "Breathwork",
    description:
      "Guided breathwork to regulate your nervous system and ending it with an ice plunge.",
    image: "/live/tracks/breathwork.jpg",
    capacity: 24,
    price: 20,
    sessions: ["dawn", "dusk"],
    times: { dawn: "8:00 AM", dusk: "4:00 PM" },
  },
  {
    name: "Spin",
    stripeKey: "Spin",
    description:
      "The ultimate indoor cycling workout, designed to give you an adrenaline rush of sweat, fun and energy.",
    image: "/live/tracks/spin.jpg",
    capacity: 25,
    price: 20,
    sessions: ["dawn", "dusk"],
    times: { dawn: "8:00 AM", dusk: "4:00 PM" },
    sessionNames: {
      dawn: "Spin - Noise Detox Ride",
      dusk: "Spin - Collective Soul Ride",
    },
  },
  {
    name: "Reformer Pilates",
    stripeKey: "PilatesReformer",
    description:
      "Core-focused movement on the reformer to build strength and body awareness.",
    image: "/live/tracks/pilates.jpg",
    capacity: 10,
    price: 20,
    sessions: ["dawn"],
    times: { dawn: "8:30 AM" },
  },
  {
    name: "Chair Pilates",
    stripeKey: "PilatesChair",
    description:
      "Targeted strength and stability work using the Pilates chair.",
    image: "/live/tracks/pilates.jpg",
    capacity: 8,
    price: 20,
    sessions: ["dawn"],
    times: { dawn: "8:30 AM" },
  },
  {
    name: "Emotional Cadence",
    stripeKey: "EmotionalCadence",
    description:
      "EQ isn't a checkbox; it's a sequence. You can't steward a feeling you haven't noticed. In this session you will move past answers like \"fine\" to map your personalized emotion wheel and experience firsthand how precise naming changes your next steps. Sign up today to walk away with a practical, daily practice for self-awareness.",
    image: "/live/tracks/emotional-cadence.jpg",
    capacity: 20,
    price: 20,
    sessions: ["dusk"],
    times: { dusk: "4:00 PM" },
    sessionNames: { dusk: "Emotional Cadence - Lynnette Chai" },
  },
  {
    name: "Mental Framing: Renewing Your Internal Narrative",
    stripeKey: "MentalFraming",
    description:
      "Building a resilient mindset requires moving past passive listening—it demands active practice. In this intimate, casual workshop, Dan Blythe will give you the practical, scriptural tools to audit and reframe your internal dialogue. Focused on raw biblical affirmations and using the Word as spoken confession, you will learn how to write down and speak out a new mental baseline. Step out of the noise, grab a pen, and architect a mind designed for peace and performance.",
    image: "/live/tracks/mental-framing.jpg",
    capacity: 20,
    price: 0,
    sessions: ["dusk"],
    times: { dusk: "4:00 PM" },
    sessionNames: { dusk: "Mental Framing - Dan Blythe" },
  },
];

const GRID_CARDS = [
  {
    name: "Hyrox",
    image: "/live/tracks/crossfit.jpg",
    description:
      "A 1 hour hybrid fitness training session that combines cardio with functional strength exercises.",
  },
  {
    name: "Spin",
    image: "/live/tracks/spin.jpg",
    description:
      "The ultimate indoor cycling workout, designed to give you an adrenaline rush of sweat, fun and energy.",
  },
  {
    name: "5k Run",
    image: "/live/tracks/run.jpg",
    description: "5k outdoor run.",
  },
  {
    name: "Pilates",
    image: "/live/tracks/pilates.jpg",
    description: "Core-focused movement to build strength and body awareness.",
  },
  {
    name: "Breathwork & Ice Plunge",
    image: "/live/tracks/breathwork.jpg",
    description:
      "Guided breathwork to regulate your nervous system and ending it with an ice plunge.",
  },
  {
    name: "Emotional Cadence",
    image: "/live/tracks/emotional-cadence.jpg",
    description:
      "EQ isn't a checkbox; it's a sequence. Map your personalized emotion wheel and walk away with a practical, daily practice for self-awareness.",
  },
  {
    name: "Mental Framing: Renewing Your Internal Narrative",
    image: "/live/tracks/mental-framing.jpg",
    description:
      "Focused on raw biblical affirmations and using the Word as spoken confession, you will learn how to write down and speak out a new mental baseline. Step out of the noise, grab a pen, and architect a mind designed for peace and performance.",
  },
];

const SESSIONS = [
  { id: "dawn", label: "Dawn Track" },
  { id: "dusk", label: "Dusk Track" },
] as const;

export function TrackSection() {
  const [modalOpen, setModalOpen] = useState(false);
  const [cart, setCart] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [soldOut, setSoldOut] = useState<Set<string>>(new Set());
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    fetch("/api/live/availability")
      .then((r) => r.json())
      .then((data: Availability) => {
        setAvailability(data);
        const out = new Set<string>();
        for (const [track, sessions] of Object.entries(data)) {
          for (const [session, { sold, capacity }] of Object.entries(
            sessions,
          )) {
            if (sold >= capacity) out.add(`${track}-${session}`);
          }
        }
        setSoldOut(out);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    document.body.style.overflow = modalOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [modalOpen]);

  function cartKey(track: string, session: string) {
    return `${track}-${session}`;
  }

  function toggleCart(trackName: string, sessionId: string) {
    const key = cartKey(trackName, sessionId);
    setCart((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        // Only one track allowed per session — replace any existing selection
        for (const k of next) {
          if (k.endsWith(`-${sessionId}`)) next.delete(k);
        }
        next.add(key);
      }
      return next;
    });
  }

  async function handleCheckout() {
    setLoading(true);
    const items = Array.from(cart).map((key) => {
      const sep = key.lastIndexOf("-");
      return { track: key.slice(0, sep), session: key.slice(sep + 1) };
    });

    try {
      const res = await fetch("/api/live/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          termsAccepted,
          termsAcceptedAt: new Date().toISOString(),
        }),
      });

      if (res.status === 409) {
        const { track, session } = (await res.json()) as {
          track: string;
          session: string;
        };
        setSoldOut((prev) => new Set([...prev, cartKey(track, session)]));
        setCart((prev) => {
          const next = new Set(prev);
          next.delete(cartKey(track, session));
          return next;
        });
        return;
      }

      if (!res.ok) throw new Error();

      const { url } = (await res.json()) as { url: string };
      window.location.href = url;
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const total = Array.from(cart).reduce((sum, key) => {
    const stripeKey = key.slice(0, key.lastIndexOf("-"));
    const track = TRACKS.find((t) => t.stripeKey === stripeKey);
    return sum + (track?.price ?? 20);
  }, 0);

  return (
    <section id="tracks" className="bg-black px-4 py-24 md:px-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-4 text-center">
          <h2 className="text-4xl font-black leading-[1.1] text-white md:text-5xl">
            Activation Tracks
          </h2>
        </div>
        <p className="mx-auto mb-12 max-w-xl text-center text-base leading-relaxed text-white md:text-lg">
          Optional activations running before and after the main event. Spots
          are limited.
        </p>

        {/* Landing grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {GRID_CARDS.map((card) => (
            <div
              key={card.name}
              className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5"
            >
              <div className="relative aspect-video w-full bg-white/10">
                <Image
                  src={card.image}
                  alt={card.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              </div>
              <div className="flex flex-1 flex-col gap-3 p-4">
                <div>
                  <p className="text-sm md:text-base font-bold uppercase tracking-widest text-white">
                    {card.name}
                  </p>
                  <p className="mt-2 text-sm md:text-base leading-normal md:leading-relaxed text-white">
                    {card.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col items-center gap-4">
          <button
            onClick={() => setModalOpen(true)}
            className="rounded-full bg-primary px-8 py-3.5 text-base font-bold text-white transition-opacity hover:opacity-90 active:scale-[0.98]"
          >
            Join A Track
          </button>
          <p className="mx-auto mb-12 max-w-xl text-center text-base leading-relaxed  md:text-lg text-white/60">
            Location for all activation tracks will be at Collective.
          </p>
        </div>
      </div>

      {/* Purchase modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="relative flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-[#111]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <p className="text-sm md:text-base font-bold uppercase tracking-widest text-white">
                Choose your tracks
              </p>
              <button
                onClick={() => setModalOpen(false)}
                className="text-xl leading-none text-white hover:text-white"
              >
                ×
              </button>
            </div>

            {/* Scrollable session list */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="flex flex-col gap-8">
                {SESSIONS.map((session) => (
                  <div key={session.id}>
                    <div className="mb-3 flex items-baseline gap-2">
                      <p className="text-sm md:text-base font-bold uppercase tracking-widest text-white">
                        {session.label}
                      </p>
                      <p className="text-sm text-white/60">Optional</p>
                    </div>
                    <div className="flex flex-col divide-y divide-white/10 rounded-xl border border-white/10 overflow-hidden">
                      {TRACKS.filter((t) =>
                        t.sessions.includes(session.id),
                      ).map((track) => {
                        const key = cartKey(track.stripeKey, session.id);
                        const inCart = cart.has(key);
                        const isSoldOut = soldOut.has(key);
                        const avail =
                          availability?.[track.stripeKey]?.[session.id];
                        const spotsLeft = avail
                          ? avail.capacity - avail.sold
                          : availability !== null
                            ? track.capacity
                            : null;

                        return (
                          <div
                            key={track.name}
                            onClick={() =>
                              !isSoldOut &&
                              toggleCart(track.stripeKey, session.id)
                            }
                            className={`flex items-center gap-4 px-4 py-3 transition-colors ${
                              isSoldOut
                                ? "opacity-40"
                                : inCart
                                  ? "cursor-pointer bg-primary/10 hover:bg-primary/20"
                                  : "cursor-pointer bg-white/2 hover:bg-white/5"
                            }`}
                          >
                            {/* Name + meta */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm md:text-base font-bold tracking-wide text-white">
                                {(
                                  track as {
                                    sessionNames?: Record<string, string>;
                                  }
                                ).sessionNames?.[session.id] ?? track.name}
                              </p>
                              <p className="mt-1 text-xs text-white/60">
                                {track.times[session.id]} ·{" "}
                                {track.price === 0
                                  ? "Free"
                                  : `RM${track.price}`}
                                {spotsLeft !== null && spotsLeft > 0 && (
                                  <span
                                    className={
                                      spotsLeft <= 5
                                        ? "font-semibold text-amber-400"
                                        : ""
                                    }
                                  >
                                    {" · "}
                                    {spotsLeft} left
                                  </span>
                                )}
                                {spotsLeft !== null &&
                                  spotsLeft <= 0 &&
                                  " · Sold out"}
                              </p>
                            </div>

                            {/* Action */}
                            {isSoldOut ? (
                              <span className="text-xs font-semibold text-white/30">
                                Sold out
                              </span>
                            ) : (
                              <div
                                className={`pointer-events-none flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg font-bold ${
                                  inCart
                                    ? "bg-primary text-white"
                                    : "bg-white/10 text-white"
                                }`}
                              >
                                {inCart ? "−" : "+"}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cart bar — sticky at bottom of modal */}
            <div className="border-t border-white/10 px-6 py-4">
              {cart.size > 0 ? (
                <div className="flex flex-col gap-3">
                  <label className="flex cursor-pointer items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                    />
                    <span className="text-sm text-white/70">
                      I agree to the{" "}
                      <a
                        href="/live/terms"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline text-white/90 hover:text-white"
                        onClick={(e) => e.stopPropagation()}
                      >
                        terms and conditions
                      </a>
                    </span>
                  </label>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-white/70">
                      <span className="font-black text-white">{cart.size}</span>{" "}
                      {cart.size === 1 ? "track" : "tracks"} ·{" "}
                      <span className="font-black text-white">RM{total}</span>
                    </p>
                    <button
                      onClick={handleCheckout}
                      disabled={loading || !termsAccepted}
                      className="rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
                    >
                      {loading ? "Loading…" : "Pay now"}
                    </button>
                  </div>
                </div>
              ) : (
                <></>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
