import { submitFeedback } from "../src/lib/actions";
import { db } from "../src/lib/server-db";
import { feedback } from "../src/lib/schema";
import { count } from "drizzle-orm";

async function test() {
  console.log("Testing feedback submission...");
  
  try {
    // 1. Check initial count
    const initial = await db.select({ value: count() }).from(feedback);
    const initialCount = initial[0].value;
    console.log(`Initial count: ${initialCount}`);

    // 2. Submit feedback
    await submitFeedback({
      type: "suggestion",
      title: "Test Suggestion",
      description: "This is a test suggestion from the verification script."
    });
    console.log("Submitted suggestion.");

    await submitFeedback({
      type: "bug",
      title: "Test Bug",
      description: "This is a test bug report from the verification script."
    });
    console.log("Submitted bug report.");

    // 3. Check final count
    const final = await db.select({ value: count() }).from(feedback);
    const finalCount = final[0].value;
    console.log(`Final count: ${finalCount}`);

    if (finalCount === initialCount + 2) {
      console.log("Verification SUCCESS: Feedback saved to DB.");
    } else {
      console.log("Verification FAILED: Feedback count did not increase as expected.");
    }
    
    // 4. (Optional) Print the entries
    const entries = await db.select().from(feedback).limit(2);
    console.log("Sample entries:", JSON.stringify(entries, null, 2));

  } catch (e) {
    console.error("Verification error:", e);
  }
}

test();
