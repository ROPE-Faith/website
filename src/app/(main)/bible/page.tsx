"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { 
  BIBLE_BOOKS, 
  BOOK_CHAPTERS, 
  getTranslation, 
  setTranslation as saveTranslation, 
  TRANSLATIONS, 
  fetchChapterVerses, 
  getHighlightsForChapter, 
  addBibleHighlight, 
  removeBibleHighlight, 
  getBibleHistory,
  updateBibleHistory,
  addMemoryVerse,
  removeMemoryVerse,
  getMemoryVerses,
  type BibleHighlight 
} from "@/lib/store";
import { getPublicHighlights, addPublicHighlight, getChapterCommentPreviews, getVerseComments, postVerseComment, voteComment } from "@/lib/community-actions";
import { useAuth } from "@clerk/nextjs";

const HIGHLIGHT_COLORS = [
  { id: "gold", bg: "rgba(196,162,101,0.2)", border: "rgba(196,162,101,0.4)", label: "Gold" },
  { id: "green", bg: "rgba(34,139,34,0.15)", border: "rgba(34,139,34,0.35)", label: "Green" },
  { id: "blue", bg: "rgba(70,130,180,0.15)", border: "rgba(70,130,180,0.35)", label: "Blue" },
  { id: "red", bg: "rgba(178,34,34,0.15)", border: "rgba(178,34,34,0.35)", label: "Red" },
] as const;

function getHighlightStyle(color: string) {
  return HIGHLIGHT_COLORS.find(c => c.id === color) || HIGHLIGHT_COLORS[0];
}

interface VerseData {
  verse: number;
  text: string;
}

function BibleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const urlBook = searchParams.get("b");
  const urlChapter = parseInt(searchParams.get("c") || "1");
  const urlMode = searchParams.get("m");

  const [book, setBook] = useState(urlBook || "John");
  const [chapter, setChapter] = useState(urlChapter || 1);
  const [translation, setTranslationState] = useState("kjv");
  const [communityMode, setCommunityMode] = useState(urlMode === "community");
  const [verses, setVerses] = useState<VerseData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [highlights, setHighlights] = useState<BibleHighlight[]>([]);
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showBookPicker, setShowBookPicker] = useState(false);
  const [bookSearch, setBookSearch] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [chaptersExpanded, setChaptersExpanded] = useState(false);
  const [showDiscussion, setShowDiscussion] = useState(false);
  const [publicHighlightsData, setPublicHighlightsData] = useState<any[]>([]);
  const [commentPreviews, setCommentPreviews] = useState<Record<string, any>>({});
  const [memoryVerses, setMemoryVerses] = useState<{ verse: string; text: string }[]>([]);
  const { userId: currentUserId } = useAuth();

  const maxChapter = BOOK_CHAPTERS[book] || 1;

  // Sync state with URL params
  useEffect(() => {
    if (urlBook && urlBook !== book) {
      setBook(urlBook);
      setChapter(urlChapter || 1);
    } else if (urlChapter && urlChapter !== chapter) {
      setChapter(urlChapter);
    }
  }, [urlBook, urlChapter]);

  // Load initial translation preference and history
  useEffect(() => {
    setTranslationState(getTranslation());
    setHistory(getBibleHistory());
    setMemoryVerses(getMemoryVerses());

    const handleMemoryChange = (e: any) => {
      setMemoryVerses(e.detail.verses);
    };

    window.addEventListener("rope-memory-update", handleMemoryChange as any);
    return () => {
      window.removeEventListener("rope-memory-update", handleMemoryChange as any);
    };
  }, []);

  // Sync URL when state changes
  const syncUrl = useCallback((newBook: string, newChapter: number, isCommunity: boolean) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("b", newBook);
    params.set("c", newChapter.toString());
    params.set("m", isCommunity ? "community" : "personal");
    router.replace(`${pathname}?${params.toString()}`);
  }, [searchParams, pathname, router]);

  // Fetch chapter when book/chapter/translation changes
  const loadChapter = useCallback(async () => {
    setLoading(true);
    setError("");
    setSelectedVerse(null);
    setShowColorPicker(false);

    try {
      const data = await fetchChapterVerses(book, chapter, translation);
      setVerses(data);
      setHighlights(getHighlightsForChapter(book, chapter));
      
      // Fetch previews if in community mode
      if (communityMode) {
        const cp = await getChapterCommentPreviews(book, chapter.toString());
        setCommentPreviews(cp);
      } else {
        setCommentPreviews({});
      }

      updateBibleHistory(book, chapter);
      setHistory(getBibleHistory());
    } catch {
      setError("Could not load chapter. Try a different translation.");
      setVerses([]);
    } finally {
      setLoading(false);
    }
  }, [book, chapter, translation, communityMode]);

  useEffect(() => {
    loadChapter();
  }, [loadChapter]);

  function changePassage(newBook: string, newChapter: number) {
    setBook(newBook);
    setChapter(newChapter);
    syncUrl(newBook, newChapter, communityMode);
    setShowBookPicker(false);
    setChaptersExpanded(false); // Reset expansion when changing book
  }

  function handleModeToggle(isCommunity: boolean) {
    setCommunityMode(isCommunity);
    syncUrl(book, chapter, isCommunity);
  }

  function handleHighlight(verseNum: number, color: string) {
    const existing = highlights.find(h => h.verse === verseNum);
    if (existing && existing.color === color) {
      removeBibleHighlight(book, chapter, verseNum);
    } else {
      addBibleHighlight(book, chapter, verseNum, color);
    }
    setHighlights(getHighlightsForChapter(book, chapter));
    setShowColorPicker(false);
    setSelectedVerse(null);
  }


  const filteredBooks = bookSearch
    ? BIBLE_BOOKS.filter(b => b.name.toLowerCase().includes(bookSearch.toLowerCase()))
    : BIBLE_BOOKS;

  const otBooks = filteredBooks.slice(0, 39);
  const ntBooks = filteredBooks.slice(39);

  return (
    <div className="px-5 pt-6 pb-8" style={{ animation: "fadeIn 0.4s ease-out both" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-serif text-2xl text-brown mb-0.5">Bible</h1>
          <p className="text-muted text-sm">Read, highlight, journal</p>
        </div>
        <select
          value={translation}
          onChange={(e) => { setTranslationState(e.target.value); saveTranslation(e.target.value); }}
          className="px-2 py-1.5 bg-ivory border border-brown/10 rounded-lg text-dark text-base focus:outline-none"
        >
          {TRANSLATIONS.map(t => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Community Toggle */}
      <div className="flex items-center justify-center mb-6">
        <div className="inline-flex p-1 bg-brown/5 rounded-2xl">
          <button 
            onClick={() => handleModeToggle(false)}
            className={`px-6 py-2 text-[10px] uppercase font-bold tracking-widest rounded-xl transition ${!communityMode ? "bg-brown text-ivory shadow-lg shadow-brown/20" : "text-muted hover:text-brown"}`}
          >
            Personal
          </button>
          <button 
            onClick={() => handleModeToggle(true)}
            className={`px-6 py-2 text-[10px] uppercase font-bold tracking-widest rounded-xl transition ${communityMode ? "bg-brown text-ivory shadow-lg shadow-brown/20" : "text-muted hover:text-brown"}`}
          >
            Community
            <span className="ml-1 opacity-50">✦</span>
          </button>
        </div>
      </div>

      {/* History / Pick up where you left off */}
      {history.length > 0 && !showBookPicker && (
        <div className="mb-5 overflow-x-auto no-scrollbar">
          <div className="flex gap-2">
            {history.map((h, i) => (
              <button
                key={`${h.book}-${h.chapter}-${i}`}
                onClick={() => changePassage(h.book, h.chapter)}
                className={`flex flex-col items-start px-3 py-2 rounded-xl border transition-all whitespace-nowrap min-w-[120px] ${h.book === book && h.chapter === chapter ? "border-brown bg-brown/5" : "border-brown/10 bg-ivory hover:bg-brown/5"}`}
              >
                <span className="text-[10px] text-muted uppercase tracking-wider mb-0.5">{i === 0 ? "Last Read" : "Recent"}</span>
                <span className="text-xs font-medium text-brown">{h.book} {h.chapter}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Book + Chapter selector */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => { setShowBookPicker(!showBookPicker); setBookSearch(""); }}
          className="flex-1 px-3 py-2.5 bg-ivory border border-brown/10 rounded-xl text-dark text-sm font-medium text-left truncate flex items-center justify-between"
        >
          <span>{book}</span>
          <span className="text-muted text-xs">▾</span>
        </button>
        <div className="flex items-center gap-1">
          <button
            onClick={() => changePassage(book, Math.max(1, chapter - 1))}
            disabled={chapter <= 1}
            className="w-10 h-10 flex items-center justify-center rounded-xl border border-brown/10 text-muted hover:text-brown disabled:opacity-30 transition bg-ivory"
          >
            ‹
          </button>
          <span className="px-3 py-2.5 bg-ivory border border-brown/10 rounded-xl text-sm font-medium text-dark min-w-[64px] text-center">Ch. {chapter}</span>
          <button
            onClick={() => changePassage(book, Math.min(maxChapter, chapter + 1))}
            disabled={chapter >= maxChapter}
            className="w-10 h-10 flex items-center justify-center rounded-xl border border-brown/10 text-muted hover:text-brown disabled:opacity-30 transition bg-ivory"
          >
            ›
          </button>
        </div>
      </div>

      {/* Book picker dropdown */}
      {showBookPicker && (
        <div className="card-surface rounded-2xl p-4 mb-4 max-h-[70vh] overflow-y-auto z-30" style={{ animation: "fadeIn 0.2s ease-out both" }}>
          <input
            value={bookSearch}
            onChange={(e) => setBookSearch(e.target.value)}
            placeholder="Search books..."
            className="w-full px-4 py-3 bg-ivory border border-brown/10 rounded-xl text-dark text-base focus:outline-none placeholder:text-muted/50 mb-4"
            autoFocus
          />
          {otBooks.length > 0 && (
            <>
              <p className="text-[10px] text-muted uppercase tracking-wider mb-3 font-medium pl-1">Old Testament</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                {otBooks.map(b => (
                  <button
                    key={b.name}
                    onClick={() => changePassage(b.name, 1)}
                    className={`px-3 py-2 text-xs rounded-lg text-left truncate transition ${book === b.name ? "bg-brown text-ivory font-medium" : "text-dark bg-ivory border border-brown/5 hover:bg-brown/5"}`}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            </>
          )}
          {ntBooks.length > 0 && (
            <>
              <p className="text-[10px] text-muted uppercase tracking-wider mb-3 font-medium pl-1">New Testament</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ntBooks.map(b => (
                  <button
                    key={b.name}
                    onClick={() => changePassage(b.name, 1)}
                    className={`px-3 py-2 text-xs rounded-lg text-left truncate transition ${book === b.name ? "bg-brown text-ivory font-medium" : "text-dark bg-ivory border border-brown/5 hover:bg-brown/5"}`}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Chapter quick-jump (Collapsible for many chapters) */}
      {maxChapter > 1 && !showBookPicker && (
        <div className="mb-6">
          <div className={`flex flex-wrap gap-2 p-1 overflow-hidden transition-all duration-500 relative ${!chaptersExpanded && maxChapter > 30 ? "max-h-[100px]" : "max-h-[2000px]"}`}>
            {Array.from({ length: maxChapter }, (_, i) => i + 1).map(ch => (
              <button
                key={ch}
                onClick={() => changePassage(book, ch)}
                className={`min-w-[40px] h-10 text-xs rounded-xl transition ${ch === chapter ? "bg-brown text-ivory font-medium shadow-md shadow-brown/20" : "text-muted bg-ivory border border-brown/10 hover:border-brown/30 hover:text-brown"}`}
              >
                {ch}
              </button>
            ))}
            
            {!chaptersExpanded && maxChapter > 30 && (
              <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-cream/90 to-transparent pointer-events-none" />
            )}
          </div>
          
          {maxChapter > 30 && (
            <button
              onClick={() => setChaptersExpanded(!chaptersExpanded)}
              className="w-full mt-2 py-2 text-[10px] text-brown bg-brown/5 rounded-xl uppercase tracking-widest font-bold hover:bg-brown/10 transition"
            >
              {chaptersExpanded ? "Collapse chapters" : `Show all ${maxChapter} chapters`}
            </button>
          )}
        </div>
      )}

      {/* Loading / Error */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-8 h-8 border-2 border-brown/20 border-t-brown rounded-full animate-spin" />
          <p className="text-muted font-serif italic text-sm">Opening the scroll...</p>
        </div>
      )}
      {error && (
        <div className="text-center py-12 px-6 bg-red-400/5 rounded-2xl border border-red-400/10">
          <p className="text-red-400/80 text-sm mb-4">{error}</p>
          <button onClick={loadChapter} className="text-xs text-red-500 font-medium underline underline-offset-4">Try again</button>
        </div>
      )}

      {/* Verses */}
      {!loading && !error && verses.length > 0 && (
        <div className="space-y-0.5 mb-8">
          {verses.map(v => {
            const highlight = highlights.find(h => h.verse === v.verse);
            const hStyle = !communityMode && highlight ? getHighlightStyle(highlight.color) : null;
            
            const isSelected = selectedVerse === v.verse;

            return (
              <div key={v.verse} className="relative">
                <div
                  onClick={() => {
                    if (selectedVerse === v.verse) {
                      setSelectedVerse(null);
                      setShowColorPicker(false);
                    } else {
                      setSelectedVerse(v.verse);
                      setShowColorPicker(false);
                    }
                  }}
                  className={`px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 ${isSelected ? "bg-cream-dark/30 ring-1 ring-brown/10 shadow-sm" : "hover:bg-cream/30"}`}
                  style={hStyle ? { backgroundColor: hStyle.bg, borderLeft: `4px solid ${hStyle.border}` } : { borderLeft: "4px solid transparent" }}
                >
                  <span className="text-muted/30 text-[10px] font-mono mr-3 select-none inline-block w-4">{v.verse}</span>
                  <span className="text-dark text-[15px] leading-relaxed tracking-wide">{v.text}</span>
                </div>

                 {/* Verse action bar */}
                {isSelected && (
                  <div
                    className="flex items-center gap-1.5 mt-2 ml-4 mb-3 relative z-40 pointer-events-auto"
                    style={{ animation: "fadeIn 0.2s ease-out both" }}
                  >
                    {!communityMode && (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowColorPicker(!showColorPicker); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold text-muted hover:text-brown bg-ivory border border-brown/10 rounded-xl transition shadow-sm"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                          </svg>
                          Highlight
                        </button>

                        <button
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            const ref = `${book} ${chapter}:${v.verse}`;
                            const text = `${v.verse} ${v.text}`;
                            router.push(`/journal?verse=${encodeURIComponent(ref)}&text=${encodeURIComponent(text)}&t=${translation}`);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold text-muted hover:text-brown bg-ivory border border-brown/10 rounded-xl transition shadow-sm"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                          </svg>
                          Journal
                        </button>

                        <div className="flex flex-col items-start gap-0.5">
                          <button
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              const ref = `${book} ${chapter}:${v.verse}`;
                              const isSaved = memoryVerses.some(mv => mv.verse === ref);
                              if (isSaved) {
                                removeMemoryVerse(ref);
                              } else {
                                addMemoryVerse(ref, v.text);
                              }
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold border rounded-xl transition shadow-sm ${memoryVerses.some(mv => mv.verse === `${book} ${chapter}:${v.verse}`) ? "bg-accent-gold/20 text-accent-gold border-accent-gold/40" : "text-muted hover:text-brown bg-ivory border-brown/10"}`}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill={memoryVerses.some(mv => mv.verse === `${book} ${chapter}:${v.verse}`) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                            {memoryVerses.some(mv => mv.verse === `${book} ${chapter}:${v.verse}`) ? "Added to Memory" : "Memorize"}
                          </button>
                          {memoryVerses.some(mv => mv.verse === `${book} ${chapter}:${v.verse}`) && (
                            <a href="/me" className="text-[9px] text-accent-gold/60 underline hover:text-accent-gold ml-3 transition-all animate-in fade-in slide-in-from-top-1">
                              View in Profile
                            </a>
                          )}
                        </div>
                      </>
                    )}

                    {communityMode && (
                      <button
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setShowDiscussion(!showDiscussion); 
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold border rounded-xl transition shadow-sm active:scale-95 z-50 pointer-events-auto ${showDiscussion ? "bg-brown text-ivory border-brown" : "text-muted hover:text-brown bg-ivory border-brown/10"}`}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-7.6 8.38 8.38 0 0 1 3.8.9L21 3z" />
                        </svg>
                        {showDiscussion ? "Close Discussion" : "Discuss"}
                      </button>
                    )}
                  </div>
                )}

                {/* Color picker */}
                {isSelected && showColorPicker && (
                  <div className="flex flex-col gap-3 ml-4 mb-3" style={{ animation: "fadeIn 0.2s ease-out both" }}>
                    <div className="flex items-center gap-3">
                      {HIGHLIGHT_COLORS.map(c => (
                        <button
                          key={c.id}
                          onClick={(e) => { e.stopPropagation(); handleHighlight(v.verse, c.id); }}
                          className={`w-9 h-9 rounded-full border-2 transition-transform active:scale-90 ${highlight?.color === c.id ? "ring-2 ring-brown/30 ring-offset-2" : ""}`}
                          style={{ backgroundColor: c.bg, borderColor: c.border }}
                          title={c.label}
                        />
                      ))}
                      {highlight && (
                        <button
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            removeBibleHighlight(book, chapter, v.verse); 
                            setHighlights(getHighlightsForChapter(book, chapter)); 
                            setShowColorPicker(false);
                            setSelectedVerse(null);
                          }}
                          className="w-9 h-9 rounded-full border border-red-400/20 flex items-center justify-center text-red-400 hover:bg-red-400/10 transition"
                          title="Remove Highlight"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Previews & Inline Discussion */}
                <div className="ml-7 mr-3 mt-1 pb-2">
                  {/* Top Reflection Preview */}
                  {communityMode && !isSelected && commentPreviews[v.verse] && (
                    <div 
                      className="p-3 bg-brown/[0.03] border border-brown/5 rounded-xl animate-in fade-in slide-in-from-top-1 duration-300"
                      onClick={(e) => { e.stopPropagation(); setSelectedVerse(v.verse); setShowDiscussion(true); }}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-4 h-4 rounded-full bg-brown/10 flex items-center justify-center text-[8px] font-bold text-brown/40 overflow-hidden">
                          {commentPreviews[v.verse].profile?.imageUrl ? (
                            <img src={commentPreviews[v.verse].profile.imageUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            commentPreviews[v.verse].profile?.displayName?.charAt(0) || "?"
                          )}
                        </div>
                        <span className="text-[10px] font-bold text-brown/60 uppercase tracking-tight">Top Discussion Post</span>
                      </div>
                      <p className="text-xs text-muted line-clamp-2 leading-relaxed italic">"{commentPreviews[v.verse].content}"</p>
                    </div>
                  )}

                  {/* Inline Discussion Area */}
                  {isSelected && showDiscussion && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-400">
                      <VerseDiscussionView 
                        book={book} 
                        chapter={chapter.toString()} 
                        verse={v.verse.toString()} 
                        verseText={v.text}
                        onClose={() => setShowDiscussion(false)}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}


      {/* Chapter navigation footer */}
      {!loading && verses.length > 0 && (
        <div className="flex items-center justify-between pt-8 border-t border-brown/8 mt-4">
          <button
            onClick={() => {
              if (chapter > 1) changePassage(book, chapter - 1);
              else {
                const bookIdx = BIBLE_BOOKS.findIndex(b => b.name === book);
                if (bookIdx > 0) {
                  const prevBook = BIBLE_BOOKS[bookIdx - 1].name;
                  changePassage(prevBook, BOOK_CHAPTERS[prevBook] || 1);
                }
              }
              window.scrollTo(0, 0);
            }}
            disabled={chapter <= 1 && BIBLE_BOOKS.findIndex(b => b.name === book) === 0}
            className="group flex flex-col items-start gap-1 text-muted hover:text-brown disabled:opacity-20 transition"
          >
            <span className="text-[10px] uppercase tracking-widest font-bold">Previous</span>
            <span className="text-xs group-hover:-translate-x-1 transition-transform">← Chapter {chapter > 1 ? chapter - 1 : "Back"}</span>
          </button>
          <div className="flex flex-col items-center">
            <div className="w-1 h-1 bg-brown/20 rounded-full mb-1" />
            <span className="text-muted/40 text-[10px] font-serif italic">{book} {chapter}</span>
          </div>
          <button
            onClick={() => {
              if (chapter < maxChapter) changePassage(book, chapter + 1);
              else {
                const bookIdx = BIBLE_BOOKS.findIndex(b => b.name === book);
                if (bookIdx < BIBLE_BOOKS.length - 1) {
                  changePassage(BIBLE_BOOKS[bookIdx + 1].name, 1);
                }
              }
              window.scrollTo(0, 0);
            }}
            disabled={chapter >= maxChapter && BIBLE_BOOKS.findIndex(b => b.name === book) === BIBLE_BOOKS.length - 1}
            className="group flex flex-col items-end gap-1 text-muted hover:text-brown disabled:opacity-20 transition"
          >
            <span className="text-[10px] uppercase tracking-widest font-bold">Continue</span>
            <span className="text-xs group-hover:translate-x-1 transition-transform">Chapter {chapter < maxChapter ? chapter + 1 : "Next"} →</span>
          </button>
        </div>
      )}

    </div>
  );
}

function VerseDiscussionView({ book, chapter, verse, verseText, onClose }: { book: string; chapter: string; verse: string; verseText: string; onClose: () => void }) {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const { userId } = useAuth();

  const loadComments = async (isLoadMore = false) => {
    if (!isLoadMore) setLoading(true);
    try {
      const data = await getVerseComments(book, chapter, verse, 'top', 10, isLoadMore ? offset + 10 : 0);
      if (isLoadMore) {
        setComments(prev => [...prev, ...data]);
        setOffset(prev => prev + 10);
      } else {
        setComments(data);
        setOffset(0);
      }
      setHasMore(data.length === 10);
    } catch (err) {
      console.error(err);
    } finally {
      if (!isLoadMore) setLoading(false);
    }
  };

  useEffect(() => { loadComments(); }, [book, chapter, verse]);

  const handlePost = async () => {
    if (!newComment.trim() || !userId) return;
    setPosting(true);
    try {
      await postVerseComment(book, chapter, verse, newComment, verseText);
      setNewComment("");
      loadComments();
    } catch (err) {
      console.error(err);
    } finally {
      setPosting(false);
    }
  };

  const handleVote = async (id: string, type: 'up' | 'down') => {
    if (!userId) return;
    setComments(prev => prev.map(c => {
      if (c.id === id) {
        const oldVote = c.userVote;
        const newVote = oldVote === type ? null : type;
        const adjust = newVote === type ? 1 : -1;
        return { ...c, userVote: newVote, score: c.score + adjust };
      }
      return c;
    }));
    await voteComment(id, type);
  };

  return (
    <div className="mt-4 p-4 bg-brown/[0.02] border border-brown/5 rounded-2xl space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-[10px] text-brown font-bold uppercase tracking-widest flex items-center gap-2">
          Conversations <span className="w-1 h-1 bg-brown/20 rounded-full" /> {book} {chapter}:{verse}
        </h4>
        <button onClick={onClose} className="text-muted hover:text-brown transition">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input 
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Share a discussion post..."
          className="flex-1 px-3 py-2 bg-ivory border border-brown/10 rounded-xl text-base text-dark focus:outline-none focus:ring-1 focus:ring-brown/20"
        />
        <button 
          onClick={handlePost}
          disabled={posting || !newComment.trim()}
          className="px-4 bg-brown text-ivory text-[10px] font-bold uppercase tracking-widest rounded-xl disabled:opacity-30 transition shrink-0 whitespace-nowrap"
        >
          {posting ? "..." : "Post"}
        </button>
      </div>

      {/* List */}
      <div className="space-y-4 pt-2">
        {loading ? (
          <div className="py-8 text-center text-xs text-muted italic">Gathering discussions...</div>
        ) : comments.length === 0 ? (
          <div className="py-4 text-center text-xs text-muted/60 italic">No discussions yet. Be the first to share.</div>
        ) : (
          <>
            {comments.map(c => (
              <div key={c.id} className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-brown/5 flex items-center justify-center text-[10px] font-bold text-brown/40 shrink-0 overflow-hidden">
                  {c.profile?.imageUrl ? <img src={c.profile.imageUrl} alt="" className="w-full h-full object-cover" /> : c.profile?.displayName?.charAt(0) || "?"}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[11px] font-bold text-brown/80">{c.profile?.displayName}</span>
                    <span className="text-[9px] text-muted/50">{new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-dark leading-relaxed">{c.content}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <button 
                      onClick={() => handleVote(c.id, 'up')}
                      className={`flex items-center gap-1 text-[10px] font-bold ${c.userVote === 'up' ? "text-accent-gold" : "text-muted hover:text-brown"}`}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill={c.userVote === 'up' ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5"><path d="M7 10l5-5 5 5" /><path d="M12 5v14" /></svg>
                      {c.score}
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {hasMore && (
              <button 
                onClick={() => loadComments(true)}
                className="w-full py-2 text-[10px] text-brown/40 font-bold uppercase tracking-widest hover:text-brown transition"
              >
                Load more discussions
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function BiblePage() {
  return (
    <Suspense fallback={<div className="p-10 text-center font-serif text-muted">Loading Bible...</div>}>
      <BibleContent />
    </Suspense>
  );
}
