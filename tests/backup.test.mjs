import assert from "node:assert/strict";
import test from "node:test";
import { createLoader, createStore, entry } from "./helpers.mjs";

const backup = data => JSON.stringify({ version: "1.0", timestamp: new Date().toISOString(), data });

test("a malformed backup leaves existing storage untouched", async () => {
  const { store, storage } = createStore();
  storage.setItem("rope_translation", "kjv");
  const result = await store.importData(backup({ rope_translation: "esv", rope_entries: JSON.stringify([{ id: "incomplete" }]) }));
  assert.equal(result.success, false);
  assert.equal(storage.getItem("rope_translation"), "kjv");
});

test("backups cannot set internal sync flags or arbitrary browser data", async () => {
  const { store, storage } = createStore();
  const result = await store.importData(backup({ rope_full_db_synced: "true" }));
  assert.equal(result.success, false);
  assert.equal(storage.getItem("rope_full_db_synced"), null);
});

test("restoring an older backup keeps newer edits and updates IndexedDB", async () => {
  const harness = createStore();
  const current = entry({ observation: "Newer edit" });
  harness.storage.setItem("rope_entries", JSON.stringify([current]));
  const result = await harness.store.importData(backup({ rope_entries: JSON.stringify([entry(), entry({ id: "entry-2" })]) }), "reader");
  assert.equal(result.success, true);
  assert.equal(harness.indexedEntries.length, 2);
  assert.equal(harness.store.getRopeEntries("reader").find(item => item.id === "entry-1").observation, "Newer edit");
});

test("importing another account's entries is repeatable and updates ownership", async () => {
  const { store } = createStore();
  const json = backup({ rope_entries: JSON.stringify([entry()]) });
  await store.importData(json, "new-reader");
  await store.importData(json, "new-reader");
  assert.equal(store.getRopeEntries("new-reader").length, 1);
  assert.equal(store.getRopeEntries("reader").length, 0);
});

test("signed-in restores wait for cloud synchronization before reporting success", async () => {
  const { store, actions } = createStore();
  let complete;
  actions.syncEntries = () => new Promise(resolve => { complete = resolve; });
  let finished = false;
  const task = store.importData(backup({ rope_entries: JSON.stringify([entry()]) }), "reader", true).then(result => { finished = true; return result; });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(finished, false);
  complete(true);
  assert.equal((await task).success, true);
});

test("failed cloud restores keep the locally recovered writing", async () => {
  const { store, actions, storage } = createStore();
  actions.syncEntries = async () => { throw new Error("Offline"); };
  const result = await store.importData(backup({ rope_entries: JSON.stringify([entry()]) }), "reader", true);
  assert.equal(result.success, false);
  assert.equal(JSON.parse(storage.getItem("rope_entries"))[0].observation, entry().observation);
});

test("exports include the loaded cloud journal rather than stale localStorage", async () => {
  const { store, actions, storage } = createStore();
  actions.getDbEntries = async () => [entry({ observation: "Cloud writing" })];
  await store.initializeStore(true);
  storage.setItem("rope_entries", "[]");
  const exported = JSON.parse(store.exportData());
  assert.equal(JSON.parse(exported.data.rope_entries)[0].observation, "Cloud writing");
  assert.ok(exported.data.rope_plan_history);
  assert.ok(exported.data.rope_bible_history);
});

test("highlight notes and gratitude references survive validation", () => {
  const { load } = createLoader();
  const { BibleHighlightSchema, GratitudeItemSchema } = load("src/lib/validations.ts");
  assert.equal(BibleHighlightSchema.parse({ book: "John", chapter: 3, verse: 16, color: "gold", note: "A reminder", createdAt: new Date().toISOString() }).note, "A reminder");
  assert.equal(GratitudeItemSchema.parse({ id: "g1", text: "Family", verse: "Psalm 100:4", createdAt: new Date().toISOString() }).verse, "Psalm 100:4");
  assert.equal(GratitudeItemSchema.safeParse({ id: "g1", text: "Family", createdAt: "invalid" }).success, false);
});

test("an interrupted initial cloud migration remains eligible for retry", async () => {
  const { store, actions, storage } = createStore();
  actions.syncPrayers = async () => { throw new Error("Connection lost"); };
  await store.initializeStore(true);
  assert.equal(storage.getItem("rope_full_db_synced"), null);
  actions.syncPrayers = async () => true;
  await store.initializeStore(true);
  assert.equal(storage.getItem("rope_full_db_synced"), "true");
});

test("prayer and gratitude imports remain repeatable across accounts", async () => {
  const { store } = createStore();
  const json = backup({
    rope_prayers: JSON.stringify([{ id: "p1", text: "A prayer", createdAt: new Date().toISOString() }]),
    rope_gratitude: JSON.stringify([{ id: "g1", text: "Grateful", createdAt: new Date().toISOString() }]),
  });
  await store.importData(json, "new-reader");
  await store.importData(json, "new-reader");
  assert.equal(store.getPrayers().length, 1);
  assert.equal(store.getGratitudeItems().length, 1);
});
