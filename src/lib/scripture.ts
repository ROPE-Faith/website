import { decodeHTML } from "entities";
import { BIBLE_BOOKS, BOOK_CHAPTERS } from "./bible-data";

export const TRANSLATIONS = [
  { id: "kjv", label: "KJV", name: "King James Version", gateway: "KJV" },
  { id: "niv", label: "NIV", name: "New International Version", gateway: "NIV" },
  { id: "esv", label: "ESV", name: "English Standard Version", gateway: "ESV" },
  { id: "nlt", label: "NLT", name: "New Living Translation", gateway: "NLT" },
  { id: "nasb", label: "NASB", name: "New American Standard Bible", gateway: "NASB" },
  { id: "nkjv", label: "NKJV", name: "New King James Version", gateway: "NKJV" },
  { id: "amp", label: "AMP", name: "Amplified Bible", gateway: "AMP" },
  { id: "msg", label: "MSG", name: "The Message", gateway: "MSG" },
  { id: "web", label: "WEB", name: "World English Bible", gateway: "WEB" },
  { id: "bbe", label: "BBE", name: "Bible in Basic English", gateway: "BBE" },
] as const;

export interface VerseData { verse: number; text: string }
export function isTranslation(id: string): boolean { return TRANSLATIONS.some(t => t.id === id); }
export function translationLabel(id?: string | null): string { return TRANSLATIONS.find(t => t.id === id)?.label || "Translation unknown"; }

export function parseVerseRef(ref: string): { bookNum: number; chapter: number; verses: number[] } | null {
  const trimmed = ref.trim();
  if (trimmed.length > 2000) return null;
  const match = trimmed.match(/^(.+?)\s+(\d+)(?:[ :]+(.+))?$/);
  if (!match) return null;
  const bookName = match[1].trim().toLowerCase();
  const chapter = Number(match[2]);
  const bookIndex = BIBLE_BOOKS.findIndex(b => b.name.toLowerCase() === bookName || b.abbrevs.includes(bookName));
  if (bookIndex < 0 || chapter < 1 || chapter > BOOK_CHAPTERS[BIBLE_BOOKS[bookIndex].name]) return null;
  const verses: number[] = [];
  if (match[3]) {
    for (const part of match[3].trim().split(",")) {
      const range = part.trim().match(/^(\d+)(?:\s*[-–]\s*(\d+))?$/);
      if (!range) return null;
      const start = Number(range[1]), end = range[2] ? Number(range[2]) : start;
      if (start < 1 || end < start || end > 176) return null;
      for (let i = start; i <= end; i++) verses.push(i);
    }
  }
  return { bookNum: bookIndex + 1, chapter, verses: [...new Set(verses)].sort((a, b) => a - b) };
}

/** Return plain text only. Keep source line breaks; never guess at or rewrite Scripture words. */
export function scriptureText(html: string): string {
  return decodeHTML(html
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/<s>\s*\d+\s*<\/s>/gi, "")
    .replace(/<sup\b[^>]*>[\s\S]*?<\/sup\s*>/gi, "")
    .replace(/<br\s*\/?\s*>|<\/br\s*>|<\/?(?:p|div|h[1-6])\b[^>]*>/gi, "\n")
    .replace(/<[^>]*>/g, ""))
    .replace(/\r\n?/g, "\n").replace(/[^\S\n]+/g, " ")
    .replace(/ *\n */g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

const publicDomain = new Set(["kjv", "web", "bbe"]);
const chapters = new Map<string, { at: number; verses: VerseData[] }>();
const inFlight = new Map<string, Promise<VerseData[]>>();

async function requestChapter(bookName: string, chapter: number, translation: string): Promise<VerseData[]> {
  const bookNum = BIBLE_BOOKS.findIndex(b => b.name === bookName) + 1;
  const url = publicDomain.has(translation)
    ? `https://bible-api.com/${encodeURIComponent(`${bookName} ${chapter}`)}?translation=${translation}&single_chapter_book_matching=indifferent`
    : `https://bolls.life/get-text/${translation.toUpperCase()}/${bookNum}/${chapter}/`;
  let response: Response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(15000) });
  } catch {
    throw new Error("The passage could not be loaded. Check your connection and try again.");
  }
  if (response.status === 429) throw new Error("The Bible service is busy. Please wait a moment and try again.");
  if (!response.ok) throw new Error(`This chapter is unavailable in ${translationLabel(translation)}. Please try again.`);
  const data = await response.json();
  const source = publicDomain.has(translation) ? data.verses : data;
  if (!Array.isArray(source) || source.length === 0) throw new Error("The Bible service returned an empty chapter. Please try again.");
  const seen = new Set<number>();
  const verses = source.map((v: { verse?: unknown; text?: unknown }) => {
    if (!Number.isInteger(v.verse) || (v.verse as number) < 1 || (v.verse as number) > 176 || typeof v.text !== "string" || seen.has(v.verse as number)) {
      throw new Error("The Bible service returned an unreadable chapter. Please try again.");
    }
    const verse = v.verse as number;
    seen.add(verse);
    return { verse, text: scriptureText(v.text) };
  }).filter(v => v.text.length > 0).sort((a, b) => a.verse - b.verse);
  if (!verses.length) throw new Error("This chapter has no readable text in this translation.");
  return verses;
}

export async function fetchChapterVerses(bookName: string, chapter: number, translation: string): Promise<VerseData[]> {
  if (!isTranslation(translation)) throw new Error("Please choose a supported translation.");
  if (!BOOK_CHAPTERS[bookName] || !Number.isInteger(chapter) || chapter < 1 || chapter > BOOK_CHAPTERS[bookName]) throw new Error("Please choose a valid book and chapter.");
  const key = `${translation}:${bookName}:${chapter}`;
  const cached = chapters.get(key);
  if (cached && Date.now() - cached.at < 30 * 60 * 1000) return cached.verses.map(v => ({ ...v }));
  let promise = inFlight.get(key);
  if (!promise) {
    promise = requestChapter(bookName, chapter, translation).then(verses => {
      if (chapters.size >= 40) chapters.delete(chapters.keys().next().value!);
      chapters.set(key, { at: Date.now(), verses });
      return verses;
    }).finally(() => inFlight.delete(key));
    inFlight.set(key, promise);
  }
  return (await promise).map(v => ({ ...v }));
}

export async function fetchVerse(reference: string, translation: string): Promise<string> {
  const parsed = parseVerseRef(reference);
  if (!parsed) throw new Error("Use a reference such as John 3:16 or Romans 8:28–30.");
  const chapter = await fetchChapterVerses(BIBLE_BOOKS[parsed.bookNum - 1].name, parsed.chapter, translation);
  if (!parsed.verses.length) return chapter.map(v => v.text).join("\n");
  const missing = parsed.verses.filter(number => !chapter.some(v => v.verse === number));
  if (missing.length) throw new Error(`Verse${missing.length > 1 ? "s" : ""} ${missing.join(", ")} ${missing.length > 1 ? "are" : "is"} unavailable in ${translationLabel(translation)}. The passage has not been shortened.`);
  return parsed.verses.map(number => chapter.find(v => v.verse === number)!.text).join("\n");
}
