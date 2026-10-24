"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BIBLE_BOOKS, deleteBibleHighlight, saveBibleHighlight } from "@/lib/store";
import { HIGHLIGHT_COLORS, highlightId, highlightRange, highlightText, isPhrase, passageReference, type BibleHighlight } from "@/lib/highlight-model";
import { filterHighlights } from "@/lib/highlight-search";
import { translationLabel } from "@/lib/scripture";
import { useHighlights } from "@/components/bible/useHighlights";
import HighlightSync from "@/components/bible/HighlightSync";

const input = "min-h-11 min-w-0 rounded-xl border border-brown/15 bg-ivory px-3 py-2 text-sm text-dark";
const button = "min-h-11 rounded-xl border border-brown/15 px-3 py-2 text-sm font-medium text-brown hover:bg-brown/5 disabled:opacity-40";

export default function HighlightsLibrary() {
  const { highlights, sync, retry } = useHighlights();
  const [search, setSearch] = useState("");
  const [book, setBook] = useState("");
  const [color, setColor] = useState("");
  const [notesOnly, setNotesOnly] = useState(false);
  const [sort, setSort] = useState("newest");
  const [editing, setEditing] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [undo, setUndo] = useState<BibleHighlight | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const visible = useMemo(() => filterHighlights(highlights, { search, book, color, notesOnly, sort }), [highlights, search, book, color, notesOnly, sort]);

  async function remove(h: BibleHighlight) {
    setBusy(true); setError("");
    try { await deleteBibleHighlight(highlightId(h)); setUndo(h); setMessage("Highlight removed."); if (editing === highlightId(h)) setEditing(null); }
    catch { setError("The highlight could not be removed. Please try again."); }
    finally { setBusy(false); }
  }
  async function restore() {
    if (!undo) return;
    setBusy(true);
    try { await saveBibleHighlight(undo); setUndo(null); setMessage("Highlight restored."); }
    catch { setError("The highlight could not be restored. Please try again."); }
    finally { setBusy(false); }
  }
  async function saveNote(h: BibleHighlight) {
    setBusy(true); setError("");
    try {
      const synced = await saveBibleHighlight({ ...h, note: note.trim() });
      setEditing(null); setMessage(synced ? "Private note saved." : "Private note saved on this device and waiting to sync.");
    } catch { setError("The note could not be saved on this device. Your writing is still here."); }
    finally { setBusy(false); }
  }

  return <main className="px-5 pt-6 pb-8">
    <Link href="/bible" className="mb-5 inline-flex min-h-11 items-center text-sm font-medium text-brown">← Back to Bible</Link>
    <h1 className="mb-2 font-serif text-3xl text-brown">My highlights</h1>
    <p className="mb-6 text-sm leading-relaxed text-muted">Passages you want to return to, with your private notes.</p>
    <div className="mb-5 grid grid-cols-3 gap-2 rounded-2xl border border-brown/10 bg-cream/50 p-4 text-center">
      <div><p className="font-serif text-2xl text-brown">{highlights.length}</p><p className="text-xs text-muted">Highlights</p></div>
      <div><p className="font-serif text-2xl text-brown">{highlights.filter(h => h.note.trim()).length}</p><p className="text-xs text-muted">With notes</p></div>
      <div><p className="font-serif text-2xl text-brown">{new Set(highlights.map(h => h.book)).size}</p><p className="text-xs text-muted">Books</p></div>
    </div>
    <HighlightSync pending={sync.pending} retry={retry} />
    <div className="mb-5 rounded-2xl border border-brown/10 bg-cream/40 p-4">
      <label htmlFor="highlight-search" className="mb-2 block text-sm font-medium text-brown">Search highlights and notes</label>
      <input id="highlight-search" type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Reference, words, or a private note…" className={`${input} mb-3 w-full`} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="grid min-w-0 gap-1 text-xs text-muted">Book<select aria-label="Filter highlights by book" value={book} onChange={e => setBook(e.target.value)} className={input}><option value="">All books</option>{BIBLE_BOOKS.filter(b => highlights.some(h => h.book === b.name)).map(b => <option key={b.name}>{b.name}</option>)}</select></label>
        <label className="grid min-w-0 gap-1 text-xs text-muted">Color<select aria-label="Filter highlights by color" value={color} onChange={e => setColor(e.target.value)} className={input}><option value="">All colors</option>{HIGHLIGHT_COLORS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select></label>
        <label className="grid min-w-0 gap-1 text-xs text-muted">Order<select aria-label="Sort highlights" value={sort} onChange={e => setSort(e.target.value)} className={input}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="bible">Bible order</option></select></label>
      </div>
      <label className="mt-3 flex min-h-11 items-center gap-2 text-sm text-brown"><input type="checkbox" checked={notesOnly} onChange={e => setNotesOnly(e.target.checked)} className="h-4 w-4 accent-brown" />Only highlights with notes</label>
    </div>
    <p role="status" aria-live="polite" className="mb-4 text-sm text-muted">{visible.length} of {highlights.length} highlights</p>
    {message && <p role="status" className="mb-4 rounded-xl bg-brown/5 p-3 text-sm text-brown">{message}{undo && <button type="button" disabled={busy} onClick={() => void restore()} className="ml-3 min-h-10 font-bold underline underline-offset-4">Undo removal</button>}</p>}
    {error && <p role="alert" className="mb-4 rounded-xl border border-struggle/30 p-3 text-sm text-dark">{error}</p>}
    {visible.length === 0 && <div className="rounded-2xl border border-dashed border-brown/20 p-8 text-center"><h2 className="mb-2 font-serif text-xl text-brown">{highlights.length ? "No matching highlights" : "Keep a passage close"}</h2><p className="mb-4 text-sm text-muted">{highlights.length ? "Try a different search or clear your filters." : "Select a phrase or a few verses in the Bible to save your first highlight."}</p>{highlights.length ? <button type="button" className={button} onClick={() => { setSearch(""); setBook(""); setColor(""); setNotesOnly(false); }}>Clear filters</button> : <Link href="/bible" className={`${button} inline-flex items-center`}>Open Bible</Link>}</div>}
    <div className="space-y-4">{visible.map(h => {
      const id = highlightId(h), range = highlightRange(h), quote = highlightText(h);
      const style = HIGHLIGHT_COLORS.find(c => c.id === h.color)!;
      const params = new URLSearchParams({ b: h.book, c: String(h.chapter), h: id });
      if (h.selection) params.set("t", h.selection.translation);
      return <article key={id} className="overflow-hidden rounded-2xl border border-brown/10 bg-ivory p-4 sm:p-5" style={{ borderLeft: `4px solid ${style.border}` }}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 className="font-serif text-xl text-brown">{passageReference(h.book, h.chapter, range)}</h2><span className="rounded-full px-2 py-1 text-xs text-dark" style={{ backgroundColor: style.bg }}>{style.label} · {isPhrase(range) ? "Phrase" : "Passage"}</span></div>
        <p className="mb-3 text-xs text-muted">{h.selection ? translationLabel(h.selection.translation) : "Whole-verse highlight"} · {new Date(h.createdAt).toLocaleDateString()}</p>
        {quote ? <blockquote className="mb-4 whitespace-pre-line text-sm leading-relaxed text-dark">“{quote}”</blockquote> : <p className="mb-4 text-sm italic text-muted">Open the passage to read this saved verse.</p>}
        {editing === id ? <div className="mb-4"><label className="mb-1 block text-sm font-medium text-brown" htmlFor={`note-${id}`}>Private note</label><textarea id={`note-${id}`} value={note} onChange={e => setNote(e.target.value)} maxLength={5000} rows={4} disabled={busy} autoFocus className={`${input} mb-2 w-full`} /><div className="flex gap-2"><button type="button" disabled={busy} className={button} onClick={() => void saveNote(h)}>{busy ? "Saving…" : "Save note"}</button><button type="button" disabled={busy} className={button} onClick={() => setEditing(null)}>Cancel</button></div></div> : h.note && <div className="mb-4 rounded-xl bg-cream/60 p-3"><p className="mb-1 text-xs font-semibold text-muted">Private note</p><p className="whitespace-pre-wrap text-sm leading-relaxed text-dark">{h.note}</p></div>}
        <div className="flex flex-wrap gap-2"><Link href={`/bible?${params}`} className={`${button} inline-flex items-center`}>Open & adjust</Link><button type="button" disabled={busy} className={button} onClick={() => { if (editing && editing !== id) { setError("Save or cancel the current note before editing another."); return; } setEditing(id); setNote(h.note); }}>{h.note ? "Edit note" : "Add note"}</button><button type="button" disabled={busy} className={`${button} text-struggle`} onClick={() => void remove(h)}>Remove</button></div>
      </article>;
    })}</div>
  </main>;
}
