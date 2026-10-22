import assert from "node:assert/strict";
import test from "node:test";
import { PgDialect } from "drizzle-orm/pg-core";
import { createLoader, entry } from "./helpers.mjs";

function setup({ entryResult = [{ id: "entry-1" }] } = {}) {
  const writes = [];
  const db = {
    insert(table) {
      return {
        values(values) {
          const write = { table, values };
          writes.push(write);
          return {
            onConflictDoUpdate(config) {
              write.config = config;
              return { returning: async () => entryResult };
            },
          };
        },
      };
    },
  };
  const { load } = createLoader({ mocks: {
    "./server-db": { db },
    "@clerk/nextjs/server": { auth: async () => ({ userId: "reader" }) },
    "./rate-limit": { enforceRateLimit: async () => {} },
  } });
  return { actions: load("src/lib/actions.ts"), writes, dialect: new PgDialect() };
}

test("saving a check-in preserves the linked prayer's answer, notes and visibility", async () => {
  const { actions, writes, dialect } = setup();
  await actions.saveDbEntry(entry({ executionStatus: "yes", executionReflection: "I followed through." }));
  const prayerUpdate = writes[1];
  assert.deepEqual(Object.keys(prayerUpdate.config.set).sort(), ["text", "verse"]);
  assert.equal(prayerUpdate.values.id, "prayer_entry-1");
  const predicate = dialect.sqlToQuery(prayerUpdate.config.setWhere);
  assert.match(predicate.sql, /user_id/);
  assert.deepEqual(predicate.params, ["reader"]);
});

test("an entry collision with another account cannot update a prayer", async () => {
  const { actions, writes } = setup({ entryResult: [] });
  await assert.rejects(actions.saveDbEntry(entry()), /another account/);
  assert.equal(writes.some(write => write.values.id === "prayer_entry-1"), false);
});

test("entry, prayer and gratitude sync updates all constrain record ownership", async () => {
  const { actions, writes, dialect } = setup();
  await actions.syncEntries([entry()]);
  const prayer = { id: "prayer-1", text: "Prayer", verse: "John 3:16", answeredNote: "", isPublic: false, createdAt: new Date().toISOString(), answeredAt: null, publicAt: null };
  const gratitude = { id: "gratitude-1", text: "Family", verse: "Psalm 100:4", createdAt: new Date().toISOString() };
  await actions.saveDbPrayer(prayer);
  await actions.syncPrayers([prayer]);
  await actions.saveDbGratitude(gratitude);
  await actions.syncGratitude([gratitude]);
  assert.equal(writes.length, 5);
  for (const write of writes) {
    const predicate = dialect.sqlToQuery(write.config.setWhere);
    assert.match(predicate.sql, /user_id/);
    assert.deepEqual(predicate.params, ["reader"]);
  }
});
