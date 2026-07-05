import { db } from "@/src/db";
import { memberBlockCompletions, taskCompletions } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import {
  getMaxContentBlock,
  getTaskById as getRegistryTaskById,
} from "@/src/features/content/program";
import {
  BLOCK_LENGTH_DAYS,
  getActiveBlock,
  getBlockStart,
  PROGRAM_DEFAULT_TZ,
} from "@/src/lib/program-gate";
import { getBlockCurrentStreak, getBlockFinalStreak } from "./queries";

const BLOCK_LENGTH_MS = BLOCK_LENGTH_DAYS * 86_400_000;

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
  // yet (gap between finishing the active block and its launch date). null otherwise.
  nextBlock: { blockNumber: number; unlocksAt: string } | null;
}

function blockDateRange(
  onboardedAt: Date,
  blockNumber: number,
  tz: string,
): { start: Date; end: Date } {
  const start = getBlockStart(onboardedAt, blockNumber, tz);
  return { start, end: new Date(start.getTime() + BLOCK_LENGTH_MS) };
}

export async function getBlockOverviewForUser(
  userId: number,
  effectiveStartMs: number,
  currentDay: number,
  tz: string = PROGRAM_DEFAULT_TZ,
): Promise<BlockOverviewData> {
  const effectiveStart = new Date(effectiveStartMs);
  effectiveStart.setUTCHours(0, 0, 0, 0);

  const now = new Date();
  const activeBlockNumber = getActiveBlock(effectiveStart, now, tz).blockNumber;
  const { start: activeBlockStart, end: activeBlockEnd } = blockDateRange(
    effectiveStart,
    activeBlockNumber,
    tz,
  );

  const [completedRows, allCompletions, currentStreak] = await Promise.all([
    db
      .select({
        blockNumber: memberBlockCompletions.blockNumber,
        completedAt: memberBlockCompletions.completedAt,
      })
      .from(memberBlockCompletions)
      .where(eq(memberBlockCompletions.userId, userId)),
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

  // Any block before the active one is "completed" by time passing, regardless
  // of whether a memberBlockCompletions record exists. Synthesize missing entries
  // using the block's end date so they always appear in the overview.
  const dbCompletedBlockNumbers = new Set(completedRows.map((r) => r.blockNumber));
  const syntheticRows: { blockNumber: number; completedAt: Date }[] = [];
  for (let b = 1; b < activeBlockNumber; b++) {
    if (!dbCompletedBlockNumbers.has(b)) {
      const { end } = blockDateRange(effectiveStart, b, tz);
      syntheticRows.push({ blockNumber: b, completedAt: end });
    }
  }
  const allCompletedRows = [...completedRows, ...syntheticRows].sort(
    (a, b) => a.blockNumber - b.blockNumber,
  );

  const finalStreaks = await Promise.all(
    allCompletedRows.map((row) => {
      const { start, end } = blockDateRange(effectiveStart, row.blockNumber, tz);
      return getBlockFinalStreak(userId, start, end, tz);
    }),
  );

  const completedBlocks = allCompletedRows.map((row, i) => {
    const { start } = blockDateRange(effectiveStart, row.blockNumber, tz);
    return {
      blockNumber: row.blockNumber,
      completedAt: row.completedAt.toISOString(),
      finalStreak: finalStreaks[i],
      blockStartDate: start.toISOString().slice(0, 10),
    };
  });

  // Advertise the next block while it exists in content but hasn't started for
  // this user yet (the gap between finishing the active block and its launch date).
  // active is the highest block that has started, so active+1 is always still
  // ahead — show it whenever that block has authored content.
  const nextBlockNumber = activeBlockNumber + 1;
  const nextBlock =
    nextBlockNumber <= getMaxContentBlock()
      ? {
          blockNumber: nextBlockNumber,
          unlocksAt: getBlockStart(effectiveStart, nextBlockNumber, tz).toISOString().slice(0, 10),
        }
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
