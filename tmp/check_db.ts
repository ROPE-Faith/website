import { db } from "../src/lib/server-db";
import { entries, highlights } from "../src/lib/schema";
import { count, eq } from "drizzle-orm";

async function test() {
  console.log("Testing journal entry insertion...");
  const mockId = "test_" + Date.now();
  const mockUserId = "user_2uW3U6g6U6U6U6U6U6U6U6U6U6U"; // A dummy clerk-like ID
  
  const entryToSave = {
    id: mockId,
    userId: mockUserId,
    revelationVerse: "John 1:1",
    revelationText: "In the beginning was the Word.",
    observation: "Test observation",
    prayer: "Test prayer",
    execution: "Test execution",
    createdAt: new Date(),
    executionStatus: null as any,
    executionReflection: "",
  };

  try {
    console.log("Inserting entry...");
    await db.insert(entries).values(entryToSave).onConflictDoUpdate({
      target: entries.id,
      set: entryToSave,
    });
    console.log("Success! Checking count...");
    const entryCount = await db.select({ value: count() }).from(entries);
    console.log(`Entries: ${entryCount[0].value}`);
    
    // Clean up
    await db.delete(entries).where(eq(entries.id, mockId));
    console.log("Cleaned up test entry.");
  } catch (e) {
    console.error("FAILED to insert journal entry:", e);
  }
}

test();
