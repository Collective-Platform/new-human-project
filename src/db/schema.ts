/**
 * NHP Drizzle schema.
 *
 * Every table lives in the `nhp` Postgres schema so it cannot collide with —
 * and cannot be dropped by — giving-platform's `drizzle-kit push`, which only
 * looks at the `public` schema by default.
 *
 * NHP owns 100% of these tables, including its own `users` table. There is
 * no longer a shared `users` table or any FK across schemas.
 */

import { sql } from "drizzle-orm";
import {
  pgSchema,
  serial,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

export const nhp = pgSchema("nhp");

// --- Users (NHP-owned) ------------------------------------------------------

export const users = nhp.table(
  "users",
  {
    id: serial().primaryKey(),
    email: varchar({ length: 254 }).notNull(),
    emailVerifiedAt: timestamp({ withTimezone: true }),
    role: text().notNull().default("user"),
    status: text().notNull().default("guest"),
    // Profile
    displayName: text(),
    searchHandle: text(),
    avatarUrl: text(),
    churchId: uuid(),
    onboardedAt: timestamp({ withTimezone: true }),
    // Preferences
    notificationPrefs: jsonb()
      .$type<{
        daily_reminder: boolean;
        reminder_time: string;
        friend_requests: boolean;
      }>()
      .default(
        sql`'{"daily_reminder": true, "reminder_time": "08:00", "friend_requests": true}'::jsonb`
      ),
    privacyPublic: boolean().notNull().default(true),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("users_email_idx").on(sql`lower(${t.email})`),
    uniqueIndex("users_search_handle_idx").on(t.searchHandle),
    index("users_display_name_lower_idx").on(sql`lower(${t.displayName})`),
  ]
);

// --- Sessions ---------------------------------------------------------------

export const sessions = nhp.table(
  "sessions",
  {
    id: varchar({ length: 21 }).primaryKey(),
    tokenHash: varchar({ length: 255 }).notNull(),
    userId: integer()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("sessions_token_hash_idx").on(t.tokenHash)]
);

// --- Pending auth (OTPs not yet associated with a verified user) ------------
//
// Replaces the previous `tokens` table. OTPs are keyed by email, NOT by
// user_id, so a typo'd email creates only a short-lived pending row and
// never pollutes `users`. The user row is only inserted on successful verify.

export const pendingAuth = nhp.table(
  "pending_auth",
  {
    id: serial().primaryKey(),
    email: varchar({ length: 254 }).notNull(),
    tokenHash: varchar({ length: 255 }).notNull(),
    mode: text().notNull(), // 'login' | 'signup'
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    consumedAt: timestamp({ withTimezone: true }),
  },
  (t) => [
    uniqueIndex("pending_auth_token_hash_idx").on(t.tokenHash),
    index("pending_auth_email_idx").on(sql`lower(${t.email})`),
    index("pending_auth_expires_at_idx").on(t.expiresAt),
  ]
);

// --- Rate limit attempts ----------------------------------------------------

export const rateLimitAttempts = nhp.table(
  "rate_limit_attempts",
  {
    id: serial().primaryKey(),
    identifier: varchar({ length: 255 }).notNull(),
    action: text().notNull(), // 'otp_request' | 'otp_verify'
    attemptCount: integer().notNull().default(1),
    windowStartedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    lastAttemptAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("rate_limit_attempts_identifier_action_idx").on(
      t.identifier,
      t.action
    ),
  ]
);

// --- Block Day Tasks --------------------------------------------------------

export const blockDayTasks = nhp.table("block_day_tasks", {
  id: uuid().primaryKey().defaultRandom(),
  blockNumber: integer().notNull(),
  dayNumber: integer().notNull(),
  category: text().notNull(), // Physical | Mental | Emotional
  taskType: text().notNull(),
  name: text().notNull(),
  content: jsonb(),
  displayOrder: integer().notNull(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

// --- Task Completions -------------------------------------------------------

export const taskCompletions = nhp.table(
  "task_completions",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: integer()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    taskId: uuid()
      .notNull()
      .references(() => blockDayTasks.id, { onDelete: "cascade" }),
    data: jsonb(),
    completedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("task_completions_user_id_task_id_idx").on(t.userId, t.taskId),
  ]
);

// --- Member Block Completions ----------------------------------------------

export const memberBlockCompletions = nhp.table(
  "member_block_completions",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: integer()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    blockNumber: integer().notNull().default(1),
    completedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("member_block_completions_user_id_block_number_idx").on(
      t.userId,
      t.blockNumber
    ),
  ]
);

// --- Badge Definitions -----------------------------------------------------

export const badgeDefinitions = nhp.table(
  "badge_definitions",
  {
    id: uuid().primaryKey().defaultRandom(),
    name: text().notNull(),
    description: text(),
    iconUrl: text(),
    blockNumber: integer().notNull(),
    isMilestone: boolean(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("badge_definitions_block_number_idx").on(t.blockNumber)]
);

// --- Member Badges ---------------------------------------------------------

export const memberBadges = nhp.table(
  "member_badges",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: integer()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    badgeId: uuid()
      .notNull()
      .references(() => badgeDefinitions.id),
    earnedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("member_badges_user_id_badge_id_idx").on(t.userId, t.badgeId),
  ]
);

// --- Friend Requests -------------------------------------------------------

export const friendRequests = nhp.table(
  "friend_requests",
  {
    id: uuid().primaryKey().defaultRandom(),
    senderId: integer()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    receiverId: integer()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: text().notNull().default("pending"), // pending | accepted | rejected
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("friend_requests_sender_id_receiver_id_idx").on(
      t.senderId,
      t.receiverId
    ),
  ]
);

// --- Push Subscriptions ----------------------------------------------------
//
// One row per device. Unique on `endpoint`, NOT on user_id, so a single
// user can register multiple browsers/devices. Re-registering the same
// browser upserts onto the existing row.

export const pushSubscriptions = nhp.table(
  "push_subscriptions",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: integer()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    endpoint: text().notNull(),
    subscription: jsonb().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("push_subscriptions_endpoint_idx").on(t.endpoint),
    index("push_subscriptions_user_id_idx").on(t.userId),
  ]
);

// --- Notification Log ------------------------------------------------------

export const notificationLog = nhp.table("notification_log", {
  id: uuid().primaryKey().defaultRandom(),
  userId: integer()
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text().notNull(), // daily_reminder | friend_request
  title: text(),
  body: text(),
  sentAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  readAt: timestamp({ withTimezone: true }),
});
