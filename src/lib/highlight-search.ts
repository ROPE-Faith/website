import { BIBLE_BOOKS } from "./bible-data";
import { highlightText, passageReference, highlightRange, type BibleHighlight } from "./highlight-model";

export function filterHighlights(items: BibleHighlight[], { search = "", book = "", color = "", notesOnly = false, sort = "newest" }: { search?: string; book?: string; color?: string; notesOnly?: boolean; sort?: string } = {}): BibleHighlight[] {
  const terms = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return items.filter(h => {
    if ((book && h.book !== book) || (color && h.color !== color) || (notesOnly && !h.note.trim())) return false;
    const text = `${passageReference(h.book, h.chapter, highlightRange(h))} ${h.note} ${highlightText(h)} ${h.selection?.translation || ""}`.toLowerCase();
    return terms.every(term => text.includes(term));
  }).sort((a, b) => {
    if (sort === "bible") return BIBLE_BOOKS.findIndex(book => book.name === a.book) - BIBLE_BOOKS.findIndex(book => book.name === b.book) || a.chapter - b.chapter || a.verse - b.verse;
    return (Date.parse(a.createdAt) - Date.parse(b.createdAt)) * (sort === "oldest" ? 1 : -1);
  });
}
