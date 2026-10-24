import { z } from "zod";
import { BIBLE_BOOKS, BOOK_CHAPTERS } from "./bible-data";
import { TRANSLATIONS } from "./scripture";

const translationSchema = z.enum(TRANSLATIONS.map(t => t.id));

const dateSchema = z.string().refine(value => Number.isFinite(Date.parse(value)), "Invalid date").or(z.date());

// ─── Entry Validations ───────────────────────────────────────────────────────

export const RopeEntrySchema = z.object({
  id: z.string().max(255),
  revelationVerse: z.string().min(1, "Verse is required").max(100),
  revelationText: z.string().max(50000).optional().default(""),
  translation: translationSchema.nullable().optional(),
  observation: z.string().min(1, "Please provide an observation").max(10000),
  prayer: z.string().min(1, "Please provide a prayer").max(10000),
  execution: z.string().min(1, "Please provide an execution").max(5000),
  executionStatus: z.enum(["yes", "partly", "not_yet"]).nullable().optional(),
  executionReflection: z.string().max(5000).optional().default(""),
  createdAt: dateSchema,
});

// ─── Prayer Validations ──────────────────────────────────────────────────────

export const PrayerItemSchema = z.object({
  id: z.string().max(255),
  text: z.string().min(1, "Prayer text is required").max(5000),
  verse: z.string().max(255).optional().default(""),
  answeredNote: z.string().max(5000).optional().default(""),
  isPublic: z.boolean().optional().default(false),
  createdAt: dateSchema,
  answeredAt: dateSchema.nullable().optional(),
  publicAt: dateSchema.nullable().optional(),
});

export const BibleHighlightSchema = z.object({
  id: z.string().min(1).max(150).regex(/^[\w -]+$/).optional(),
  book: z.string().refine(book => BIBLE_BOOKS.some(b => b.name === book), "Unknown Bible book"),
  chapter: z.number().int().min(1).max(150),
  verse: z.number().int().min(1).max(200),
  color: z.enum(["gold", "green", "blue", "red"]),
  note: z.string().max(5000).optional().default(""),
  createdAt: dateSchema,
  selection: z.object({
    endVerse: z.number().int().min(1).max(176),
    translation: translationSchema,
    startOffset: z.number().int().nonnegative().max(10000).nullable(),
    endOffset: z.number().int().positive().max(10000).nullable(),
    verses: z.array(z.object({ verse: z.number().int().min(1).max(176), text: z.string().min(1).max(10000) })).min(1).max(176),
  }).nullable().optional(),
}).superRefine((h, ctx) => {
  const invalid = (message: string) => ctx.addIssue({ code: "custom", message });
  if (h.chapter > BOOK_CHAPTERS[h.book]) invalid("Chapter is outside this book");
  const s = h.selection;
  if (!s) return;
  if (!s.verses.length) return; // The array validator reports this; do not dereference an empty backup.
  if (s.endVerse < h.verse || s.verses[0].verse !== h.verse || s.verses.at(-1)!.verse !== s.endVerse) invalid("The selected passage does not match its reference");
  if (s.verses.some((v, i) => i > 0 && v.verse <= s.verses[i - 1].verse)) invalid("Passage verses must be unique and in order");
  if ((s.startOffset === null) !== (s.endOffset === null)) invalid("Both phrase boundaries are required");
  if (s.startOffset !== null && s.endOffset !== null) {
    if (s.startOffset >= s.verses[0].text.length || s.endOffset > s.verses.at(-1)!.text.length || (h.verse === s.endVerse && s.endOffset <= s.startOffset)) invalid("The phrase boundaries are outside the selected text");
  }
});

export const GratitudeItemSchema = z.object({
  id: z.string().max(255),
  text: z.string().min(1, "Gratitude text is required").max(1000),
  verse: z.string().max(255).optional().default(""),
  createdAt: dateSchema,
});

export const MemoryVerseSchema = z.object({
  verse: z.string().max(255),
  text: z.string().max(50000),
  translation: translationSchema.nullable().optional(),
  addedAt: dateSchema,
});

export const UserSettingsSchema = z.object({
  darkMode: z.boolean(),
  translation: translationSchema,
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
