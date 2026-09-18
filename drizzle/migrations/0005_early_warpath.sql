CREATE TABLE "nhp"."plan_completions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"user_id" integer NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "nhp"."member_badges_user_id_badge_id_idx";--> statement-breakpoint
ALTER TABLE "nhp"."member_badges" ADD COLUMN "plan_id" uuid;--> statement-breakpoint
ALTER TABLE "nhp"."plans" ADD COLUMN "is_group" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "nhp"."users" ADD COLUMN "dashboard_plan_id" uuid;--> statement-breakpoint
ALTER TABLE "nhp"."plan_completions" ADD CONSTRAINT "plan_completions_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "nhp"."plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nhp"."plan_completions" ADD CONSTRAINT "plan_completions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "nhp"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "plan_completions_plan_user_idx" ON "nhp"."plan_completions" USING btree ("plan_id","user_id");--> statement-breakpoint
ALTER TABLE "nhp"."member_badges" ADD CONSTRAINT "member_badges_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "nhp"."plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "member_badges_user_badge_plan_idx" ON "nhp"."member_badges" USING btree ("user_id","badge_id","plan_id");