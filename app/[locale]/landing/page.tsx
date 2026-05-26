import { setRequestLocale } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";

export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex h-full flex-col md:flex-row">
      {/* Left panel: content */}
      <div className="relative flex flex-1 flex-col md:w-1/2 md:flex-none md:bg-surface">
        {/* Mobile only: video as full-bleed background */}
        <div className="absolute inset-0 md:hidden">
          <video
            src="https://mqyxc4xvodvuodmx.public.blob.vercel-storage.com/running-compressed.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-linear-to-b from-black/0 via-black/20 to-black/85" />
        </div>

        {/* Hero content pushed to bottom */}
        <main className="relative z-10 mt-auto flex flex-col px-8 pb-16 md:px-12 md:pb-20">
          <div className="mb-10">
            <h1
              className="mb-4 text-5xl font-bold tracking-tight text-white md:text-6xl md:text-primary"
              style={{ fontFamily: "var(--font-nowstalgic), sans-serif" }}
            >
              Rhythm
            </h1>
            <p className="text-lg font-medium leading-relaxed text-white/95 md:text-on-surface-variant">
              Mental. Emotional. Physical. <br></br>Build the rhythms that make you whole.
            </p>
          </div>

          <div className="flex flex-col gap-4 md:flex-row">
            <Link
              href="/signup"
              className="w-full rounded-xl bg-primary py-2.5 text-center text-base font-bold text-white shadow-lg transition-opacity hover:opacity-90 active:scale-[0.98]"
            >
              Sign Up
            </Link>
            <Link
              href="/login"
              className="w-full rounded-xl border border-white/30 bg-white/10 py-2.5 text-center text-base font-bold text-white backdrop-blur-md transition-all hover:bg-white/20 active:scale-[0.98] md:border-foreground/15 md:bg-surface-container-high md:text-foreground md:backdrop-blur-none md:hover:bg-surface-container-highest"
            >
              Login
            </Link>
          </div>
        </main>

        {/* Footer on left panel */}
        <footer className="relative z-10 pb-6 px-8 text-center text-[10px] uppercase tracking-widest text-white/50 md:px-12 md:text-foreground/40">
          © 2026 COLLECTIVE CENTRAL. All Rights Reserved.
        </footer>
      </div>

      {/* Right panel: desktop-only video */}
      <div className="relative hidden overflow-hidden md:block md:w-1/2">
        <video
          src="https://mqyxc4xvodvuodmx.public.blob.vercel-storage.com/running-compressed.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
      </div>
    </div>
  );
}
