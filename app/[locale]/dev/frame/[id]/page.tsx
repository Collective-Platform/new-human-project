import { Suspense } from "react";
import { isBoardEnabled, isBoardLiveDataEnabled } from "@/src/dev-board/enabled";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { setRequestLocale } from "next-intl/server";
import { getDayContent } from "@/src/features/progress/get-day-content";
import type { ProgressTask } from "@/src/features/progress";
import { FRAMES } from "@/src/dev-board/registry";
import { buildFixtures, type BoardFixtures } from "@/src/dev-board/fixtures";
import { FixtureFrame } from "@/src/dev-board/frames";
import { FrameBridge } from "@/src/dev-board/frame-bridge";
import { LiveFrame } from "@/src/dev-board/live-frame";
import LandingPage from "../../../landing/page";
import LoginPage from "../../../login/page";
import LoginVerifyPage from "../../../login/verify/page";
import SignupPage from "../../../signup/page";
import SignupVerifyPage from "../../../signup/verify/page";
import OnboardingPage from "../../../onboarding/page";

// Design-board frame. Dev only: shows one screen with sample data (no database), or with
// local-database data when ?data=live and the database is on this computer.

type Props = {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ data?: string }>;
};

const CURRENT_DAY = 9;

async function loadSamples(locale: "en" | "zh") {
  const samples: BoardFixtures["samples"] = {};
  let today: ProgressTask[] = [];
  const toTask = (t: Awaited<ReturnType<typeof getDayContent>>["tasks"][number]): ProgressTask => ({
    ...t,
    completed: false,
    completionData: null,
  });
  for (let day = CURRENT_DAY; day >= 1; day--) {
    let tasks;
    try {
      tasks = (await getDayContent(1, day, locale)).tasks.map(toTask);
    } catch {
      continue;
    }
    if (day === CURRENT_DAY) today = tasks;
    for (const t of tasks) {
      if (t.taskType === "devotional") samples.devotional ??= t;
      if (t.taskType === "scripture_reading") samples.scripture ??= t;
      if (t.taskType === "mood_log") samples.mood ??= t;
      if (t.taskType === "exercise") samples.exercise ??= t;
    }
    if (
      day <= CURRENT_DAY - 3 &&
      samples.devotional &&
      samples.scripture &&
      samples.mood &&
      samples.exercise
    )
      break;
  }
  return { today, samples };
}

async function FrameBody({ params, searchParams }: Props) {
  await connection();
  const { locale, id } = await params;
  setRequestLocale(locale);
  const def = FRAMES.find((f) => f.id === id);
  if (!def || def.render === "route") notFound();
  const lang = locale === "zh" ? "zh" : "en";
  const p = Promise.resolve({ locale });

  if (def.render === "page") {
    const wrap = (cls: string, node: React.ReactNode) => (
      <div className={cls}>
        <FrameBridge />
        {node}
      </div>
    );
    switch (id) {
      case "landing":
        return wrap("w-full bg-background text-foreground", await LandingPage({ params: p }));
      case "login":
        return wrap("min-h-[100svh] bg-surface", await LoginPage({ params: p }));
      case "login-verify":
        return wrap("min-h-[100svh] bg-surface", await LoginVerifyPage({ params: p }));
      case "signup":
        return wrap("min-h-[100svh] bg-surface", await SignupPage({ params: p }));
      case "signup-verify":
        return wrap("min-h-[100svh] bg-surface", await SignupVerifyPage({ params: p }));
      case "onboarding":
        return wrap("min-h-screen flex flex-col bg-surface", <OnboardingPage />);
      default:
        notFound();
    }
  }

  const { data } = await searchParams;
  if (data === "live" && def.liveData && isBoardLiveDataEnabled()) {
    const live = await LiveFrame({ id, locale: lang });
    if (live) return live;
  }

  const { today, samples } = await loadSamples(lang);
  const fx = buildFixtures(Date.now(), today, samples, CURRENT_DAY);
  return <FixtureFrame id={id} fx={fx} locale={lang} />;
}

export default async function DevFramePage(props: Props) {
  if (!isBoardEnabled()) notFound();
  return (
    <Suspense fallback={<div className="p-6 text-sm text-foreground/50">Loading…</div>}>
      <FrameBody {...props} />
    </Suspense>
  );
}
