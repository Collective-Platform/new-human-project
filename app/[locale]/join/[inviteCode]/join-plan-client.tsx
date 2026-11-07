"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/src/i18n/navigation";
import { Overlay } from "@/app/components/overlay";
import { joinPlan, type JoinErrorCode } from "@/src/features/plans/actions";

/** What the popup says. `failed` covers network errors and anything we did not expect. */
export type JoinNotice = JoinErrorCode | "failed";

// Message keys in messages/*.json under "plans". `back` sends the member to their plans;
// otherwise the button only closes the popup so they can try again.
const NOTICES: Record<JoinNotice, { title: string; body: string; back: boolean }> = {
  kicked: { title: "removedTitle", body: "removedBody", back: true },
  invalid: { title: "inviteInvalidTitle", body: "inviteInvalidBody", back: true },
  closed: { title: "inviteClosedTitle", body: "inviteClosedBody", back: true },
  expired: { title: "inviteExpiredTitle", body: "inviteExpired", back: true },
  signed_out: { title: "joinFailedTitle", body: "joinSignedOutBody", back: false },
  failed: { title: "joinFailedTitle", body: "joinFailedBody", back: false },
};

export function JoinPlanClient({
  inviteCode,
  expired,
  initialNotice = null,
}: {
  inviteCode: string;
  expired: boolean;
  /** Shown as a popup when the page opens, e.g. `kicked` when the creator removed this member. */
  initialNotice?: JoinNotice | null;
}) {
  const t = useTranslations("plans");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [notice, setNotice] = useState<JoinNotice | null>(initialNotice);
  // Keep the last notice while the popup plays its exit animation.
  const [shown, setShown] = useState<JoinNotice | null>(initialNotice);
  function show(next: JoinNotice) {
    setShown(next);
    setNotice(next);
  }
  function join() {
    startTransition(async () => {
      try {
        const result = await joinPlan({ inviteCode });
        if ("success" in result) router.push(`/progress/${result.data.planId}`);
        else show(result.code ?? "failed");
      } catch {
        show("failed");
      }
    });
  }
  const copy = NOTICES[shown ?? "failed"];
  return (
    <main className="mx-auto flex min-h-dvh max-w-md items-center px-5">
      <section className="w-full rounded-card bg-white p-7 text-center shadow-card">
        <h1 className="font-headline text-3xl font-medium text-on-surface">{t("joinTitle")}</h1>
        {expired ? (
          <p className="mt-4 text-sm leading-6 text-on-surface-variant">{t("inviteExpired")}</p>
        ) : (
          <>
            <p className="mt-4 text-sm leading-6 text-on-surface-variant">{t("joinHint")}</p>
            <button
              disabled={isPending}
              onClick={join}
              className="press mt-7 w-full rounded-full bg-primary py-3.5 text-sm font-semibold text-white shadow-glow disabled:opacity-50"
            >
              {isPending ? t("joining") : t("join")}
            </button>
          </>
        )}
      </section>
      <Overlay open={notice !== null} variant="center" onClose={() => setNotice(null)}>
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="join-notice-title"
          className="w-full max-w-sm rounded-card bg-white p-7 text-center shadow-card"
        >
          <h2 id="join-notice-title" className="font-headline text-2xl font-medium text-on-surface">
            {t(copy.title)}
          </h2>
          <p className="mt-3 text-sm leading-6 text-on-surface-variant">{t(copy.body)}</p>
          <button
            type="button"
            onClick={() => (copy.back ? router.push("/progress") : setNotice(null))}
            className="press mt-6 w-full rounded-full bg-primary py-3.5 text-sm font-semibold text-white shadow-glow"
          >
            {copy.back ? t("removedOk") : t("noticeClose")}
          </button>
        </div>
      </Overlay>
    </main>
  );
}
