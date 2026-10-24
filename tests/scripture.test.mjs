import assert from "node:assert/strict";
import test from "node:test";
import { createLoader } from "./helpers.mjs";

function setup(fetch) { return createLoader({ globals: { fetch } }).load("src/lib/scripture.ts"); }
const response = verses => ({ ok: true, status: 200, json: async () => ({ verses }) });

test("all single-chapter books explicitly request the full chapter", async () => {
  const urls = [];
  const scripture = setup(async url => { urls.push(url); return response([{ verse: 1, text: "First" }, { verse: 2, text: "Second" }]); });
  for (const book of ["Jude", "Obadiah", "Philemon", "2 John", "3 John"]) {
    assert.equal((await scripture.fetchChapterVerses(book, 1, "kjv")).length, 2);
  }
  assert.equal(urls.length, 5);
  assert.ok(urls.every(url => new URL(url).searchParams.get("single_chapter_book_matching") === "indifferent"));
});

test("range lookups use one chapter request and refuse an incomplete passage", async () => {
  let requests = 0;
  // Bolls returns an array, unlike the public-domain provider.
  const bolls = setup(async () => { requests++; return { ok: true, json: async () => [{ verse: 16, text: "Sixteen" }, { verse: 18, text: "Eighteen" }] }; });
  await assert.rejects(bolls.fetchVerse("John 3:16-18", "esv"), /17.*unavailable/);
  assert.equal(requests, 1);
  assert.equal(await bolls.fetchVerse("John 3:16,18", "esv"), "Sixteen\nEighteen");
  assert.equal(requests, 1);
});

test("formatting preserves word boundaries, poetry, entities and capitalization", () => {
  const { scriptureText } = setup();
  assert.equal(scriptureText("<p>First<br>second &amp; third</p><p>O LORD, <i>McExample</i> &ldquo;word&rdquo; &#x1F54A;</p><sup>a</sup><S>123</S>"), "First\nsecond & third\n\nO LORD, McExample “word” 🕊");
  assert.equal(scriptureText("<script>bad()</script>Safe<style>bad</style> text"), "Safe text");
  assert.equal(scriptureText("Psalm 43 is mentioned here."), "Psalm 43 is mentioned here.");
});

test("chapter requests deduplicate in flight and return independent cached copies", async () => {
  let requests = 0, resolve;
  const scripture = setup(() => { requests++; return new Promise(done => { resolve = done; }); });
  const first = scripture.fetchChapterVerses("John", 3, "kjv");
  const second = scripture.fetchChapterVerses("John", 3, "kjv");
  resolve(response([{ verse: 1, text: "Original" }]));
  const [a, b] = await Promise.all([first, second]);
  a[0].text = "Changed";
  assert.equal(b[0].text, "Original");
  assert.equal((await scripture.fetchChapterVerses("John", 3, "kjv"))[0].text, "Original");
  assert.equal(requests, 1);
});

test("invalid references and versions never silently fall back to KJV", async () => {
  let requests = 0;
  const scripture = setup(async () => { requests++; });
  for (const args of [["John", 22, "kjv"], ["unknown", 1, "kjv"], ["John", 3, "bad"], ["John", -1, "esv"]]) await assert.rejects(scripture.fetchChapterVerses(...args));
  assert.equal(requests, 0);
});

test("service failures are retryable and malformed verse responses are rejected", async () => {
  let requests = 0;
  const scripture = setup(async () => ++requests === 1 ? { status: 429, ok: false } : response([{ verse: 1, text: "Recovered" }]));
  await assert.rejects(scripture.fetchChapterVerses("John", 3, "kjv"), /busy/);
  assert.equal((await scripture.fetchChapterVerses("John", 3, "kjv"))[0].text, "Recovered");
  const malformed = setup(async () => response([{ verse: 1, text: "One" }, { verse: 1, text: "Duplicate" }]));
  await assert.rejects(malformed.fetchChapterVerses("John", 3, "kjv"), /unreadable/);
});
