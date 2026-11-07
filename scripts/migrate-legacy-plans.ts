/**
 * One-time data migration for the move from automatic blocks to member-started
 * plans. It is deliberately idempotent: re-running it only fills legacy
 * completion rows whose plan_id is still null, and sets each finished block's
 * completion date from its original milestone again.
 *
 * The old Completed tab counted every block before the member's current one as
 * completed because its time had passed, even with tasks left. That list was never
 * saved, so this script saves it: each of those blocks gets a plan and a finished
 * record. It gives no badges, because the old rule gave none.
 *
 * Run after `pnpm db:migrate` against production:
 *   pnpm plans:migrate-legacy
 */
import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/src/db";
import {
  memberBlockCompletions,
  planCompletions,
  planMembers,
  plans,
  taskCompletions,
  users,
} from "@/src/db/schema";
import { getAllTasks } from "@/src/features/content/program";
import { legacyActiveBlock, legacyBlockEnd, legacyBlockStart } from "./legacy-block-schedule";

type UserRow = { id: number; onboardedAt: Date | null };

async function findOrCreateLegacyPlan(user: UserRow, blockNumber: number) {
  const inviteCode = `legacy-${user.id}-${blockNumber}`;
  const [existing] = await db.select().from(plans).where(eq(plans.inviteCode, inviteCode)).limit(1);
  if (existing) return existing;
  const startedAt = legacyBlockStart(user.onboardedAt!, blockNumber);
  const [plan] = await db
    .insert(plans)
    .values({ blockNumber, createdBy: user.id, inviteCode, startedAt })
    .returning();
  await db.insert(planMembers).values({ planId: plan.id, userId: user.id, role: "owner" });
  return plan;
}

async function main() {
  const allTasks = getAllTasks();
  const taskIdsByBlock = new Map<number, string[]>();
  for (const task of allTasks) {
    const ids = taskIdsByBlock.get(task.block) ?? [];
    ids.push(task.id);
    taskIdsByBlock.set(task.block, ids);
  }
  const allUsers = (await db
    .select({ id: users.id, onboardedAt: users.onboardedAt })
    .from(users)) as UserRow[];
  let migrated = 0;

  for (const user of allUsers) {
    if (!user.onboardedAt) continue;
    const [completionRows, milestoneRows] = await Promise.all([
      db
        .select({ taskId: taskCompletions.taskId })
        .from(taskCompletions)
        .where(and(eq(taskCompletions.userId, user.id), isNull(taskCompletions.planId))),
      db
        .select({
          blockNumber: memberBlockCompletions.blockNumber,
          completedAt: memberBlockCompletions.completedAt,
        })
        .from(memberBlockCompletions)
        .where(eq(memberBlockCompletions.userId, user.id)),
    ]);

    const blocks = new Set<number>(milestoneRows.map((row) => row.blockNumber));
    for (const row of completionRows) {
      const task = allTasks.find((candidate) => candidate.id === row.taskId);
      if (task) blocks.add(task.block);
    }
    // Preserve an empty in-progress run, but never materialize a brand-new
    // automatic block on its first day. That would undermine manual start for
    // members who cross a former block boundary before migration runs.
    const activeLegacyBlock = legacyActiveBlock(user.onboardedAt);
    const currentBlock = activeLegacyBlock.blockNumber;
    if (activeLegacyBlock.currentDay > 1 || blocks.has(currentBlock)) {
      blocks.add(currentBlock);
    }
    for (let blockNumber = 1; blockNumber < currentBlock; blockNumber++) {
      blocks.add(blockNumber);
    }

    for (const blockNumber of blocks) {
      const plan = await findOrCreateLegacyPlan(user, blockNumber);
      const milestone = milestoneRows.find((row) => row.blockNumber === blockNumber);
      if (milestone) {
        // Keep the date the member really finished, not the date this script runs.
        await db
          .insert(planCompletions)
          .values({ planId: plan.id, userId: user.id, completedAt: milestone.completedAt })
          .onConflictDoUpdate({
            target: [planCompletions.planId, planCompletions.userId],
            set: { completedAt: milestone.completedAt },
          });
      } else if (blockNumber < currentBlock) {
        // Completed by time passing. Keep any finished record the block already has.
        await db
          .insert(planCompletions)
          .values({
            planId: plan.id,
            userId: user.id,
            completedAt: legacyBlockEnd(user.onboardedAt, blockNumber),
          })
          .onConflictDoNothing();
      }
      const taskIds = taskIdsByBlock.get(blockNumber) ?? [];
      if (taskIds.length === 0) continue;
      const result = await db
        .update(taskCompletions)
        .set({ planId: plan.id })
        .where(
          and(
            eq(taskCompletions.userId, user.id),
            isNull(taskCompletions.planId),
            inArray(taskCompletions.taskId, taskIds),
          ),
        )
        .returning();
      migrated += result.length;
    }

    if (blocks.has(currentBlock)) {
      await findOrCreateLegacyPlan(user, currentBlock);
    }
  }
  console.log(`Migrated ${migrated} legacy task completions into personal plans.`);
}

void main();
