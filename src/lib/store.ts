// ─── Types ───────────────────────────────────────────────────────────────────

export type ExecutionStatus = "yes" | "partly" | "not_yet" | null;

export interface RopeEntry {
  id: string;
  userId: string;
  createdAt: string;
  revelationVerse: string;
  revelationText: string;
  observation: string;
  prayer: string;
  execution: string;
  executionStatus: ExecutionStatus;
  executionReflection: string;
}

// ─── Bible Books ─────────────────────────────────────────────────────────────

export const BIBLE_BOOKS = [
  { name: "Genesis", abbrevs: ["gen", "ge", "gn"] },
  { name: "Exodus", abbrevs: ["exod", "exo", "ex"] },
  { name: "Leviticus", abbrevs: ["lev", "le", "lv"] },
  { name: "Numbers", abbrevs: ["num", "nu", "nm"] },
  { name: "Deuteronomy", abbrevs: ["deut", "de", "dt"] },
  { name: "Joshua", abbrevs: ["josh", "jos", "jsh"] },
  { name: "Judges", abbrevs: ["judg", "jdg", "jg"] },
  { name: "Ruth", abbrevs: ["ruth", "ru", "rth"] },
  { name: "1 Samuel", abbrevs: ["1sam", "1sa", "1 sam"] },
  { name: "2 Samuel", abbrevs: ["2sam", "2sa", "2 sam"] },
  { name: "1 Kings", abbrevs: ["1kgs", "1ki", "1 kings"] },
  { name: "2 Kings", abbrevs: ["2kgs", "2ki", "2 kings"] },
  { name: "1 Chronicles", abbrevs: ["1chr", "1ch", "1 chron"] },
  { name: "2 Chronicles", abbrevs: ["2chr", "2ch", "2 chron"] },
  { name: "Ezra", abbrevs: ["ezra", "ezr"] },
  { name: "Nehemiah", abbrevs: ["neh", "ne"] },
  { name: "Esther", abbrevs: ["esth", "est", "es"] },
  { name: "Job", abbrevs: ["job", "jb"] },
  { name: "Psalms", abbrevs: ["ps", "psa", "psalm"] },
  { name: "Proverbs", abbrevs: ["prov", "pro", "pr"] },
  { name: "Ecclesiastes", abbrevs: ["eccl", "ecc", "ec"] },
  { name: "Song of Solomon", abbrevs: ["song", "sos", "sg"] },
  { name: "Isaiah", abbrevs: ["isa", "is"] },
  { name: "Jeremiah", abbrevs: ["jer", "je"] },
  { name: "Lamentations", abbrevs: ["lam", "la"] },
  { name: "Ezekiel", abbrevs: ["ezek", "eze", "ezk"] },
  { name: "Daniel", abbrevs: ["dan", "da", "dn"] },
  { name: "Hosea", abbrevs: ["hos", "ho"] },
  { name: "Joel", abbrevs: ["joel", "jl"] },
  { name: "Amos", abbrevs: ["amos", "am"] },
  { name: "Obadiah", abbrevs: ["obad", "ob"] },
  { name: "Jonah", abbrevs: ["jonah", "jon"] },
  { name: "Micah", abbrevs: ["mic", "mc"] },
  { name: "Nahum", abbrevs: ["nah", "na"] },
  { name: "Habakkuk", abbrevs: ["hab"] },
  { name: "Zephaniah", abbrevs: ["zeph", "zep"] },
  { name: "Haggai", abbrevs: ["hag", "hg"] },
  { name: "Zechariah", abbrevs: ["zech", "zec"] },
  { name: "Malachi", abbrevs: ["mal", "ml"] },
  { name: "Matthew", abbrevs: ["matt", "mat", "mt"] },
  { name: "Mark", abbrevs: ["mark", "mrk", "mk"] },
  { name: "Luke", abbrevs: ["luke", "luk", "lk"] },
  { name: "John", abbrevs: ["john", "jhn", "jn"] },
  { name: "Acts", abbrevs: ["acts", "act", "ac"] },
  { name: "Romans", abbrevs: ["rom", "ro", "rm"] },
  { name: "1 Corinthians", abbrevs: ["1cor", "1co", "1 cor"] },
  { name: "2 Corinthians", abbrevs: ["2cor", "2co", "2 cor"] },
  { name: "Galatians", abbrevs: ["gal", "ga"] },
  { name: "Ephesians", abbrevs: ["eph", "ep"] },
  { name: "Philippians", abbrevs: ["phil", "php"] },
  { name: "Colossians", abbrevs: ["col", "co"] },
  { name: "1 Thessalonians", abbrevs: ["1thess", "1th", "1 thes"] },
  { name: "2 Thessalonians", abbrevs: ["2thess", "2th", "2 thes"] },
  { name: "1 Timothy", abbrevs: ["1tim", "1ti", "1 tim"] },
  { name: "2 Timothy", abbrevs: ["2tim", "2ti", "2 tim"] },
  { name: "Titus", abbrevs: ["titus", "tit"] },
  { name: "Philemon", abbrevs: ["phlm", "phm"] },
  { name: "Hebrews", abbrevs: ["heb"] },
  { name: "James", abbrevs: ["jas", "jm"] },
  { name: "1 Peter", abbrevs: ["1pet", "1pe", "1 pet"] },
  { name: "2 Peter", abbrevs: ["2pet", "2pe", "2 pet"] },
  { name: "1 John", abbrevs: ["1john", "1jn", "1 john"] },
  { name: "2 John", abbrevs: ["2john", "2jn", "2 john"] },
  { name: "3 John", abbrevs: ["3john", "3jn", "3 john"] },
  { name: "Jude", abbrevs: ["jude", "jud"] },
  { name: "Revelation", abbrevs: ["rev", "re"] },
];

export function suggestBooks(input: string): string[] {
  if (!input.trim()) return [];
  const lower = input.trim().toLowerCase();

  // If input contains a space, the user has already selected a book — don't suggest
  if (lower.includes(" ")) return [];

  // If input has a digit not at start (like "1" for "1 Samuel"), keep suggesting
  const withoutLeadingNum = lower.replace(/^[123]\s*/, "");
  if (/\d/.test(withoutLeadingNum)) return [];

  const matches: string[] = [];

  for (const book of BIBLE_BOOKS) {
    if (matches.length >= 5) break;
    const nameLower = book.name.toLowerCase();
    if (nameLower.startsWith(lower) || nameLower.replace(/\s/g, "").startsWith(lower)) {
      matches.push(book.name);
      continue;
    }
    for (const abbr of book.abbrevs) {
      if (abbr.startsWith(lower) || lower.startsWith(abbr)) {
        matches.push(book.name);
        break;
      }
    }
  }

  return matches;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

function generateAliasNumber(): number {
  const existing = localStorage.getItem("rope_alias_counter");
  const next = existing ? parseInt(existing, 10) + 1 : Math.floor(Math.random() * 90) + 10;
  localStorage.setItem("rope_alias_counter", next.toString());
  return next;
}

function formatLocalDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// ─── Entry Store ──────────────────────────────────────────────────────────

import { migrateFromLocalStorage, loadRopeEntries, saveRopeEntries, deleteRopeEntries } from "./db";
import { 
  getDbEntries, saveDbEntry, deleteDbEntry, syncEntries,
  getDbPrayers, saveDbPrayer, deleteDbPrayer, syncPrayers,
  getDbHighlights, saveDbHighlight, deleteDbHighlight, syncHighlights,
  getDbGratitude, saveDbGratitude, deleteDbGratitude, syncGratitude,
  getDbPlanProgress, saveDbPlanProgress,
  getDbMemoryVerses, saveDbMemoryVerse, deleteDbMemoryVerse, syncMemoryVerses,
  getDbSettings, saveDbSettings, clearAllDbData
} from "./actions";

let cachedEntries: RopeEntry[] | null = null;
let cachedPrayers: PrayerItem[] | null = null;
let cachedHighlights: BibleHighlight[] | null = null;
let cachedGratitude: GratitudeItem[] | null = null;
let cachedPlan: PlanProgress | null = null;
let cachedMemoryVerses: { verse: string; text: string; addedAt: string }[] | null = null;
let cachedSettings: { darkMode: boolean; translation: string; onboardingComplete: boolean; lastRead: any[] } | null = null;
let storeInitialized = false;

/**
 * Initializes the store by loading entries from Postgres (if logged in) or IndexedDB.
 * Falls back to localStorage if IndexedDB is empty/unavailable.
 */
export async function initializeStore(isAuthenticated: boolean = false) {
  if (typeof window === "undefined" || storeInitialized) return;
  
  try {
    if (!localStorage.getItem("rope_entries_migrated")) {
      await migrateFromLocalStorage();
    }
    
    if (isAuthenticated) {
      // 1. Initial Sync if needed
      const needsSync = !localStorage.getItem("rope_full_db_synced");
      if (needsSync) {
        const localEntries = await loadRopeEntries();
        const localPrayers = getPrayers();
        const localGratitude = getGratitudeItems();
        const localHighlights = getBibleHighlights();
        const localMemoryVerses = getMemoryVerses();
        
        await Promise.all([
          syncEntries(localEntries).catch(console.error),
          syncPrayers(localPrayers).catch(console.error),
          syncGratitude(localGratitude).catch(console.error),
          syncHighlights(localHighlights).catch(console.error),
          syncMemoryVerses(localMemoryVerses).catch(console.error)
        ]);
        localStorage.setItem("rope_full_db_synced", "true");
      }

      // 2. Load all data from Postgres
      const [entries, prayers, gratitude, highlights, plan, mvs, settings] = await Promise.all([
        getDbEntries(),
        getDbPrayers(),
        getDbGratitude(),
        getDbHighlights(),
        getDbPlanProgress(),
        getDbMemoryVerses(),
        getDbSettings()
      ]);

      cachedEntries = entries;
      cachedPrayers = prayers;
      cachedGratitude = gratitude;
      cachedHighlights = highlights;
      cachedPlan = plan;
      cachedMemoryVerses = mvs;
      cachedSettings = settings || {
        darkMode: getDarkMode(),
        translation: getTranslation(),
        onboardingComplete: hasCompletedOnboarding(),
        lastRead: getBibleHistory()
      };
      // If we got settings from cloud, hydrate local storage
      if (settings) {
        localStorage.setItem("rope_dark_mode", settings.darkMode ? "true" : "false");
        localStorage.setItem("rope_translation", settings.translation);
        localStorage.setItem("rope_onboarding_done", settings.onboardingComplete ? "true" : "false");
        localStorage.setItem("rope_bible_history", JSON.stringify(settings.lastRead));
        // Force theme update
        if (settings.darkMode) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
      }
    } else {
      cachedEntries = await loadRopeEntries();
      cachedPrayers = JSON.parse(localStorage.getItem("rope_prayers") || "[]");
      cachedGratitude = JSON.parse(localStorage.getItem("rope_gratitude") || "[]");
      cachedHighlights = JSON.parse(localStorage.getItem("rope_bible_highlights") || "[]");
      cachedPlan = JSON.parse(localStorage.getItem("rope_active_plan") || "null");
      cachedMemoryVerses = JSON.parse(localStorage.getItem("rope_memory_verses") || "[]");
      cachedSettings = {
        darkMode: getDarkMode(),
        translation: getTranslation(),
        onboardingComplete: hasCompletedOnboarding(),
        lastRead: getBibleHistory()
      };
    }

    storeInitialized = true;
  } catch (e) {
    console.error("Store initialization failed", e);
  }
}

export function getRopeEntries(userId?: string): RopeEntry[] {
  if (typeof window === "undefined") return [];

  let entries: RopeEntry[] = [];
  
  if (storeInitialized && cachedEntries) {
    entries = cachedEntries;
  } else {
    // Fallback until initialized
    const raw = localStorage.getItem("rope_entries");
    if (raw) {
      try {
        entries = JSON.parse(raw);
      } catch (e) {
        entries = [];
      }
    }
  }

  const sorted = [...entries].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return userId ? sorted.filter((e) => e.userId === userId) : sorted;
}

export function clearCache(): void {
  cachedEntries = null;
}

export function addRopeEntry(
  entry: Omit<RopeEntry, "id" | "createdAt" | "executionStatus" | "executionReflection">,
  isAuthenticated: boolean = false
): RopeEntry {
  const newEntry: RopeEntry = {
    ...entry,
    id: generateId(),
    createdAt: new Date().toISOString(),
    executionStatus: null,
    executionReflection: "",
  };
  
  const existing = getRopeEntries();
  const updated = [newEntry, ...existing];
  
  // Sync to memory
  cachedEntries = updated;
  
  // Async save to IndexedDB & Cloud
  if (typeof window !== "undefined") {
    saveRopeEntries(updated).catch(console.error);
    localStorage.setItem("rope_entries", JSON.stringify(updated));
    
    if (isAuthenticated) {
      saveDbEntry(newEntry).catch(console.error);
    }
  }

  return newEntry;
}

export function updateRopeEntry(
  id: string, 
  updates: Partial<RopeEntry>,
  isAuthenticated: boolean = false
): RopeEntry | null {
  const entries = getRopeEntries();
  const index = entries.findIndex((e) => e.id === id);
  if (index === -1) return null;
  
  entries[index] = { ...entries[index], ...updates };
  cachedEntries = entries;
  
  if (typeof window !== "undefined") {
    saveRopeEntries(entries).catch(console.error);
    localStorage.setItem("rope_entries", JSON.stringify(entries));
    
    if (isAuthenticated) {
      saveDbEntry(entries[index]).catch(console.error);
    }
  }
  
  return entries[index];
}

export function getYesterdayEntry(userId: string): RopeEntry | null {
  const entries = getRopeEntries(userId);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = formatLocalDate(yesterday);

  return (
    entries.find((e) => {
      const d = new Date(e.createdAt);
      return formatLocalDate(d) === yStr;
    }) ?? null
  );
}

export function deleteRopeEntry(id: string, isAuthenticated: boolean = false): boolean {
  const entries = getRopeEntries();
  const filtered = entries.filter((e) => e.id !== id);
  if (filtered.length === entries.length) return false;
  
  cachedEntries = filtered;
  
  if (typeof window !== "undefined") {
    saveRopeEntries(filtered).catch(console.error);
    localStorage.setItem("rope_entries", JSON.stringify(filtered));
    
    if (isAuthenticated) {
      deleteDbEntry(id).catch(console.error);
    }
  }
  
  return true;
}

export function hasPendingCheckin(userId: string): boolean {
  const entry = getYesterdayEntry(userId);
  if (!entry) return false;
  return entry.executionStatus === null;
}

// ─── Analytics Helpers ───────────────────────────────────────────────────────

export function getStreak(userId: string): number {
  const entries = getRopeEntries(userId);
  if (entries.length === 0) return 0;

  // Get unique LOCAL dates as 'YYYY-MM-DD'
  const dateSet = new Set(entries.map((e) => formatLocalDate(new Date(e.createdAt))));
  
  let streak = 0;
  let curr = new Date(); // Start at today
  
  // Check if there's an entry today
  if (dateSet.has(formatLocalDate(curr))) {
    streak++;
    curr.setDate(curr.getDate() - 1); // Move to yesterday
  } else {
    // If no entry today, check if there was one yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (dateSet.has(formatLocalDate(yesterday))) {
      streak = 0; // Streak hasn't started yet today, but yesterday was active
      curr = yesterday;
    } else {
      return 0; // No entry today or yesterday
    }
  }

  // Count backwards
  while (dateSet.has(formatLocalDate(curr))) {
    streak++;
    curr.setDate(curr.getDate() - 1);
  }

  return streak;
}

export function getBookFrequency(userId: string): { book: string; count: number }[] {
  const entries = getRopeEntries(userId);
  const freq: Record<string, number> = {};

  for (const entry of entries) {
    const verse = entry.revelationVerse.trim();
    // Extract book name: everything before the first digit that follows a space
    const match = verse.match(/^(.+?)\s*\d/);
    const book = match ? match[1].trim() : verse;
    if (book) {
      freq[book] = (freq[book] || 0) + 1;
    }
  }

  return Object.entries(freq)
    .map(([book, count]) => ({ book, count }))
    .sort((a, b) => b.count - a.count);
}

export function getExecutionRate(userId: string): number {
  const entries = getRopeEntries(userId);
  const withStatus = entries.filter((e) => e.executionStatus !== null);
  if (withStatus.length === 0) return 0;
  const yesCount = withStatus.filter((e) => e.executionStatus === "yes").length;
  return Math.round((yesCount / withStatus.length) * 100);
}

export function getMostCommonBook(userId: string): string | null {
  const freq = getBookFrequency(userId);
  return freq.length > 0 ? freq[0].book : null;
}

// ─── Extended Analytics ─────────────────────────────────────────────────────

/** Get ROPE balance — how much the user writes in each section */
export function getRopeBalance(userId: string): { r: number; o: number; p: number; e: number } {
  const entries = getRopeEntries(userId);
  if (entries.length === 0) return { r: 0, o: 0, p: 0, e: 0 };
  let rTotal = 0, oTotal = 0, pTotal = 0, eTotal = 0;
  for (const entry of entries) {
    rTotal += (entry.revelationText || entry.revelationVerse).split(/\s+/).length;
    oTotal += entry.observation.split(/\s+/).length;
    pTotal += entry.prayer.split(/\s+/).length;
    eTotal += entry.execution.split(/\s+/).length;
  }
  const sum = rTotal + oTotal + pTotal + eTotal || 1;
  return {
    r: Math.round((rTotal / sum) * 100),
    o: Math.round((oTotal / sum) * 100),
    p: Math.round((pTotal / sum) * 100),
    e: Math.round((eTotal / sum) * 100),
  };
}

/** Get the most recent verse reference */
export function getLastVerse(userId: string): string | null {
  const entries = getRopeEntries(userId);
  return entries.length > 0 ? entries[0].revelationVerse : null;
}

/** Get total unique books studied */
export function getUniqueBooksCount(userId: string): number {
  const freq = getBookFrequency(userId);
  return freq.length;
}

// ─── Bible Translations ─────────────────────────────────────────────────────

// bible-api.com translations (free, no API key)
const BIBLE_API_TRANSLATIONS = new Set(["kjv", "web", "bbe"]);

const TRANSLATIONS = [
  { id: "kjv", label: "KJV", gateway: "KJV" },
  { id: "niv", label: "NIV", gateway: "NIV" },
  { id: "esv", label: "ESV", gateway: "ESV" },
  { id: "nlt", label: "NLT", gateway: "NLT" },
  { id: "nasb", label: "NASB", gateway: "NASB" },
  { id: "nkjv", label: "NKJV", gateway: "NKJV" },
  { id: "amp", label: "AMP", gateway: "AMP" },
  { id: "msg", label: "MSG", gateway: "MSG" },
  { id: "web", label: "WEB", gateway: "WEB" },
  { id: "bbe", label: "BBE", gateway: "BBE" },
];

// bolls.life translation ID mapping (their API uses numeric IDs)
const BOLLS_TRANSLATION_MAP: Record<string, string> = {
  kjv: "KJV",
  niv: "NIV",
  esv: "ESV",
  nlt: "NLT",
  nasb: "NASB",
  nkjv: "NKJV",
  amp: "AMP",
  msg: "MSG",
  web: "WEB",
  bbe: "BBE",
};

/**
 * Parse a verse reference into book + chapter + verse(s) for the bolls.life API.
 * Supports: "John 3:16", "John 3:16-18", "John 3:16,18", "John 3"
 * Returns { bookNum, chapter, verses: number[] } or null.
 */
export function parseVerseRef(ref: string): { bookNum: number; chapter: number; verses: number[] } | null {
  const trimmed = ref.trim();
  // Match: "Book Chapter:VerseStuff" or "Book Chapter VerseStuff" (space/colon/comma)
  const match = trimmed.match(/^(.+?)\s+(\d+)(?:[ :]+(.+))?$/);
  if (!match) return null;

  const bookName = match[1].trim().toLowerCase();
  const chapter = parseInt(match[2]);
  const verseStuff = match[3] ? match[3].trim() : "";

  // Map book name to bolls.life book number (1-66)
  const bookIndex = BIBLE_BOOKS.findIndex(b => {
    const nameLower = b.name.toLowerCase();
    return nameLower === bookName || b.abbrevs.some(a => a === bookName);
  });

  if (bookIndex === -1) return null;

  const verses: number[] = [];
  if (verseStuff) {
    // Parse complex ranges like "1-3,5,7-9"
    const parts = verseStuff.split(",");
    for (const part of parts) {
      if (part.includes("-")) {
        const [start, end] = part.split("-").map(v => parseInt(v.trim()));
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = start; i <= end; i++) verses.push(i);
        }
      } else {
        const v = parseInt(part.trim());
        if (!isNaN(v)) verses.push(v);
      }
    }
  }

  return { bookNum: bookIndex + 1, chapter, verses };
}

/**
 * Fetch a verse from the appropriate API based on translation.
 * Uses bible-api.com for KJV/WEB/BBE, bolls.life for all others.
 */
export async function fetchVerse(verseRef: string, translationId: string): Promise<string> {
  try {
    if (BIBLE_API_TRANSLATIONS.has(translationId)) {
      // Use bible-api.com
      const res = await fetch(`https://bible-api.com/${encodeURIComponent(verseRef)}?translation=${translationId}`);
      if (!res.ok) throw new Error(`Reference "${verseRef}" not found in ${translationId.toUpperCase()}.`);
      const data = await res.json();
      if (data.text) return data.text.trim();
      throw new Error("No text found for this reference.");
    }

  // Use bolls.life for NIV, ESV, NLT, NASB, NKJV, AMP, MSG
  const bollsId = BOLLS_TRANSLATION_MAP[translationId];
  if (!bollsId) throw new Error(`Translation ${translationId} not supported`);

  const parsed = parseVerseRef(verseRef);
  if (!parsed) throw new Error("Could not parse verse reference");

  const { bookNum, chapter, verses } = parsed;

  if (verses.length > 0) {
    // Fetch specific verse(s)
    const promises = verses.map(v => 
      fetch(`https://bolls.life/get-verse/${bollsId}/${bookNum}/${chapter}/${v}/`)
        .then(async r => {
          if (!r.ok) return { verse: v, text: "" };
          const d = await r.json();
          // Clean text and handle clumping
          let clean = (d.text || "").replace(/<[^>]*>/g, "").trim();
          // Fix [a-z][A-Z] clumping (section headers)
          clean = clean.replace(/([a-z])([A-Z])/g, '$1 $2');
          return { verse: v, text: clean };
        })
    );
    
    const results = await Promise.all(promises);
    const combined = results
      .filter(r => r.text)
      .sort((a, b) => a.verse - b.verse)
      .map(r => r.text)
      .join(" ");
      
    if (!combined) throw new Error("No text returned for these verses");
    return combined;
  }

  // Whole chapter — fetch chapter text
  const url = `https://bolls.life/get-chapter/${bollsId}/${bookNum}/${chapter}/`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Chapter not found");
  const data = await res.json();
  if (Array.isArray(data)) {
    const combined = data.map((v: { text: string }) => (v.text || "").replace(/<[^>]*>/g, "").trim()).join(" ");
    if (!combined) throw new Error("No text returned");
    return combined;
  }
    throw new Error("Unexpected response format from Bible API.");
  } catch (err: any) {
    if (err instanceof Error && err.message.includes("Failed to fetch")) {
      throw new Error("Connection failed. Please check your internet.");
    }
    throw err;
  }
}

export function getTranslation(): string {
  if (typeof window === "undefined") return "kjv";
  if (storeInitialized && cachedSettings) return cachedSettings.translation;
  const saved = localStorage.getItem("rope_translation") || "kjv";
  if (!TRANSLATIONS.some(t => t.id === saved)) return "kjv";
  return saved;
}

export function getGatewayVersion(translationId: string): string {
  const t = TRANSLATIONS.find(t => t.id === translationId);
  return t?.gateway || "KJV";
}

export function setTranslation(t: string): void {
  if (storeInitialized && cachedSettings) cachedSettings.translation = t;
  localStorage.setItem("rope_translation", t);
  saveSettings();
}

export { TRANSLATIONS };

/**
 * Fetch a full chapter as individual verses.
 * Uses bible-api.com for KJV/WEB/BBE, bolls.life for all others.
 */
export async function fetchChapterVerses(bookName: string, chapter: number, translationId: string): Promise<{ verse: number; text: string }[]> {
  if (BIBLE_API_TRANSLATIONS.has(translationId)) {
    // Use bible-api.com for chapter fetch
    const res = await fetch(`https://bible-api.com/${encodeURIComponent(bookName + ' ' + chapter)}?translation=${translationId}`);
    if (!res.ok) throw new Error("Chapter not found");
    const data = await res.json();
    if (!data.verses || !Array.isArray(data.verses)) throw new Error("Unexpected response");
    
    return data.verses.map((v: { verse: number; text: string }) => ({
      verse: v.verse,
      text: (v.text || "").replace(/([a-z])([A-Z])/g, '$1 $2').trim(),
    }));
  }

  // Use bolls.life translation name
  const BOLLS_NAMES: Record<string, string> = {
    kjv: "KJV", niv: "NIV", esv: "ESV", nlt: "NLT", nasb: "NASB",
    nkjv: "NKJV", amp: "AMP", msg: "MSG", web: "WEB", bbe: "BBE",
  };
  const bollsName = BOLLS_NAMES[translationId] || "KJV";

  const bookIndex = BIBLE_BOOKS.findIndex(b => b.name.toLowerCase() === bookName.toLowerCase());
  if (bookIndex === -1) throw new Error(`Book not found: ${bookName}`);
  const bookNum = bookIndex + 1;

  const url = `https://bolls.life/get-text/${bollsName}/${bookNum}/${chapter}/`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Chapter not found");
  const data = await res.json();

  if (!Array.isArray(data)) throw new Error("Unexpected response");

  // Advanced cleaning for bolls.life metadata/headers
  // often returns headers like "Psalm 43" or "BOOK I" in the first verse
  return data.map((v: { verse: number; text: string }) => {
    let cleanText = (v.text || "")
      .replace(/<S>\d+<\/S>/g, "")
      .replace(/<[^>]*>/g, "")
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .trim();

    if (v.verse === 1) {
      // Remove leading Psalm/Book headers if they clump into verse 1
      // e.g. "Psalm 43Vindicate me" -> "Vindicate me"
      const psalmMatch = cleanText.match(new RegExp(`^Psalm\\s*\\d+\\s*`, 'i'));
      if (psalmMatch) cleanText = cleanText.substring(psalmMatch[0].length).trim();
      
      const bookMatch = cleanText.match(/^BOOK\s+[IVXLCDM]+\s*/i);
      if (bookMatch) cleanText = cleanText.substring(bookMatch[0].length).trim();

      // Remove specific clumping like "Psalms 1–41Psalm 1"
      const multiMatch = cleanText.match(/^[A-Za-z]+\s+\d+[-–]\d+[A-Za-z]+\s+\d+/i);
      if (multiMatch) cleanText = cleanText.substring(multiMatch[0].length).trim();

      // Remove Hebrew letter headers for Psalm 119
      if (bookName.toLowerCase() === 'psalms' && chapter === 119) {
        cleanText = cleanText.replace(/^[א-ת]\s+\w+\s+/i, "").trim();
      }
    }

    return {
      verse: v.verse,
      text: cleanText,
    };
  }).filter((v: { text: string }) => v.text.length > 0);
}

// ─── Bible History ──────────────────────────────────────────────────────────

export interface BibleHistoryItem {
  book: string;
  chapter: number;
  lastRead: string; // ISO date
}

export function getBibleHistory(): BibleHistoryItem[] {
  if (typeof window === "undefined") return [];
  if (storeInitialized && cachedSettings) return cachedSettings.lastRead;
  const raw = localStorage.getItem("rope_bible_history");
  if (!raw) return [];
  try {
    return (JSON.parse(raw) as BibleHistoryItem[]).sort((a, b) => 
      new Date(b.lastRead).getTime() - new Date(a.lastRead).getTime()
    );
  } catch {
    return [];
  }
}

export function updateBibleHistory(book: string, chapter: number): void {
  const history = getBibleHistory();
  const existing = history.filter(h => !(h.book === book && h.chapter === chapter));
  existing.unshift({ book, chapter, lastRead: new Date().toISOString() });
  const final = existing.slice(0, 5);
  if (storeInitialized && cachedSettings) cachedSettings.lastRead = final;
  localStorage.setItem("rope_bible_history", JSON.stringify(final));
  saveSettings();
}

// ─── Dark Mode ──────────────────────────────────────────────────────────────

export function getDarkMode(): boolean {
  if (typeof window === "undefined") return false;
  if (storeInitialized && cachedSettings) return cachedSettings.darkMode;
  const saved = localStorage.getItem("rope_dark_mode");
  if (saved !== null) return saved === "true";
  // Auto-detect system preference
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
}

export function setDarkMode(dark: boolean): void {
  if (storeInitialized && cachedSettings) cachedSettings.darkMode = dark;
  localStorage.setItem("rope_dark_mode", dark ? "true" : "false");
  saveSettings();
}

// ─── Onboarding ─────────────────────────────────────────────────────────────

export function hasCompletedOnboarding(): boolean {
  if (typeof window === "undefined") return true;
  if (storeInitialized && cachedSettings) return cachedSettings.onboardingComplete;
  return localStorage.getItem("rope_onboarding_done") === "true";
}

export function completeOnboarding(): void {
  if (storeInitialized && cachedSettings) cachedSettings.onboardingComplete = true;
  localStorage.setItem("rope_onboarding_done", "true");
  saveSettings();
}

export function resetOnboarding(): void {
  if (storeInitialized && cachedSettings) cachedSettings.onboardingComplete = false;
  localStorage.removeItem("rope_onboarding_done");
  saveSettings();
}

/** Internal helper to background-sync settings */
function saveSettings() {
  if (!storeInitialized || !cachedSettings) return;
  saveDbSettings(cachedSettings).catch(console.error);
}

// ─── Reading Plans ──────────────────────────────────────────────────────────

export interface ReadingPlan {
  id: string;
  title: string;
  description: string;
  days: number;
  verses: string[];
}

export const READING_PLANS: ReadingPlan[] = [
  {
    id: "faith-7",
    title: "7 Days on Faith",
    description: "Strengthen your foundation of belief",
    days: 7,
    verses: ["Hebrews 11:1", "Romans 10:17", "James 2:17", "Mark 11:22-24", "2 Corinthians 5:7", "Ephesians 2:8-9", "Hebrews 11:6"],
  },
  {
    id: "peace-21",
    title: "21 Days: Anxiety to Peace",
    description: "Replace worry with God's peace",
    days: 21,
    verses: [
      "Philippians 4:6-7", "Isaiah 41:10", "Psalm 23:1-4", "Matthew 6:25-27", "John 14:27",
      "Psalm 46:10", "Isaiah 26:3", "Romans 8:28", "1 Peter 5:7", "Psalm 55:22",
      "Matthew 11:28-30", "Psalm 94:19", "2 Timothy 1:7", "Psalm 27:1", "Isaiah 43:1-2",
      "Psalm 34:4", "Proverbs 3:5-6", "Jeremiah 29:11", "Romans 15:13", "Psalm 121:1-2",
      "Lamentations 3:22-23",
    ],
  },
  {
    id: "proverbs-30",
    title: "30 Days in Proverbs",
    description: "One chapter of wisdom per day",
    days: 30,
    verses: Array.from({ length: 30 }, (_, i) => `Proverbs ${i + 1}`),
  },
  {
    id: "john-14",
    title: "The Gospel of John in 14 Days",
    description: "Walk through Jesus' story",
    days: 14,
    verses: [
      "John 1:1-18", "John 2:1-25", "John 3:1-21", "John 4:1-42", "John 5:1-30",
      "John 6:1-40", "John 8:1-32", "John 9:1-41", "John 10:1-30", "John 11:1-44",
      "John 13:1-17", "John 14:1-27", "John 15:1-17", "John 17:1-26",
    ],
  },
];

export interface PlanProgress {
  planId: string;
  currentDay: number;
  startedAt: string;
  completedDays: number[];
  paused: boolean;
  isCompleted?: boolean;
  completedAt?: string | null;
  lastAdvancedAt?: string | null;
}

export function getActivePlan(): PlanProgress | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("rope_active_plan");
  if (!raw) return null;
  try { 
    const p = JSON.parse(raw);
    if (p.isCompleted) return null; 
    return p;
  } catch { return null; }
}

export function getPlanHistory(): PlanProgress[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem("rope_plan_history");
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

function addToPlanHistory(progress: PlanProgress) {
  const history = getPlanHistory();
  // Avoid duplicates
  if (!history.some(h => h.planId === progress.planId && h.startedAt === progress.startedAt)) {
    history.unshift(progress);
    localStorage.setItem("rope_plan_history", JSON.stringify(history.slice(0, 50)));
  }
}

export function startPlan(planId: string): PlanProgress {
  const progress: PlanProgress = {
    planId,
    currentDay: 0,
    startedAt: new Date().toISOString(),
    completedDays: [],
    paused: false,
  };
  if (storeInitialized) cachedPlan = progress;
  localStorage.setItem("rope_active_plan", JSON.stringify(progress));
  saveDbPlanProgress(progress).catch(console.error);
  return progress;
}

export function advancePlan(): { progress: PlanProgress | null; newlyAdvanced: boolean } {
  const progress = getActivePlan();
  if (!progress) return { progress: null, newlyAdvanced: false };
  const plan = READING_PLANS.find(p => p.id === progress.planId);
  if (!plan) return { progress, newlyAdvanced: false };

  // Add the current day to completed list if not already there
  if (!progress.completedDays.includes(progress.currentDay)) {
    progress.completedDays.push(progress.currentDay);
  }

  const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD
  const alreadyAdvancedToday = progress.lastAdvancedAt === today;
  let newlyAdvanced = false;

  if (!alreadyAdvancedToday) {
    if (progress.currentDay < plan.days - 1) {
      progress.currentDay++;
      progress.lastAdvancedAt = today;
      newlyAdvanced = true;
    } else {
      // Completion Logic
      progress.isCompleted = true;
      progress.completedAt = new Date().toISOString();
      progress.lastAdvancedAt = today;
      newlyAdvanced = true;
      addToPlanHistory(progress);
      // We keep the object in 'rope_active_plan' but it will be filtered out by getActivePlan()
      // This allows the UI to still "see" the final state for the celebration modal
    }
  }

  if (storeInitialized) cachedPlan = progress;
  localStorage.setItem("rope_active_plan", JSON.stringify(progress));
  saveDbPlanProgress(progress).catch(console.error);
  
  return { progress, newlyAdvanced };
}

export function pausePlan(): void {
  const progress = getActivePlan();
  if (!progress) return;
  progress.paused = !progress.paused;
  if (storeInitialized) cachedPlan = progress;
  localStorage.setItem("rope_active_plan", JSON.stringify(progress));
  saveDbPlanProgress(progress).catch(console.error);
}

export function quitPlan(): void {
  if (storeInitialized) cachedPlan = null;
  localStorage.removeItem("rope_active_plan");
  // We don't delete from DB, just null it out or we could add a 'delete' action
  // For now, removing local is enough to stop the UI from showing it.
}

export function isPlanAdvancedToday(): boolean {
  const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD
  
  // Check active plan
  const active = getActivePlan();
  if (active && active.lastAdvancedAt === today) return true;

  // Check history (for just-completed plans)
  const history = getPlanHistory();
  if (history.length > 0 && history[0].lastAdvancedAt === today) return true;

  return false;
}

export function getPlanSuggestedVerse(): string | null {
  const progress = getActivePlan();
  if (!progress || progress.paused) return null;
  // If already advanced today, don't suggest the next verse yet
  if (isPlanAdvancedToday()) return null;
  
  const plan = READING_PLANS.find(p => p.id === progress.planId);
  if (!plan) return null;
  return plan.verses[progress.currentDay] || null;
}

// ─── Milestones ─────────────────────────────────────────────────────────────

const MILESTONES = [
  { days: 3, title: "First Steps", verse: "The journey of faith begins with a single step.", ref: "Proverbs 4:12" },
  { days: 7, title: "One Week Strong", verse: "Be steadfast, immovable, always abounding in the work of the Lord.", ref: "1 Corinthians 15:58" },
  { days: 14, title: "Two Weeks of Faithfulness", verse: "His mercies are new every morning; great is your faithfulness.", ref: "Lamentations 3:23" },
  { days: 21, title: "Habit Formed", verse: "Let us not become weary in doing good, for at the proper time we will reap a harvest.", ref: "Galatians 6:9" },
  { days: 30, title: "One Month of Walking", verse: "Blessed is the one who perseveres under trial.", ref: "James 1:12" },
  { days: 60, title: "Two Months Deep", verse: "I press on toward the goal to win the prize.", ref: "Philippians 3:14" },
  { days: 100, title: "Century of Faith", verse: "Well done, good and faithful servant.", ref: "Matthew 25:21" },
];

export { MILESTONES };

export function getNextMilestone(streak: number): typeof MILESTONES[0] | null {
  return MILESTONES.find(m => m.days > streak) || null;
}

export function getReachedMilestone(streak: number): typeof MILESTONES[0] | null {
  return MILESTONES.filter(m => m.days === streak)[0] || null;
}

export function getAllReachedMilestones(streak: number): typeof MILESTONES {
  return MILESTONES.filter(m => m.days <= streak);
}

// ─── Prayer Wall ────────────────────────────────────────────────────────────

export interface PrayerItem {
  id: string;
  text: string;
  verse: string;
  createdAt: string;
  answeredAt: string | null;
  answeredNote: string;
  isPublic: boolean;
  publicAt: string | null;
}

export function getPrayers(): PrayerItem[] {
  if (typeof window === "undefined") return [];
  if (storeInitialized && cachedPrayers) return cachedPrayers;
  const raw = localStorage.getItem("rope_prayers");
  if (!raw) return [];
  try { return JSON.parse(raw) as PrayerItem[]; } catch { return []; }
}

export function addPrayer(text: string, verse: string): PrayerItem {
  const prayer: PrayerItem = { id: generateId(), text, verse, createdAt: new Date().toISOString(), answeredAt: null, answeredNote: "", isPublic: false, publicAt: null };
  const prayers = getPrayers();
  prayers.unshift(prayer);
  if (storeInitialized && cachedPrayers) cachedPrayers = prayers;
  localStorage.setItem("rope_prayers", JSON.stringify(prayers));
  saveDbPrayer(prayer).catch(console.error);
  return prayer;
}

export function markPrayerAnswered(id: string, note?: string): void {
  const prayers = getPrayers();
  const idx = prayers.findIndex(p => p.id === id);
  if (idx !== -1) {
    prayers[idx].answeredAt = new Date().toISOString();
    if (note !== undefined) prayers[idx].answeredNote = note;
    if (storeInitialized && cachedPrayers) cachedPrayers = prayers;
    localStorage.setItem("rope_prayers", JSON.stringify(prayers));
    saveDbPrayer(prayers[idx]).catch(console.error);
  }
}

export function setPrayerPublic(id: string, isPublic: boolean): void {
  const prayers = getPrayers();
  const idx = prayers.findIndex(p => p.id === id);
  if (idx !== -1) {
    prayers[idx].isPublic = isPublic;
    prayers[idx].publicAt = isPublic ? new Date().toISOString() : null;
    if (storeInitialized && cachedPrayers) cachedPrayers = prayers;
    localStorage.setItem("rope_prayers", JSON.stringify(prayers));
    saveDbPrayer(prayers[idx]).catch(console.error);
  }
}

export function deletePrayer(id: string): void {
  const prayers = getPrayers().filter(p => p.id !== id);
  if (storeInitialized && cachedPrayers) cachedPrayers = prayers;
  localStorage.setItem("rope_prayers", JSON.stringify(prayers));
  deleteDbPrayer(id).catch(console.error);
}

// ─── Gratitude List ─────────────────────────────────────────────────────────

export interface GratitudeItem {
  id: string;
  text: string;
  verse: string;
  createdAt: string;
}

export function getGratitudeItems(): GratitudeItem[] {
  if (typeof window === "undefined") return [];
  if (storeInitialized && cachedGratitude) return cachedGratitude;
  const raw = localStorage.getItem("rope_gratitude");
  if (!raw) return [];
  try { return JSON.parse(raw) as GratitudeItem[]; } catch { return []; }
}

export function addGratitudeItem(text: string, verse?: string): GratitudeItem {
  const item: GratitudeItem = {
    id: generateId(),
    text,
    verse: verse || "",
    createdAt: new Date().toISOString(),
  };
  const items = getGratitudeItems();
  items.unshift(item);
  if (storeInitialized && cachedGratitude) cachedGratitude = items;
  localStorage.setItem("rope_gratitude", JSON.stringify(items));
  saveDbGratitude(item).catch(console.error);
  return item;
}

export function deleteGratitudeItem(id: string): void {
  const items = getGratitudeItems().filter(i => i.id !== id);
  if (storeInitialized && cachedGratitude) cachedGratitude = items;
  localStorage.setItem("rope_gratitude", JSON.stringify(items));
  deleteDbGratitude(id).catch(console.error);
}

// ─── Memory Verses ──────────────────────────────────────────────────────────

export function getMemoryVerses(): { verse: string; text: string; addedAt: string }[] {
  if (typeof window === "undefined") return [];
  if (storeInitialized && cachedMemoryVerses) return cachedMemoryVerses;
  const raw = localStorage.getItem("rope_memory_verses");
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

export function addMemoryVerse(verse: string, text: string): void {
  const item = { verse, text, addedAt: new Date().toISOString() };
  const verses = getMemoryVerses();
  if (verses.some(v => v.verse === verse)) return;
  verses.unshift(item);
  if (storeInitialized && cachedMemoryVerses) cachedMemoryVerses = verses;
  localStorage.setItem("rope_memory_verses", JSON.stringify(verses));
  
  // Notify other components for immediate UI update
  window.dispatchEvent(new CustomEvent("rope-memory-update", { detail: { verses } }));
  
  saveDbMemoryVerse(item).catch(console.error);
}

export function removeMemoryVerse(verse: string): void {
  const verses = getMemoryVerses().filter(v => v.verse !== verse);
  if (storeInitialized && cachedMemoryVerses) cachedMemoryVerses = verses;
  localStorage.setItem("rope_memory_verses", JSON.stringify(verses));
  
  // Notify other components for immediate UI update
  window.dispatchEvent(new CustomEvent("rope-memory-update", { detail: { verses } }));
  
  deleteDbMemoryVerse(verse).catch(console.error);
}

// ─── Bible Highlights ───────────────────────────────────────────────────────

export interface BibleHighlight {
  book: string;      // e.g. "John"
  chapter: number;
  verse: number;
  color: string;     // "gold" | "green" | "blue" | "red"
  note: string;
  createdAt: string;
}

export function getBibleHighlights(): BibleHighlight[] {
  if (typeof window === "undefined") return [];
  if (storeInitialized && cachedHighlights) return cachedHighlights;
  const raw = localStorage.getItem("rope_bible_highlights");
  if (!raw) return [];
  try { return JSON.parse(raw) as BibleHighlight[]; } catch { return []; }
}

export function addBibleHighlight(book: string, chapter: number, verse: number, color: string, note?: string): void {
  const highlights = getBibleHighlights();
  const highlight: BibleHighlight = { book, chapter, verse, color, note: note || "", createdAt: new Date().toISOString() };
  // Remove existing highlight for same verse
  const filtered = highlights.filter(h => !(h.book === book && h.chapter === chapter && h.verse === verse));
  filtered.push(highlight);
  if (storeInitialized && cachedHighlights) cachedHighlights = filtered;
  localStorage.setItem("rope_bible_highlights", JSON.stringify(filtered));
  saveDbHighlight(highlight).catch(console.error);
}

export function removeBibleHighlight(book: string, chapter: number, verse: number): void {
  const highlights = getBibleHighlights().filter(h => !(h.book === book && h.chapter === chapter && h.verse === verse));
  if (storeInitialized && cachedHighlights) cachedHighlights = highlights;
  localStorage.setItem("rope_bible_highlights", JSON.stringify(highlights));
  deleteDbHighlight(book, chapter, verse).catch(console.error);
}

export function getHighlightsForChapter(book: string, chapter: number): BibleHighlight[] {
  return getBibleHighlights().filter(h => h.book === book && h.chapter === chapter);
}

// Chapter count per book (for navigation)
export const BOOK_CHAPTERS: Record<string, number> = {
  Genesis: 50, Exodus: 40, Leviticus: 27, Numbers: 36, Deuteronomy: 34,
  Joshua: 24, Judges: 21, Ruth: 4, "1 Samuel": 31, "2 Samuel": 24,
  "1 Kings": 22, "2 Kings": 25, "1 Chronicles": 29, "2 Chronicles": 36,
  Ezra: 10, Nehemiah: 13, Esther: 10, Job: 42, Psalms: 150, Proverbs: 31,
  Ecclesiastes: 12, "Song of Solomon": 8, Isaiah: 66, Jeremiah: 52,
  Lamentations: 5, Ezekiel: 48, Daniel: 12, Hosea: 14, Joel: 3, Amos: 9,
  Obadiah: 1, Jonah: 4, Micah: 7, Nahum: 3, Habakkuk: 3, Zephaniah: 3,
  Haggai: 2, Zechariah: 14, Malachi: 4,
  Matthew: 28, Mark: 16, Luke: 24, John: 21, Acts: 28, Romans: 16,
  "1 Corinthians": 16, "2 Corinthians": 13, Galatians: 6, Ephesians: 6,
  Philippians: 4, Colossians: 4, "1 Thessalonians": 5, "2 Thessalonians": 3,
  "1 Timothy": 6, "2 Timothy": 4, Titus: 3, Philemon: 1, Hebrews: 13,
  James: 5, "1 Peter": 5, "2 Peter": 3, "1 John": 5, "2 John": 1,
  "3 John": 1, Jude: 1, Revelation: 22,
};

// ─── Verse Recommendations ──────────────────────────────────────────────────

const THEME_VERSES: Record<string, string[]> = {
  "Trust": ["Proverbs 3:5-6", "Isaiah 26:3", "Psalm 37:5", "Jeremiah 17:7", "Nahum 1:7"],
  "Peace": ["John 14:27", "Isaiah 26:3", "Philippians 4:6-7", "Psalm 29:11", "Romans 15:13"],
  "Love": ["1 John 4:19", "Romans 5:8", "1 Corinthians 13:4-7", "Ephesians 3:17-19", "John 15:12"],
  "Obedience": ["John 14:15", "Deuteronomy 5:33", "1 Samuel 15:22", "James 1:22", "Luke 11:28"],
  "Courage": ["Deuteronomy 31:6", "Isaiah 41:10", "Joshua 1:9", "2 Timothy 1:7", "Psalm 31:24"],
  "Gratitude": ["1 Thessalonians 5:18", "Psalm 100:4", "Colossians 3:17", "Psalm 107:1", "James 1:17"],
  "Patience": ["James 5:7-8", "Romans 12:12", "Psalm 27:14", "Isaiah 40:31", "Hebrews 10:36"],
  "Forgiveness": ["Colossians 3:13", "Ephesians 4:32", "Matthew 6:14", "Mark 11:25", "Luke 6:37"],
  "Purpose": ["Jeremiah 29:11", "Romans 8:28", "Proverbs 19:21", "Ephesians 2:10", "Psalm 138:8"],
  "Growth": ["2 Peter 3:18", "Philippians 1:6", "Colossians 1:10", "Hebrews 6:1", "Ephesians 4:15"],
};

export function getRecommendedVerses(userId: string): { theme: string; verses: string[] }[] {
  const themes = getThemes(userId);
  if (themes.length === 0) return [];
  return themes.slice(0, 3).map(theme => ({
    theme,
    verses: (THEME_VERSES[theme] || []).slice(0, 3),
  }));
}

/** Extract common spiritual themes from observations */
export function getThemes(userId: string): string[] {
  const entries = getRopeEntries(userId);
  const themeKeywords: Record<string, string[]> = {
    "Trust": ["trust", "faith", "believe", "rely", "depend"],
    "Obedience": ["obey", "obedience", "follow", "submit", "listen"],
    "Peace": ["peace", "calm", "rest", "still", "quiet"],
    "Love": ["love", "compassion", "mercy", "kindness", "grace"],
    "Courage": ["courage", "brave", "strong", "bold", "fear not"],
    "Gratitude": ["thank", "grateful", "praise", "blessing", "thankful"],
    "Patience": ["patience", "wait", "endure", "persevere", "long-suffering"],
    "Forgiveness": ["forgive", "forgiveness", "pardon", "mercy", "reconcile"],
    "Purpose": ["purpose", "calling", "plan", "mission", "destiny"],
    "Growth": ["grow", "growth", "mature", "transform", "renew"],
  };

  const counts: Record<string, number> = {};
  const allText = entries.map(e => `${e.observation} ${e.prayer} ${e.execution}`).join(" ").toLowerCase();

  for (const [theme, keywords] of Object.entries(themeKeywords)) {
    let count = 0;
    for (const kw of keywords) {
      const regex = new RegExp(`\\b${kw}`, "gi");
      const matches = allText.match(regex);
      if (matches) count += matches.length;
    }
    if (count > 0) counts[theme] = count;
  }

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([theme]) => theme);
}

// ─── Data Export / Import ──────────────────────────────────────────────────

export function exportData(): string {
  if (typeof window === "undefined") return "{}";
  const data: Record<string, string | null> = {};
  const keys = [
    "rope_user",
    "rope_entries",
    "rope_prayers",
    "rope_gratitude",
    "rope_memory_verses",
    "rope_bible_highlights",
    "rope_active_plan",
    "rope_translation",
    "rope_dark_mode",
    "rope_onboarding_done",
    "rope_alias_counter"
  ];

  for (const key of keys) {
    data[key] = localStorage.getItem(key);
  }

  return JSON.stringify({
    version: "1.0",
    timestamp: new Date().toISOString(),
    data
  }, null, 2);
}

export function importData(jsonString: string): { success: boolean; error?: string } {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed.data || typeof parsed.data !== "object") {
      return { success: false, error: "Invalid data format" };
    }

    Object.entries(parsed.data).forEach(([key, value]) => {
      if (typeof value === "string") {
        localStorage.setItem(key, value);
      }
    });

    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function clearAllData(cloud: boolean = false): Promise<void> {
  if (typeof window === "undefined") return;
  
  if (cloud) {
    try {
      await clearAllDbData();
    } catch (e) {
      console.error("Cloud wipe failed", e);
      throw e;
    }
  }

  const keys = [
    "rope_user",
    "rope_entries",
    "rope_prayers",
    "rope_gratitude",
    "rope_memory_verses",
    "rope_bible_highlights",
    "rope_active_plan",
    "rope_translation",
    "rope_dark_mode",
    "rope_onboarding_done",
    "rope_alias_counter",
    "rope_bible_history",
    "rope_full_db_synced",
    "rope_entries_migrated"
  ];
  keys.forEach(key => localStorage.removeItem(key));
  
  // Clear indexedDB if needed
  try {
    const { deleteRopeEntries } = await import("./db");
    await deleteRopeEntries();
  } catch (e) { /* ignore */ }
  
  clearCache();
}
