import type { VerseData } from "./scripture";

export const HIGHLIGHT_COLORS = [
  { id: "gold", bg: "rgba(196,162,101,0.28)", border: "#a17c39", label: "Gold" },
  { id: "green", bg: "rgba(109,140,92,0.24)", border: "#6d8c5c", label: "Green" },
  { id: "blue", bg: "rgba(70,130,180,0.22)", border: "#4682b4", label: "Blue" },
  { id: "red", bg: "rgba(184,107,78,0.24)", border: "#b86b4e", label: "Rose" },
] as const;
export type HighlightColor = typeof HIGHLIGHT_COLORS[number]["id"];

export interface PassageRange {
  verse: number;
  endVerse: number;
  startOffset: number | null;
  endOffset: number | null;
}
export interface HighlightSelection {
  endVerse: number;
  translation: string;
  startOffset: number | null;
  endOffset: number | null;
  verses: VerseData[];
}
export interface BibleHighlight {
  id?: string; // Missing only in original backups. Normalize without changing their identity.
  book: string;
  chapter: number;
  verse: number;
  color: string;
  note: string;
  createdAt: string;
  selection?: HighlightSelection | null;
}

export function highlightId(h: Pick<BibleHighlight, "id" | "book" | "chapter" | "verse">): string {
  return h.id || `${h.book}_${h.chapter}_${h.verse}`;
}
export function highlightRange(h: BibleHighlight): PassageRange {
  return { verse: h.verse, endVerse: h.selection?.endVerse ?? h.verse, startOffset: h.selection?.startOffset ?? null, endOffset: h.selection?.endOffset ?? null };
}
export function sameRange(a: PassageRange | null, b: PassageRange): boolean {
  return !!a && a.verse === b.verse && a.endVerse === b.endVerse && a.startOffset === b.startOffset && a.endOffset === b.endOffset;
}
export function newSelectionAction(draft: { range: PassageRange | null; editing: BibleHighlight | null; color: string; note: string }, intent: "new" | "adjust"): "new" | "adjust" | "blocked" {
  if (!draft.editing || intent === "adjust") return "adjust";
  if (draft.note !== draft.editing.note || draft.color !== draft.editing.color || !sameRange(draft.range, highlightRange(draft.editing))) return "blocked";
  return "new";
}
export function isPhrase(range: Pick<PassageRange, "startOffset" | "endOffset">): boolean {
  return range.startOffset !== null || range.endOffset !== null;
}
export function passageReference(book: string, chapter: number, range: Pick<PassageRange, "verse" | "endVerse">): string {
  return `${book} ${chapter}:${range.verse}${range.endVerse > range.verse ? `–${range.endVerse}` : ""}`;
}
export function rangeText(range: PassageRange, verses: VerseData[]): string {
  return verses.filter(v => v.verse >= range.verse && v.verse <= range.endVerse).map(v => {
    const start = v.verse === range.verse ? range.startOffset ?? 0 : 0;
    const end = v.verse === range.endVerse ? range.endOffset ?? v.text.length : v.text.length;
    return v.text.slice(start, end);
  }).join("\n");
}
export function highlightText(h: BibleHighlight): string { return rangeText(highlightRange(h), h.selection?.verses || []); }

/** Exact source matching prevents a phrase moving onto different words after a version/text change. */
export function highlightApplies(h: BibleHighlight, translation: string, verse: VerseData): boolean {
  const range = highlightRange(h);
  if (verse.verse < range.verse || verse.verse > range.endVerse) return false;
  if (!isPhrase(range)) return true;
  return h.selection?.translation === translation && h.selection.verses.some(v => v.verse === verse.verse && v.text === verse.text) === true;
}

export function verseSegments(verse: VerseData, highlights: BibleHighlight[], translation: string): { text: string; highlights: BibleHighlight[] }[] {
  const spans = highlights.filter(h => highlightApplies(h, translation, verse)).map(h => {
    const range = highlightRange(h);
    return { h, start: verse.verse === range.verse ? range.startOffset ?? 0 : 0, end: verse.verse === range.endVerse ? range.endOffset ?? verse.text.length : verse.text.length };
  });
  const boundaries = [...new Set([0, verse.text.length, ...spans.flatMap(s => [s.start, s.end])])].filter(n => n >= 0 && n <= verse.text.length).sort((a, b) => a - b);
  return boundaries.slice(0, -1).map((start, index) => ({
    text: verse.text.slice(start, boundaries[index + 1]),
    highlights: spans.filter(s => s.start <= start && s.end >= boundaries[index + 1]).map(s => s.h),
  }));
}

export function wordBounds(text: string): { text: string; start: number; end: number }[] {
  return Array.from(text.matchAll(/\S+/gu), match => ({ text: match[0], start: match.index!, end: match.index! + match[0].length }));
}

/** Read only Scripture text nodes, excluding verse numbers, tools and private notes. */
export function readTextSelection(root: HTMLElement, selection: Selection | null): PassageRange | null {
  if (!selection || selection.isCollapsed || !selection.rangeCount) return null;
  const range = selection.getRangeAt(0);
  const elementFor = (node: Node): HTMLElement | null => (node.nodeType === 1 ? node as Element : node.parentElement)?.closest<HTMLElement>("[data-scripture-verse]") ?? null;
  const first = elementFor(range.startContainer), last = elementFor(range.endContainer);
  if (!first || !last || !root.contains(first) || !root.contains(last)) return null;
  const offset = (element: HTMLElement, node: Node, end: number) => {
    const prefix = element.ownerDocument.createRange();
    prefix.selectNodeContents(element);
    prefix.setEnd(node, end);
    return prefix.toString().length;
  };
  const startOffset = offset(first, range.startContainer, range.startOffset);
  const endOffset = offset(last, range.endContainer, range.endOffset);
  const verse = Number(first.dataset.scriptureVerse), endVerse = Number(last.dataset.scriptureVerse);
  if (verse === endVerse && startOffset >= endOffset) return null;
  return { verse, endVerse, startOffset, endOffset };
}
