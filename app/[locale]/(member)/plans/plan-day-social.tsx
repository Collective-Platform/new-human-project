"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { Check, Search, Send, Trash2, User, UserPlus, Users, X } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  addFriendToPlan,
  createPlanDiscussionPost,
  deletePlanDiscussionPost,
  getPlanFriendsForAdding,
  removePlanMember,
} from "@/src/features/plans/actions";
import type { PlanDiscussionThread, PlanFriend, PlanMember } from "@/src/features/plans/queries";

type DayData = { members: PlanMember[]; discussion: PlanDiscussionThread[] };

function Avatar({
  member,
  size = "md",
}: {
  member: PlanMember | PlanDiscussionThread["user"] | PlanFriend;
  size?: "sm" | "md";
}) {
  const pixels = size === "sm" ? 32 : 40;
  const label = member.searchHandle ? `@${member.searchHandle}` : member.displayName || "Member";
  if (member.avatarUrl) {
    return (
      <Image
        src={member.avatarUrl}
        alt={label}
        width={pixels}
        height={pixels}
        unoptimized
        className={`rounded-full object-cover ${size === "sm" ? "h-8 w-8" : "h-10 w-10"}`}
      />
    );
  }
  return (
    <div
      className={`${size === "sm" ? "h-8 w-8" : "h-10 w-10"} rounded-full bg-surface-container-high flex items-center justify-center`}
    >
      <User size={size === "sm" ? 15 : 18} className="text-on-surface-variant" />
    </div>
  );
}

function authorName(user: PlanDiscussionThread["user"], fallback: string) {
  return user.searchHandle ? `@${user.searchHandle}` : user.displayName || fallback;
}

export function PlanDaySocial({
  locale,
  planId,
  selectedDay,
  selfUserId,
  isOwner,
  initialData,
  showControls = true,
  showDiscussion = true,
}: {
  locale: "en" | "zh";
  planId: string;
  selectedDay: number;
  selfUserId: number;
  isOwner: boolean;
  initialData: DayData;
  showControls?: boolean;
  showDiscussion?: boolean;
}) {
  const t = useTranslations("plans");
  const [data, setData] = useState<DayData>(initialData);
  const [membersOpen, setMembersOpen] = useState(false);
  const [memberTab, setMemberTab] = useState<"members" | "add">("members");
  const [friends, setFriends] = useState<PlanFriend[] | null>(null);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [friendQuery, setFriendQuery] = useState("");
  const [addedFriendIds, setAddedFriendIds] = useState<Set<number>>(new Set());
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/plans/${planId}/day?day=${selectedDay}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((next: DayData | null) => {
        if (next && !cancelled) setData(next);
      })
      .catch(() => {
        if (!cancelled) setActionError(t("actionError"));
      });
    return () => {
      cancelled = true;
    };
  }, [planId, selectedDay, t]);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMembersOpen(false);
    }

    if (!membersOpen) return;
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [membersOpen]);

  useEffect(() => {
    if (!membersOpen || memberTab !== "add" || !isOwner || friends !== null) return;
    let cancelled = false;
    setFriendsLoading(true);
    void getPlanFriendsForAdding({ planId })
      .then((result) => {
        if (cancelled) return;
        if ("success" in result) setFriends(result.data);
        else setActionError(t("actionError"));
      })
      .catch(() => {
        if (!cancelled) setActionError(t("actionError"));
      })
      .finally(() => {
        if (!cancelled) setFriendsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [friends, isOwner, memberTab, membersOpen, planId, t]);

  function refresh() {
    void fetch(`/api/plans/${planId}/day?day=${selectedDay}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((next: DayData | null) => next && setData(next))
      .catch(() => setActionError(t("actionError")));
  }

  function submit(parentId?: string) {
    const message = parentId ? replyBody : body;
    setActionError(null);
    startTransition(async () => {
      const result = await createPlanDiscussionPost({
        planId,
        dayNumber: selectedDay,
        body: message,
        parentId,
      });
      if ("success" in result) {
        if (parentId) {
          setReplyBody("");
          setReplyTo(null);
        } else setBody("");
        refresh();
      } else {
        setActionError(t("actionError"));
      }
    });
  }

  function deletePost(postId: string) {
    setActionError(null);
    startTransition(async () => {
      const result = await deletePlanDiscussionPost({ planId, postId });
      if ("success" in result) refresh();
      else setActionError(t("actionError"));
    });
  }

  function remove(memberId: number) {
    setActionError(null);
    startTransition(async () => {
      const result = await removePlanMember({ planId, memberId });
      if ("success" in result) {
        setMembersOpen(false);
        refresh();
      } else setActionError(t("actionError"));
    });
  }

  function addFriend(friendId: number) {
    setActionError(null);
    startTransition(async () => {
      const result = await addFriendToPlan({ planId, friendId });
      if ("success" in result) {
        setAddedFriendIds((current) => new Set(current).add(friendId));
        refresh();
      } else {
        setActionError(t("actionError"));
      }
    });
  }

  const memberLabel =
    data.members.length === 1
      ? t("member", { count: 1 })
      : t("members", { count: data.members.length });
  const activeMemberIds = new Set(data.members.map((member) => member.id));
  const normalizedFriendQuery = friendQuery.trim().replace(/^@+/, "").toLowerCase();
  const availableFriends = (friends ?? []).filter((friend) => {
    if (activeMemberIds.has(friend.id) || addedFriendIds.has(friend.id)) return false;
    if (!normalizedFriendQuery) return true;
    return [friend.searchHandle, friend.displayName]
      .filter((value): value is string => Boolean(value))
      .some((value) => value.toLowerCase().includes(normalizedFriendQuery));
  });

  return (
    <section className="pb-4" aria-label={showDiscussion ? t("talkItOut") : t("membersTitle")}>
      {showControls && (
        <>
          <button
            type="button"
            onClick={() => {
              setMemberTab("members");
              setMembersOpen(true);
            }}
            className="mb-6 flex items-center gap-1.5 rounded-full border border-foreground/80 px-3 py-1.5 text-foreground transition-colors hover:bg-surface-container-high active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary-container"
            aria-haspopup="dialog"
          >
            <Users size={15} aria-hidden="true" />
            <span className="text-xs font-medium uppercase tracking-wider">{memberLabel}</span>
          </button>
        </>
      )}

      {showDiscussion && (
        <>
          <div className="rounded-3xl bg-white p-4 shadow-[0_12px_32px_rgba(53,50,47,0.06)]">
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              maxLength={1000}
              placeholder={t("takeawayPlaceholder")}
              aria-label={t("takeawayPlaceholder")}
              className="min-h-24 w-full resize-none rounded-2xl bg-surface-container-high p-3 text-sm text-on-surface placeholder:text-outline-variant focus:outline-none focus:ring-2 focus:ring-primary-container"
            />
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                disabled={!body.trim() || isPending}
                onClick={() => submit()}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_16px_rgba(190,43,23,0.2)] transition hover:opacity-90 disabled:opacity-50"
              >
                <Send size={15} />
                {isPending ? t("posting") : t("post")}
              </button>
            </div>
          </div>

          {actionError && (
            <p
              role="alert"
              className="mt-3 rounded-2xl bg-primary-container px-4 py-3 text-sm text-on-primary-container"
            >
              {actionError}
            </p>
          )}

          <div className="mt-5 space-y-4">
            {data.discussion.length === 0 ? (
              <p className="rounded-2xl bg-tertiary-container px-4 py-5 text-center text-sm text-on-tertiary-fixed-variant">
                {t("noDiscussion")}
              </p>
            ) : (
              data.discussion.map((thread) => (
                <article
                  key={thread.id}
                  className="rounded-3xl bg-white p-4 shadow-[0_8px_24px_rgba(53,50,47,0.05)]"
                >
                  <PostRow
                    post={thread}
                    canDelete={thread.user.id === selfUserId}
                    onDelete={deletePost}
                    fallback={t("you")}
                    deleteLabel={t("delete")}
                    locale={locale}
                  />
                  {thread.replies.map((reply) => (
                    <div
                      key={reply.id}
                      className="ml-6 mt-4 border-l border-outline-variant/40 pl-4"
                    >
                      <PostRow
                        post={reply}
                        canDelete={reply.user.id === selfUserId}
                        onDelete={deletePost}
                        fallback={t("you")}
                        deleteLabel={t("delete")}
                        locale={locale}
                        compact
                      />
                    </div>
                  ))}
                  {replyTo === thread.id ? (
                    <div className="mt-4 flex gap-2">
                      <input
                        autoFocus
                        value={replyBody}
                        onChange={(event) => setReplyBody(event.target.value)}
                        maxLength={1000}
                        placeholder={t("replyPlaceholder")}
                        aria-label={t("replyPlaceholder")}
                        className="min-w-0 flex-1 rounded-full bg-surface-container-high px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-container"
                      />
                      <button
                        type="button"
                        disabled={!replyBody.trim() || isPending}
                        onClick={() => submit(thread.id)}
                        className="rounded-full bg-primary px-3 text-white disabled:opacity-50"
                        aria-label={t("post")}
                      >
                        <Send size={15} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setReplyTo(thread.id)}
                      className="mt-3 text-sm font-medium text-secondary hover:underline"
                    >
                      {t("reply")}
                    </button>
                  )}
                </article>
              ))
            )}
          </div>
        </>
      )}

      {showControls && membersOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/40 p-4 sm:items-center sm:justify-center"
          onClick={() => setMembersOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="plan-members-title"
            className="w-full max-w-md rounded-3xl bg-surface p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3
                id="plan-members-title"
                className="font-headline text-xl font-medium text-on-surface"
              >
                {t("membersTitle")}
              </h3>
              <button
                type="button"
                onClick={() => setMembersOpen(false)}
                className="rounded-full p-1 text-on-surface-variant hover:bg-surface-container"
                aria-label={t("close")}
              >
                <X size={20} />
              </button>
            </div>
            {isOwner && (
              <div
                role="tablist"
                aria-label={t("membersTitle")}
                className="mb-4 grid grid-cols-2 gap-1 rounded-full bg-surface-container-high p-1"
              >
                <button
                  type="button"
                  onClick={() => setMemberTab("members")}
                  className={`rounded-full px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-primary-container ${
                    memberTab === "members"
                      ? "bg-white text-on-surface shadow-[0_4px_12px_rgba(53,50,47,0.08)]"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                  role="tab"
                  aria-selected={memberTab === "members"}
                >
                  {t("membersTab")}
                </button>
                <button
                  type="button"
                  onClick={() => setMemberTab("add")}
                  className={`rounded-full px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-primary-container ${
                    memberTab === "add"
                      ? "bg-white text-on-surface shadow-[0_4px_12px_rgba(53,50,47,0.08)]"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                  role="tab"
                  aria-selected={memberTab === "add"}
                >
                  {t("addMembers")}
                </button>
              </div>
            )}
            {actionError && (
              <p
                role="alert"
                className="mb-3 rounded-2xl bg-primary-container px-4 py-3 text-sm text-on-primary-container"
              >
                {actionError}
              </p>
            )}
            {memberTab === "members" ? (
              <div className="max-h-[60dvh] space-y-3 overflow-y-auto">
                {data.members.map((member) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <Avatar member={member} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-on-surface">
                        {member.searchHandle
                          ? `@${member.searchHandle}`
                          : member.displayName || t("you")}
                        {member.id === selfUserId ? ` · ${t("you")}` : ""}
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        {member.completed ? t("completedDay") : t("notCompletedDay")}
                      </p>
                    </div>
                    {member.completed && (
                      <Check
                        size={19}
                        className="text-category-emotional"
                        aria-label={t("completedDay")}
                      />
                    )}
                    {isOwner && member.id !== selfUserId && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => remove(member.id)}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        {t("remove")}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <div className="relative mb-4">
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
                  <div className="flex justify-center py-10">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                ) : availableFriends.length > 0 ? (
                  <div className="max-h-[50dvh] space-y-3 overflow-y-auto">
                    <p className="text-xs font-medium text-on-surface-variant">
                      {t("yourFriends")}
                    </p>
                    {availableFriends.map((friend) => (
                      <div key={friend.id} className="flex items-center gap-3">
                        <Avatar member={friend} />
                        <p className="min-w-0 flex-1 truncate text-sm font-medium text-on-surface">
                          {friend.searchHandle
                            ? `@${friend.searchHandle}`
                            : friend.displayName || t("you")}
                        </p>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => addFriend(friend.id)}
                          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-3 py-2 text-xs font-semibold text-white shadow-[0_8px_16px_rgba(190,43,23,0.2)] transition hover:opacity-90 disabled:opacity-50"
                        >
                          <UserPlus size={14} />
                          {isPending ? t("adding") : t("add")}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-8 text-center text-sm text-on-surface-variant">
                    {normalizedFriendQuery ? t("noFriendMatches") : t("noFriendsToAdd")}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function PostRow({
  post,
  canDelete,
  onDelete,
  fallback,
  deleteLabel,
  locale,
  compact = false,
}: {
  post: { id: string; body: string; createdAt: string; user: PlanDiscussionThread["user"] };
  canDelete: boolean;
  onDelete: (id: string) => void;
  fallback: string;
  deleteLabel: string;
  locale: "en" | "zh";
  compact?: boolean;
}) {
  return (
    <div className="flex gap-3">
      <Avatar member={post.user} size={compact ? "sm" : "md"} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-sm font-medium text-on-surface">
            {authorName(post.user, fallback)}
          </p>
          <time className="shrink-0 text-xs text-outline">
            {new Intl.DateTimeFormat(locale, {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            }).format(new Date(post.createdAt))}
          </time>
        </div>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-on-surface-variant">
          {post.body}
        </p>
        {canDelete && (
          <button
            type="button"
            onClick={() => onDelete(post.id)}
            className="mt-2 inline-flex items-center gap-1 text-xs text-outline hover:text-primary"
          >
            <Trash2 size={12} />
            {deleteLabel}
          </button>
        )}
      </div>
    </div>
  );
}
