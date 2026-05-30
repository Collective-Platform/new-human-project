CREATE TABLE "nhp"."likes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" integer NOT NULL,
	"completion_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "nhp"."member_badges" ADD COLUMN "seen_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "nhp"."pending_auth" ADD COLUMN "otp_plaintext" varchar(10);--> statement-breakpoint
ALTER TABLE "nhp"."pending_auth" ADD COLUMN "email_sent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "nhp"."likes" ADD CONSTRAINT "likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "nhp"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nhp"."likes" ADD CONSTRAINT "likes_completion_id_task_completions_id_fk" FOREIGN KEY ("completion_id") REFERENCES "nhp"."task_completions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "likes_user_completion_idx" ON "nhp"."likes" USING btree ("user_id","completion_id");