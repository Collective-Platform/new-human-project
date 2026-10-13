import { db } from "@/src/db";
import { taskCompletions } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import {
  getMaxContentBlock,
  getTaskById as getRegistryTaskById,
} from "@/src/features/content/program";
import {
  getActiveBlock,
  getBlockLaunchDate,
  getBlockStart,
  getBlockWindowEnd,
  PROGRAM_DEFAULT_TZ,
} from "@/src/lib/program-gate";
import { getAttempts } from "./block-attempts";
import { getBlockCurrentStreak, getBlockFinalStreak } from "./queries";

export interface BlockOverviewData {
  activeBlock: {
    blockNumber: number;
    currentDay: number;
    daysCompleted: number;
    currentStreak: number;
    blockStartDate: string;
  };
  completedBlocks: Array<{
    blockNumber: number;
    completedAt: string;
    finalStreak: number;
    blockStartDate: string;
  }>;
  // The next block, when it exists in content but hasn't started for this user
  // yet. `unlocksAt` is its start date once known, else its launch date, else null.
  nextBlock: { blockNumber: number; unlocksAt: string | null } | null;
}

export async function getBlockOverviewForUser(
  userId: number,
  onboardedAt: Date,
  currentDay: number,
  tz: string = PROGRAM_DEFAULT_TZ,
): Promise<BlockOverviewData> {
  const now = new Date();
  const attempts = await getAttempts(userId);
  const activeBlockNumber = getActiveBlock(onboardedAt, attempts, now, tz).blockNumber;
  const activeBlockStart = getBlockStart(onboardedAt, attempts, activeBlockNumber, tz);
  const activeBlockEnd = getBlockWindowEnd(onboardedAt, attempts, activeBlockNumber, now, tz);

  const [allCompletions, currentStreak] = await Promise.all([
    db
      .select({ taskId: taskCompletions.taskId })
      .from(taskCompletions)
      .where(eq(taskCompletions.userId, userId)),
    getBlockCurrentStreak(userId, activeBlockStart, activeBlockEnd, tz),
  ]);

  const dayHasCompletion = new Set<number>();
  for (const { taskId } of allCompletions) {
    const t = getRegistryTaskById(taskId);
    if (t && t.block === activeBlockNumber) dayHasCompletion.add(t.day);
  }

  // A block is "completed" once the user pressed Complete (attempt.completedAt),
  // not because time passed.
  const completedRows = attempts
    .filter((a) => a.completedAt)
    .sort((a, b) => b.blockNumber - a.blockNumber);

  const windows = completedRows.map((row) => ({
    start: getBlockStart(onboardedAt, attempts, row.blockNumber, tz),
    end: getBlockWindowEnd(onboardedAt, attempts, row.blockNumber, now, tz),
  }));
  const finalStreaks = await Promise.all(
    windows.map(({ start, end }) => getBlockFinalStreak(userId, start, end, tz)),
  );

  const completedBlocks = completedRows.map((row, i) => ({
    blockNumber: row.blockNumber,
    completedAt: row.completedAt!.toISOString(),
    finalStreak: finalStreaks[i],
    blockStartDate: windows[i].start.toISOString().slice(0, 10),
  }));

  // Advertise the next block while it exists in content but hasn't started for
  // this user yet. active is the highest block that has started, so active+1 is
  // always still ahead.
  const nextBlockNumber = activeBlockNumber + 1;
  const hasNextRow = attempts.some((a) => a.blockNumber === nextBlockNumber);
  const nextStart = hasNextRow
    ? getBlockStart(onboardedAt, attempts, nextBlockNumber, tz)
    : getBlockLaunchDate(nextBlockNumber);
  const nextBlock =
    nextBlockNumber <= getMaxContentBlock()
      ? { blockNumber: nextBlockNumber, unlocksAt: nextStart?.toISOString().slice(0, 10) ?? null }
      : null;

  return {
    activeBlock: {
      blockNumber: activeBlockNumber,
      currentDay,
      daysCompleted: dayHasCompletion.size,
      currentStreak,
      blockStartDate: activeBlockStart.toISOString().slice(0, 10),
    },
    completedBlocks,
    nextBlock,
  };
}
