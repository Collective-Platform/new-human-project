"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/src/i18n/navigation";
import { joinPlan } from "@/src/features/plans/actions";

export function JoinPlanClient({ inviteCode, expired }: { inviteCode: string; expired: boolean }) {
  const t = useTranslations("plans");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  function join() {
    startTransition(async () => {
      const result = await joinPlan({ inviteCode });
      if ("success" in result) router.push(`/progress/${result.data.planId}`);
    });
  }
  return (
    <main className="mx-auto flex min-h-dvh max-w-md items-center px-5">
      <section className="w-full rounded-3xl bg-white p-7 text-center shadow-[0_12px_32px_rgba(53,50,47,0.06)]">
        <h1 className="font-headline text-3xl font-medium text-on-surface">{t("joinTitle")}</h1>
        {expired ? (
          <p className="mt-4 text-sm leading-6 text-on-surface-variant">{t("inviteExpired")}</p>
        ) : (
          <>
            <p className="mt-4 text-sm leading-6 text-on-surface-variant">{t("joinHint")}</p>
            <button
              disabled={isPending}
              onClick={join}
              className="mt-7 w-full rounded-full bg-primary py-3.5 text-sm font-semibold text-white shadow-[0_10px_15px_-3px_rgba(190,43,23,0.2)] disabled:opacity-50"
            >
              {isPending ? t("joining") : t("join")}
            </button>
          </>
        )}
      </section>
    </main>
  );
}
