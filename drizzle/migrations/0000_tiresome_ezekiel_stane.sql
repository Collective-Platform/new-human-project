CREATE SCHEMA "nhp";
--> statement-breakpoint
CREATE TABLE "nhp"."badge_definitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"icon_url" text,
	"block_number" integer NOT NULL,
	"is_milestone" boolean,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nhp"."block_day_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"block_number" integer NOT NULL,
	"day_number" integer NOT NULL,
	"category" text NOT NULL,
	"task_type" text NOT NULL,
	"name" text NOT NULL,
	"content" jsonb,
	"display_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nhp"."friend_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sender_id" integer NOT NULL,
	"receiver_id" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nhp"."member_badges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" integer NOT NULL,
	"badge_id" uuid NOT NULL,
	"earned_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nhp"."member_block_completions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" integer NOT NULL,
	"block_number" integer DEFAULT 1 NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nhp"."notification_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" integer NOT NULL,
	"type" text NOT NULL,
	"title" text,
	"body" text,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	"read_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "nhp"."pending_auth" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(254) NOT NULL,
	"token_hash" varchar(255) NOT NULL,
	"mode" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "nhp"."push_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" integer NOT NULL,
	"endpoint" text NOT NULL,
	"subscription" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nhp"."rate_limit_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"identifier" varchar(255) NOT NULL,
	"action" text NOT NULL,
	"attempt_count" integer DEFAULT 1 NOT NULL,
	"window_started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_attempt_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nhp"."sessions" (
	"id" varchar(21) PRIMARY KEY NOT NULL,
	"token_hash" varchar(255) NOT NULL,
	"user_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nhp"."task_completions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" integer NOT NULL,
	"task_id" uuid NOT NULL,
	"data" jsonb,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nhp"."users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(254) NOT NULL,
	"email_verified_at" timestamp with time zone,
	"role" text DEFAULT 'user' NOT NULL,
	"status" text DEFAULT 'guest' NOT NULL,
	"display_name" text,
	"search_handle" text,
	"avatar_url" text,
	"church_id" uuid,
	"onboarded_at" timestamp with time zone,
	"notification_prefs" jsonb DEFAULT '{"daily_reminder": true, "reminder_time": "08:00", "friend_requests": true}'::jsonb,
	"privacy_public" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "nhp"."friend_requests" ADD CONSTRAINT "friend_requests_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "nhp"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nhp"."friend_requests" ADD CONSTRAINT "friend_requests_receiver_id_users_id_fk" FOREIGN KEY ("receiver_id") REFERENCES "nhp"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nhp"."member_badges" ADD CONSTRAINT "member_badges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "nhp"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nhp"."member_badges" ADD CONSTRAINT "member_badges_badge_id_badge_definitions_id_fk" FOREIGN KEY ("badge_id") REFERENCES "nhp"."badge_definitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nhp"."member_block_completions" ADD CONSTRAINT "member_block_completions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "nhp"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nhp"."notification_log" ADD CONSTRAINT "notification_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "nhp"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nhp"."push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "nhp"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nhp"."sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "nhp"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nhp"."task_completions" ADD CONSTRAINT "task_completions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "nhp"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nhp"."task_completions" ADD CONSTRAINT "task_completions_task_id_block_day_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "nhp"."block_day_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "badge_definitions_block_number_idx" ON "nhp"."badge_definitions" USING btree ("block_number");--> statement-breakpoint
CREATE UNIQUE INDEX "friend_requests_sender_id_receiver_id_idx" ON "nhp"."friend_requests" USING btree ("sender_id","receiver_id");--> statement-breakpoint
CREATE UNIQUE INDEX "member_badges_user_id_badge_id_idx" ON "nhp"."member_badges" USING btree ("user_id","badge_id");--> statement-breakpoint
CREATE UNIQUE INDEX "member_block_completions_user_id_block_number_idx" ON "nhp"."member_block_completions" USING btree ("user_id","block_number");--> statement-breakpoint
CREATE UNIQUE INDEX "pending_auth_token_hash_idx" ON "nhp"."pending_auth" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "pending_auth_email_idx" ON "nhp"."pending_auth" USING btree (lower("email"));--> statement-breakpoint
CREATE INDEX "pending_auth_expires_at_idx" ON "nhp"."pending_auth" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "push_subscriptions_endpoint_idx" ON "nhp"."push_subscriptions" USING btree ("endpoint");--> statement-breakpoint
CREATE INDEX "push_subscriptions_user_id_idx" ON "nhp"."push_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "rate_limit_attempts_identifier_action_idx" ON "nhp"."rate_limit_attempts" USING btree ("identifier","action");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_token_hash_idx" ON "nhp"."sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "task_completions_user_id_task_id_idx" ON "nhp"."task_completions" USING btree ("user_id","task_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "nhp"."users" USING btree (lower("email"));--> statement-breakpoint
CREATE UNIQUE INDEX "users_search_handle_idx" ON "nhp"."users" USING btree ("search_handle");--> statement-breakpoint
CREATE INDEX "users_display_name_lower_idx" ON "nhp"."users" USING btree (lower("display_name"));