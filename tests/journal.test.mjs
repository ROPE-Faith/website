import assert from "node:assert/strict";
import test from "node:test";
import { createLoader, createStore, entry, MemoryStorage } from "./helpers.mjs";

test("drafts recover writing from yesterday and do not resurrect after saving", () => {
  const { load, storage } = createLoader();
  const { readJournalDraft, draftKey } = load("src/lib/journal-draft.ts");
  storage.setItem("rope_draft_2026-10-20", JSON.stringify({ observation: "Older draft" }));
  storage.setItem("rope_draft_2026-10-21", JSON.stringify({ observation: "Unfinished thought" }));
  assert.equal(readJournalDraft(storage, "reader").observation, "Unfinished thought");
  storage.removeItem(draftKey("reader"));
  assert.equal(readJournalDraft(storage, "reader"), null);
});

test("drafts are isolated between accounts and malformed fields are ignored", () => {
  const { load, storage } = createLoader();
  const { readJournalDraft, writeJournalDraft, EMPTY_DRAFT, draftKey } = load("src/lib/journal-draft.ts");
  writeJournalDraft(storage, "reader-a", { ...EMPTY_DRAFT, prayer: "Private prayer" });
  assert.equal(readJournalDraft(storage, "reader-b"), null);
  storage.setItem(draftKey("reader-b"), JSON.stringify({ prayer: {}, observation: "Valid writing" }));
  const recovered = readJournalDraft(storage, "reader-b");
  assert.equal(recovered.observation, "Valid writing");
  assert.equal(recovered.prayer, "");
});

test("clearing every field removes the draft", () => {
  const { load, storage } = createLoader();
  const { writeJournalDraft, EMPTY_DRAFT, draftKey } = load("src/lib/journal-draft.ts");
  writeJournalDraft(storage, "reader", { ...EMPTY_DRAFT, prayer: "A prayer" });
  writeJournalDraft(storage, "reader", EMPTY_DRAFT);
  assert.equal(storage.getItem(draftKey("reader")), null);
});

test("check-in lookup and streak count entries for the actual account", () => {
  const { store, storage } = createStore();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  storage.setItem("rope_entries", JSON.stringify([entry({ createdAt: yesterday.toISOString() })]));
  assert.equal(store.getYesterdayEntry("reader")?.id, "entry-1");
  assert.equal(store.getYesterdayEntry("someone-else"), null);
  assert.equal(store.getStreak("reader"), 1);
});

test("book statistics keep numbered Bible book names", () => {
  const { store, storage } = createStore();
  storage.setItem("rope_entries", JSON.stringify([entry(), entry({ id: "2", revelationVerse: "2 Corinthians 5:17" })]));
  assert.deepEqual(Array.from(store.getBookFrequency("reader"), item => item.book).sort(), ["1 John", "2 Corinthians"]);
});

test("reading plans advance once per day without completing tomorrow's reading", () => {
  const { store } = createStore();
  const plan = store.READING_PLANS[0];
  store.startPlan(plan.id);
  const first = store.advancePlan();
  const second = store.advancePlan();
  assert.equal(first.newlyAdvanced, true);
  assert.equal(second.newlyAdvanced, false);
  assert.deepEqual(Array.from(second.progress.completedDays), [0]);
  assert.equal(second.progress.currentDay, 1);
});

test("a paused plan keeps its day and completion untouched", () => {
  const { store } = createStore();
  store.startPlan(store.READING_PLANS[0].id);
  store.pausePlan();
  const result = store.advancePlan();
  assert.equal(result.newlyAdvanced, false);
  assert.equal(result.progress.currentDay, 0);
  assert.equal(result.progress.completedDays.length, 0);
});

test("final reading advances once and preserves completion history", () => {
  const { store, storage } = createStore();
  const plan = store.READING_PLANS[0];
  const progress = store.startPlan(plan.id);
  progress.currentDay = plan.days - 1;
  storage.setItem("rope_active_plan", JSON.stringify(progress));
  const result = store.advancePlan();
  assert.equal(result.progress.isCompleted, true);
  assert.equal(store.getActivePlan(), null);
  assert.equal(store.getPlanHistory().length, 1);
  assert.equal(store.advancePlan().newlyAdvanced, false);
});

test("history searches reflections and combines date and check-in filters", () => {
  const { load } = createLoader();
  const { filterEntries } = load("src/lib/entry-search.ts");
  const date = new Date(2026, 9, 21, 23, 30);
  const entries = [entry({ createdAt: date.toISOString(), executionStatus: "partly", executionReflection: "I called my sister." })];
  assert.equal(filterEntries(entries, "SISTER", "2026-10-21", "partly").length, 1);
  assert.equal(filterEntries(entries, "sister", "2026-10-21", "yes").length, 0);
  assert.equal(filterEntries(entries, "sister", "2026-10-22").length, 0);
});

test("verse references accept ranges and reject malformed or unbounded input", () => {
  const { store } = createStore();
  assert.deepEqual(Array.from(store.parseVerseRef("1 John 3:1-3,2,5").verses), [1, 2, 3, 5]);
  for (const ref of ["John 0:1", "John 22:1", "John 3:0", "John 3:16-no", "John 3:18-16", "John 3:1-999999999", "John 3:abc"]) {
    assert.equal(store.parseVerseRef(ref), null, ref);
  }
});
