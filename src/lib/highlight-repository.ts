import { BibleHighlightSchema } from "./validations";
import { highlightId, type BibleHighlight } from "./highlight-model";

type Pending = { id: string; token: string; value: BibleHighlight | null };
type Remote = { save: (h: BibleHighlight) => Promise<unknown>; remove: (id: string) => Promise<unknown> };

/** Account-scoped, durable optimistic writes. A failed request never discards someone's note. */
export class HighlightRepository {
  readonly key: string;
  readonly outboxKey: string;
  private flushing: Promise<boolean> | null = null;
  constructor(private storage: Storage, readonly account: string, private remote?: Remote, private changed: () => void = () => {}) {
    this.key = `rope_highlights_${account}`;
    this.outboxKey = `rope_highlight_outbox_${account}`;
    const owner = storage.getItem("rope_highlights_legacy_owner");
    if (storage.getItem(this.key) === null && (!owner || owner === account)) {
      const legacy = storage.getItem("rope_bible_highlights");
      if (legacy) {
        storage.setItem(this.key, legacy);
        storage.setItem("rope_highlights_legacy_owner", account);
      }
    }
  }
  get(): BibleHighlight[] {
    try {
      const values: unknown = JSON.parse(this.storage.getItem(this.key) || "[]");
      if (!Array.isArray(values)) return [];
      return values.flatMap(value => {
        const parsed = BibleHighlightSchema.safeParse(value);
        return parsed.success ? [{ ...parsed.data, id: highlightId(parsed.data), createdAt: new Date(parsed.data.createdAt).toISOString() }] : [];
      });
    } catch { return []; }
  }
  private pending(): Pending[] {
    try {
      const data = JSON.parse(this.storage.getItem(this.outboxKey) || "[]");
      return Array.isArray(data) ? data : [];
    } catch { return []; }
  }
  get pendingCount(): number { return this.pending().length; }
  private commit(items: BibleHighlight[], pending: Pending[]) {
    const previous = this.storage.getItem(this.key);
    // Persist the outbox before publishing the collection. Roll back if device storage is full.
    const oldOutbox = this.storage.getItem(this.outboxKey);
    try {
      this.storage.setItem(this.outboxKey, JSON.stringify(pending));
      this.storage.setItem(this.key, JSON.stringify(items));
    } catch (error) {
      try {
        if (previous === null) this.storage.removeItem(this.key); else this.storage.setItem(this.key, previous);
        if (oldOutbox === null) this.storage.removeItem(this.outboxKey); else this.storage.setItem(this.outboxKey, oldOutbox);
      } catch { /* Keep any surviving recovery copy. */ }
      throw error;
    }
    this.changed();
  }
  private mutation(value: BibleHighlight | null, id: string): Pending {
    return { id, value, token: `${Date.now()}_${Math.random()}` };
  }
  async save(value: BibleHighlight): Promise<boolean> {
    const parsed = BibleHighlightSchema.parse(value);
    const h: BibleHighlight = { ...parsed, id: highlightId(parsed), createdAt: new Date(parsed.createdAt).toISOString() };
    const items = this.get();
    const index = items.findIndex(item => highlightId(item) === h.id);
    if (index < 0) items.push(h); else items[index] = h;
    const pending = this.pending().filter(p => p.id !== h.id);
    if (this.remote) pending.push(this.mutation(h, h.id!));
    this.commit(items, pending);
    return this.flush();
  }
  async remove(id: string): Promise<boolean> {
    const pending = this.pending().filter(p => p.id !== id);
    if (this.remote) pending.push(this.mutation(null, id));
    this.commit(this.get().filter(h => highlightId(h) !== id), pending);
    return this.flush();
  }
  hydrateCloud(values: BibleHighlight[]) {
    const records = new Map<string, BibleHighlight>(values.map(h => [highlightId(h), { ...h, id: highlightId(h) }]));
    // Pending edits/deletions win over a stale network response, including after a reload.
    for (const operation of this.pending()) {
      if (operation.value) records.set(operation.id, operation.value);
      else records.delete(operation.id);
    }
    this.commit([...records.values()], this.pending());
  }
  importLocal(values: BibleHighlight[]) {
    const items = values.map(h => ({ ...h, id: highlightId(h) }));
    const pending = this.remote ? items.map(h => this.mutation(h, h.id)) : [];
    // Preserve tombstones so importing a backup does not accidentally resurrect a deleted cloud mark.
    this.commit(items, [...this.pending().filter(p => !items.some(h => h.id === p.id)), ...pending]);
  }
  flush(): Promise<boolean> {
    if (!this.remote) return Promise.resolve(true);
    if (this.flushing) return this.flushing;
    this.flushing = this.drain().finally(() => { this.flushing = null; this.changed(); });
    return this.flushing;
  }
  private async drain(): Promise<boolean> {
    for (;;) {
      const operation = this.pending()[0];
      if (!operation) return true;
      try {
        if (operation.value) await this.remote!.save(operation.value);
        else await this.remote!.remove(operation.id);
        // A more recent edit of this mark may have arrived while the request was in flight.
        this.storage.setItem(this.outboxKey, JSON.stringify(this.pending().filter(p => p.token !== operation.token)));
      } catch { return false; }
    }
  }
}
