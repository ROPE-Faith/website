// ─── Types ───────────────────────────────────────────────────────────────────

export type ExecutionStatus = "yes" | "partly" | "not_yet" | null;

export interface RopeEntry {
  id: string;
  userId: string;
  createdAt: string;
  revelationVerse: string;
  revelationText: string;
  translation?: string | null;
  observation: string;
  prayer: string;
  execution: string;
  executionStatus: ExecutionStatus;
  executionReflection: string;
}

// ─── Bible Books ─────────────────────────────────────────────────────────────

import { BIBLE_BOOKS, BOOK_CHAPTERS } from "./bible-data";
export { BIBLE_BOOKS, BOOK_CHAPTERS } from "./bible-data";

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

import { formatLocalDate } from "./dates";
import { mergeBackupItems, parseBackup } from "./backup";

// ─── Entry Store ──────────────────────────────────────────────────────────

import { migrateFromLocalStorage, loadRopeEntries, saveRopeEntries, deleteRopeEntries } from "./db";
import { 
  getDbEntries, saveDbEntry, deleteDbEntry, syncEntries,
  getDbPrayers, saveDbPrayer, deleteDbPrayer, syncPrayers,
  getDbHighlights, saveDbHighlight, deleteDbHighlightById, syncHighlights,
  getDbGratitude, saveDbGratitude, deleteDbGratitude, syncGratitude,
  getDbPlanProgress, saveDbPlanProgress,
  getDbMemoryVerses, saveDbMemoryVerse, deleteDbMemoryVerse, syncMemoryVerses,
  getDbSettings, saveDbSettings, clearAllDbData, logErrorAction
} from "./actions";

let cachedEntries: RopeEntry[] | null = null;
let cachedPrayers: PrayerItem[] | null = null;
import { HighlightRepository } from "./highlight-repository";
import { highlightId, type BibleHighlight } from "./highlight-model";
export type { BibleHighlight } from "./highlight-model";
let highlightRepository: HighlightRepository | null = null;
let highlightAccount = "local";
let highlightsAuthenticated = false;
let cachedGratitude: GratitudeItem[] | null = null;
let cachedPlan: PlanProgress | null = null;
let cachedMemoryVerses: { verse: string; text: string; translation?: string | null; addedAt: string }[] | null = null;
let cachedSettings: { darkMode: boolean; translation: string; onboardingComplete: boolean; lastRead: any[] } | null = null;
let storeInitialized = false;
let storeGeneration = 0;

/**
 * Initializes the store by loading entries from Postgres (if logged in) or IndexedDB.
 * Falls back to localStorage if IndexedDB is empty/unavailable.
 */
export async function initializeStore(isAuthenticated: boolean = false, accountId = "local") {
  if (typeof window === "undefined") return;
  if (highlightAccount !== accountId || highlightsAuthenticated !== isAuthenticated) clearCache();
  highlightAccount = accountId;
  highlightsAuthenticated = isAuthenticated;
  if (storeInitialized) return;
  const repository = getHighlightRepository();
  const generation = storeGeneration;
  
  try {
    if (!localStorage.getItem("rope_entries_migrated")) {
      await migrateFromLocalStorage();
    }
    if (generation !== storeGeneration) return;
    
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
          syncEntries(localEntries),
          syncPrayers(localPrayers),
          syncGratitude(localGratitude),
          syncHighlights(localHighlights),
          syncMemoryVerses(localMemoryVerses)
        ]);
        if (generation !== storeGeneration) return;
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
      if (generation !== storeGeneration) return;

      cachedEntries = entries;
      cachedPrayers = prayers;
      cachedGratitude = gratitude;
      repository.hydrateCloud(highlights);
      void repository.flush();
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
      const entries = await loadRopeEntries();
      if (generation !== storeGeneration) return;
      cachedEntries = entries;
      cachedPrayers = JSON.parse(localStorage.getItem("rope_prayers") || "[]");
      cachedGratitude = JSON.parse(localStorage.getItem("rope_gratitude") || "[]");
      getBibleHighlights();
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
  storeGeneration++;
  cachedEntries = null;
  cachedPrayers = null;
  highlightRepository = null;
  cachedGratitude = null;
  cachedPlan = null;
  cachedMemoryVerses = null;
  cachedSettings = null;
  storeInitialized = false;
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
    
    // Also sync the Prayer component to the Prayer Wall
    if (newEntry.prayer && newEntry.prayer.trim().length > 0) {
      const prayerId = `prayer_${newEntry.id}`;
      const prayers = getPrayers();
      if (!prayers.some(p => p.id === prayerId)) {
        const newPrayer: PrayerItem = {
          id: prayerId,
          text: newEntry.prayer,
          verse: newEntry.revelationVerse,
          createdAt: newEntry.createdAt,
          answeredAt: null,
          answeredNote: "",
          isPublic: false,
          publicAt: null,
        };
        prayers.unshift(newPrayer);
        if (storeInitialized && cachedPrayers) cachedPrayers = prayers;
        localStorage.setItem("rope_prayers", JSON.stringify(prayers));
        // We don't call saveDbPrayer here because saveDbEntry on the server now handles it
      }
    }

    if (isAuthenticated) {
      saveDbEntry(newEntry).catch(console.error);
    }

    // Notify UI components
    window.dispatchEvent(new CustomEvent("rope-entry-update", { 
      detail: { entries: updated, newEntry } 
    }));
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

    // Update corresponding prayer if it exists
    if (updates.prayer) {
      const prayerId = `prayer_${id}`;
      const prayers = getPrayers();
      const pIdx = prayers.findIndex(p => p.id === prayerId);
      if (pIdx !== -1) {
        prayers[pIdx].text = updates.prayer;
        if (updates.revelationVerse) prayers[pIdx].verse = updates.revelationVerse;
        if (storeInitialized && cachedPrayers) cachedPrayers = prayers;
        localStorage.setItem("rope_prayers", JSON.stringify(prayers));
        
        window.dispatchEvent(new CustomEvent("rope-prayer-update", { 
          detail: { prayers, updatedId: prayerId } 
        }));
      }
    }

    // Notify UI components
    window.dispatchEvent(new CustomEvent("rope-entry-update", { 
      detail: { entries, updatedEntry: entries[index] } 
    }));
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

    // Notify UI components
    window.dispatchEvent(new CustomEvent("rope-entry-update", { 
      detail: { entries: filtered, deletedId: id } 
    }));
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
    const match = verse.match(/^(.+?)\s+\d/);
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

import { TRANSLATIONS } from "./scripture";
export { TRANSLATIONS, fetchVerse, fetchChapterVerses, parseVerseRef } from "./scripture";

export function getTranslation(): string {
  if (typeof window === "undefined") return "kjv";
  const saved = (storeInitialized && cachedSettings ? cachedSettings.translation : localStorage.getItem("rope_translation")) || "kjv";
  if (!TRANSLATIONS.some(t => t.id === saved)) return "kjv";
  return saved;
}

export function getGatewayVersion(translationId: string): string {
  const t = TRANSLATIONS.find(t => t.id === translationId);
  return t?.gateway || "KJV";
}

export function setTranslation(t: string): void {
  if (!TRANSLATIONS.some(translation => translation.id === t)) return;
  if (storeInitialized && cachedSettings) cachedSettings.translation = t;
  localStorage.setItem("rope_translation", t);
  saveSettings();
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

  const today = formatLocalDate(new Date());
  if (progress.paused || progress.lastAdvancedAt === today) {
    return { progress, newlyAdvanced: false };
  }

  // Add the current day to completed list if not already there
  if (!progress.completedDays.includes(progress.currentDay)) {
    progress.completedDays.push(progress.currentDay);
  }

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
  const today = formatLocalDate(new Date());
  
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
  
  // Notify UI components
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("rope-prayer-update", { 
      detail: { prayers, newPrayer: prayer } 
    }));
  }

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
    
    // Notify UI components
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("rope-prayer-update", { 
        detail: { prayers, updatedId: id } 
      }));
    }
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
    
    // Notify UI components
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("rope-prayer-update", { 
        detail: { prayers, updatedId: id } 
      }));
    }
  }
}

export function deletePrayer(id: string): void {
  const prayers = getPrayers().filter(p => p.id !== id);
  if (storeInitialized && cachedPrayers) cachedPrayers = prayers;
  localStorage.setItem("rope_prayers", JSON.stringify(prayers));
  deleteDbPrayer(id).catch(console.error);
  
  // Notify UI components
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("rope-prayer-update", { 
      detail: { prayers, deletedId: id } 
    }));
  }
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

export function getMemoryVerses(): { verse: string; text: string; translation?: string | null; addedAt: string }[] {
  if (typeof window === "undefined") return [];
  if (storeInitialized && cachedMemoryVerses) return cachedMemoryVerses;
  const raw = localStorage.getItem("rope_memory_verses");
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

export async function addMemoryVerse(verse: string, text: string, translation?: string | null): Promise<void> {
  const item = { verse, text, translation: translation || null, addedAt: new Date().toISOString() };
  const previousVerses = getMemoryVerses();
  
  if (previousVerses.some(v => v.verse === verse)) return;
  
  const updatedVerses = [item, ...previousVerses];
  
  // Optimistic update
  if (storeInitialized && cachedMemoryVerses) cachedMemoryVerses = updatedVerses;
  localStorage.setItem("rope_memory_verses", JSON.stringify(updatedVerses));
  
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("rope-memory-update", { detail: { verses: updatedVerses } }));
  }

  try {
    await saveDbMemoryVerse(item);
  } catch (error: any) {
    console.error("Failed to save memory verse, rolling back:", error);
    
    // Rollback
    if (storeInitialized && cachedMemoryVerses) cachedMemoryVerses = previousVerses;
    localStorage.setItem("rope_memory_verses", JSON.stringify(previousVerses));
    
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("rope-memory-update", { detail: { verses: previousVerses, error: error.message } }));
    }
    
    // Log error
    await logErrorAction({
      message: `addMemoryVerse failed: ${error.message}`,
      context: { verse, text }
    });
  }
}

export async function removeMemoryVerse(verse: string): Promise<void> {
  const previousVerses = getMemoryVerses();
  const updatedVerses = previousVerses.filter(v => v.verse !== verse);
  
  if (previousVerses.length === updatedVerses.length) return;

  // Optimistic update
  if (storeInitialized && cachedMemoryVerses) cachedMemoryVerses = updatedVerses;
  localStorage.setItem("rope_memory_verses", JSON.stringify(updatedVerses));
  
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("rope-memory-update", { detail: { verses: updatedVerses } }));
  }

  try {
    await deleteDbMemoryVerse(verse);
  } catch (error: any) {
    console.error("Failed to delete memory verse, rolling back:", error);
    
    // Rollback
    if (storeInitialized && cachedMemoryVerses) cachedMemoryVerses = previousVerses;
    localStorage.setItem("rope_memory_verses", JSON.stringify(previousVerses));
    
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("rope-memory-update", { detail: { verses: previousVerses, error: error.message } }));
    }

    // Log error
    await logErrorAction({
      message: `removeMemoryVerse failed: ${error.message}`,
      context: { verse }
    });
  }
}

// ─── Bible Highlights ───────────────────────────────────────────────────────

function getHighlightRepository(): HighlightRepository {
  if (!highlightRepository) {
    const account = highlightAccount;
    highlightRepository = new HighlightRepository(localStorage, account, highlightsAuthenticated ? {
      save: h => saveDbHighlight(h, account),
      remove: id => deleteDbHighlightById(id, account),
    } : undefined, () => window.dispatchEvent(new CustomEvent("rope-highlights-update")));
  }
  return highlightRepository;
}

export function getBibleHighlights(): BibleHighlight[] {
  return typeof window === "undefined" ? [] : getHighlightRepository().get();
}
export function getHighlightSyncStatus(): { pending: number; cloud: boolean } {
  return { pending: getHighlightRepository().pendingCount, cloud: highlightsAuthenticated };
}
export function retryHighlightSync(): Promise<boolean> { return getHighlightRepository().flush(); }
export function saveBibleHighlight(value: BibleHighlight): Promise<boolean> { return getHighlightRepository().save(value); }
export function deleteBibleHighlight(id: string): Promise<boolean> { return getHighlightRepository().remove(id); }

/** Compatibility for original whole-verse marks; recoloring preserves the note and creation date. */
export function addBibleHighlight(book: string, chapter: number, verse: number, color: string, note?: string): void {
  const id = highlightId({ book, chapter, verse });
  const existing = getBibleHighlights().find(h => highlightId(h) === id);
  void saveBibleHighlight({ ...existing, id, book, chapter, verse, color, note: note ?? existing?.note ?? "", createdAt: existing?.createdAt || new Date().toISOString() });
}
export function removeBibleHighlight(book: string, chapter: number, verse: number): void {
  void deleteBibleHighlight(highlightId({ book, chapter, verse }));
}
export function getHighlightsForChapter(book: string, chapter: number): BibleHighlight[] {
  return getBibleHighlights().filter(h => h.book === book && h.chapter === chapter);
}

// Chapter count per book (for navigation)


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
  // Cloud-loaded data may be newer than the localStorage mirror.
  const data = {
    rope_entries: JSON.stringify(getRopeEntries()),
    rope_prayers: JSON.stringify(getPrayers()),
    rope_gratitude: JSON.stringify(getGratitudeItems()),
    rope_memory_verses: JSON.stringify(getMemoryVerses()),
    rope_bible_highlights: JSON.stringify(getBibleHighlights()),
    rope_active_plan: localStorage.getItem("rope_active_plan"),
    rope_plan_history: JSON.stringify(getPlanHistory()),
    rope_bible_history: JSON.stringify(getBibleHistory()),
    rope_translation: getTranslation(),
    rope_dark_mode: JSON.stringify(getDarkMode()),
    rope_onboarding_done: JSON.stringify(hasCompletedOnboarding()),
  };

  return JSON.stringify({
    version: "1.0",
    timestamp: new Date().toISOString(),
    data
  }, null, 2);
}

export async function importData(jsonString: string, userId = "local", isAuthenticated = false): Promise<{ success: boolean; error?: string }> {
  try {
    const data = parseBackup(jsonString);
    const entryIds = new Map<string, string>();
    const importedEntries = (data.rope_entries as RopeEntry[] | undefined)?.map(entry => {
      const id = entry.userId === userId ? entry.id : `${entry.id.slice(0, 160)}_import_${userId.slice(-80)}`;
      entryIds.set(entry.id, id);
      return { ...entry, id, userId };
    });
    if (importedEntries) data.rope_entries = mergeBackupItems(getRopeEntries(), importedEntries, entry => entry.id);
    if (data.rope_prayers) {
      const imported = (data.rope_prayers as PrayerItem[]).map(prayer => {
        const linkedId = prayer.id.startsWith("prayer_") ? entryIds.get(prayer.id.slice(7)) : undefined;
        const id = linkedId ? `prayer_${linkedId}` : getPrayers().some(p => p.id === prayer.id) ? prayer.id : `${prayer.id.slice(0, 160)}_import_${userId.slice(-80)}`;
        return { ...prayer, id };
      });
      data.rope_prayers = mergeBackupItems(getPrayers(), imported, prayer => prayer.id);
    }
    if (data.rope_gratitude) {
      const current = getGratitudeItems();
      const imported = (data.rope_gratitude as GratitudeItem[]).map(item => ({
        ...item, id: current.some(existing => existing.id === item.id) ? item.id : `${item.id.slice(0, 160)}_import_${userId.slice(-80)}`,
      }));
      data.rope_gratitude = mergeBackupItems(current, imported, item => item.id);
    }
    if (data.rope_bible_highlights) data.rope_bible_highlights = mergeBackupItems(getBibleHighlights(), data.rope_bible_highlights as BibleHighlight[], highlightId);
    if (data.rope_memory_verses) data.rope_memory_verses = mergeBackupItems(getMemoryVerses(), data.rope_memory_verses as { verse: string; text: string; translation?: string | null; addedAt: string }[], v => v.verse);
    if (data.rope_plan_history) data.rope_plan_history = mergeBackupItems(getPlanHistory(), data.rope_plan_history as PlanProgress[], p => `${p.planId}:${p.startedAt}`);

    // Save a recoverable local copy before attempting the network.
    const previous = new Map(Object.keys(data).map(key => [key, localStorage.getItem(key)]));
    try {
      for (const [key, value] of Object.entries(data)) {
        localStorage.setItem(key, key === "rope_translation" ? value as string : JSON.stringify(value));
      }
    } catch (error) {
      for (const [key, value] of previous) {
        if (value === null) localStorage.removeItem(key);
        else localStorage.setItem(key, value);
      }
      throw error;
    }

    if (data.rope_entries) {
      cachedEntries = data.rope_entries as RopeEntry[];
      await saveRopeEntries(cachedEntries).catch(console.error);
    }
    if (data.rope_prayers) cachedPrayers = data.rope_prayers as PrayerItem[];
    if (data.rope_gratitude) cachedGratitude = data.rope_gratitude as GratitudeItem[];
    if (data.rope_bible_highlights) getHighlightRepository().importLocal(data.rope_bible_highlights as BibleHighlight[]);
    if (data.rope_memory_verses) cachedMemoryVerses = data.rope_memory_verses as { verse: string; text: string; translation?: string | null; addedAt: string }[];
    cachedSettings = {
      darkMode: data.rope_dark_mode as boolean ?? getDarkMode(),
      translation: data.rope_translation as string ?? getTranslation(),
      onboardingComplete: data.rope_onboarding_done as boolean ?? hasCompletedOnboarding(),
      lastRead: data.rope_bible_history as BibleHistoryItem[] ?? getBibleHistory(),
    };

    if (isAuthenticated) {
      await Promise.all([
        ...(data.rope_entries ? [syncEntries(data.rope_entries as RopeEntry[])] : []),
        ...(data.rope_prayers ? [syncPrayers(data.rope_prayers as PrayerItem[])] : []),
        ...(data.rope_gratitude ? [syncGratitude(data.rope_gratitude as GratitudeItem[])] : []),
        ...(data.rope_bible_highlights ? [retryHighlightSync().then(ok => { if (!ok) throw new Error("Highlights are saved locally and waiting to sync."); })] : []),
        ...(data.rope_memory_verses ? [syncMemoryVerses(data.rope_memory_verses as { verse: string; text: string; translation?: string | null; addedAt: string }[])] : []),
        ...(data.rope_active_plan ? [saveDbPlanProgress(data.rope_active_plan as PlanProgress)] : []),
        saveDbSettings(cachedSettings),
      ]);
    }

    return { success: true };
  } catch (e) {
    console.error("Backup import failed", e);
    return { success: false, error: "The backup could not be fully restored. Check that it is a valid ROPE backup and that you are connected, then try again. Any data already restored is kept on this device." };
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
    "rope_plan_history",
    "rope_translation",
    "rope_dark_mode",
    "rope_onboarding_done",
    "rope_alias_counter",
    "rope_bible_history",
    "rope_full_db_synced",
    "rope_entries_migrated"
  ];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith("rope_journal_draft_") || /^rope_draft_\d{4}-\d{2}-\d{2}$/.test(key))) keys.push(key);
  }
  keys.forEach(key => localStorage.removeItem(key));
  
  // Clear indexedDB if needed
  try {
    const { deleteRopeEntries } = await import("./db");
    await deleteRopeEntries();
  } catch (e) { /* ignore */ }
  
  localStorage.removeItem(`rope_highlights_${highlightAccount}`);
  localStorage.removeItem(`rope_highlight_outbox_${highlightAccount}`);
  clearCache();
}
