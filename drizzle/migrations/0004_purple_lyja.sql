CREATE TABLE "nhp"."plan_discussion_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"day_number" integer NOT NULL,
	"user_id" integer NOT NULL,
	"parent_id" uuid,
	"body" varchar(1000) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "nhp"."plan_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"user_id" integer NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"removed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "nhp"."plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"block_number" integer NOT NULL,
	"created_by" integer NOT NULL,
	"invite_code" varchar(32) NOT NULL,
	"title" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "nhp"."task_completions_user_id_task_id_idx";--> statement-breakpoint
ALTER TABLE "nhp"."task_completions" ADD COLUMN "plan_id" uuid;--> statement-breakpoint
ALTER TABLE "nhp"."plan_discussion_posts" ADD CONSTRAINT "plan_discussion_posts_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "nhp"."plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nhp"."plan_discussion_posts" ADD CONSTRAINT "plan_discussion_posts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "nhp"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nhp"."plan_discussion_posts" ADD CONSTRAINT "plan_discussion_posts_parent_id_plan_discussion_posts_id_fk" FOREIGN KEY ("parent_id") REFERENCES "nhp"."plan_discussion_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nhp"."plan_members" ADD CONSTRAINT "plan_members_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "nhp"."plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nhp"."plan_members" ADD CONSTRAINT "plan_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "nhp"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nhp"."plans" ADD CONSTRAINT "plans_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "nhp"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "plan_discussion_posts_plan_day_created_idx" ON "nhp"."plan_discussion_posts" USING btree ("plan_id","day_number","created_at");--> statement-breakpoint
CREATE INDEX "plan_discussion_posts_parent_created_idx" ON "nhp"."plan_discussion_posts" USING btree ("parent_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "plan_members_plan_user_idx" ON "nhp"."plan_members" USING btree ("plan_id","user_id");--> statement-breakpoint
CREATE INDEX "plan_members_user_status_idx" ON "nhp"."plan_members" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "plan_members_plan_status_idx" ON "nhp"."plan_members" USING btree ("plan_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "plans_invite_code_idx" ON "nhp"."plans" USING btree ("invite_code");--> statement-breakpoint
CREATE INDEX "plans_created_by_started_at_idx" ON "nhp"."plans" USING btree ("created_by","started_at");--> statement-breakpoint
ALTER TABLE "nhp"."task_completions" ADD CONSTRAINT "task_completions_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "nhp"."plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "task_completions_plan_user_task_idx" ON "nhp"."task_completions" USING btree ("plan_id","user_id","task_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "task_completions_plan_user_task_unique_idx" ON "nhp"."task_completions" USING btree ("plan_id","user_id","task_id") WHERE "plan_id" IS NOT NULL;
