CREATE TYPE "public"."execution_status" AS ENUM('yes', 'partly', 'not_yet');--> statement-breakpoint
CREATE TABLE "comment_votes" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"comment_id" varchar(255) NOT NULL,
	"vote_type" varchar(10) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entries" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"revelation_verse" text NOT NULL,
	"revelation_text" text DEFAULT '' NOT NULL,
	"observation" text DEFAULT '' NOT NULL,
	"prayer" text DEFAULT '' NOT NULL,
	"execution" text DEFAULT '' NOT NULL,
	"execution_status" "execution_status",
	"execution_reflection" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feedback" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(255),
	"type" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forum_posts" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"category" varchar(100) DEFAULT 'General' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forum_replies" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"post_id" varchar(255) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gratitude" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"text" text NOT NULL,
	"verse" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "highlights" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"book" varchar(100) NOT NULL,
	"chapter" text NOT NULL,
	"verse" text NOT NULL,
	"color" varchar(50) NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memory_verses" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"verse" text NOT NULL,
	"text" text NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_votes" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"post_id" varchar(255) NOT NULL,
	"vote_type" varchar(10) DEFAULT 'up' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prayer_amens" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"prayer_id" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prayer_replies" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"prayer_id" varchar(255) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prayers" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"text" text NOT NULL,
	"verse" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"answered_at" timestamp,
	"answered_note" text DEFAULT '' NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"public_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"user_id" varchar(255) PRIMARY KEY NOT NULL,
	"display_name" varchar(100) NOT NULL,
	"image_url" text,
	"bio" text DEFAULT '' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "public_highlights" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"book" varchar(100) NOT NULL,
	"chapter" varchar(20) NOT NULL,
	"verse" varchar(20) NOT NULL,
	"color" varchar(50) NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reading_plans" (
	"user_id" varchar(255) PRIMARY KEY NOT NULL,
	"plan_id" varchar(255) NOT NULL,
	"current_day" text NOT NULL,
	"completed_days" text NOT NULL,
	"paused" text DEFAULT 'false' NOT NULL,
	"start_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"user_id" varchar(255) PRIMARY KEY NOT NULL,
	"dark_mode" boolean DEFAULT false NOT NULL,
	"translation" varchar(16) DEFAULT 'kjv' NOT NULL,
	"onboarding_complete" boolean DEFAULT false NOT NULL,
	"last_read" text DEFAULT '[]' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verse_comments" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"book" varchar(100) NOT NULL,
	"chapter" varchar(20) NOT NULL,
	"verse" varchar(20) NOT NULL,
	"content" text NOT NULL,
	"verse_text" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verse_replies" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"verse_comment_id" varchar(255) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
