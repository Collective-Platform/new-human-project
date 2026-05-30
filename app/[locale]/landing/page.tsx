import Image from "next/image";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative flex min-h-screen flex-col overflow-hidden">
        <video
          src="https://mqyxc4xvodvuodmx.public.blob.vercel-storage.com/running-compressed.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        {/* Mobile: dark only at bottom. Desktop: uniform dark overlay */}
        <div className="absolute inset-0 bg-linear-to-b from-black/0 via-black/20 to-black/85 md:from-black/30 md:via-black/40 md:to-black/80" />

        {/* Mobile: content at bottom-left. Desktop: content centred */}
        <div className="relative z-10 mt-auto flex flex-col px-8 pb-16 md:m-auto md:items-center md:px-12 md:pb-0 md:text-center">
          <p className="mb-6 hidden text-xs font-semibold uppercase tracking-[0.25em] text-white/70 md:block">
            The New Human Project
          </p>
          <h1
            className="mb-4 text-5xl font-bold tracking-tight text-white md:mb-6 md:text-[9rem] md:leading-none"
            style={{ fontFamily: "var(--font-nowstalgic), serif" }}
          >
            Rhythm
          </h1>
          <p className="mb-10 text- xl font-medium leading-relaxed text-white/95 md:max-w-xl md:text-2xl">
            Mental. Emotional. Physical.
            <br />
            Build the rhythms that make you whole.
          </p>
          <div className="flex flex-col gap-4 md:flex-row">
            <Link
              href="/signup"
              className="w-full rounded-xl bg-primary py-2.5 text-center text-base font-bold text-white shadow-lg transition-opacity hover:opacity-90 active:scale-[0.98] md:w-auto md:rounded-full md:px-8 md:py-3.5"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="w-full rounded-xl border border-white/30 bg-white/10 py-2.5 text-center text-base font-bold text-white backdrop-blur-md transition-all hover:bg-white/20 active:scale-[0.98] md:w-auto md:rounded-full md:px-8 md:py-3.5"
            >
              I already have an account
            </Link>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="px-4 pt-20 md:px-12">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-on-surface-variant">
            What is Rhythm?
          </p>
          <h2
            className="mb-6 text-4xl text-balance font-bold leading-tight text-on-surface md:text-5xl"
            style={{ fontFamily: "var(--font-nowstalgic), serif" }}
          >
            A community practice.
            <br />
            The goal: A way of life.
          </h2>
          <p className="text-lg leading-relaxed text-on-surface-variant">
            A community-wide commitment to building healthy rhythms across three
            dimensions — practised concurrently in 25-day blocks on rhythm.you.
          </p>
        </div>
      </section>

      {/* Categories */}
      <section className="grid grid-cols-1 gap-4 px-4  md:px-32 py-8 lg:grid-cols-3 lg:gap-5 lg:px-20 lg:pb-20 lg:pt-10">
        {/* Mental */}
        <div className="flex flex-col overflow-hidden rounded-2xl border border-category-mental">
          <div className="px-8 py-12">
            <span className="mb-4 inline-block self-start rounded-full bg-category-mental-bg px-3 py-1 text-xs font-semibold uppercase tracking-widest text-category-mental">
              Mental
            </span>
            <h3
              className="mb-4 mt-4 text-3xl font-bold capitalize leading-tight text-on-surface"
              style={{ fontFamily: "var(--font-nowstalgic), serif" }}
            >
              Focus, clarity, learning.
            </h3>
            <p className="mt-2 text-sm font-semibold text-category-mental">
              Matt 22:37
            </p>
            <p className="mt-4 text-lg leading-relaxed text-on-surface-variant">
              Truth sets us free. Each day we study a Scripture passage together
              and write up what we&apos;ve learned and how to apply it.
            </p>
          </div>
          <div className="flex items-end justify-center px-8 pb-0 lg:mt-auto">
            <Image
              src="/landing/mental-mockup.png"
              alt="Mental — daily Bible reading and devotional notes"
              width={400}
              height={400}
              className="w-full max-w-xs object-contain"
            />
          </div>
        </div>

        {/* Emotional */}
        <div className="flex flex-col overflow-hidden rounded-2xl border border-category-emotional">
          <div className="px-8 py-12">
            <span className="mb-4 inline-block self-start rounded-full bg-category-emotional-bg px-3 py-1 text-xs font-semibold uppercase tracking-widest text-category-emotional">
              Emotional
            </span>
            <h3
              className="mb-4 mt-4 text-3xl font-bold capitalize leading-tight text-on-surface"
              style={{ fontFamily: "var(--font-nowstalgic), serif" }}
            >
              Resilience, regulation, inner work.
            </h3>
            <p className="mt-2 text-sm font-semibold text-category-emotional">
              Matt 22:37
            </p>
            <p className="mt-4 text-lg leading-relaxed text-on-surface-variant">
              Knowing truth without handling emotion renders life ineffective.
              Each day, we are given tools to regulate and grow our inner world.
            </p>
          </div>
          <div className="flex items-end justify-center px-8 pb-0 lg:mt-auto">
            <Image
              src="/landing/emotional-mockup.png"
              alt="Emotional — daily mood log"
              width={400}
              height={400}
              className="w-full max-w-xs object-contain"
            />
          </div>
        </div>

        {/* Physical */}
        <div className="flex flex-col overflow-hidden rounded-2xl border border-category-physical">
          <div className="px-8 py-12">
            <span className="mb-4 inline-block self-start rounded-full bg-category-physical-bg px-3 py-1 text-xs font-semibold uppercase tracking-widest text-category-physical">
              Physical
            </span>
            <h3
              className="mb-4 mt-4 text-3xl font-bold capitalize leading-tight text-on-surface"
              style={{ fontFamily: "var(--font-nowstalgic), serif" }}
            >
              Movement, recovery, sleep.
            </h3>
            <p className="mt-2 text-sm font-semibold text-category-physical">
              Luke 2:52
            </p>
            <p className="mt-4 text-lg leading-relaxed text-on-surface-variant">
              Jesus grew in stature. Our bodies matter. Every day we complete a
              movement task designed to make exercise a way of life.
            </p>
          </div>
          <div className="flex items-end justify-center px-8 pb-0 lg:mt-auto">
            <Image
              src="/landing/physical-mockup.png"
              alt="Physical — exercise and activity logging"
              width={400}
              height={400}
              className="w-full max-w-xs object-contain"
            />
          </div>
        </div>
      </section>

      {/* CTA + Overview image */}
      <section className="bg-primary px-6 pt-20 text-center md:px-12">
        <div className="mx-auto max-w-lg">
          <h2
            className="mb-4 text-4xl font-bold leading-tight text-black md:text-5xl"
            style={{ fontFamily: "var(--font-nowstalgic), serif" }}
          >
            Start your journey.
          </h2>
          <p className="mb-10 text-lg text-black">
            Join us on Rhythm and begin your first 25-day block today.
          </p>
          <Link
            href="/signup"
            className="inline-block rounded-full bg-black px-10 py-4 text-base font-semibold text-on-primary transition-opacity hover:opacity-90"
          >
            Get Started
          </Link>
        </div>
        <div className="mt-10 flex justify-center overflow-hidden">
          <Image
            src="/landing/overview-mockup.png"
            alt="Rhythm app overview showing mental, emotional, and physical tracking"
            width={600}
            height={600}
            className="object-contain"
            priority
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 text-center text-[11px] font-medium uppercase tracking-widest text-on-surface bg-primary md:px-12">
        © 2026 Collective Central. All Rights Reserved.
      </footer>
    </div>
  );
}
