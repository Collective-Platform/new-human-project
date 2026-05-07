ALTER TABLE "nhp"."task_completions" DROP CONSTRAINT "task_completions_task_id_block_day_tasks_id_fk";
--> statement-breakpoint
ALTER TABLE "nhp"."task_completions" ALTER COLUMN "task_id" SET DATA TYPE text;