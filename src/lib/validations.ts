import { z } from "zod";

// ─── Entry Validations ───────────────────────────────────────────────────────

export const RopeEntrySchema = z.object({
  id: z.string().max(255),
  revelationVerse: z.string().min(1, "Verse is required").max(100),
  revelationText: z.string().max(5000).optional().default(""),
  observation: z.string().min(1, "Please provide an observation").max(10000),
  prayer: z.string().min(1, "Please provide a prayer").max(10000),
  execution: z.string().min(1, "Please provide an execution").max(5000),
  executionStatus: z.enum(["yes", "partly", "not_yet"]).nullable().optional(),
  executionReflection: z.string().max(5000).optional().default(""),
  createdAt: z.string().or(z.date()),
});

// ─── Prayer Validations ──────────────────────────────────────────────────────

export const PrayerItemSchema = z.object({
  id: z.string().max(255),
  text: z.string().min(1, "Prayer text is required").max(5000),
  verse: z.string().max(255).optional().default(""),
  answeredNote: z.string().max(5000).optional().default(""),
  isPublic: z.boolean().optional().default(false),
  createdAt: z.string().or(z.date()),
  answeredAt: z.string().or(z.date()).nullable().optional(),
  publicAt: z.string().or(z.date()).nullable().optional(),
});

export const BibleHighlightSchema = z.object({
  book: z.string().max(100),
  chapter: z.number().int().min(1).max(150),
  verse: z.number().int().min(1).max(200),
  color: z.enum(["gold", "green", "blue", "red"]),
  createdAt: z.string().or(z.date()),
});

export const GratitudeItemSchema = z.object({
  id: z.string().max(255),
  text: z.string().min(1, "Gratitude text is required").max(1000),
  createdAt: z.string().or(z.date()),
});

export const MemoryVerseSchema = z.object({
  verse: z.string().max(255),
  text: z.string().max(5000),
  addedAt: z.string().or(z.date()),
});

export const UserSettingsSchema = z.object({
  darkMode: z.boolean(),
  translation: z.string().max(20),
  onboardingComplete: z.boolean(),
  lastRead: z.array(z.object({
    book: z.string(),
    chapter: z.number(),
    lastRead: z.string().or(z.date()),
  })).max(10),
});


// ─── Community Validations ───────────────────────────────────────────────────

export const ForumPostSchema = z.object({
  title: z.string().min(3, "Title too short").max(255),
  content: z.string().min(5, "Content too short").max(20000),
  category: z.string().max(100).optional().default("General"),
});

export const VerseCommentSchema = z.object({
  book: z.string().max(100),
  chapter: z.string().or(z.number()).transform(v => v.toString()).pipe(z.string().max(20)),
  verse: z.string().or(z.number()).transform(v => v.toString()).pipe(z.string().max(20)),
  content: z.string().min(1, "Comment cannot be empty").max(5000),
  verseText: z.string().max(5000).optional().default(""),
});

export const ReplySchema = z.object({
  content: z.string().min(1, "Reply cannot be empty").max(5000),
});

export const PublicHighlightSchema = z.object({
  book: z.string().max(100),
  chapter: z.string().or(z.number()).transform(v => v.toString()).pipe(z.string().max(20)),
  verse: z.string().or(z.number()).transform(v => v.toString()).pipe(z.string().max(20)),
  color: z.string().max(50),
  note: z.string().max(1000).optional().default(""),
});


// ─── Support Validations ─────────────────────────────────────────────────────

export const FeedbackSchema = z.object({
  type: z.enum(["bug", "suggestion"]),
  title: z.string().min(3, "Title must be at least 3 characters").max(255),
  description: z.string().min(10, "Please provide a more detailed description").max(5000),
});

export const ErrorLogSchema = z.object({
  message: z.string().max(2000),
  stack: z.string().max(20000).optional(),
  pathname: z.string().max(1000).optional(),
  context: z.any().optional(),
});
