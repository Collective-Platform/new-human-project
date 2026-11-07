// Sample data for the design board. Plain data only — nothing here touches the
// database. Shapes match the real components' props.

import type { DashboardData, HomeDashboardData } from "@/src/features/dashboard";
import type { ProgressPayload, ProgressTask } from "@/src/features/progress";
import type {
  PlanCardProgress,
  PlanDiscussionThread,
  PlanMember,
} from "@/src/features/plans/queries";

const DAY = 86_400_000;

function isoDay(base: number, offsetDays: number) {
  return new Date(base + offsetDays * DAY).toISOString().slice(0, 10);
}

export interface BoardFixtures {
  progress: ProgressPayload;
  /** One real task per type, for the popup frames. */
  samples: Partial<Record<"devotional" | "scripture" | "mood" | "exercise", ProgressTask>>;
  dashboard: HomeDashboardData;
  feed: Feed[];
  people: Person[];
  profile: ReturnType<typeof makeProfile>;
  plans: PlanCard[];
  members: PlanMember[];
  discussion: PlanDiscussionThread[];
  admin: ReturnType<typeof makeAdmin>;
  badge: NonNullable<DashboardData["earnedBadge"]>;
  notifications: {
    id: string;
    type: string;
    title: string;
    body: string;
    sentAt: string;
    readAt: string | null;
  }[];
}

interface Person {
  id: number;
  displayName: string | null;
  searchHandle: string | null;
  avatarUrl: string | null;
  lastActivity: string | null;
}
interface Feed {
  completionId: string;
  taskId?: string;
  userId: number;
  displayName: string | null;
  searchHandle: string | null;
  avatarUrl: string | null;
  category: string;
  activity: string;
  completedAt: string;
  likeCount: number;
  likedByMe: boolean;
}
export interface PlanCard {
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
  finalStreak: number;
}

function makeProfile(base: number) {
  return {
    user: {
      email: "sample.member@example.com",
      displayName: "Sample Member",
      searchHandle: "sample_member",
      avatarUrl: null as string | null,
      notificationPrefs: { daily_reminder: true, reminder_time: "08:00", friend_requests: true },
      privacyPublic: true,
    },
    badges: [
      {
        name: "Block 1 Complete",
        description: "Finished all 25 days of Block 1.",
        iconUrl: "/icons/badge-block-1.svg",
        earnedAt: new Date(base - 30 * DAY).toISOString(),
      },
    ],
  };
}

function makeAdmin() {
  return {
    stats: {
      total: 248,
      active: 191,
      monthlySignups: [
        { month: "2026-08", count: 34 },
        { month: "2026-09", count: 71 },
        { month: "2026-10", count: 58 },
      ],
      monthlyActive: [
        { month: "2026-08", count: 29 },
        { month: "2026-09", count: 88 },
        { month: "2026-10", count: 102 },
      ],
      dailySignups: Array.from({ length: 14 }, (_, i) => ({
        date: `2026-10-${String(i + 1).padStart(2, "0")}`,
        count: (i * 7) % 9,
      })),
      weeklyActiveUsers: [
        { week: "2026-09-21", count: 80 },
        { week: "2026-09-28", count: 94 },
        { week: "2026-10-05", count: 101 },
        { week: "2026-10-12", count: 97 },
      ],
      blockCompletions: [
        {
          block: 1,
          completedAllDays: 64,
          meanDaysCompleted: 19.2,
          medianDaysCompleted: 22,
          completed1To4Days: 12,
          completed5To14Days: 30,
          completed15To19Days: 28,
          completed20To24Days: 41,
        },
      ],
      componentCompletions: [
        {
          block: 1,
          category: "Mental" as const,
          completedTasks: 3100,
          taskCount: 4000,
          membersStarted: 160,
          completionRate: 0.78,
        },
        {
          block: 1,
          category: "Emotional" as const,
          completedTasks: 2700,
          taskCount: 4000,
          membersStarted: 160,
          completionRate: 0.68,
        },
        {
          block: 1,
          category: "Physical" as const,
          completedTasks: 2300,
          taskCount: 4000,
          membersStarted: 160,
          completionRate: 0.58,
        },
      ],
    },
    users: [
      {
        id: 1,
        email: "sample.member@example.com",
        displayName: "Sample Member",
        searchHandle: "sample_member",
        status: "active",
        role: "user",
        emailVerifiedAt: "2026-09-01T00:00:00Z",
        onboardedAt: "2026-09-01T00:00:00Z",
        createdAt: "2026-09-01T00:00:00Z",
      },
      {
        id: 2,
        email: "grace@example.com",
        displayName: "Grace Lim",
        searchHandle: "grace",
        status: "active",
        role: "admin",
        emailVerifiedAt: "2026-09-03T00:00:00Z",
        onboardedAt: "2026-09-03T00:00:00Z",
        createdAt: "2026-09-03T00:00:00Z",
      },
      {
        id: 3,
        email: "new.guest@example.com",
        displayName: null,
        searchHandle: null,
        status: "guest",
        role: "user",
        emailVerifiedAt: null,
        onboardedAt: null,
        createdAt: "2026-10-12T00:00:00Z",
      },
    ],
    streaks: [
      { id: 2, email: "grace@example.com", searchHandle: "grace", streak: 21 },
      { id: 1, email: "sample.member@example.com", searchHandle: "sample_member", streak: 9 },
    ],
  };
}

export function buildFixtures(
  base: number,
  tasks: ProgressTask[],
  samples: BoardFixtures["samples"],
  currentDay = 9,
): BoardFixtures {
  const blockStart = base - (currentDay - 1) * DAY;
  const completions: ProgressPayload["completions"] = {};
  for (const t of tasks.slice(0, 2)) completions[t.id] = {};

  const progress: ProgressPayload = {
    planId: "demo-plan",
    blockNumber: 1,
    currentDay,
    selectedDay: currentDay,
    blockStartDate: new Date(blockStart).toISOString(),
    missedDays: 1,
    carousel: Array.from({ length: 25 }, (_, i) => ({
      day: i + 1,
      reachable: i + 1 <= currentDay,
      fullyCompleted: i + 1 < currentDay && i + 1 !== 4,
    })),
    tasks: tasks.map((t) => ({
      ...t,
      completed: t.id in completions,
      completionData: completions[t.id] ?? null,
    })),
    taskIdsByDay: { [currentDay]: tasks.map((t) => t.id) },
    completions,
  };

  const windowStart = base - 24 * DAY;
  const dashboard: HomeDashboardData = {
    radar: { mental: 72, emotional: 55, physical: 38 },
    streak: 9,
    calendar: Array.from({ length: 12 }, (_, i) => ({
      date: isoDay(windowStart, 12 + i),
      categories: ["Mental", "Emotional", "Physical"].slice(0, 1 + ((i * 5) % 3)),
    })),
    windowStartDate: isoDay(windowStart, 0),
    emotionBreakdown: { good: 6, okay: 4, excellent: 3, bad: 1 },
    activityLast25: Array.from({ length: 25 }, (_, i) => ({
      day: new Date(windowStart + i * DAY).getUTCDate(),
      totalMinutes: i > 11 ? ((i * 17) % 60) + 10 : 0,
    })),
    earnedBadge: null,
  };

  const people: Person[] = [
    {
      id: 2,
      displayName: "Grace Lim",
      searchHandle: "grace",
      avatarUrl: null,
      lastActivity: new Date(base - 3_600_000).toISOString(),
    },
    {
      id: 3,
      displayName: "Daniel Tan",
      searchHandle: "dan_tan",
      avatarUrl: null,
      lastActivity: new Date(base - 26 * 3_600_000).toISOString(),
    },
    {
      id: 4,
      displayName: "Mei Ling",
      searchHandle: "meiling",
      avatarUrl: null,
      lastActivity: null,
    },
  ];

  const feed: Feed[] = [
    {
      completionId: "c1",
      userId: 2,
      displayName: "Grace Lim",
      searchHandle: "grace",
      avatarUrl: null,
      category: "Mental",
      activity: "Gift of Awareness",
      completedAt: new Date(base - 3_600_000).toISOString(),
      likeCount: 3,
      likedByMe: true,
    },
    {
      completionId: "c2",
      userId: 3,
      displayName: "Daniel Tan",
      searchHandle: "dan_tan",
      avatarUrl: null,
      category: "Physical",
      activity: "Run · 30 min",
      completedAt: new Date(base - 5 * 3_600_000).toISOString(),
      likeCount: 1,
      likedByMe: false,
    },
    {
      completionId: "c3",
      userId: 2,
      displayName: "Grace Lim",
      searchHandle: "grace",
      avatarUrl: null,
      category: "Emotional",
      activity: "Mood log",
      completedAt: new Date(base - 28 * 3_600_000).toISOString(),
      likeCount: 0,
      likedByMe: false,
    },
  ];

  const user = (id: number, handle: string, name: string) => ({
    id,
    displayName: name,
    searchHandle: handle,
    avatarUrl: null,
  });
  const plans: PlanCard[] = [
    {
      id: "demo-solo",
      blockNumber: 3,
      title: null,
      startedAt: new Date(base - 8 * DAY).toISOString(),
      createdBy: 1,
      memberCount: 1,
      role: "owner",
      isGroup: false,
      completedAt: null,
      finalStreak: 0,
      progress: { currentDay: 9, totalDays: 25, todayTotal: 5, todayDone: 5, members: [] },
    },
    {
      id: "demo-group",
      blockNumber: 5,
      title: "Tuesday small group",
      startedAt: new Date(base - 4 * DAY).toISOString(),
      createdBy: 1,
      memberCount: 4,
      role: "owner",
      isGroup: true,
      completedAt: null,
      finalStreak: 0,
      progress: {
        currentDay: 5,
        totalDays: 25,
        todayTotal: 5,
        todayDone: 2,
        members: [
          {
            id: 2,
            displayName: "Grace Lim",
            searchHandle: "grace",
            avatarUrl: null,
            completedToday: true,
          },
          {
            id: 3,
            displayName: "Daniel Tan",
            searchHandle: "dan_tan",
            avatarUrl: null,
            completedToday: false,
          },
          {
            id: 4,
            displayName: "Mei Ling",
            searchHandle: "meiling",
            avatarUrl: null,
            completedToday: false,
          },
        ],
      },
    },
    {
      id: "demo-group-2",
      blockNumber: 2,
      title: "Church friends",
      startedAt: new Date(base - 12 * DAY).toISOString(),
      createdBy: 2,
      memberCount: 6,
      role: "member",
      isGroup: true,
      completedAt: null,
      finalStreak: 0,
      progress: {
        currentDay: 13,
        totalDays: 25,
        todayTotal: 5,
        todayDone: 0,
        members: [
          {
            id: 2,
            displayName: "Grace Lim",
            searchHandle: "grace",
            avatarUrl: null,
            completedToday: true,
          },
          {
            id: 5,
            displayName: "Sam Ong",
            searchHandle: "sam_ong",
            avatarUrl: null,
            completedToday: false,
          },
          {
            id: 6,
            displayName: "Ruth Koh",
            searchHandle: "ruth",
            avatarUrl: null,
            completedToday: true,
          },
        ],
      },
    },
    {
      id: "demo-done",
      blockNumber: 1,
      title: null,
      startedAt: new Date(base - 60 * DAY).toISOString(),
      createdBy: 1,
      memberCount: 1,
      role: "owner",
      isGroup: false,
      completedAt: new Date(base - 33 * DAY).toISOString(),
      finalStreak: 12,
      progress: null,
    },
  ];
  const members: PlanMember[] = [
    { ...user(1, "sample_member", "Sample Member"), completed: true, role: "owner" },
    { ...user(2, "grace", "Grace Lim"), completed: true, role: "member" },
    { ...user(3, "dan_tan", "Daniel Tan"), completed: false, role: "member" },
    { ...user(4, "meiling", "Mei Ling"), completed: false, role: "member" },
  ];
  const discussion: PlanDiscussionThread[] = [
    {
      id: "d1",
      body: "The part about no side entrance for people who feel they don't deserve to walk in really got me. Who else felt that?",
      createdAt: new Date(base - 2 * 3_600_000).toISOString(),
      user: user(2, "grace", "Grace Lim"),
      replies: [
        {
          id: "d1r1",
          body: "Same. I read it twice.",
          createdAt: new Date(base - 3_600_000).toISOString(),
          user: user(3, "dan_tan", "Daniel Tan"),
        },
      ],
    },
    {
      id: "d2",
      body: "How did you use today's rhythm in your week?",
      createdAt: new Date(base - 5 * 3_600_000).toISOString(),
      user: user(1, "sample_member", "Sample Member"),
      replies: [],
    },
  ];

  return {
    progress,
    samples,
    dashboard,
    feed,
    people,
    profile: makeProfile(base),
    plans,
    members,
    discussion,
    admin: makeAdmin(),
    badge: {
      memberBadgeId: "demo-member-badge",
      badgeId: "block-1",
      name: "Block 1 Complete",
      description: "Finished all 25 days of Block 1.",
      iconUrl: "/icons/badge-block-1.svg",
      blockNumber: 1,
      earnedAt: new Date(base).toISOString(),
    },
    notifications: [
      {
        id: "n1",
        type: "like",
        title: "Grace liked your reflection",
        body: "Tap to see it.",
        sentAt: new Date(base - 600_000).toISOString(),
        readAt: null,
      },
      {
        id: "n2",
        type: "daily_reminder",
        title: "Today's rhythm is ready",
        body: "Day 9 is waiting for you.",
        sentAt: new Date(base - 8 * 3_600_000).toISOString(),
        readAt: new Date(base - 7 * 3_600_000).toISOString(),
      },
    ],
  };
}
