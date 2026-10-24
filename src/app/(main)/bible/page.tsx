"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { 
  BIBLE_BOOKS, 
  BOOK_CHAPTERS, 
  getTranslation, 
  setTranslation as saveTranslation, 
  TRANSLATIONS, 
  fetchChapterVerses, 
  getBibleHistory,
  updateBibleHistory,
} from "@/lib/store";
import { getChapterCommentPreviews, getVerseComments, postVerseComment, voteComment, deleteVerseComment } from "@/lib/community-actions";
import { useAuth, useUser } from "@clerk/nextjs";
import StudyReader from "@/components/bible/StudyReader";
import { isTranslation, type VerseData } from "@/lib/scripture";

function BibleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const requestedBook = searchParams.get("b");
  const urlBook = BIBLE_BOOKS.some(b => b.name === requestedBook) ? requestedBook : null;
  const parsedChapter = Number(searchParams.get("c") || "1");
  const urlChapter = Number.isInteger(parsedChapter) && parsedChapter > 0 && parsedChapter <= (BOOK_CHAPTERS[urlBook || "John"] || 1) ? parsedChapter : 1;
  const urlTranslation = searchParams.get("t");
  const urlMode = searchParams.get("m");

  const [book, setBook] = useState(urlBook || "John");
  const [chapter, setChapter] = useState(urlChapter || 1);
  const [isInitializing, setIsInitializing] = useState(true);
  const [translation, setTranslationState] = useState("kjv");
  const [communityMode, setCommunityMode] = useState(urlMode === "community");
  const [verses, setVerses] = useState<VerseData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
  const [showBookPicker, setShowBookPicker] = useState(false);
  const [bookSearch, setBookSearch] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [chaptersExpanded, setChaptersExpanded] = useState(false);
  const [showDiscussion, setShowDiscussion] = useState(false);
  const [commentPreviews, setCommentPreviews] = useState<Record<string, any>>({});
  const { userId: currentUserId } = useAuth();
  const chapterRequest = useRef(0);

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
    setTranslationState(urlTranslation && isTranslation(urlTranslation) ? urlTranslation : getTranslation());
    
    const hist = getBibleHistory();
    setHistory(hist);
    
    if (!urlBook && hist.length > 0) {
      const lastBook = hist[0].book;
      const lastChapter = hist[0].chapter;
      setBook(lastBook);
      setChapter(lastChapter);
      
      // Update URL to match
      const params = new URLSearchParams(window.location.search);
      params.set("b", lastBook);
      params.set("c", lastChapter.toString());
      params.set("m", communityMode ? "community" : "personal");
      router.replace(`${pathname}?${params.toString()}`);
    }
    setIsInitializing(false);

  }, []);

  useEffect(() => {
    if (urlTranslation && isTranslation(urlTranslation)) setTranslationState(urlTranslation);
  }, [urlTranslation]);

  // Sync URL when state changes
  const syncUrl = useCallback((newBook: string, newChapter: number, isCommunity: boolean) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("b", newBook);
    params.set("c", newChapter.toString());
    params.set("m", isCommunity ? "community" : "personal");
    params.set("t", translation);
    params.delete("h");
    router.replace(`${pathname}?${params.toString()}`);
  }, [searchParams, pathname, router, translation]);

  // Fetch chapter when book/chapter/translation changes
  const loadChapter = useCallback(async (silent = false) => {
    if (isInitializing) return;
    const request = silent ? chapterRequest.current : ++chapterRequest.current;
    
    if (!silent) {
      setLoading(true);
      setError("");
      setSelectedVerse(null);
    }

    try {
      if (!silent) {
        const data = await fetchChapterVerses(book, chapter, translation);
        if (request !== chapterRequest.current) return;
        setVerses(data);
      }
      
      // Fetch previews if in community mode
      if (communityMode) {
        const cp = await getChapterCommentPreviews(book, chapter.toString());
        if (request !== chapterRequest.current) return;
        setCommentPreviews(cp);
      } else if (!silent) {
        setCommentPreviews({});
      }

      if (!silent) {
        updateBibleHistory(book, chapter);
        setHistory(getBibleHistory());
      }
    } catch (cause) {
      if (!silent && request === chapterRequest.current) {
        setError(cause instanceof Error ? cause.message : "Could not load this chapter. Please try again.");
        setVerses([]);
      }
    } finally {
      if (!silent && request === chapterRequest.current) setLoading(false);
    }
  }, [book, chapter, translation, communityMode, isInitializing]);

  useEffect(() => {
    loadChapter();
    const interval = setInterval(() => loadChapter(true), 30000);
    return () => {
      clearInterval(interval);
      chapterRequest.current++;
    };
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

  const filteredBooks = bookSearch
    ? BIBLE_BOOKS.filter(b => b.name.toLowerCase().includes(bookSearch.toLowerCase()))
    : BIBLE_BOOKS;

  const otBooks = filteredBooks.filter(b => BIBLE_BOOKS.indexOf(b) < 39);
  const ntBooks = filteredBooks.filter(b => BIBLE_BOOKS.indexOf(b) >= 39);

  return (
    <div className="px-5 pt-6 pb-8" style={{ animation: "fadeIn 0.4s ease-out both" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-serif text-2xl text-brown mb-0.5">Bible</h1>
          <p className="text-muted text-sm">Read, highlight, journal</p>
        </div>
        <select
          aria-label="Bible translation"
          value={translation}
          onChange={(e) => {
            const value = e.target.value; setTranslationState(value); saveTranslation(value);
            const params = new URLSearchParams(searchParams.toString()); params.set("t", value); params.delete("h");
            router.replace(`${pathname}?${params.toString()}`, { scroll: false });
          }}
          className="max-w-[50%] min-h-11 px-2 py-1.5 bg-ivory border border-brown/10 rounded-lg text-dark text-sm focus:outline-none"
        >
          {TRANSLATIONS.map(t => (
            <option key={t.id} value={t.id}>{t.label} — {t.name}</option>
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
        <div role="alert" className="text-center py-12 px-6 bg-red-400/5 rounded-2xl border border-red-400/10">
          <p className="text-red-400/80 text-sm mb-4">{error}</p>
          <button onClick={() => loadChapter()} className="text-xs text-red-500 font-medium underline underline-offset-4">Try again</button>
        </div>
      )}

      {!loading && !error && verses.length > 0 && !communityMode && (
        <StudyReader key={book + chapter + translation} book={book} chapter={chapter} translation={translation} verses={verses} requestedHighlight={searchParams.get("h")} />
      )}
      {!loading && !error && verses.length > 0 && communityMode && (
        <div className="mb-8">
          {verses.map(v => <div key={v.verse} className="mb-3 rounded-xl border border-brown/10 p-3">
            <button type="button" onClick={() => { setSelectedVerse(v.verse); setShowDiscussion(selectedVerse === v.verse ? !showDiscussion : true); }} aria-expanded={selectedVerse === v.verse && showDiscussion} className="w-full text-left text-dark text-base leading-relaxed">
              <span className="mr-3 text-xs font-semibold text-muted">{v.verse}</span><span className="whitespace-pre-line">{v.text}</span>
              <span className="mt-2 block text-xs font-medium text-brown">{selectedVerse === v.verse && showDiscussion ? "Close discussion" : "Discuss this verse"}</span>
            </button>
            {commentPreviews[v.verse] && selectedVerse !== v.verse && <p className="mt-2 border-l-2 border-accent-gold/30 pl-3 text-sm text-muted line-clamp-2">{commentPreviews[v.verse].content}</p>}
            {selectedVerse === v.verse && showDiscussion && <VerseDiscussionView key={book + chapter + v.verse} book={book} chapter={String(chapter)} verse={String(v.verse)} verseText={v.text} onClose={() => setShowDiscussion(false)} onCommentPosted={comment => setCommentPreviews(prev => ({ ...prev, [v.verse]: comment }))} onCommentDeleted={id => setCommentPreviews(prev => { const next = { ...prev }; if (next[v.verse]?.id === id) delete next[v.verse]; return next; })} />}
          </div>)}
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

function VerseDiscussionView({ book, chapter, verse, verseText, onClose, onCommentPosted, onCommentDeleted }: { book: string; chapter: string; verse: string; verseText: string; onClose: () => void; onCommentPosted?: (c: any) => void; onCommentDeleted?: (id: string) => void }) {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const { userId } = useAuth();
  const { user } = useUser();

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
    
    const commentText = newComment;
    setNewComment("");
    setPosting(true);

    const tempId = `temp-${Date.now()}`;
    const optimisticComment = {
      id: tempId,
      userId,
      content: commentText,
      createdAt: new Date().toISOString(),
      profile: {
        displayName: user?.fullName || user?.username || "You",
        imageUrl: user?.imageUrl,
      },
      score: 0,
      userVote: null,
    };

    setComments(prev => [optimisticComment, ...prev]);
    onCommentPosted?.(optimisticComment);

    try {
      await postVerseComment(book, chapter, verse, commentText, verseText);
      loadComments();
    } catch (err) {
      console.error(err);
      setComments(prev => prev.filter(c => c.id !== tempId));
      setNewComment(commentText);
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

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    
    // Optimistic delete
    setComments(prev => prev.filter(c => c.id !== id));
    onCommentDeleted?.(id);
    
    try {
      await deleteVerseComment(id);
      loadComments();
    } catch (err: any) {
      console.error(err);
      loadComments(); // Restore on error
    } finally {
      setDeletingId(null);
    }
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
                    {userId && c.userId === userId && (
                      <button
                        onClick={() => setConfirmDeleteId(c.id)}
                        disabled={deletingId === c.id}
                        className="ml-auto text-[9px] uppercase font-bold tracking-widest text-red-400/60 hover:text-red-400 transition-colors disabled:opacity-50"
                      >
                        {deletingId === c.id ? "..." : "Delete"}
                      </button>
                    )}
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
      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-cream-dark/40 backdrop-blur-sm rounded-xl" style={{ animation: "fadeIn 0.2s ease-out both" }}>
          <div className="bg-ivory rounded-2xl p-5 shadow-xl border border-brown/10 max-w-[280px] w-full" style={{ animation: "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) both" }}>
            <h3 className="font-serif text-lg text-dark mb-1">Delete Reflection?</h3>
            <p className="text-[11px] text-muted mb-4 leading-relaxed">This action cannot be undone. It will be permanently removed.</p>
            <div className="flex gap-2">
              <button 
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-2 bg-brown/5 text-brown text-[9px] font-bold uppercase tracking-widest rounded-lg hover:bg-brown/10 transition"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  handleDelete(confirmDeleteId);
                  setConfirmDeleteId(null);
                }}
                className="flex-1 py-2 bg-red-400/10 text-red-500 text-[9px] font-bold uppercase tracking-widest rounded-lg hover:bg-red-400/20 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
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
