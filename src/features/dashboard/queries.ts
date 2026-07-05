// getCurrentDay now lives in program-gate (pure date math shared by the block
// scheduling helpers). Re-exported here so existing import sites keep working.
export { getCurrentDay } from "@/src/lib/program-gate";

// XP weight by task type — mirrors the `xp_weight` column in the legacy seed.
// Used when resolving Mental XP for registry tasks that have no DB content JSON.
export const XP_WEIGHT_BY_TYPE: Record<string, number> = {
  devotional: 2,
  scripture_study: 2,
  scripture_reading: 1,
  info: 1,
  mood_log: 0,
};
