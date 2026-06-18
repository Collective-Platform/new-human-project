import { cacheLife } from "next/cache";
import { getPassageForLocale } from "@/src/features/bible";
import { getDayTasks } from "./queries";

export interface DayContentTask {
  id: string;
  category: string;
  taskType: string;
  name: string;
  content: Record<string, unknown> | null;
  body?: string;
  passageRef?: string;
  scriptureRef?: string;
  inputs?: string[];
}

export interface DayContent {
  tasks: DayContentTask[];
}

export async function getDayContent(
  blockNumber: number,
  day: number,
  locale: "en" | "zh",
): Promise<DayContent> {
  "use cache";
  cacheLife("days");

  const tasks = await getDayTasks(blockNumber, day, locale);

  const enrichedTasks: DayContentTask[] = await Promise.all(
    tasks.map(async (t) => {
      let content = t.content as Record<string, unknown> | null;

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
        body: t.body,
        passageRef: t.passageRef,
        scriptureRef: t.scriptureRef,
        inputs: t.inputs,
      };
    }),
  );

  return { tasks: enrichedTasks };
}
