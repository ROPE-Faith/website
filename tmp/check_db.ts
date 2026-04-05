import { db } from "../src/lib/server-db";
import { entries, highlights } from "../src/lib/schema";
import { count } from "drizzle-orm";

async function test() {
  console.log("Checking DB counts...");
  try {
    const entryCount = await db.select({ value: count() }).from(entries);
    const highlightCount = await db.select({ value: count() }).from(highlights);
    console.log(`Entries: ${entryCount[0].value}`);
    console.log(`Highlights: ${highlightCount[0].value}`);
  } catch (e) {
    console.error("Failed to access tables:", e);
    process.exit(1);
  }
}

test();
