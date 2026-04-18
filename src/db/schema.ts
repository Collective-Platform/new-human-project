/**
 * Formation-specific Drizzle schema.
 *
 * These tables are created and managed by Drizzle migrations.
 * The users table is shared with giving-platform — only formation-specific
 * columns are added via ALTER TABLE (see migration 2.4).
 */

import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "./shared-schema";

// --- Block Day Tasks (2.5) ---

export const blockDayTasks = pgTable("block_day_tasks", {
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

// --- Task Completions (2.6) ---

export const taskCompletions = pgTable(
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
  (table) => [
    uniqueIndex("task_completions_user_id_task_id_idx").on(
      table.userId,
      table.taskId
    ),
  ]
);

// --- Member Block Completions (2.7) ---

export const memberBlockCompletions = pgTable(
  "member_block_completions",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: integer()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    blockNumber: integer().notNull().default(1),
    completedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("member_block_completions_user_id_block_number_idx").on(
      table.userId,
      table.blockNumber
    ),
  ]
);

// --- Badge Definitions (2.8) ---

export const badgeDefinitions = pgTable(
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
  (table) => [
    uniqueIndex("badge_definitions_block_number_idx").on(table.blockNumber),
  ]
);

// --- Member Badges (2.9) ---

export const memberBadges = pgTable(
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
  (table) => [
    uniqueIndex("member_badges_user_id_badge_id_idx").on(
      table.userId,
      table.badgeId
    ),
  ]
);

// --- Friend Requests (2.10) ---

export const friendRequests = pgTable(
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
  (table) => [
    uniqueIndex("friend_requests_sender_id_receiver_id_idx").on(
      table.senderId,
      table.receiverId
    ),
  ]
);

// --- Push Subscriptions (2.11) ---

export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: integer()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    subscription: jsonb().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("push_subscriptions_user_id_idx").on(table.userId),
  ]
);

// --- Notification Log (2.12) ---

export const notificationLog = pgTable("notification_log", {
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
