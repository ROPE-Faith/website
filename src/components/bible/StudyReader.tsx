"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { addMemoryVerse, deleteBibleHighlight, getMemoryVerses, saveBibleHighlight } from "@/lib/store";
import { HIGHLIGHT_COLORS, highlightApplies, highlightId, highlightRange, isPhrase, newSelectionAction, passageReference, rangeText, readTextSelection, sameRange, verseSegments, wordBounds, type BibleHighlight, type PassageRange } from "@/lib/highlight-model";
import { translationLabel, type VerseData } from "@/lib/scripture";
import { useHighlights } from "./useHighlights";
import HighlightSync from "./HighlightSync";

const control = "min-h-11 rounded-xl border border-brown/15 bg-ivory px-3 py-2 text-sm text-dark";
const action = "min-h-11 rounded-xl border border-brown/15 bg-ivory px-4 py-2 text-sm font-medium text-brown hover:bg-brown/5 disabled:opacity-40";

export default function StudyReader({ book, chapter, translation, verses, requestedHighlight }: { book: string; chapter: number; translation: string; verses: VerseData[]; requestedHighlight?: string | null }) {
  const router = useRouter();
  const { highlights: allHighlights, sync, retry } = useHighlights();
  const highlights = useMemo(() => allHighlights.filter(h => h.book === book && h.chapter === chapter), [allHighlights, book, chapter]);
  const [range, setRange] = useState<PassageRange | null>(null);
  const [editing, setEditing] = useState<BibleHighlight | null>(null);
  const [color, setColor] = useState("gold");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [undo, setUndo] = useState<BibleHighlight | null>(null);
  const [readingSize, setReadingSize] = useState(18);
  const [memory, setMemory] = useState<string[]>([]);
  const passageRoot = useRef<HTMLDivElement>(null);
  const editor = useRef<HTMLElement>(null);
  const opened = useRef<string | null>(null);
  const selectionIntent = useRef<"new" | "adjust">("new");
  const currentDraft = useRef({ range, editing, color, note });
  currentDraft.current = { range, editing, color, note };

  useEffect(() => {
    const saved = Number(localStorage.getItem("rope_reading_size"));
    if (saved >= 16 && saved <= 24) setReadingSize(saved);
    const update = () => setMemory(getMemoryVerses().map(v => v.verse));
    update();
    window.addEventListener("rope-memory-update", update);
    return () => window.removeEventListener("rope-memory-update", update);
  }, []);

  // Selection handles on touch devices and keyboard selections use the same precise source offsets.
  useEffect(() => {
    const capture = () => {
      if (busy || !passageRoot.current) return;
      const selected = readTextSelection(passageRoot.current, window.getSelection());
      if (selected) {
        const current = currentDraft.current;
        const action = newSelectionAction(current, selectionIntent.current);
        if (action === "blocked") { setError("Save or cancel your current edits before starting a new highlight. Use Reselect text to adjust this one."); return; }
        if (action === "new") {
          setEditing(null); setNote("");
        }
        setRange(selected); setError("");
      }
    };
    document.addEventListener("selectionchange", capture);
    return () => document.removeEventListener("selectionchange", capture);
  }, [busy]);

  function closeEditor() {
    selectionIntent.current = "new";
    setRange(null); setEditing(null); setNote(""); setError("");
    window.getSelection()?.removeAllRanges();
  }
  function editHighlight(h: BibleHighlight, scroll = true) {
    if (range && (note !== (editing?.note || "") || (editing && (color !== editing.color || !sameRange(range, highlightRange(editing)))))) {
      setError("Save or cancel your current edits before opening another highlight.");
      return;
    }
    const original = highlightRange(h);
    const hasEndpoints = verses.some(v => v.verse === original.verse) && verses.some(v => v.verse === original.endVerse);
    const canAdjust = hasEndpoints && (!isPhrase(original) || h.selection!.verses.every(source => verses.some(v => v.verse === source.verse && highlightApplies(h, translation, v))));
    if (!canAdjust) { setError("This phrase belongs to another translation or an earlier text edition. Open it from the highlights library in its original translation."); return; }
    setEditing(h); setRange(original); setNote(h.note); setColor(h.color); setError("");
    selectionIntent.current = "new";
    if (scroll) requestAnimationFrame(() => editor.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }
  useEffect(() => {
    if (!requestedHighlight || opened.current === requestedHighlight) return;
    const h = highlights.find(h => highlightId(h) === requestedHighlight);
    if (h) { opened.current = requestedHighlight; editHighlight(h); }
  }, [requestedHighlight, highlights]);

  function selectVerse(number: number) {
    if (busy) return;
    window.getSelection()?.removeAllRanges();
    setError("");
    const action = newSelectionAction({ range, editing, color, note }, selectionIntent.current);
    if (action === "blocked") { setError("Save or cancel your current edits before starting a new highlight."); return; }
    if (action === "new") {
      setEditing(null); setNote(""); setRange({ verse: number, endVerse: number, startOffset: null, endOffset: null });
      return;
    }
    setRange(current => {
      if (!current) return { verse: number, endVerse: number, startOffset: null, endOffset: null };
      // Extend from the current start. Explicit start/end controls also support shortening the range.
      return { verse: Math.min(current.verse, number), endVerse: Math.max(current.verse, number), startOffset: null, endOffset: null };
    });
  }

  const first = verses.find(v => v.verse === range?.verse);
  const last = verses.find(v => v.verse === range?.endVerse);
  const quote = range ? rangeText(range, verses) : "";
  const reference = range ? passageReference(book, chapter, range) : "";
  const startWords = first ? wordBounds(first.text) : [];
  const endWords = last ? wordBounds(last.text) : [];
  const selectedMemory = memory.includes(reference.replace(/–/g, "-"));
  const hiddenPhrases = highlights.filter(h => isPhrase(highlightRange(h)) && !verses.some(v => highlightApplies(h, translation, v))).length;

  async function save() {
    if (!range || !quote.trim() || busy) return;
    setBusy(true); setError("");
    const value: BibleHighlight = {
      id: editing ? highlightId(editing) : crypto.randomUUID(), book, chapter, verse: range.verse, color, note: note.trim(),
      createdAt: editing?.createdAt || new Date().toISOString(),
      selection: { endVerse: range.endVerse, translation, startOffset: range.startOffset, endOffset: range.endOffset, verses: verses.filter(v => v.verse >= range.verse && v.verse <= range.endVerse) },
    };
    try {
      const synced = await saveBibleHighlight(value);
      setMessage(synced ? "Highlight saved." : "Highlight saved on this device. It will sync when you reconnect.");
      closeEditor();
    } catch { setError("This device could not save the highlight. Your note is still here; free some storage and try again."); }
    finally { setBusy(false); }
  }
  async function remove(h: BibleHighlight) {
    setBusy(true); setError("");
    try {
      await deleteBibleHighlight(highlightId(h)); setUndo(h); setMessage("Highlight removed."); closeEditor();
    } catch { setError("The highlight could not be removed. Please try again."); }
    finally { setBusy(false); }
  }
  async function restore() {
    if (!undo) return;
    try { await saveBibleHighlight(undo); setUndo(null); setMessage("Highlight restored."); }
    catch { setError("The highlight could not be restored. Please try again."); }
  }
  async function copy() {
    try { await navigator.clipboard.writeText(`${quote}\n— ${reference} (${translationLabel(translation)})`); setMessage("Passage copied with its reference and translation."); }
    catch { setError("Copy is unavailable. You can select and copy the passage text directly."); }
  }

  return <div className="mb-8">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-y border-brown/10 py-3">
      <Link href="/bible/highlights" className="min-h-11 inline-flex items-center gap-2 text-sm font-semibold text-brown">My highlights <span className="rounded-full bg-brown/10 px-2 py-0.5 text-xs">{allHighlights.length}</span><span aria-hidden="true">→</span></Link>
      <div className="flex items-center gap-2" aria-label="Reading text size">
        <button type="button" className={action} disabled={readingSize <= 16} aria-label="Decrease reading text size" onClick={() => { const size = readingSize - 2; setReadingSize(size); localStorage.setItem("rope_reading_size", String(size)); }}>A−</button>
        <button type="button" className={action} disabled={readingSize >= 24} aria-label="Increase reading text size" onClick={() => { const size = readingSize + 2; setReadingSize(size); localStorage.setItem("rope_reading_size", String(size)); }}>A+</button>
      </div>
    </div>
    <p className="mb-4 text-sm leading-relaxed text-muted">Select words to mark a phrase, or tap verse numbers to select a passage. Tap another number to extend it.</p>
    {hiddenPhrases > 0 && <p className="mb-4 text-sm text-muted">{hiddenPhrases} phrase highlight{hiddenPhrases > 1 ? "s" : ""} from another translation or text edition {hiddenPhrases > 1 ? "are" : "is"} available in <Link className="text-brown underline" href="/bible/highlights">your library</Link>.</p>}
    <HighlightSync pending={sync.pending} retry={retry} />
    <div role="status" aria-live="polite" className={message ? "mb-4 rounded-xl bg-brown/5 px-4 py-3 text-sm text-brown" : "sr-only"}>{message}{undo && <button type="button" onClick={() => void restore()} className="ml-3 min-h-10 font-bold underline underline-offset-4">Undo removal</button>}</div>
    {error && <p role="alert" className="mb-4 rounded-xl border border-struggle/30 bg-struggle/10 p-3 text-sm text-dark">{error}</p>}



    <div ref={passageRoot} aria-label={`${book} ${chapter}, ${translationLabel(translation)}`}>
      {verses.map(v => {
        const selected = !!range && v.verse >= range.verse && v.verse <= range.endVerse;
        const startingHere = highlights.filter(h => h.verse === v.verse && highlightApplies(h, translation, v));
        return <div key={v.verse} id={`verse-${v.verse}`} className={`mb-1 rounded-xl border-l-2 px-2 py-2.5 transition-colors ${selected ? "border-brown/40 bg-brown/5" : "border-transparent"}`}>
          <div className="flex items-baseline gap-1">
            <button type="button" aria-label={`Select verse ${v.verse}`} aria-pressed={selected} disabled={busy} onClick={() => selectVerse(v.verse)} className={`min-h-11 min-w-10 shrink-0 select-none rounded-lg text-xs font-semibold ${selected ? "bg-brown/10 text-brown" : "text-muted hover:bg-brown/5"}`}>{v.verse}</button>
            <span data-scripture-verse={v.verse} className="scripture-text min-w-0 flex-1 select-text whitespace-pre-line text-dark" style={{ fontSize: `${readingSize}px`, lineHeight: 1.85 }}>
              {verseSegments(v, highlights, translation).map((segment, i) => {
                const h = segment.highlights.at(-1);
                const style = h && HIGHLIGHT_COLORS.find(c => c.id === h.color);
                return style ? <mark key={i} className="rounded-sm text-inherit decoration-clone" style={{ backgroundColor: style.bg, boxShadow: `0 2px 0 ${style.border}` }}>{segment.text}</mark> : <span key={i}>{segment.text}</span>;
              })}
            </span>
          </div>
          {startingHere.length > 0 && <div className="ml-11 mt-1 flex flex-wrap gap-2">{startingHere.map(h => <button key={highlightId(h)} type="button" disabled={busy} onClick={() => editHighlight(h)} className="min-h-10 max-w-full rounded-lg border border-brown/10 px-2 py-1 text-left text-xs text-brown hover:bg-brown/5"><span aria-hidden="true" className="mr-1 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: HIGHLIGHT_COLORS.find(c => c.id === h.color)?.border }} />Edit {isPhrase(highlightRange(h)) ? "phrase" : "highlight"}{h.note ? " · Private note" : ""}</button>)}</div>}
        </div>;
      })}
    </div>
    {range && first && last && <section ref={editor} aria-label="Highlight editor" className="scroll-mt-6 mb-6 rounded-2xl border border-accent-gold/40 bg-cream p-4 sm:p-5 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div><p className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted">{editing ? "Edit highlight" : "Selected passage"}</p><h2 className="font-serif text-xl text-brown">{reference} <span className="font-sans text-xs text-muted">{translationLabel(translation)}</span></h2></div>
        <button type="button" className={action} disabled={busy} onClick={closeEditor}>{editing ? "Cancel" : "Clear"}</button>
      </div>
      <blockquote className="mb-4 max-h-36 overflow-auto whitespace-pre-line border-l-2 border-accent-gold pl-3 text-sm leading-relaxed text-dark">{quote}</blockquote>
      {editing && <div className="mb-4 flex flex-wrap gap-2">
        <button type="button" className={action} disabled={busy} onClick={() => { selectionIntent.current = "adjust"; setMessage("Select new words in the passage to adjust this highlight, then save your changes."); passageRoot.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>Reselect text</button>
        <button type="button" className={action} disabled={busy} onClick={closeEditor}>New highlight</button>
      </div>}
      <div className="mb-3 grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-muted">First verse<select aria-label="First verse" className={control} disabled={busy} value={range.verse} onChange={e => { const verse = Number(e.target.value); setRange({ verse, endVerse: Math.max(verse, range.endVerse), startOffset: null, endOffset: null }); }}>{verses.map(v => <option key={v.verse} value={v.verse}>{v.verse}</option>)}</select></label>
        <label className="flex flex-col gap-1 text-xs font-medium text-muted">Last verse<select aria-label="Last verse" className={control} disabled={busy} value={range.endVerse} onChange={e => { const endVerse = Number(e.target.value); setRange({ verse: Math.min(range.verse, endVerse), endVerse, startOffset: null, endOffset: null }); }}>{verses.map(v => <option key={v.verse} value={v.verse}>{v.verse}</option>)}</select></label>
      </div>
      {isPhrase(range) ? <>
        <div className="mb-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex min-w-0 flex-col gap-1 text-xs font-medium text-muted">Start at word<select aria-label="Highlight start word" disabled={busy} className={`${control} w-full`} value={range.startOffset ?? 0} onChange={e => setRange({ ...range, startOffset: Number(e.target.value) })}>
            {!startWords.some(w => w.start === range.startOffset) && <option value={range.startOffset!}>Current character position</option>}
            {startWords.map((w, i) => ({ ...w, number: i + 1 })).filter(w => range.verse !== range.endVerse || w.start < (range.endOffset ?? last.text.length)).map(w => <option key={w.start} value={w.start}>{w.number}. {w.text}</option>)}
          </select></label>
          <label className="flex min-w-0 flex-col gap-1 text-xs font-medium text-muted">End after word<select aria-label="Highlight end word" disabled={busy} className={`${control} w-full`} value={range.endOffset ?? last.text.length} onChange={e => setRange({ ...range, endOffset: Number(e.target.value) })}>
            {!endWords.some(w => w.end === range.endOffset) && <option value={range.endOffset!}>Current character position</option>}
            {endWords.map((w, i) => ({ ...w, number: i + 1 })).filter(w => range.verse !== range.endVerse || w.end > (range.startOffset ?? 0)).map(w => <option key={w.end} value={w.end}>{w.number}. {w.text}</option>)}
          </select></label>
        </div>
        <button type="button" disabled={busy} className="mb-4 min-h-10 text-sm font-medium text-brown underline underline-offset-4" onClick={() => setRange({ ...range, startOffset: null, endOffset: null })}>Use whole verses</button>
      </> : <button type="button" disabled={busy} className="mb-4 min-h-10 text-sm font-medium text-brown underline underline-offset-4" onClick={() => setRange({ ...range, startOffset: 0, endOffset: last.text.length })}>Adjust start and end words</button>}

      <fieldset disabled={busy} className="mb-4"><legend className="mb-2 text-xs font-semibold text-muted">Highlight color</legend><div className="flex flex-wrap gap-2">{HIGHLIGHT_COLORS.map(c => <button type="button" key={c.id} aria-label={`${c.label} highlight`} aria-pressed={color === c.id} onClick={() => setColor(c.id)} className={`min-h-11 rounded-xl border-2 px-3 text-sm text-dark ${color === c.id ? "ring-2 ring-brown/40 ring-offset-2 ring-offset-cream" : ""}`} style={{ backgroundColor: c.bg, borderColor: c.border }}><span aria-hidden="true">{color === c.id ? "✓ " : ""}</span>{c.label}</button>)}</div></fieldset>
      <label className="mb-1 block text-sm font-medium text-brown" htmlFor="highlight-note">Private note <span className="font-normal text-muted">(optional)</span></label>
      <textarea id="highlight-note" maxLength={5000} disabled={busy} value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="What stands out in this passage?" className={`${control} mb-1 w-full resize-y leading-relaxed`} />
      <p className="mb-4 text-xs text-muted">Only you can see this note. {note.length.toLocaleString()}/5,000</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy || !quote.trim()} onClick={() => void save()} className="min-h-11 rounded-xl bg-brown px-5 py-2 text-sm font-semibold text-ivory disabled:opacity-50">{busy ? "Saving…" : editing ? "Save changes" : "Save highlight"}</button>
        <button type="button" className={action} disabled={busy} onClick={() => { router.push(`/journal?verse=${encodeURIComponent(reference.replace(/–/g, "-"))}&text=${encodeURIComponent(quote)}&t=${translation}`); }}>Journal</button>
        <button type="button" className={action} disabled={busy} onClick={() => void copy()}>Copy</button>
        {!isPhrase(range) && <button type="button" className={action} disabled={busy || selectedMemory} onClick={() => { void addMemoryVerse(reference.replace(/–/g, "-"), quote, translation); }}>{selectedMemory ? "Saved to memory" : "Memorize"}</button>}
        {editing && <button type="button" className={`${action} text-struggle`} disabled={busy} onClick={() => void remove(editing)}>Remove highlight</button>}
      </div>
    </section>}

    {range && <button type="button" className="fixed bottom-24 right-5 z-40 block min-h-11 rounded-full bg-brown px-5 py-3 text-sm font-semibold text-ivory shadow-lg md:bottom-6 md:right-8 xl:right-80" onClick={() => editor.current?.scrollIntoView({ behavior: "smooth", block: "start" })}>Edit selection · {range.verse}{range.endVerse > range.verse ? `–${range.endVerse}` : ""}</button>}
  </div>;
}
