"use client";

import { useEffect, useState, useTransition } from "react";
import { Check, ChevronRight, LogOut, Plus, Search, Users, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/src/i18n/navigation";
import { createPlan, getFriendsForNewPlan, leaveGroupPlan } from "@/src/features/plans/actions";
import type { PlanFriend } from "@/src/features/plans/queries";
import { SlidingTabs } from "@/app/components/sliding-tabs";
import { Avatar } from "./plan-day-social";
import { getBlockLabel, getBlockName, getBlockPrefix } from "@/src/lib/block-names";

type PlanCard = {
  id: string;
  blockNumber: number;
  title: string | null;
  startedAt: string;
  createdBy: number;
  memberCount: number;
  role: string;
  isGroup: boolean;
  completedAt: string | null;
};

export function PlansClient({
  locale,
  plans,
  availableBlocks,
  initialTab,
}: {
  locale: "en" | "zh";
  plans: PlanCard[];
  availableBlocks: number[];
  initialTab: "active" | "completed";
}) {
  const t = useTranslations("plans");
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [blockNumber, setBlockNumber] = useState(() => availableBlocks[0] ?? 1);
  const [mode, setMode] = useState<"solo" | "friends">("solo");
  const [title, setTitle] = useState("");
  const [friends, setFriends] = useState<PlanFriend[] | null>(null);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [friendQuery, setFriendQuery] = useState("");
  const [selectedFriendIds, setSelectedFriendIds] = useState<Set<number>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [planToLeave, setPlanToLeave] = useState<PlanCard | null>(null);
  const [leaveError, setLeaveError] = useState<string | null>(null);
  const [tab, setTab] = useState<"active" | "completed">(initialTab);
  const activePlans = plans.filter((plan) => !plan.completedAt);
  const completedPlans = plans.filter((plan) => plan.completedAt);
  const visiblePlans = tab === "active" ? activePlans : completedPlans;

  useEffect(() => setTab(initialTab), [initialTab]);

  function openCreateDialog() {
    setError(null);
    setCreateOpen(true);
  }

  function closeCreateDialog() {
    if (!isPending) setCreateOpen(false);
  }

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape" || isPending) return;
      setCreateOpen(false);
      setPlanToLeave(null);
    }

    if (!createOpen && !planToLeave) return;
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [createOpen, isPending, planToLeave]);

  useEffect(() => {
    if (!createOpen || mode !== "friends" || friends !== null) return;
    let cancelled = false;
    setFriendsLoading(true);
    void getFriendsForNewPlan()
      .then((result) => {
        if (cancelled) return;
        if ("success" in result) setFriends(result.data);
        else setError(t("actionError"));
      })
      .catch(() => {
        if (!cancelled) setError(t("actionError"));
      })
      .finally(() => {
        if (!cancelled) setFriendsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [createOpen, friends, mode, t]);

  function toggleFriend(friendId: number) {
    setSelectedFriendIds((current) => {
      const next = new Set(current);
      if (!next.delete(friendId)) next.add(friendId);
      return next;
    });
  }

  const normalizedFriendQuery = friendQuery.trim().replace(/^@+/, "").toLowerCase();
  const visibleFriends = (friends ?? []).filter((friend) => {
    if (!normalizedFriendQuery) return true;
    return [friend.searchHandle, friend.displayName]
      .filter((value): value is string => Boolean(value))
      .some((value) => value.toLowerCase().includes(normalizedFriendQuery));
  });

  function submit() {
    if (mode === "friends" && selectedFriendIds.size === 0) {
      setError(t("selectFriendRequired"));
      return;
    }
    startTransition(async () => {
      const result = await createPlan({
        blockNumber,
        title,
        mode,
        friendIds: mode === "friends" ? [...selectedFriendIds] : undefined,
      });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      router.push(`/progress/${result.data.planId}`);
    });
  }

  function confirmLeave() {
    if (!planToLeave) return;
    startTransition(async () => {
      const result = await leaveGroupPlan({ planId: planToLeave.id });
      if ("error" in result) {
        setLeaveError(result.error);
        return;
      }
      setPlanToLeave(null);
      setLeaveError(null);
      router.refresh();
    });
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-8 pt-6 sm:px-6 md:px-8">
      <div className="mb-5 flex items-center justify-between gap-3">
        <SlidingTabs
          tabs={[
            { value: "active", label: t("active") },
            { value: "completed", label: t("completed") },
          ]}
          value={tab}
          onChange={setTab}
        />
        <button
          type="button"
          onClick={openCreateDialog}
          className="shrink-0 rounded-full bg-primary p-3 text-white shadow-[0_10px_15px_-3px_rgba(190,43,23,0.2)] transition hover:opacity-90 active:scale-[0.98]"
          aria-label={t("startPlan")}
        >
          <Plus size={20} />
        </button>
      </div>
      {visiblePlans.length === 0 ? (
        <div className="rounded-3xl bg-white px-6 py-10 text-center shadow-[0_12px_32px_rgba(53,50,47,0.06)]">
          <p className="text-on-surface-variant">
            {tab === "active" ? t("noPlans") : t("noCompletedPlans")}
          </p>
          {tab === "active" && (
            <button
              type="button"
              onClick={openCreateDialog}
              className="mt-5 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_16px_rgba(190,43,23,0.2)]"
            >
              {t("startPlan")}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {visiblePlans.map((plan) => (
            <article
              key={plan.id}
              className="group relative rounded-2xl border border-outline/30 bg-surface px-5 py-4 transition-colors hover:bg-outline/5"
            >
              <button
                type="button"
                onClick={() => router.push(`/progress/${plan.id}`)}
                className="w-full pr-8 text-left focus:outline-none focus:ring-2 focus:ring-primary-container"
                aria-label={`${t("open")}: ${getBlockLabel(plan.blockNumber, locale)}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 space-y-1">
                    <p className="truncate text-xs font-medium text-on-surface-variant">
                      {getBlockPrefix(plan.blockNumber, locale)}
                    </p>
                    <h2 className="font-headline truncate text-lg font-medium text-on-surface">
                      {getBlockName(plan.blockNumber, locale) ?? plan.title}
                    </h2>
                    {plan.title && getBlockName(plan.blockNumber, locale) && (
                      <p className="truncate text-sm text-on-surface">{plan.title}</p>
                    )}
                    <p className="text-xs text-on-surface-variant">
                      {new Intl.DateTimeFormat(locale, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }).format(new Date(plan.completedAt ?? plan.startedAt))}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {plan.isGroup && !plan.completedAt && (
                      <span
                        className="flex items-center gap-1 text-xs font-medium text-on-surface-variant"
                        aria-label={t(plan.memberCount === 1 ? "member" : "members", {
                          count: plan.memberCount,
                        })}
                      >
                        <Users size={15} aria-hidden="true" />
                        {plan.memberCount}
                      </span>
                    )}
                    <ChevronRight
                      size={18}
                      aria-hidden="true"
                      className="text-outline-variant transition-transform group-hover:translate-x-0.5"
                    />
                  </div>
                </div>
              </button>
              {plan.isGroup && plan.role !== "owner" && (
                <button
                  type="button"
                  onClick={() => {
                    setLeaveError(null);
                    setPlanToLeave(plan);
                  }}
                  className="absolute bottom-4 right-4 rounded-full p-2 text-on-surface-variant transition hover:bg-secondary-container hover:text-on-secondary-container focus:outline-none focus:ring-2 focus:ring-primary-container"
                  aria-label={t("leavePlan")}
                >
                  <LogOut size={17} />
                </button>
              )}
            </article>
          ))}
        </div>
      )}
      {createOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/40 p-4 sm:items-center sm:justify-center"
          onClick={closeCreateDialog}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="start-plan-title"
            className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-3xl bg-surface p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2
                id="start-plan-title"
                className="font-headline text-2xl font-medium text-on-surface"
              >
                {t("startPlan")}
              </h2>
              <button
                type="button"
                disabled={isPending}
                onClick={closeCreateDialog}
                className="rounded-full p-1 text-on-surface-variant hover:bg-surface-container"
                aria-label={t("close")}
              >
                <X size={20} />
              </button>
            </div>
            <label htmlFor="plan-block" className="text-sm font-medium text-on-surface">
              {t("chooseBlock")}
            </label>
            <select
              id="plan-block"
              value={blockNumber}
              onChange={(event) => setBlockNumber(Number(event.target.value))}
              className="mt-2 w-full rounded-2xl bg-white px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
            >
              {availableBlocks.map((block) => (
                <option key={block} value={block}>
                  {getBlockLabel(block, locale)}
                </option>
              ))}
            </select>
            <fieldset className="mt-5">
              <legend className="text-sm font-medium text-on-surface">{t("startWith")}</legend>
              <div className="mt-2 grid grid-cols-2 gap-2 rounded-2xl bg-surface-container-high p-1">
                {(["solo", "friends"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setMode(value)}
                    className={`rounded-2xl px-3 py-3 text-sm font-medium transition ${
                      mode === value
                        ? "bg-white text-on-surface shadow-[0_4px_12px_rgba(53,50,47,0.08)]"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    {value === "solo" ? t("startSolo") : t("startFriends")}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs leading-5 text-on-surface-variant">
                {mode === "solo" ? t("startSoloHint") : t("startFriendsHint")}
              </p>
            </fieldset>
            {mode === "friends" && (
              <>
                <p className="mt-4 text-sm font-medium text-on-surface">
                  {t("addFriends")}
                  {selectedFriendIds.size > 0 && (
                    <span className="ml-2 text-xs text-on-surface-variant">
                      {t("selectedCount", { count: selectedFriendIds.size })}
                    </span>
                  )}
                </p>
                <div className="relative mt-2">
                  <Search
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
                  />
                  <input
                    type="search"
                    value={friendQuery}
                    onChange={(event) => setFriendQuery(event.target.value)}
                    placeholder={t("searchFriendsPlaceholder")}
                    aria-label={t("searchFriends")}
                    autoCapitalize="none"
                    autoCorrect="off"
                    className="w-full rounded-2xl bg-white py-3 pl-11 pr-4 text-sm text-on-surface placeholder:text-outline-variant outline-none ring-1 ring-outline-variant/40 focus:ring-2 focus:ring-primary-container"
                  />
                </div>
                {friendsLoading ? (
                  <div className="flex justify-center py-6">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                ) : visibleFriends.length > 0 ? (
                  <div className="mt-3 max-h-[28dvh] space-y-3 overflow-y-auto">
                    <p className="text-xs font-medium text-on-surface-variant">
                      {t("yourFriends")}
                    </p>
                    {visibleFriends.map((friend) => {
                      const selected = selectedFriendIds.has(friend.id);
                      return (
                        <div key={friend.id} className="flex items-center gap-3">
                          <Avatar member={friend} />
                          <p className="min-w-0 flex-1 truncate text-sm font-medium text-on-surface">
                            {friend.searchHandle
                              ? `@${friend.searchHandle}`
                              : friend.displayName || t("you")}
                          </p>
                          <button
                            type="button"
                            aria-pressed={selected}
                            onClick={() => toggleFriend(friend.id)}
                            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition ${
                              selected
                                ? "bg-surface-container-high text-on-surface"
                                : "bg-primary text-white shadow-[0_8px_16px_rgba(190,43,23,0.2)] hover:opacity-90"
                            }`}
                          >
                            {selected ? <Check size={14} /> : <Plus size={14} />}
                            {selected ? t("added") : t("add")}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="py-6 text-center text-sm text-on-surface-variant">
                    {normalizedFriendQuery ? t("noFriendMatches") : t("noFriendsYet")}
                  </p>
                )}
                <label
                  htmlFor="plan-title"
                  className="mt-5 block text-sm font-medium text-on-surface"
                >
                  {t("planName")}
                </label>
                <input
                  id="plan-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder={t("planNamePlaceholder")}
                  maxLength={80}
                  className="mt-2 w-full rounded-2xl bg-white px-4 py-3 text-sm text-on-surface placeholder:text-outline-variant focus:outline-none focus:ring-2 focus:ring-primary-container"
                />
              </>
            )}
            {error && (
              <p role="alert" className="mt-3 text-sm text-primary">
                {error}
              </p>
            )}
            <button
              type="button"
              disabled={isPending}
              onClick={submit}
              className="mt-6 w-full rounded-full bg-primary py-3.5 text-sm font-semibold text-white shadow-[0_10px_15px_-3px_rgba(190,43,23,0.2)] disabled:opacity-50"
            >
              {isPending ? t("creating") : t("create")}
            </button>
          </div>
        </div>
      )}
      {planToLeave && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/40 p-4 sm:items-center sm:justify-center"
          onClick={() => !isPending && setPlanToLeave(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="leave-plan-title"
            className="w-full max-w-md rounded-3xl bg-surface p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2
              id="leave-plan-title"
              className="font-headline text-2xl font-medium text-on-surface"
            >
              {t("leavePlan")}
            </h2>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              {t("leavePlanBody", { block: getBlockLabel(planToLeave.blockNumber, locale) })}
            </p>
            {leaveError && (
              <p role="alert" className="mt-3 text-sm text-primary">
                {leaveError}
              </p>
            )}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setPlanToLeave(null)}
                className="flex-1 rounded-full bg-surface-container-high px-4 py-3 text-sm font-semibold text-on-surface transition hover:bg-surface-container disabled:opacity-50"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={confirmLeave}
                className="flex-1 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-on-primary shadow-[0_8px_16px_rgba(190,43,23,0.2)] transition hover:opacity-90 disabled:opacity-50"
              >
                {isPending ? t("leaving") : t("leavePlan")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
