import { db } from "../src/lib/server-db";
import { feedback } from "../src/lib/schema";
import { count } from "drizzle-orm";

async function test() {
  console.log("Checking if feedback table exists and is accessible...");
  try {
    const result = await db.select({ value: count() }).from(feedback);
    console.log(`Success! Feedback table has ${result[0].value} rows.`);
  } catch (e) {
    console.error("Failed to access feedback table:", e);
    process.exit(1);
  }
}

test();
