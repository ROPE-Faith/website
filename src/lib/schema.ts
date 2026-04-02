import { pgTable, text, timestamp, varchar, pgEnum, boolean } from "drizzle-orm/pg-core";

export const executionStatusEnum = pgEnum("execution_status", ["yes", "partly", "not_yet"]);

export const entries = pgTable("entries", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  revelationVerse: text("revelation_verse").notNull(),
  revelationText: text("revelation_text").default("").notNull(),
  observation: text("observation").default("").notNull(),
  prayer: text("prayer").default("").notNull(),
  execution: text("execution").default("").notNull(),
  executionStatus: executionStatusEnum("execution_status"),
  executionReflection: text("execution_reflection").default("").notNull(),
});

export const prayers = pgTable("prayers", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  text: text("text").notNull(),
  verse: text("verse").default("").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  answeredAt: timestamp("answered_at"),
  answeredNote: text("answered_note").default("").notNull(),
  isPublic: boolean("is_public").default(false).notNull(),
  publicAt: timestamp("public_at"),
});

export const profiles = pgTable("profiles", {
  userId: varchar("user_id", { length: 255 }).primaryKey(),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  imageUrl: text("image_url"),
  bio: text("bio").default("").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const verseComments = pgTable("verse_comments", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  book: varchar("book", { length: 100 }).notNull(),
  chapter: varchar("chapter", { length: 20 }).notNull(),
  verse: varchar("verse", { length: 20 }).notNull(),
  content: text("content").notNull(),
  verseText: text("verse_text").default("").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const commentVotes = pgTable("comment_votes", {
  id: varchar("id", { length: 255 }).primaryKey(), // composite userId_commentId
  userId: varchar("user_id", { length: 255 }).notNull(),
  commentId: varchar("comment_id", { length: 255 }).notNull(),
  voteType: varchar("vote_type", { length: 10 }).notNull(), // 'up' or 'down'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const forumPosts = pgTable("forum_posts", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  category: varchar("category", { length: 100 }).default("General").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const forumReplies = pgTable("forum_replies", {
  id: varchar("id", { length: 255 }).primaryKey(),
  postId: varchar("post_id", { length: 255 }).notNull(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const gratitude = pgTable("gratitude", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  text: text("text").notNull(),
  verse: text("verse").default("").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const highlights = pgTable("highlights", {
  id: varchar("id", { length: 255 }).primaryKey(), // composite id usually but id is simpler for sync
  userId: varchar("user_id", { length: 255 }).notNull(),
  book: varchar("book", { length: 100 }).notNull(),
  chapter: text("chapter").notNull(), // text to handle edge cases or lead zeros
  verse: text("verse").notNull(),
  color: varchar("color", { length: 50 }).notNull(),
  note: text("note").default("").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const readingPlans = pgTable("reading_plans", {
  userId: varchar("user_id", { length: 255 }).primaryKey(), // One active plan per user stored in DB
  planId: varchar("plan_id", { length: 255 }).notNull(),
  currentDay: text("current_day").notNull(),
  completedDays: text("completed_days").notNull(), // JSON string
  paused: text("paused").default("false").notNull(),
  startAt: timestamp("start_at").defaultNow().notNull(),
});

export const memoryVerses = pgTable("memory_verses", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  verse: text("verse").notNull(),
  text: text("text").notNull(),
  addedAt: timestamp("added_at").defaultNow().notNull(),
});

export const userSettings = pgTable("user_settings", {
  userId: varchar("user_id", { length: 255 }).primaryKey(),
  darkMode: boolean("dark_mode").default(false).notNull(),
  translation: varchar("translation", { length: 16 }).default("kjv").notNull(),
  onboardingComplete: boolean("onboarding_complete").default(false).notNull(),
  lastRead: text("last_read").default("[]").notNull(), // JSON history array
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const prayerAmens = pgTable("prayer_amens", {
  id: varchar("id", { length: 255 }).primaryKey(), // userId_prayerId
  userId: varchar("user_id", { length: 255 }).notNull(),
  prayerId: varchar("prayer_id", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const postVotes = pgTable("post_votes", {
  id: varchar("id", { length: 255 }).primaryKey(), // userId_postId
  userId: varchar("user_id", { length: 255 }).notNull(),
  postId: varchar("post_id", { length: 255 }).notNull(),
  voteType: varchar("vote_type", { length: 10 }).default("up").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const publicHighlights = pgTable("public_highlights", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  book: varchar("book", { length: 100 }).notNull(),
  chapter: varchar("chapter", { length: 20 }).notNull(),
  verse: varchar("verse", { length: 20 }).notNull(),
  color: varchar("color", { length: 50 }).notNull(),
  note: text("note").default("").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const prayerReplies = pgTable("prayer_replies", {
  id: varchar("id", { length: 255 }).primaryKey(),
  prayerId: varchar("prayer_id", { length: 255 }).notNull(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const verseReplies = pgTable("verse_replies", {
  id: varchar("id", { length: 255 }).primaryKey(),
  verseCommentId: varchar("verse_comment_id", { length: 255 }).notNull(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const feedback = pgTable("feedback", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }),
  type: varchar("type", { length: 50 }).notNull(), // 'bug' | 'suggestion'
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  status: varchar("status", { length: 50 }).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const errorLogs = pgTable("error_logs", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }),
  message: text("message").notNull(),
  stack: text("stack"),
  pathname: text("pathname"),
  context: text("context"), // JSON string
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
