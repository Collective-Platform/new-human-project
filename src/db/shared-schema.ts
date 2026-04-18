/**
 * Read-only Drizzle schema references for giving-platform shared tables.
 *
 * These tables already exist in production (managed by giving-platform).
 * Locally they are created by scripts/setup-local-db.sql.
 *
 * DO NOT create or modify these tables via Drizzle migrations.
 */

import {
  pgTable,
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

export const users = pgTable(
  "users",
  {
    id: serial().primaryKey(),
    email: varchar({ length: 254 }).notNull(),
    emailVerifiedAt: timestamp({ withTimezone: true }),
    firstName: varchar({ length: 32 }),
    lastName: varchar({ length: 32 }),
    role: text().notNull().default("user"),
    status: text().notNull().default("guest"),
    journey: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    // Formation-specific columns (added via ALTER TABLE)
    displayName: text(),
    searchHandle: text(),
    avatarUrl: text(),
    churchId: uuid(),
    onboardedAt: timestamp({ withTimezone: true }),
    pushSubscription: jsonb(),
    notificationPrefs: jsonb().$type<{
      daily_reminder: boolean;
      reminder_time: string;
      friend_requests: boolean;
    }>().default({ daily_reminder: true, reminder_time: "08:00", friend_requests: true }),
    privacyPublic: boolean().default(true),
  },
  (table) => [
    uniqueIndex("users_email_idx").on(table.email),
    uniqueIndex("users_search_handle_idx").on(table.searchHandle),
  ]
);

export const sessions = pgTable(
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
  (table) => [uniqueIndex("sessions_token_hash_idx").on(table.tokenHash)]
);

export const tokens = pgTable(
  "tokens",
  {
    id: serial().primaryKey(),
    tokenHash: varchar({ length: 255 }).notNull(),
    userId: integer()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    mode: text().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    usedAt: timestamp({ withTimezone: true }),
  },
  (table) => [
    uniqueIndex("tokens_token_hash_user_id_idx").on(
      table.tokenHash,
      table.userId
    ),
    index("tokens_user_id_expires_at_used_at_created_at_idx").on(
      table.userId,
      table.expiresAt,
      table.usedAt,
      table.createdAt
    ),
  ]
);

export const userSettings = pgTable("user_settings", {
  userId: integer()
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  privacyMode: boolean().notNull().default(false),
});

export const rateLimitAttempts = pgTable(
  "rate_limit_attempts",
  {
    id: serial().primaryKey(),
    identifier: varchar({ length: 255 }).notNull(),
    action: text().notNull(),
    attemptCount: integer().notNull().default(1),
    windowStartedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    lastAttemptAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("rate_limit_attempts_identifier_action_idx").on(
      table.identifier,
      table.action
    ),
  ]
);
