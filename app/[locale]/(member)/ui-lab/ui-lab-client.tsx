"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Copy,
  MoreHorizontal,
  Plus,
  Send,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { getBlockLabel } from "@/src/lib/block-names";

type Locale = "en" | "zh";
type Screen = "celebration" | "blocks" | "shared" | "task" | "invite";

const COPY = {
  en: {
    title: "UI lab",
    description:
      "Editable previews of the new block and shared-plan interface. These controls are local only.",
    celebration: "Block completion",
    blocks: "Your blocks",
    shared: "Shared block",
    task: "Discussion task",
    invite: "Invite",
    preview: "Preview",
    reset: "Reset",
    blockComplete: "You completed Block 3",
    continue: "Continue",
    active: "Active",
    completed: "Completed",
    startPlan: "Start a plan",
    sharedPlan: "Tuesday small group",
    member: "member",
    members: "members",
    completedOn: "Completed Aug 22, 2026",
    noPlans: "Start a block to make it your own rhythm.",
    chooseBlock: "Choose a block",
    startWith: "How would you like to start?",
    solo: "On my own",
    friends: "With friends",
    soloHint: "A private plan just for you.",
    friendsHint: "You can share an invite after it starts.",
    planName: "Plan name (optional)",
    planPlaceholder: "e.g. Tuesday small group",
    create: "Start plan",
    membersTitle: "Plan members",
    addMembers: "Add members",
    memberStatus: "Completed this day",
    waiting: "Not completed yet",
    takeaway: "Share your takeaway…",
    post: "Post",
    reply: "Reply",
    replyPlaceholder: "Write a reply…",
    menu: "More block actions",
    copyInvite: "Copy invite link",
    copied: "Invite copied",
    deletePlan: "Delete shared block",
    deleteBody: "Delete Block 3 - The Holy Spirit? This permanently removes the shared block.",
    warning:
      "Every member’s progress, completion history, and discussion will be permanently deleted. This cannot be undone.",
    cancel: "Cancel",
    day: "Day 12",
    talkItOut: "Talk It Out",
    joinTitle: "Join this plan",
    joinHint: "You will join on the plan’s current day in your timezone.",
    join: "Join plan",
    joined: "You’re in",
    expired: "This plan has finished and can no longer accept new members.",
    owner: "You",
  },
  zh: {
    title: "界面实验室",
    description: "新增计划和共享计划界面的可编辑预览；这里的操作只会影响预览。",
    celebration: "计划完成",
    blocks: "你的计划",
    shared: "共享计划",
    task: "讨论任务",
    invite: "邀请",
    preview: "预览",
    reset: "重置",
    blockComplete: "你完成了第 3 阶段",
    continue: "继续",
    active: "进行中",
    completed: "已完成",
    startPlan: "开始计划",
    sharedPlan: "周二小组",
    member: "位成员",
    members: "位成员",
    completedOn: "完成于 2026年8月22日",
    noPlans: "开始一个计划，让它成为属于你的节奏。",
    chooseBlock: "选择计划",
    startWith: "你想如何开始？",
    solo: "自己进行",
    friends: "与朋友一起",
    soloHint: "一个只属于你的私人计划。",
    friendsHint: "计划开始后即可分享邀请链接。",
    planName: "计划名称（可选）",
    planPlaceholder: "例如：周二小组",
    create: "开始计划",
    membersTitle: "计划成员",
    addMembers: "添加成员",
    memberStatus: "已完成当天",
    waiting: "尚未完成",
    takeaway: "分享你的心得…",
    post: "发布",
    reply: "回复",
    replyPlaceholder: "写下回复…",
    menu: "更多计划操作",
    copyInvite: "复制邀请链接",
    copied: "已复制邀请",
    deletePlan: "删除共享计划",
    deleteBody: "删除第 3 阶段 - 圣灵吗？这将永久删除此共享计划。",
    warning: "所有成员的进度、完成记录和讨论都会被永久删除，且无法撤销。",
    cancel: "取消",
    day: "第 12 天",
    talkItOut: "聊一聊",
    joinTitle: "加入此计划",
    joinHint: "你将在自己时区中此计划当前的天数加入。",
    join: "加入计划",
    joined: "已加入",
    expired: "此计划已经结束，不能再加入新成员。",
    owner: "你",
  },
} as const;

const SCREENS: Array<{ id: Screen; icon: typeof Check }> = [
  { id: "celebration", icon: Check },
  { id: "blocks", icon: ChevronRight },
  { id: "shared", icon: Users },
  { id: "task", icon: Send },
  { id: "invite", icon: Copy },
];

export function UiLabClient({ locale }: { locale: Locale }) {
  const t = COPY[locale];
  const [screen, setScreen] = useState<Screen>("celebration");
  const [showCelebration, setShowCelebration] = useState(true);

  function reset() {
    setShowCelebration(true);
    setScreen("celebration");
  }

  return (
    <div className="min-h-full bg-surface px-4 pb-10 pt-5 sm:px-6 md:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="font-headline text-3xl text-on-surface">{t.title}</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-on-surface-variant">
              {t.description}
            </p>
          </div>
          <button
            type="button"
            onClick={reset}
            className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-semibold text-on-surface shadow-[0_8px_24px_rgba(53,50,47,0.05)] transition hover:bg-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary-container"
          >
            {t.reset}
          </button>
        </div>

        <nav
          aria-label={t.preview}
          className="mb-6 -mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6 md:-mx-8 md:px-8"
        >
          <div className="inline-flex min-w-max rounded-full bg-surface-container-high p-1">
            {SCREENS.map(({ id, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setScreen(id)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-primary-container ${
                  screen === id
                    ? "bg-white text-on-surface shadow-[0_4px_12px_rgba(53,50,47,0.08)]"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <Icon size={15} aria-hidden="true" />
                {t[id]}
              </button>
            ))}
          </div>
        </nav>

        {screen === "celebration" && (
          <CelebrationPreview
            locale={locale}
            show={showCelebration}
            onShow={() => setShowCelebration(true)}
            onDismiss={() => setShowCelebration(false)}
          />
        )}
        {screen === "blocks" && <BlocksPreview locale={locale} />}
        {screen === "shared" && <SharedPlanPreview locale={locale} />}
        {screen === "task" && <DiscussionTaskPreview locale={locale} />}
        {screen === "invite" && <InvitePreview locale={locale} />}
      </div>
    </div>
  );
}

function CelebrationPreview({
  locale,
  show,
  onShow,
  onDismiss,
}: {
  locale: Locale;
  show: boolean;
  onShow: () => void;
  onDismiss: () => void;
}) {
  const t = COPY[locale];
  return (
    <section className="relative overflow-hidden rounded-[2rem] bg-white px-6 py-16 text-center shadow-card">
      <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
        <Check size={48} className="text-primary" strokeWidth={2.5} aria-hidden="true" />
      </div>
      <h2 className="mt-6 font-headline text-3xl text-on-surface">{t.blockComplete}</h2>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-on-surface-variant">
        {locale === "en"
          ? "A moment worth celebrating. Preview the interrupting completion state below."
          : "值得庆祝的时刻。请在下方预览完成后的提示状态。"}
      </p>
      <button
        type="button"
        onClick={onShow}
        className="mt-7 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_15px_-3px_rgba(190,43,23,0.2)] transition hover:opacity-90 active:scale-[0.99]"
      >
        {t.preview}
      </button>
      {show && <CelebrationModal locale={locale} onDismiss={onDismiss} />}
    </section>
  );
}

function CelebrationModal({ locale, onDismiss }: { locale: Locale; onDismiss: () => void }) {
  const t = COPY[locale];
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lab-complete-title"
    >
      <div className="w-full max-w-sm rounded-[2rem] bg-white px-8 py-10 text-center shadow-2xl">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
          <Check size={48} className="text-primary" strokeWidth={2.5} aria-hidden="true" />
        </div>
        <h2 id="lab-complete-title" className="mt-5 font-headline text-2xl text-on-surface">
          {t.blockComplete}
        </h2>
        <button
          type="button"
          onClick={onDismiss}
          className="mt-6 rounded-full bg-primary px-8 py-3 text-sm font-semibold text-white shadow-[0_10px_15px_-3px_rgba(190,43,23,0.2)]"
        >
          {t.continue}
        </button>
      </div>
    </div>
  );
}

function BlocksPreview({ locale }: { locale: Locale }) {
  const t = COPY[locale];
  const [tab, setTab] = useState<"active" | "completed">("active");
  const [startOpen, setStartOpen] = useState(false);
  const [mode, setMode] = useState<"solo" | "friends">("friends");
  return (
    <section className="rounded-[2rem] bg-surface-container-high p-4 sm:p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="inline-flex rounded-full bg-white p-1">
          {(["active", "completed"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={`rounded-full px-4 py-2 text-sm font-medium ${tab === value ? "bg-primary text-white shadow-[0_4px_12px_rgba(190,43,23,0.2)]" : "text-on-surface-variant"}`}
            >
              {t[value]}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setStartOpen(true)}
          className="rounded-full bg-primary p-3 text-white shadow-[0_10px_15px_-3px_rgba(190,43,23,0.2)]"
          aria-label={t.startPlan}
        >
          <Plus size={20} />
        </button>
      </div>
      {tab === "active" ? (
        <div className="space-y-4">
          <PlanCard locale={locale} title={t.sharedPlan} group />
          <PlanCard locale={locale} title={null} />
        </div>
      ) : (
        <PlanCard locale={locale} title={null} completed />
      )}
      {startOpen && (
        <StartPlanDialog
          locale={locale}
          mode={mode}
          setMode={setMode}
          onClose={() => setStartOpen(false)}
        />
      )}
    </section>
  );
}

function PlanCard({
  locale,
  title,
  group = false,
  completed = false,
}: {
  locale: Locale;
  title: string | null;
  group?: boolean;
  completed?: boolean;
}) {
  const t = COPY[locale];
  return (
    <article className="group rounded-[2rem] bg-white p-5 shadow-card">
      <button
        type="button"
        className="flex w-full items-start justify-between gap-4 text-left focus:outline-none focus:ring-2 focus:ring-primary-container"
      >
        <div className="min-w-0">
          <h2 className="font-headline text-lg text-on-surface">
            {getBlockLabel(completed ? 2 : 3, locale)}
          </h2>
          {title && <p className="mt-1 truncate text-sm text-on-surface">{title}</p>}
          <p className="mt-2 text-sm text-on-surface-variant">
            {completed ? t.completedOn : group ? `4 ${t.members}` : `1 ${t.member}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-tertiary-container px-3 py-1 text-xs font-medium text-on-tertiary-fixed-variant">
            Aug 12
          </span>
          <ChevronRight
            size={18}
            className="text-outline-variant transition-transform group-hover:translate-x-0.5"
          />
        </div>
      </button>
    </article>
  );
}

function StartPlanDialog({
  locale,
  mode,
  setMode,
  onClose,
}: {
  locale: Locale;
  mode: "solo" | "friends";
  setMode: (mode: "solo" | "friends") => void;
  onClose: () => void;
}) {
  const t = COPY[locale];
  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-black/40 p-4 sm:items-center sm:justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lab-start-title"
    >
      <div className="w-full max-w-md rounded-[2rem] bg-surface p-5 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 id="lab-start-title" className="font-headline text-2xl text-on-surface">
            {t.startPlan}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-on-surface-variant hover:bg-white"
            aria-label={t.cancel}
          >
            <X size={20} />
          </button>
        </div>
        <label className="text-sm font-medium text-on-surface">{t.chooseBlock}</label>
        <select className="mt-2 w-full rounded-2xl bg-white px-4 py-3 text-sm text-on-surface">
          <option>{getBlockLabel(3, locale)}</option>
          <option>{getBlockLabel(4, locale)}</option>
        </select>
        <fieldset className="mt-5">
          <legend className="text-sm font-medium text-on-surface">{t.startWith}</legend>
          <div className="mt-2 grid grid-cols-2 gap-2 rounded-2xl bg-white p-1">
            {(["solo", "friends"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                className={`rounded-2xl px-3 py-3 text-sm font-medium ${mode === value ? "bg-surface-container-high text-on-surface shadow-[0_4px_12px_rgba(53,50,47,0.08)]" : "text-on-surface-variant"}`}
              >
                {t[value]}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs leading-5 text-on-surface-variant">
            {mode === "solo" ? t.soloHint : t.friendsHint}
          </p>
        </fieldset>
        {mode === "friends" && (
          <>
            <label className="mt-4 block text-sm font-medium text-on-surface">{t.planName}</label>
            <input
              placeholder={t.planPlaceholder}
              className="mt-2 w-full rounded-2xl bg-white px-4 py-3 text-sm text-on-surface placeholder:text-outline-variant"
            />
          </>
        )}
        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-full bg-primary py-3.5 text-sm font-semibold text-white shadow-[0_10px_15px_-3px_rgba(190,43,23,0.2)]"
        >
          {t.create}
        </button>
      </div>
    </div>
  );
}

function SharedPlanPreview({ locale }: { locale: Locale }) {
  const t = COPY[locale];
  const [membersOpen, setMembersOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [post, setPost] = useState("");
  const [posts, setPosts] = useState(["The reminder to slow down stayed with me today."]);
  return (
    <section className="rounded-[2rem] bg-surface-container-high p-4 sm:p-5">
      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMembersOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-full border border-foreground/80 px-3 py-1.5 text-foreground"
        >
          <Users size={15} />
          <span className="text-xs font-medium uppercase tracking-wider">4 {t.members}</span>
        </button>
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-foreground hover:bg-white"
            aria-label={t.menu}
          >
            <MoreHorizontal size={21} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 z-10 mt-2 min-w-48 rounded-2xl bg-white p-1.5 shadow-[0_12px_32px_rgba(53,50,47,0.12)]">
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-on-surface hover:bg-surface-container-high"
              >
                <Copy size={17} className="text-secondary" />
                {t.copyInvite}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setDeleteOpen(true);
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-primary hover:bg-primary-container"
              >
                <Trash2 size={17} />
                {t.deletePlan}
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="rounded-[2rem] bg-white p-4 shadow-card">
        <textarea
          value={post}
          onChange={(event) => setPost(event.target.value)}
          placeholder={t.takeaway}
          className="min-h-24 w-full resize-none rounded-2xl bg-surface-container-high p-3 text-sm text-on-surface placeholder:text-outline-variant focus:outline-none focus:ring-2 focus:ring-primary-container"
        />
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={() => {
              if (post.trim()) {
                setPosts([post, ...posts]);
                setPost("");
              }
            }}
            disabled={!post.trim()}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_16px_rgba(190,43,23,0.2)] disabled:opacity-50"
          >
            <Send size={15} />
            {t.post}
          </button>
        </div>
      </div>
      <div className="mt-5 space-y-4">
        {posts.map((body, index) => (
          <DiscussionPost key={`${body}-${index}`} body={body} locale={locale} />
        ))}
      </div>
      {membersOpen && <MembersDialog locale={locale} onClose={() => setMembersOpen(false)} />}
      {deleteOpen && <DeleteDialog locale={locale} onClose={() => setDeleteOpen(false)} />}
    </section>
  );
}

function DiscussionPost({ body, locale }: { body: string; locale: Locale }) {
  const t = COPY[locale];
  const [replying, setReplying] = useState(false);
  return (
    <article className="rounded-[2rem] bg-white p-4 shadow-[0_8px_24px_rgba(53,50,47,0.05)]">
      <div className="flex items-start gap-3">
        <Avatar initials="AK" />
        <div>
          <p className="text-sm font-medium text-on-surface">
            @alex <span className="font-normal text-on-surface-variant">· {t.owner}</span>
          </p>
          <p className="mt-2 text-sm leading-6 text-on-surface">{body}</p>
        </div>
      </div>
      {replying ? (
        <div className="mt-4 flex gap-2">
          <input
            autoFocus
            placeholder={t.replyPlaceholder}
            className="min-w-0 flex-1 rounded-full bg-surface-container-high px-4 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => setReplying(false)}
            className="rounded-full bg-primary px-3 text-white"
          >
            <Send size={15} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setReplying(true)}
          className="mt-3 text-sm font-medium text-secondary hover:underline"
        >
          {t.reply}
        </button>
      )}
    </article>
  );
}
function Avatar({ initials }: { initials: string }) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary-container text-xs font-semibold text-on-secondary-container">
      {initials}
    </div>
  );
}

function MembersDialog({ locale, onClose }: { locale: Locale; onClose: () => void }) {
  const t = COPY[locale];
  const [tab, setTab] = useState<"members" | "add">("members");
  const [added, setAdded] = useState(false);
  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-black/40 p-4 sm:items-center sm:justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lab-members-title"
    >
      <div className="w-full max-w-md rounded-[2rem] bg-surface p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="lab-members-title" className="font-headline text-xl text-on-surface">
            {t.membersTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-on-surface-variant hover:bg-white"
          >
            <X size={20} />
          </button>
        </div>
        <div className="mb-4 grid grid-cols-2 gap-1 rounded-full bg-white p-1">
          <button
            type="button"
            onClick={() => setTab("members")}
            className={`rounded-full px-3 py-2 text-sm font-medium ${tab === "members" ? "bg-surface-container-high text-on-surface" : "text-on-surface-variant"}`}
          >
            {t.membersTitle}
          </button>
          <button
            type="button"
            onClick={() => setTab("add")}
            className={`rounded-full px-3 py-2 text-sm font-medium ${tab === "add" ? "bg-surface-container-high text-on-surface" : "text-on-surface-variant"}`}
          >
            {t.addMembers}
          </button>
        </div>
        {tab === "members" ? (
          <div className="space-y-3">
            {[
              ["AK", "@alex", true],
              ["JM", "@james", true],
              ["LC", "@lily", false],
              ["SR", "@sam", false],
            ].map(([initials, name, done]) => (
              <div key={String(name)} className="flex items-center gap-3">
                <Avatar initials={String(initials)} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-on-surface">{String(name)}</p>
                  <p className="text-xs text-on-surface-variant">
                    {done ? t.memberStatus : t.waiting}
                  </p>
                </div>
                {done && <Check size={19} className="text-category-emotional" />}
              </div>
            ))}
          </div>
        ) : (
          <div>
            <label className="relative block">
              <UserPlus
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
              />
              <input
                type="search"
                placeholder={locale === "en" ? "Search your friends" : "搜索你的好友"}
                className="w-full rounded-2xl bg-white py-3 pl-11 pr-4 text-sm"
              />
            </label>
            <div className="mt-5 flex items-center gap-3">
              <Avatar initials="TN" />
              <p className="flex-1 text-sm font-medium text-on-surface">@tina</p>
              <button
                type="button"
                onClick={() => setAdded(true)}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-2 text-xs font-semibold text-white"
              >
                {added ? <Check size={14} /> : <UserPlus size={14} />}
                {added ? (locale === "en" ? "Added" : "已添加") : t.addMembers}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DeleteDialog({ locale, onClose }: { locale: Locale; onClose: () => void }) {
  const t = COPY[locale];
  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-black/40 p-4 sm:items-center sm:justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lab-delete-title"
    >
      <div className="w-full max-w-md rounded-[2rem] bg-surface p-5 shadow-2xl">
        <h2 id="lab-delete-title" className="font-headline text-2xl text-on-surface">
          {t.deletePlan}
        </h2>
        <p className="mt-2 text-sm leading-6 text-on-surface-variant">{t.deleteBody}</p>
        <p className="mt-4 text-sm leading-6 text-on-surface-variant">
          <strong className="font-semibold text-primary">
            {locale === "en" ? "Warning:" : "警告："}
          </strong>{" "}
          {t.warning}
        </p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full bg-white px-4 py-3 text-sm font-semibold text-on-surface"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_16px_rgba(190,43,23,0.2)]"
          >
            {t.deletePlan}
          </button>
        </div>
      </div>
    </div>
  );
}

function DiscussionTaskPreview({ locale }: { locale: Locale }) {
  const t = COPY[locale];
  const [closed, setClosed] = useState(false);
  if (closed)
    return (
      <section className="rounded-[2rem] bg-white p-8 text-center shadow-card">
        <h2 className="font-headline text-2xl text-on-surface">
          {locale === "en" ? "Task closed" : "任务已关闭"}
        </h2>
        <button
          type="button"
          onClick={() => setClosed(false)}
          className="mt-5 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white"
        >
          {t.preview}
        </button>
      </section>
    );
  return (
    <section className="overflow-hidden rounded-[2rem] bg-surface shadow-card">
      <header className="flex items-center gap-3 border-b border-outline-variant/30 bg-white px-4 py-3">
        <button
          type="button"
          onClick={() => setClosed(true)}
          className="flex h-7 w-7 items-center justify-center rounded-full text-foreground hover:bg-surface-container-high"
          aria-label={t.cancel}
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="flex-1 font-headline text-lg text-foreground">{t.talkItOut}</h2>
      </header>
      <div className="p-4">
        <p className="rounded-2xl bg-tertiary-container px-4 py-5 text-center text-sm text-on-tertiary-fixed-variant">
          {locale === "en"
            ? "Be the first to share what stayed with you today."
            : "成为第一个分享今天触动你内容的人。"}
        </p>
      </div>
      <footer className="flex items-center justify-between border-t border-outline-variant/30 bg-white px-3 py-5">
        <div className="h-9 w-9" />
        <div className="text-center">
          <p className="text-sm font-semibold text-foreground">
            {getBlockLabel(3, locale)} | {locale === "en" ? "Mental" : "心理"}
          </p>
          <p className="text-xs text-on-surface-variant">{t.day} | 3 of 4</p>
        </div>
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white shadow-sm"
        >
          <ArrowRight size={20} />
        </button>
      </footer>
    </section>
  );
}

function InvitePreview({ locale }: { locale: Locale }) {
  const t = COPY[locale];
  const [state, setState] = useState<"ready" | "joined" | "expired">("ready");
  return (
    <section className="rounded-[2rem] bg-white p-7 text-center shadow-card">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary-container">
        <Users size={25} className="text-on-secondary-container" />
      </div>
      <h2 className="mt-5 font-headline text-3xl text-on-surface">{t.joinTitle}</h2>
      {state === "expired" ? (
        <p className="mt-4 text-sm leading-6 text-on-surface-variant">{t.expired}</p>
      ) : state === "joined" ? (
        <p className="mt-4 text-sm leading-6 text-on-surface-variant">
          {locale === "en" ? "Welcome to Tuesday small group." : "欢迎加入周二小组。"}
        </p>
      ) : (
        <p className="mt-4 text-sm leading-6 text-on-surface-variant">{t.joinHint}</p>
      )}
      <div className="mt-7 flex flex-col gap-3">
        <button
          type="button"
          onClick={() => setState("joined")}
          disabled={state !== "ready"}
          className="w-full rounded-full bg-primary py-3.5 text-sm font-semibold text-white shadow-[0_10px_15px_-3px_rgba(190,43,23,0.2)] disabled:opacity-50"
        >
          {state === "joined" ? t.joined : t.join}
        </button>
        <button
          type="button"
          onClick={() => setState(state === "expired" ? "ready" : "expired")}
          className="text-sm font-medium text-secondary hover:underline"
        >
          {state === "expired"
            ? t.reset
            : locale === "en"
              ? "Preview expired state"
              : "预览已失效状态"}
        </button>
      </div>
    </section>
  );
}
