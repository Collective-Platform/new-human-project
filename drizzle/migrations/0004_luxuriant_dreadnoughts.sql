CREATE TABLE "nhp"."member_block_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" integer NOT NULL,
	"block_number" integer NOT NULL,
	"attempt" integer DEFAULT 1 NOT NULL,
	"starts_on" date NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "nhp"."member_block_attempts" ADD CONSTRAINT "member_block_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "nhp"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "member_block_attempts_user_block_attempt_idx" ON "nhp"."member_block_attempts" USING btree ("user_id","block_number","attempt");