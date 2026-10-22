export interface JournalDraft {
  verseRef: string;
  verseText: string;
  observation: string;
  prayer: string;
  execution: string;
}

export const EMPTY_DRAFT: JournalDraft = {
  verseRef: "", verseText: "", observation: "", prayer: "", execution: "",
};

export function draftKey(userId: string): string {
  return `rope_journal_draft_${userId}`;
}

export function hasDraftContent(draft: JournalDraft): boolean {
  return Object.values(draft).some(value => value.trim().length > 0);
}

/** Keep unfinished writing across midnight and scope new drafts to the account. */
export function readJournalDraft(storage: Storage, userId: string): JournalDraft | null {
  const key = draftKey(userId);
  const legacyKeys = storage.getItem("rope_legacy_drafts_migrated") ? [] : Array.from({ length: storage.length }, (_, i) => storage.key(i))
    .filter((key): key is string => !!key && /^rope_draft_\d{4}-\d{2}-\d{2}$/.test(key))
    .sort().reverse();

  for (const candidate of [key, ...legacyKeys]) {
    try {
      const raw = storage.getItem(candidate);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) continue;
      const draft = Object.fromEntries(Object.keys(EMPTY_DRAFT).map(field => [
        field, typeof parsed[field] === "string" ? parsed[field] : "",
      ])) as unknown as JournalDraft;
      if (!hasDraftContent(draft)) continue;
      if (candidate !== key) {
        storage.setItem(key, JSON.stringify(draft));
        storage.setItem("rope_legacy_drafts_migrated", "true");
        storage.removeItem(candidate);
      }
      return draft;
    } catch { /* Leave unreadable drafts intact and try the next recovery copy. */ }
  }
  return null;
}

export function writeJournalDraft(storage: Storage, userId: string, draft: JournalDraft): void {
  if (hasDraftContent(draft)) storage.setItem(draftKey(userId), JSON.stringify(draft));
  else storage.removeItem(draftKey(userId));
}
