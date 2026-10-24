ALTER TABLE "entries" ADD COLUMN IF NOT EXISTS "translation" varchar(16);--> statement-breakpoint
ALTER TABLE "highlights" ADD COLUMN IF NOT EXISTS "selection" jsonb;--> statement-breakpoint
ALTER TABLE "memory_verses" ADD COLUMN IF NOT EXISTS "translation" varchar(16);