import { cacheLife, cacheTag } from "next/cache";
import { getPassageForLocale } from "@/src/features/bible";
import {
  getDayTasks,
  getUserCompletions,
  getDayCompletionStates,
  getFullyCompletedDays,
} from "./queries";

export interface ProgressTask {
  id: string;
  category: string;
  taskType: string;
  name: string;
  content: Record<string, unknown> | null;
  completed: boolean;
  completionData: Record<string, unknown> | null;
  // Registry-only fields. Set when the task came from the markdown program
  // registry (`data/program/**/*.md`). The renderer uses presence of `body`
  // as the feature switch to mount SectionedContentRenderer instead of the
  // legacy DevotionalRenderer.
  body?: string;
  passageRef?: string;
  scriptureRef?: string;
  inputs?: string[];
}

export interface ProgressCarouselDay {
  day: number;
  reachable: boolean;
  fullyCompleted: boolean;
}

export interface ProgressPayload {
  blockNumber: number;
  currentDay: number;
  selectedDay: number;
  blockStartDate: string;
  missedDays: number;
  carousel: ProgressCarouselDay[];
  tasks: ProgressTask[];
}

export async function getProgressForUser(
  userId: number,
  onboardedAtMs: number,
  requestedDayParam: number | null,
  locale: "en" | "zh",
  currentDay: number,
): Promise<ProgressPayload> {
  "use cache";
  cacheLife("minutes");
  cacheTag(`progress:${userId}`);

  const requestedDay = Math.min(Math.max(requestedDayParam ?? currentDay, 1), 25);

  const blockNumber = 1;
  const tasks = await getDayTasks(blockNumber, requestedDay, locale);
  const taskIds = tasks.map((t) => t.id);
  const completedMap = await getUserCompletions(userId, taskIds);

  const [dayStates, fullyCompletedDays] = await Promise.all([
    getDayCompletionStates(userId, blockNumber),
    getFullyCompletedDays(userId, blockNumber),
  ]);

  const carousel: ProgressCarouselDay[] = Array.from({ length: 25 }, (_, i) => {
    const day = i + 1;
    return {
      day,
      reachable: true,
      fullyCompleted: fullyCompletedDays.has(day),
    };
  });

  let missedDays = 0;
  for (let d = 1; d < currentDay; d++) {
    if (!dayStates.has(d)) missedDays++;
  }

  const enrichedTasks: ProgressTask[] = await Promise.all(
    tasks.map(async (t) => {
      let content = t.content as Record<string, unknown> | null;

      // Resolve the scripture reference from either source: DB tasks store
      // it in the `content` jsonb under `scripture_reference`; registry
      // tasks declare it in frontmatter as `scriptureRef`.
      const scriptureRef =
        t.scriptureRef ??
        (typeof content?.scripture_reference === "string"
          ? (content.scripture_reference as string)
          : undefined);

      if (
        (t.taskType === "scripture_reading" || t.taskType === "scripture_study") &&
        scriptureRef
      ) {
        const passage = await getPassageForLocale(scriptureRef, locale);
        content = {
          ...content,
          scripture_reference: scriptureRef,
          ...(passage ? { prefetched_passage: passage } : {}),
        };
      }
      return {
        id: t.id,
        category: t.category,
        taskType: t.taskType,
        name: t.name,
        content,
        completed: completedMap.has(t.id),
        completionData: completedMap.get(t.id) ?? null,
        body: t.body,
        passageRef: t.passageRef,
        scriptureRef: t.scriptureRef,
        inputs: t.inputs,
      };
    }),
  );

  return {
    blockNumber,
    currentDay,
    selectedDay: requestedDay,
    blockStartDate: new Date(onboardedAtMs).toISOString(),
    missedDays,
    carousel,
    tasks: enrichedTasks,
  };
}
