import { randomUUID } from "node:crypto";
import { test as base, expect } from "@playwright/test";
import { and, eq } from "drizzle-orm";
import type { ProgramTask } from "../../src/features/content/program";
import en from "../../messages/en.json";
import zh from "../../messages/zh.json";
import { loadTestEnvironment } from "../../scripts/e2e-environment";

export const messages = { en, zh };
export type Locale = keyof typeof messages;

type Member = {
  id: number;
  email: string;
  handle: string;
  cookie: string;
  tasks: ProgramTask[];
  completion: (taskId: string) => Promise<Record<string, unknown> | null | undefined>;
};

export const test = base.extend<{
  member: Member;
  memberRole: "user" | "admin";
  onboarded: boolean;
}>({
  memberRole: ["user", { option: true }],
  onboarded: [true, { option: true }],
  member: async ({ context, baseURL, memberRole, onboarded }, use) => {
    loadTestEnvironment();
    // Deferred requires keep --list independent of database credentials.
    // Use Playwright's CommonJS transform so nested @/ imports resolve in workers.
    const { db } = require("../../src/db") as typeof import("../../src/db");
    const { users, sessions, taskCompletions } =
      require("../../src/db/schema") as typeof import("../../src/db/schema");
    const { generateSessionId, generateRawToken, hashToken } =
      require("../../src/features/auth/crypto") as typeof import("../../src/features/auth/crypto");
    const { getDayTasks } =
      require("../../src/features/content/program") as typeof import("../../src/features/content/program");
    const handle = `e2e_${randomUUID().replaceAll("-", "").slice(0, 20)}`;
    const email = `${handle}@example.invalid`;
    const [user] = await db
      .insert(users)
      .values({
        email,
        emailVerifiedAt: new Date(),
        displayName: "Browser Test Member",
        searchHandle: onboarded ? handle : null,
        status: "active",
        role: memberRole,
        // A new member stays in block 1; day 1 remains available across midnight.
        onboardedAt: onboarded ? new Date(Date.now() - 2 * 86_400_000) : null,
        notificationPrefs: {
          daily_reminder: false,
          reminder_time: "08:00",
          friend_requests: false,
          likes: false,
        },
      })
      .returning();
    try {
      const sessionId = generateSessionId();
      const token = generateRawToken();
      const cookie = `${sessionId}.${token}`;
      await db.insert(sessions).values({
        id: sessionId,
        tokenHash: hashToken(token),
        userId: user.id,
        expiresAt: new Date(Date.now() + 86_400_000),
      });
      await context.addCookies([
        { name: "__session", value: cookie, url: baseURL!, httpOnly: true, sameSite: "Lax" },
        { name: "tz", value: "Asia/Kuala_Lumpur", url: baseURL! },
      ]);
      await context.addInitScript(() => localStorage.setItem("a2hs-dismissed", "1"));
      await use({
        id: user.id,
        email,
        handle,
        cookie,
        tasks: getDayTasks(1, 1),
        completion: async (taskId) => {
          const rows = await db
            .select({ data: taskCompletions.data })
            .from(taskCompletions)
            .where(and(eq(taskCompletions.userId, user.id), eq(taskCompletions.taskId, taskId)));
          return rows.length ? (rows[0].data as Record<string, unknown> | null) : undefined;
        },
      });
    } finally {
      // Cascades remove this test's sessions and progress. No shared data is reset.
      await db.delete(users).where(eq(users.id, user.id));
    }
  },
});

export function taskName(task: ProgramTask, locale: Locale): string {
  return typeof task.name === "string" ? task.name : (task.name[locale] ?? task.name.en ?? "");
}

export { expect };
