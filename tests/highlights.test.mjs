import assert from "node:assert/strict";
import test from "node:test";
import { createLoader, createStore, MemoryStorage } from "./helpers.mjs";

const verses = [{ verse: 16, text: "For God so loved the world" }, { verse: 17, text: "He sent his Son" }, { verse: 18, text: "Whoever believes" }];
function mark(overrides = {}) { return { id: "mark-1", book: "John", chapter: 3, verse: 16, color: "gold", note: "A private thought", createdAt: "2026-10-21T14:00:00.000Z", selection: { translation: "kjv", endVerse: 16, startOffset: 4, endOffset: 7, verses: [verses[0]] }, ...overrides }; }
function setup() {
  const { load } = createLoader();
  return { ...load("src/lib/highlight-model.ts"), ...load("src/lib/highlight-repository.ts"), ...load("src/lib/validations.ts"), ...load("src/lib/highlight-search.ts") };
}

test("phrase highlights preserve exact offsets and apply only to the source version and text", () => {
  const m = setup(), h = mark();
  assert.equal(m.highlightText(h), "God");
  assert.equal(m.highlightApplies(h, "kjv", verses[0]), true);
  assert.equal(m.highlightApplies(h, "esv", verses[0]), false);
  assert.equal(m.highlightApplies(h, "kjv", { verse: 16, text: "Changed text" }), false);
  const segments = m.verseSegments(verses[0], [h], "kjv");
  assert.equal(segments.map(s => s.text).join(""), verses[0].text);
  assert.equal(segments.filter(s => s.highlights.length).map(s => s.text).join(""), "God");
});

test("multi-verse phrases trim only the first and last verses", () => {
  const m = setup();
  const h = mark({ selection: { translation: "kjv", endVerse: 18, startOffset: 4, endOffset: 7, verses } });
  assert.equal(m.highlightText(h), "God so loved the world\nHe sent his Son\nWhoever");
  assert.equal(m.verseSegments(verses[1], [h], "kjv")[0].text, verses[1].text);
  assert.equal(m.passageReference("John", 3, m.highlightRange(h)), "John 3:16–18");
});

test("overlapping marks retain all text and separate identities", () => {
  const m = setup();
  const h = mark();
  const whole = mark({ id: "whole", selection: { translation: "esv", endVerse: 18, startOffset: null, endOffset: null, verses } });
  const segments = m.verseSegments(verses[0], [whole, h], "kjv");
  assert.equal(segments.map(s => s.text).join(""), verses[0].text);
  assert.equal(segments.find(s => s.text === "God").highlights.length, 2);
  assert.equal(m.highlightApplies(whole, "web", verses[2]), true);
});

test("a fresh selection creates a separate mark while explicit reselection adjusts the saved mark", () => {
  const m = setup(), editing = mark();
  const draft = { editing, range: m.highlightRange(editing), color: editing.color, note: editing.note };
  assert.equal(m.newSelectionAction(draft, "new"), "new");
  assert.equal(m.newSelectionAction(draft, "adjust"), "adjust");
  assert.equal(m.newSelectionAction({ ...draft, note: "Unsaved note" }, "new"), "blocked");
  assert.equal(m.newSelectionAction({ ...draft, range: { ...draft.range, endOffset: 12 } }, "new"), "blocked");
  assert.equal(m.newSelectionAction({ ...draft, editing: null }, "new"), "adjust");
});

test("word adjustments use Unicode-safe source offsets", () => {
  const m = setup(), text = "Love 🕊 brings peace.";
  const words = m.wordBounds(text);
  assert.equal(words.map(w => text.slice(w.start, w.end)).join(" "), text);
  assert.equal(words[2].start, 8);
});

test("selection validation rejects inverted, missing, duplicate and out-of-text anchors", () => {
  const { BibleHighlightSchema } = setup();
  assert.ok(BibleHighlightSchema.safeParse(mark()).success);
  for (const overrides of [{ endVerse: 15 }, { startOffset: 8, endOffset: 4 }, { endOffset: 999 }, { startOffset: null }, { verses: [] }, { verses: [verses[0], verses[0]] }]) {
    assert.equal(BibleHighlightSchema.safeParse(mark({ selection: { ...mark().selection, ...overrides } })).success, false);
  }
  assert.equal(BibleHighlightSchema.safeParse(mark({ book: "Unknown" })).success, false);
  assert.equal(BibleHighlightSchema.safeParse(mark({ book: "Jude", chapter: 2 })).success, false);
});

test("recoloring a legacy mark keeps its note, identity and original date", async () => {
  const { store, storage } = createStore();
  const h = mark({ id: undefined, selection: undefined });
  storage.setItem("rope_bible_highlights", JSON.stringify([h]));
  store.addBibleHighlight("John", 3, 16, "blue");
  const saved = store.getBibleHighlights()[0];
  assert.equal(saved.note, h.note);
  assert.equal(saved.createdAt, h.createdAt);
  assert.equal(saved.id, "John_3_16");
  assert.equal(saved.color, "blue");
});

test("notes and multiple phrases on one verse survive backup export and repeat restoration", async () => {
  const { store } = createStore();
  await store.saveBibleHighlight(mark());
  await store.saveBibleHighlight(mark({ id: "second", color: "blue", note: "Another thought" }));
  const backup = store.exportData();
  assert.equal((await store.importData(backup)).success, true);
  assert.equal((await store.importData(backup)).success, true);
  assert.equal(store.getBibleHighlights().length, 2);
  assert.equal(store.getBibleHighlights()[0].selection.startOffset, 4);
  assert.equal(store.getBibleHighlights()[1].note, "Another thought");
});

test("failed cloud writes persist locally and retry after reload", async () => {
  const { HighlightRepository } = setup(), storage = new MemoryStorage();
  const offline = new HighlightRepository(storage, "reader", { save: async () => { throw Error("offline"); }, remove: async () => {} });
  assert.equal(await offline.save(mark()), false);
  assert.equal(offline.get()[0].note, "A private thought");
  assert.equal(offline.pendingCount, 1);
  const writes = [];
  const reloaded = new HighlightRepository(storage, "reader", { save: async h => writes.push(h), remove: async () => {} });
  reloaded.hydrateCloud([]);
  assert.equal(reloaded.get().length, 1);
  assert.equal(await reloaded.flush(), true);
  assert.equal(writes[0].note, "A private thought");
  assert.equal(reloaded.pendingCount, 0);
});

test("deletion removes just one mark and a pending tombstone survives stale cloud loading", async () => {
  const { HighlightRepository } = setup(), storage = new MemoryStorage();
  const repo = new HighlightRepository(storage, "reader", { save: async () => {}, remove: async () => { throw Error("offline"); } });
  await repo.save(mark()); await repo.save(mark({ id: "second" }));
  assert.equal(await repo.remove("mark-1"), false);
  repo.hydrateCloud([mark(), mark({ id: "second" })]);
  assert.equal(repo.get().length, 1);
  assert.equal(repo.get()[0].id, "second");
  await repo.save(mark()); // Undo restores the same identity and its original note.
  assert.equal(repo.get().length, 2);
});

test("concurrent edits serialize and an older response cannot remove a newer pending note", async () => {
  const { HighlightRepository } = setup(), storage = new MemoryStorage();
  let release;
  const writes = [];
  const repo = new HighlightRepository(storage, "reader", { save: async h => { writes.push(h.note); if (writes.length === 1) await new Promise(resolve => { release = resolve; }); }, remove: async () => {} });
  const first = repo.save(mark({ note: "First" }));
  const second = repo.save(mark({ note: "Second" }));
  release();
  await Promise.all([first, second]);
  assert.deepEqual(writes, ["First", "Second"]);
  assert.equal(repo.get()[0].note, "Second");
  assert.equal(repo.pendingCount, 0);
});

test("private highlight collections and pending writes are isolated by account", async () => {
  const { HighlightRepository } = setup(), storage = new MemoryStorage();
  storage.setItem("rope_bible_highlights", JSON.stringify([mark({ id: undefined, selection: undefined })]));
  const first = new HighlightRepository(storage, "reader-a");
  const second = new HighlightRepository(storage, "reader-b");
  assert.equal(first.get().length, 1);
  assert.equal(second.get().length, 0);
  await second.save(mark({ note: "B only" }));
  assert.equal(first.get()[0].note, "A private thought");
});

test("a device storage failure leaves the previous saved note intact", async () => {
  const { HighlightRepository } = setup(), storage = new MemoryStorage();
  const repo = new HighlightRepository(storage, "reader");
  await repo.save(mark());
  const originalWrite = storage.setItem.bind(storage);
  storage.setItem = (key, value) => { if (key === repo.key && value.includes("Unsaved edit")) throw Error("Quota exceeded"); originalWrite(key, value); };
  await assert.rejects(repo.save(mark({ note: "Unsaved edit" })), /Quota/);
  assert.equal(repo.get()[0].note, "A private thought");
});

test("an old account load cannot overwrite the account that became active while it was pending", async () => {
  const { store, storage, actions } = createStore();
  storage.setItem("rope_entries_migrated", "true"); storage.setItem("rope_full_db_synced", "true");
  let release;
  actions.getDbEntries = () => new Promise(resolve => { release = resolve; });
  const first = store.initializeStore(true, "reader-a");
  actions.getDbEntries = async () => [{ id: "b", userId: "reader-b", createdAt: new Date().toISOString() }];
  await store.initializeStore(true, "reader-b");
  release([{ id: "a", userId: "reader-a", createdAt: new Date().toISOString() }]);
  await first;
  assert.equal(store.getRopeEntries("reader-b")[0].id, "b");
  assert.equal(store.getRopeEntries("reader-a").length, 0);
});

test("highlight search combines note, phrase, reference, book and color filters", () => {
  const m = setup();
  const items = [mark(), mark({ id: "second", book: "Psalms", chapter: 23, verse: 1, note: "", color: "blue", selection: null })];
  assert.equal(m.filterHighlights(items, { search: "God thought John", color: "gold", notesOnly: true }).length, 1);
  assert.equal(m.filterHighlights(items, { book: "Psalms", notesOnly: true }).length, 0);
  assert.equal(m.filterHighlights(items, { sort: "bible" })[0].book, "Psalms");
});
