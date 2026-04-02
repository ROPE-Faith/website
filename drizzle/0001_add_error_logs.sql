CREATE TABLE "error_logs" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(255),
	"message" text NOT NULL,
	"stack" text,
	"pathname" text,
	"context" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
