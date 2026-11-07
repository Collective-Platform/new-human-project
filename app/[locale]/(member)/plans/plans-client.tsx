"use client";

import { useEffect, useState, useTransition } from "react";
import { Check, ChevronRight, Plus, Search, UserPlus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/src/i18n/navigation";
import { createPlan, getFriendsForNewPlan } from "@/src/features/plans/actions";
import type { PlanCardProgress, PlanFriend } from "@/src/features/plans/queries";
import { SlidingTabs } from "@/app/components/sliding-tabs";
import { Avatar } from "./plan-day-social";
import { getBlockLabel, getBlockName, getBlockPrefix } from "@/src/lib/block-names";
import { Overlay } from "@/app/components/overlay";
import { Crossfade } from "@/app/components/crossfade";

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
  progress: PlanCardProgress | null;
};

/** Day/month/year, such as 14/10/2026, in both languages. */
function formatCompletedDate(value: string) {
  const date = new Date(value);
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

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
  const [tab, setTab] = useState<"active" | "completed">(initialTab);
  const activePlans = plans.filter((plan) => !plan.completedAt);
  const completedPlans = plans.filter((plan) => plan.completedAt);
  // Plans with tasks left today come first. The sort is stable, so the rest keep newest first.
  const visiblePlans =
    tab === "active"
      ? [...activePlans].sort((a, b) => Number(isDoneToday(a)) - Number(isDoneToday(b)))
      : completedPlans;

  useEffect(() => setTab(initialTab), [initialTab]);

  // Form state resets on open, not on close. Resetting while the sheet slides
  // out would make its contents jump during the exit.
  function openCreateDialog() {
    setError(null);
    setTitle("");
    setMode("solo");
    setSelectedFriendIds(new Set());
    setFriendQuery("");
    setCreateOpen(true);
  }

  function closeCreateDialog() {
    if (!isPending) setCreateOpen(false);
  }

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape" || isPending) return;
      setCreateOpen(false);
    }

    if (!createOpen) return;
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [createOpen, isPending]);

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
      setCreateOpen(false);
      router.push(`/progress/${result.data.planId}`);
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
          onClick={() => openCreateDialog()}
          className="shrink-0 rounded-full bg-primary p-3 text-white shadow-glow transition hover:opacity-90 press"
          aria-label={t("startPlan")}
        >
          <Plus size={20} />
        </button>
      </div>
      {visiblePlans.length === 0 ? (
        <div className="rounded-card bg-white px-6 py-10 text-center shadow-card">
          <p className="text-on-surface-variant">
            {tab === "active" ? t("noPlans") : t("noCompletedPlans")}
          </p>
          {tab === "active" && (
            <button
              type="button"
              onClick={() => openCreateDialog()}
              className="press mt-5 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white shadow-glow"
            >
              {t("startPlan")}
            </button>
          )}
        </div>
      ) : (
        <div key={tab} className="animate-list-in space-y-4">
          {visiblePlans.map((plan) => (
            <article
              key={plan.id}
              className="group relative rounded-card border border-outline/30 bg-surface px-5 py-4 transition-colors hover:bg-on-surface/5"
            >
              <button
                type="button"
                onClick={() => router.push(`/progress/${plan.id}`)}
                className="press-soft w-full text-left focus:outline-none focus:ring-2 focus:ring-primary-container"
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
                    {plan.completedAt && (
                      <p className="text-xs text-on-surface-variant">
                        {formatCompletedDate(plan.completedAt)}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {plan.isGroup && !plan.completedAt && (
                      <MemberStack
                        members={plan.progress?.members ?? []}
                        memberCount={plan.memberCount}
                        label={t(plan.memberCount === 1 ? "member" : "members", {
                          count: plan.memberCount,
                        })}
                        doneLabel={(name) => t("memberDoneToday", { name })}
                        notDoneLabel={(name) => t("memberNotDoneToday", { name })}
                        moreLabel={(count) => t("moreMembers", { count })}
                        fallbackName={t("you")}
                      />
                    )}
                    <ChevronRight
                      size={18}
                      aria-hidden="true"
                      className="text-outline-variant transition-transform group-hover:translate-x-0.5"
                    />
                  </div>
                </div>
                {plan.progress && !plan.completedAt && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="font-medium text-on-surface">
                        {t("dayOfTotal", {
                          day: plan.progress.currentDay,
                          total: plan.progress.totalDays,
                        })}
                      </span>
                      <TodayStatus progress={plan.progress} />
                    </div>
                    <div
                      className="h-1 overflow-hidden rounded-full bg-surface-container-high"
                      aria-hidden="true"
                    >
                      <div
                        className="h-full origin-left rounded-full bg-primary"
                        style={{
                          transform: `scaleX(${plan.progress.currentDay / plan.progress.totalDays})`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </button>
            </article>
          ))}
        </div>
      )}
      <Overlay variant="sheet" open={createOpen} onClose={closeCreateDialog}>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="start-plan-title"
          className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-sheet bg-surface p-5 shadow-float"
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
              className="tap-target press rounded-full p-1 text-on-surface-variant hover:bg-on-surface/5"
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
            className="mt-2 w-full rounded-control bg-white px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
          >
            {availableBlocks.map((block) => (
              <option key={block} value={block}>
                {getBlockLabel(block, locale)}
              </option>
            ))}
          </select>
          <fieldset className="mt-5">
            <legend className="text-sm font-medium text-on-surface">{t("startWith")}</legend>
            <div className="mt-2 grid grid-cols-2 gap-2 rounded-control bg-surface-container-high p-1">
              {(["solo", "friends"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMode(value)}
                  className={`press rounded-control px-3 py-3 text-sm font-medium transition ${
                    mode === value
                      ? "bg-white text-on-surface"
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
                  className="w-full rounded-control bg-white py-3 pl-11 pr-4 text-sm text-on-surface placeholder:text-outline-variant outline-none ring-1 ring-outline-variant/40 focus:ring-2 focus:ring-primary-container"
                />
              </div>
              {friendsLoading ? (
                <FriendRowsSkeleton />
              ) : visibleFriends.length > 0 ? (
                <div className="mt-3 max-h-[28dvh] space-y-3 overflow-y-auto">
                  <p className="text-xs font-medium text-on-surface-variant">{t("yourFriends")}</p>
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
                          className={`tap-target press inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition ${
                            selected
                              ? "bg-surface-container-high text-on-surface"
                              : "bg-primary text-white shadow-glow hover:opacity-90"
                          }`}
                        >
                          <Crossfade
                            showSecond={selected}
                            first={
                              <>
                                <Plus size={14} />
                                {t("add")}
                              </>
                            }
                            second={
                              <>
                                <Check size={14} />
                                {t("added")}
                              </>
                            }
                          />
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
                className="mt-2 w-full rounded-control bg-white px-4 py-3 text-sm text-on-surface placeholder:text-outline-variant focus:outline-none focus:ring-2 focus:ring-primary-container"
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
            className="press mt-6 w-full rounded-full bg-primary py-3.5 text-sm font-semibold text-white shadow-glow disabled:opacity-50"
          >
            {isPending ? t("creating") : t("create")}
          </button>
        </div>
      </Overlay>
    </div>
  );
}

function isDoneToday(plan: PlanCard) {
  const progress = plan.progress;
  return Boolean(progress && progress.todayTotal > 0 && progress.todayDone >= progress.todayTotal);
}

function TodayStatus({ progress }: { progress: PlanCardProgress }) {
  const t = useTranslations("plans");
  if (progress.todayTotal === 0) return null;
  if (progress.todayDone >= progress.todayTotal) {
    return (
      <span className="inline-flex items-center gap-1 font-medium text-on-surface">
        <Check size={13} aria-hidden="true" className="text-primary" />
        {t("todayDone")}
      </span>
    );
  }
  return null;
}

function MemberStack({
  members,
  memberCount,
  label,
  doneLabel,
  notDoneLabel,
  moreLabel,
  fallbackName,
}: {
  members: PlanCardProgress["members"];
  memberCount: number;
  label: string;
  doneLabel: (name: string) => string;
  notDoneLabel: (name: string) => string;
  moreLabel: (count: number) => string;
  fallbackName: string;
}) {
  // memberCount includes the viewer, who is not shown in the stack.
  const hiddenCount = Math.max(memberCount - 1 - members.length, 0);
  return (
    <div className="flex items-center" role="group" aria-label={label}>
      <div className="flex -space-x-2">
        {members.map((member) => {
          const name = member.searchHandle
            ? `@${member.searchHandle}`
            : member.displayName || fallbackName;
          return (
            <span
              key={member.id}
              className="relative rounded-full ring-2 ring-surface"
              role="img"
              aria-label={member.completedToday ? doneLabel(name) : notDoneLabel(name)}
            >
              <span className={member.completedToday ? "" : "opacity-60"}>
                <Avatar member={member} size="sm" />
              </span>
              {member.completedToday && (
                <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-white ring-2 ring-surface">
                  <Check size={9} strokeWidth={3} aria-hidden="true" />
                </span>
              )}
            </span>
          );
        })}
        {members.length === 0 && (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant">
            <UserPlus size={15} aria-hidden="true" />
          </span>
        )}
      </div>
      {hiddenCount > 0 && (
        <span
          className="ml-1.5 text-xs font-medium text-on-surface-variant"
          aria-label={moreLabel(hiddenCount)}
        >
          +{hiddenCount}
        </span>
      )}
    </div>
  );
}

function FriendRowsSkeleton() {
  return (
    <div className="mt-3 animate-pulse space-y-3" aria-hidden="true">
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 rounded-full bg-surface-container-high" />
          <div className="h-4 flex-1 rounded bg-surface-container-high" />
          <div className="h-8 w-16 shrink-0 rounded-full bg-surface-container-high" />
        </div>
      ))}
    </div>
  );
}
