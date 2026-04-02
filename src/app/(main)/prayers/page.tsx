"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { getPrayers, addPrayer, deletePrayer, markPrayerAnswered, setPrayerPublic, getRopeEntries, type PrayerItem, type RopeEntry } from "@/lib/store";
import { LampIcon, OliveBranch } from "@/components/Accents";

export default function PrayersPage() {
  const [prayers, setPrayers] = useState<PrayerItem[]>([]);
  const [entries, setEntries] = useState<RopeEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [text, setText] = useState("");
  const [verse, setVerse] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [tab, setTab] = useState<"active" | "answered">("active");
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [answerNote, setAnswerNote] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { userId, isSignedIn } = useAuth();
  
  useEffect(() => {
    setPrayers(getPrayers());
    setEntries(getRopeEntries(userId || undefined));
    setLoaded(true);
  }, [userId]);

  function handleAdd() {
    if (!text.trim()) return;
    addPrayer(text.trim(), verse.trim());
    setPrayers(getPrayers());
    setText("");
    setVerse("");
    setShowForm(false);
  }

  function handleDelete(id: string) {
    if (deletingId === id) {
      deletePrayer(id);
      setPrayers(getPrayers());
      setDeletingId(null);
    } else {
      setDeletingId(id);
    }
  }

  function handleMarkAnswered(id: string) {
    if (!answerNote.trim()) return;
    markPrayerAnswered(id, answerNote.trim());
    setPrayers(getPrayers());
    setAnsweringId(null);
    setAnswerNote("");
  }

  function getRelatedEntries(prayer: PrayerItem): RopeEntry[] {
    const prayerWords = prayer.text.toLowerCase().split(/\s+/).filter(w => w.length > 4);
    const verseRef = prayer.verse?.toLowerCase().trim();

    return entries.filter(entry => {
      // Match on verse reference
      if (verseRef && entry.revelationVerse.toLowerCase().includes(verseRef)) return true;
      // Match on keyword overlap (at least 2 words)
      const entryText = `${entry.observation} ${entry.prayer} ${entry.execution}`.toLowerCase();
      const matchCount = prayerWords.filter(w => entryText.includes(w)).length;
      return matchCount >= 2;
    }).slice(0, 5);
  }

  if (!loaded) return <div className="min-h-[80vh] flex items-center justify-center"><p className="text-muted font-serif">Loading...</p></div>;

  const activePrayers = prayers.filter(p => !p.answeredAt);
  const answeredPrayers = prayers.filter(p => !!p.answeredAt);

  return (
    <div className="px-5 pt-6 pb-8" style={{ animation: "fadeIn 0.4s ease-out both" }}>
      <h1 className="font-serif text-2xl text-brown mb-1">Prayer List</h1>
      <p className="text-muted text-sm mb-6">Concerns on your heart</p>

      {/* Add button */}
      {!showForm && tab === "active" && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 py-3 mb-6 rounded-xl border border-dashed border-brown/15 text-muted text-sm hover:border-brown/30 hover:text-brown transition"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add a prayer
        </button>
      )}

      {/* Quick-add form */}
      {showForm && (
        <div className="card-surface rounded-2xl p-4 mb-6" style={{ animation: "fadeInUp 0.3s ease-out both" }}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What's on your heart?"
            rows={3}
            className="w-full px-3 py-2.5 bg-ivory border border-brown/10 rounded-xl text-dark text-base resize-none focus:outline-none placeholder:text-muted/50 mb-3"
            autoFocus
          />
          <input
            value={verse}
            onChange={(e) => setVerse(e.target.value)}
            placeholder="Related verse (optional)"
            className="w-full px-4 py-3 bg-ivory border border-brown/10 rounded-xl text-dark text-base focus:outline-none placeholder:text-muted/50 mb-4"
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => { setShowForm(false); setText(""); setVerse(""); }}
              className="text-xs text-muted px-3 py-1.5"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={!text.trim()}
              className="text-xs bg-accent-olive/10 text-accent-olive px-4 py-1.5 rounded-lg font-medium disabled:opacity-40"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-brown/[0.04] rounded-xl p-1">
        <button
          onClick={() => setTab("active")}
          className={`flex-1 py-2 text-xs font-medium rounded-lg transition ${tab === "active" ? "bg-ivory text-brown shadow-sm" : "text-muted hover:text-brown"}`}
        >
          Active ({activePrayers.length})
        </button>
        <button
          onClick={() => setTab("answered")}
          className={`flex-1 py-2 text-xs font-medium rounded-lg transition ${tab === "answered" ? "bg-ivory text-brown shadow-sm" : "text-muted hover:text-brown"}`}
        >
          Answered ({answeredPrayers.length})
        </button>
      </div>

      {/* Active prayers */}
      {tab === "active" && (
        <div className="space-y-3">
          {activePrayers.length === 0 ? (
            <div className="flex flex-col items-center py-10">
              <LampIcon className="w-10 h-[52px] mb-4" />
              <p className="text-muted text-sm text-center max-w-xs leading-relaxed">
                Whenever a concern comes to mind, note it here. This is your place to bring everything before Him.
              </p>
              <p className="text-muted/60 text-xs mt-3 italic">
                &ldquo;Cast all your anxiety on Him because He cares for you.&rdquo; &mdash; 1 Peter 5:7
              </p>
            </div>
          ) : (
            activePrayers.map((p, i) => (
              <div
                key={p.id}
                className="card-surface rounded-2xl p-4 border-l-2 border-l-accent-olive/20"
                style={{ animation: "fadeInUp 0.3s ease-out both", animationDelay: `${Math.min(i * 0.05, 0.3)}s` }}
              >
                <p className="text-dark text-sm leading-relaxed">{p.text}</p>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <p className="text-muted text-xs">
                      {new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                    {p.verse && (
                      <span className="text-accent-olive/60 text-xs">&middot; {p.verse}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setAnsweringId(answeringId === p.id ? null : p.id); setAnswerNote(""); }}
                      className="text-[10px] text-accent-gold hover:text-accent-gold/80 transition font-medium"
                    >
                      {answeringId === p.id ? "Cancel" : "✦ Mark answered"}
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className={`text-[10px] transition ${deletingId === p.id ? "text-red-400" : "text-muted/40 hover:text-muted"}`}
                    >
                      {deletingId === p.id ? "Confirm" : "Remove"}
                    </button>
                  </div>
                </div>

                {/* Mark Answered expansion */}
                {answeringId === p.id && (
                  <div className="mt-3 pt-3 border-t border-brown/8" style={{ animation: "fadeInUp 0.2s ease-out both" }}>
                    <textarea
                      value={answerNote}
                      onChange={(e) => setAnswerNote(e.target.value)}
                      placeholder="How did God answer this prayer?"
                      rows={3}
                      className="w-full px-3 py-2.5 bg-ivory border border-brown/10 rounded-xl text-dark text-base resize-none focus:outline-none placeholder:text-muted/50 mb-3"
                      autoFocus
                    />
                    <div className="flex items-center gap-2 mb-4 px-1">
                      <input 
                        type="checkbox" 
                        id="share-toggle"
                        className="w-4 h-4 rounded border-brown/20 text-accent-gold focus:ring-accent-gold/20"
                      />
                      <label htmlFor="share-toggle" className="text-[10px] text-muted uppercase font-bold tracking-wider cursor-pointer">
                        Share with Community
                      </label>
                    </div>

                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => { setAnsweringId(null); setAnswerNote(""); }}
                        className="text-xs text-muted px-3 py-1.5"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          const checkbox = document.getElementById('share-toggle') as HTMLInputElement;
                          handleMarkAnswered(p.id);
                          if (checkbox?.checked) setPrayerPublic(p.id, true);
                        }}
                        disabled={!answerNote.trim()}
                        className="text-xs bg-accent-gold/15 text-accent-gold px-4 py-1.5 rounded-lg font-medium disabled:opacity-40"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Answered prayers */}
      {tab === "answered" && (
        <div className="space-y-3">
          {answeredPrayers.length === 0 ? (
            <div className="flex flex-col items-center py-10">
              <LampIcon className="w-10 h-[52px] mb-4" />
              <p className="text-muted text-sm text-center max-w-xs leading-relaxed">
                When God answers a prayer, mark it here. Build your testimony wall — a record of His faithfulness.
              </p>
            </div>
          ) : (
            answeredPrayers.map((p, i) => {
              const related = getRelatedEntries(p);
              const isExpanded = expandedId === p.id;
              return (
                <div
                  key={p.id}
                  className="rounded-2xl p-4 border border-accent-gold/15 relative overflow-hidden"
                  style={{
                    animation: "fadeInUp 0.3s ease-out both",
                    animationDelay: `${Math.min(i * 0.05, 0.3)}s`,
                    background: "linear-gradient(135deg, rgba(196,162,101,0.06) 0%, var(--color-cream) 50%, rgba(196,162,101,0.04) 100%)",
                  }}
                >
                  {/* Answered badge */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-accent-gold/12 text-accent-gold text-[10px] font-medium rounded-full">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Answered
                    </span>
                    <span className="text-muted text-[10px]">
                      {p.answeredAt && new Date(p.answeredAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                    
                    {/* Public Toggle for existing answers */}
                    <button 
                      onClick={() => { 
                        const next = !p.isPublic;
                        // Optimistic update
                        setPrayers(prev => prev.map(pr => pr.id === p.id ? { ...pr, isPublic: next } : pr));
                        setPrayerPublic(p.id, next); 
                      }}
                      className={`ml-auto flex items-center gap-1.5 px-2 py-0.5 rounded-full border transition ${p.isPublic ? "bg-brown text-ivory border-brown" : "bg-transparent text-muted/60 border-brown/10 hover:border-brown/30"}`}
                    >
                      <span className="text-[9px] uppercase font-bold tracking-tighter">
                        {p.isPublic ? "Shared" : "Private"}
                      </span>
                      {p.isPublic ? (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                      ) : (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      )}
                    </button>
                  </div>

                  <p className="text-dark text-sm leading-relaxed">{p.text}</p>

                  {p.verse && (
                    <p className="text-accent-olive/60 text-xs mt-1">{p.verse}</p>
                  )}

                  {/* How God answered */}
                  {p.answeredNote && (
                    <div className="mt-3 pt-3 border-t border-accent-gold/10">
                      <p className="text-[10px] text-accent-gold uppercase tracking-wider font-medium mb-1">How God answered</p>
                      <p className="text-dark/80 text-sm leading-relaxed italic pl-3 border-l-2 border-accent-gold/20">
                        {p.answeredNote}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-3">
                    <p className="text-muted/50 text-[10px]">
                      Prayed {new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      {p.answeredAt && (() => {
                        const days = Math.round((new Date(p.answeredAt).getTime() - new Date(p.createdAt).getTime()) / (1000 * 60 * 60 * 24));
                        return ` · ${days} day${days !== 1 ? "s" : ""} later`;
                      })()}
                    </p>
                    {related.length > 0 && (
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : p.id)}
                        className="text-[10px] text-brown/60 hover:text-brown transition"
                      >
                        Related entries ({related.length}) {isExpanded ? "▲" : "▼"}
                      </button>
                    )}
                  </div>

                  {/* Related journal entries */}
                  {isExpanded && related.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-brown/8 space-y-2" style={{ animation: "fadeIn 0.2s ease-out both" }}>
                      {related.map(entry => (
                        <div key={entry.id} className="flex items-center gap-2 px-3 py-2 bg-ivory/60 rounded-lg">
                          <div className="w-1.5 h-1.5 bg-brown/30 rounded-full shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-dark font-medium truncate">{entry.revelationVerse}</p>
                            <p className="text-[10px] text-muted">
                              {new Date(entry.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      <div className="mt-8 flex justify-center">
        <OliveBranch className="opacity-30" />
      </div>
    </div>
  );
}
