import { z } from "zod";
import { BibleHighlightSchema, GratitudeItemSchema, MemoryVerseSchema, PrayerItemSchema, RopeEntrySchema, UserSettingsSchema } from "./validations";

const planSchema = z.object({
  planId: z.string().min(1),
  currentDay: z.number().int().nonnegative(),
  startedAt: z.string().refine(value => Number.isFinite(Date.parse(value))),
  completedDays: z.array(z.number().int().nonnegative()),
  paused: z.boolean(),
  isCompleted: z.boolean().optional(),
  completedAt: z.string().nullable().optional(),
  lastAdvancedAt: z.string().nullable().optional(),
});

const backupSchemas: Record<string, z.ZodType> = {
  rope_entries: z.array(RopeEntrySchema.extend({ userId: z.string().default("local") })),
  rope_prayers: z.array(PrayerItemSchema),
  rope_gratitude: z.array(GratitudeItemSchema),
  rope_memory_verses: z.array(MemoryVerseSchema),
  rope_bible_highlights: z.array(BibleHighlightSchema),
  rope_active_plan: planSchema.nullable(),
  rope_plan_history: z.array(planSchema),
  rope_bible_history: UserSettingsSchema.shape.lastRead,
  rope_translation: z.enum(["kjv", "web", "bbe", "niv", "esv", "nlt", "nasb", "nkjv", "amp", "msg"]),
  rope_dark_mode: z.boolean(),
  rope_onboarding_done: z.boolean(),
};

/** Validate the entire file before changing storage; never accept arbitrary storage keys. */
export function parseBackup(json: string): Record<string, unknown> {
  const envelope = z.object({ version: z.literal("1.0"), data: z.record(z.string(), z.string().nullable()) }).parse(JSON.parse(json));
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(envelope.data)) {
    if (value === null) continue;
    const schema = backupSchemas[key];
    if (!schema) {
      // Original exports included these obsolete device-only fields.
      if (key === "rope_user" || key === "rope_alias_counter") continue;
      throw new Error(`Unsupported backup field: ${key}`);
    }
    const decoded = key === "rope_translation" ? value : JSON.parse(value);
    result[key] = schema.parse(decoded);
  }
  if (Object.keys(result).length === 0) throw new Error("This backup does not contain any journal data or settings.");
  return result;
}

/** Existing records win, so restoring an older backup cannot undo newer edits. */
export function mergeBackupItems<T>(current: T[], incoming: T[], identity: (item: T) => string): T[] {
  return [...new Map([...incoming, ...current].map(item => [identity(item), item])).values()];
}
