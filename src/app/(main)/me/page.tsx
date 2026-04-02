"use client";

import { useState, useEffect } from "react";
import { LampIcon, OliveBranch } from "@/components/Accents";
import DataManagement from "@/components/DataManagement";
import MemoryMode from "@/components/MemoryMode";
import { useAuth, useUser, UserButton } from "@clerk/nextjs";
import { 
  getRopeEntries, 
  getStreak, 
  getUniqueBooksCount, 
  getMostCommonBook, 
  getThemes, 
  getDarkMode, 
  setDarkMode,
  getMemoryVerses, 
  removeMemoryVerse,
  getBookFrequency, 
  getPrayers, 
  updateRopeEntry, 
  deleteRopeEntry,
  type RopeEntry,
  type PrayerItem
} from "@/lib/store";

export default function MePage() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const { user: clerkUser } = useUser();
  const [entries, setEntries] = useState<RopeEntry[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [streak, setStreakVal] = useState(0);
  const [uniqueBooks, setUniqueBooks] = useState(0);
  const [topBook, setTopBook] = useState<string | null>(null);
  const [themes, setThemes] = useState<string[]>([]);
  const [isDark, setIsDark] = useState(false);
  const [search, setSearch] = useState("");
  const [bookFilter, setBookFilter] = useState("");
  const [memoryVerses, setMemoryVerses] = useState<{ verse: string; text: string; addedAt: string }[]>([]);
  const [bookFreq, setBookFreq] = useState<{ book: string; count: number }[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState({ observation: "", prayer: "", execution: "" });
  const [meView, setMeView] = useState<"entries" | "prayers">("entries");
  const [answeredPrayers, setAnsweredPrayers] = useState<PrayerItem[]>([]);
  const [activeVerse, setActiveVerse] = useState<{ verse: string; text: string } | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    const currentUserId = userId || "local";
    setEntries(getRopeEntries(currentUserId));
    setStreakVal(getStreak(currentUserId));
    setUniqueBooks(getUniqueBooksCount(currentUserId));
    setTopBook(getMostCommonBook(currentUserId));
    setThemes(getThemes(currentUserId));
    setIsDark(getDarkMode());
    setMemoryVerses(getMemoryVerses());
    setBookFreq(getBookFrequency(currentUserId));
    setAnsweredPrayers(getPrayers().filter(p => !!p.answeredAt));

    const handleCustomChange = (e: any) => {
      setIsDark(e.detail.darkMode);
    };

    const handleMemoryChange = (e: any) => {
      setMemoryVerses(e.detail.verses);
    };

    window.addEventListener("rope-theme-toggle", handleCustomChange as any);
    window.addEventListener("rope-memory-update", handleMemoryChange as any);
    return () => {
      window.removeEventListener("rope-theme-toggle", handleCustomChange as any);
      window.removeEventListener("rope-memory-update", handleMemoryChange as any);
    };
  }, [isLoaded, userId]);

  function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    }) + " at " + d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function startEdit(entry: RopeEntry) {
    setEditingId(entry.id);
    setEditFields({
      observation: entry.observation,
      prayer: entry.prayer,
      execution: entry.execution,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditFields({ observation: "", prayer: "", execution: "" });
  }

  function saveEdit(id: string) {
    updateRopeEntry(id, {
      observation: editFields.observation.trim(),
      prayer: editFields.prayer.trim(),
      execution: editFields.execution.trim(),
    }, isSignedIn || false);
    setEntries(getRopeEntries(userId || "local"));
    setEditingId(null);
  }

  function handleDelete(id: string) {
    if (confirm("Are you sure you want to delete this entry? This cannot be undone.")) {
      deleteRopeEntry(id, isSignedIn || false);
      setEntries(entries.filter(e => e.id !== id));
      if (expandedId === id) setExpandedId(null);
    }
  }

  if (!isLoaded) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <p className="text-muted font-serif">Loading...</p>
      </div>
    );
  }

  return (
    <div className="px-5 pt-6 pb-8" style={{ animation: "fadeIn 0.4s ease-out both" }}>
      <div className="text-center mb-8 flex flex-col items-center">
        <div className="mb-4">
          <UserButton 
            appearance={{
              elements: {
                userButtonAvatarBox: "w-20 h-20 ring-2 ring-brown/10 ring-offset-2 ring-offset-ivory"
              }
            }}
          />
        </div>
        <h1 className="font-serif text-2xl text-dark">{clerkUser?.fullName || "Journaler"}</h1>
        {clerkUser?.primaryEmailAddress && <p className="text-muted text-sm">{clerkUser.primaryEmailAddress.emailAddress}</p>}
        {isSignedIn ? (
          <p className="text-accent-gold text-[10px] uppercase tracking-wider font-medium mt-1">Cloud Synced &bull; Secure</p>
        ) : (
          <p className="text-muted/60 text-xs mt-1 italic">Guest Mode &bull; Local Only</p>
        )}
      </div>

      {/* Settings */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between p-3 bg-brown/[0.03] rounded-xl">
          <span className="text-sm text-dark font-medium">Dark mode</span>
          <button
            onClick={() => {
              const next = !isDark;
              setIsDark(next);
              setDarkMode(next);
              
              // Notify other components (like MainLayout) in the same tab
              window.dispatchEvent(new CustomEvent("rope-theme-toggle", { detail: { darkMode: next } }));
              
              // Still dispatch storage event for other tabs to stay in sync
              window.dispatchEvent(new StorageEvent("storage", {
                key: "rope_dark_mode",
                newValue: next.toString(),
              }));
            }}
            className={`relative w-11 h-6 rounded-full transition-colors ${isDark ? "bg-accent-gold" : "bg-brown/20"}`}
          >
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-ivory shadow transition-transform ${isDark ? "translate-x-5.5 left-0" : "left-0.5"}`} />
          </button>
        </div>

        <div className="flex items-center justify-between p-3 bg-brown/[0.03] rounded-xl hover:bg-brown/[0.06] transition-colors group">
          <div className="flex flex-col">
            <span className="text-sm text-dark font-medium">Centering Exercise</span>
            <span className="text-[10px] text-muted italic">Psalm 46:10 Stillness</span>
          </div>
          <button
            onClick={() => {
              sessionStorage.removeItem("rope-breathing-done");
              window.location.href = "/journal";
            }}
            className="px-4 py-1.5 bg-brown/10 text-brown rounded-lg text-xs font-semibold hover:bg-brown hover:text-ivory transition-all active:scale-95"
          >
            Start Stillness
          </button>
        </div>

        <div className="flex items-center justify-between p-3 bg-struggle/[0.03] rounded-xl hover:bg-struggle/[0.06] transition-colors group">
          <div className="flex flex-col">
            <span className="text-sm text-dark font-medium">Feedback & Bugs</span>
            <span className="text-[10px] text-muted italic">Help us improve ROPE</span>
          </div>
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent("rope-open-help", { detail: { view: "feedback" } }));
            }}
            className="px-4 py-1.5 bg-struggle/10 text-struggle rounded-lg text-xs font-semibold hover:bg-struggle hover:text-ivory transition-all active:scale-95"
          >
            Report / Request
          </button>
        </div>
      </div>

      {/* Data privacy note */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-brown/[0.03] rounded-xl mb-4 text-muted text-xs">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <path d="M12 8a3 3 0 0 0-3 3"/>
        </svg>
        <span>{isSignedIn ? "Your data is synced securely to the cloud." : "You're in Guest Mode. Data is stored only on this device."}</span>
      </div>

      {/* Walk Snapshot */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { value: entries.length, label: "Entries" },
          { value: streak, label: "Streak" },
          { value: uniqueBooks, label: "Books Studied" },
        ].map((stat, i) => (
          <div key={stat.label} className="text-center p-3 bg-brown/[0.03] rounded-xl" style={{ animation: "fadeIn 0.3s ease-out both", animationDelay: `${i * 0.1}s` }}>
            <p className="font-serif text-xl text-brown font-bold">{stat.value}</p>
            <p className="text-muted text-[10px] uppercase tracking-wider mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Current walk summary */}
      {topBook && (
        <div className="card-surface rounded-2xl p-4 mb-8 border-l-2 border-l-accent-gold/20">
          <p className="text-dark/70 text-sm italic leading-relaxed">
            Lately you&apos;ve been spending time in <span className="font-medium not-italic text-brown">{topBook}</span>.
            {themes.length > 0 && <> Themes of <span className="font-medium not-italic text-brown">{themes.slice(0, 2).join(" and ")}</span> are emerging in your reflections.</>}
          </p>
        </div>
      )}

      {/* Memory Verses */}
      {memoryVerses.length > 0 && (
        <div className="mb-8">
          <h2 className="font-serif text-lg text-brown mb-3">Memory Verses</h2>
          <div className="space-y-2">
            {memoryVerses.map((mv, i) => (
              <div key={mv.verse} className="card-surface rounded-2xl p-4 flex items-start justify-between group hover:border-accent-gold/30 transition-colors cursor-pointer" style={{ animation: "fadeInUp 0.3s ease-out both", animationDelay: `${i * 0.05}s` }}>
                <div 
                  className="min-w-0 flex-1"
                  onClick={() => setActiveVerse(mv)}
                >
                  <p className="text-dark text-sm font-medium group-hover:text-brown transition-colors flex items-center gap-2">
                    {mv.verse}
                    <span className="text-[10px] text-accent-gold opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest font-bold">Practice &rarr;</span>
                  </p>
                  <p className="text-dark/70 text-xs italic mt-1 leading-relaxed line-clamp-2">&ldquo;{mv.text}&rdquo;</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); removeMemoryVerse(mv.verse); }}
                  className="text-muted hover:text-struggle text-xs ml-3 shrink-0 p-2"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeVerse && (
        <MemoryMode 
          verse={activeVerse.verse}
          text={activeVerse.text}
          onClose={() => setActiveVerse(null)}
        />
      )}


      <div className="mb-8">
        {/* View toggle */}
        <div className="flex gap-1 mb-4 bg-brown/[0.04] rounded-xl p-1">
          <button
            onClick={() => setMeView("entries")}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition ${meView === "entries" ? "bg-ivory text-brown shadow-sm" : "text-muted hover:text-brown"}`}
          >
            Journal Entries ({entries.length})
          </button>
          <button
            onClick={() => setMeView("prayers")}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition ${meView === "prayers" ? "bg-ivory text-brown shadow-sm" : "text-muted hover:text-brown"}`}
          >
            Answered Prayers ({answeredPrayers.length})
          </button>
        </div>

        {/* Answered Prayers Timeline */}
        {meView === "prayers" && (
          answeredPrayers.length === 0 ? (
            <div className="flex flex-col items-center py-10">
              <LampIcon className="w-10 h-[52px] mb-4" />
              <p className="text-muted text-sm text-center max-w-xs">
                Your testimony wall. When prayers are answered, they&apos;ll appear here as a record of His faithfulness.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {answeredPrayers.map((p, i) => (
                <div
                  key={p.id}
                  className="rounded-2xl p-4 border border-accent-gold/15"
                  style={{
                    animation: "fadeInUp 0.3s ease-out both",
                    animationDelay: `${Math.min(i * 0.05, 0.3)}s`,
                    background: "linear-gradient(135deg, rgba(196,162,101,0.06) 0%, var(--color-cream) 50%, rgba(196,162,101,0.04) 100%)",
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-accent-gold/12 text-accent-gold text-[10px] font-medium rounded-full">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Answered
                    </span>
                  </div>
                  <p className="text-dark text-sm leading-relaxed">{p.text}</p>
                  {p.verse && <p className="text-accent-olive/60 text-xs mt-1">{p.verse}</p>}
                  {p.answeredNote && (
                    <div className="mt-3 pt-3 border-t border-accent-gold/10">
                      <p className="text-[10px] text-accent-gold uppercase tracking-wider font-medium mb-1">How God answered</p>
                      <p className="text-dark/80 text-sm leading-relaxed italic pl-3 border-l-2 border-accent-gold/20">{p.answeredNote}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-3 mt-3 text-muted/50 text-[10px]">
                    <span>Prayed {new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                    {p.answeredAt && (
                      <span>Answered {new Date(p.answeredAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                    )}
                    {p.answeredAt && (() => {
                      const days = Math.round((new Date(p.answeredAt).getTime() - new Date(p.createdAt).getTime()) / (1000 * 60 * 60 * 24));
                      return <span>{days} day{days !== 1 ? "s" : ""}</span>;
                    })()}
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Journal Entries */}
        {meView === "entries" && (
          <>
        {/* Search and filter */}
        {entries.length > 0 && (
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search entries..."
              className="flex-1 px-3 py-2 bg-ivory border border-brown/10 rounded-xl text-dark placeholder:text-muted/50 focus:outline-none text-base"
            />
            <select
              value={bookFilter}
              onChange={(e) => setBookFilter(e.target.value)}
              className="px-2 py-2 bg-ivory border border-brown/10 rounded-xl text-dark text-xs focus:outline-none shrink-0"
            >
              <option value="">All books</option>
              {bookFreq.map(({ book }) => (
                <option key={book} value={book}>{book}</option>
              ))}
            </select>
          </div>
        )}

        {entries.length === 0 ? (
          <div className="flex flex-col items-center py-10">
            <LampIcon className="w-10 h-[52px] mb-4" />
            <p className="text-muted text-sm text-center max-w-xs">
              No entries yet. Start your first ROPE journal entry today and begin tracking your spiritual growth.
            </p>
          </div>
        ) : (
          <div className="space-y-2 md:grid md:grid-cols-1 md:gap-3 md:space-y-0">
            {entries.filter(e => {
              const matchesSearch = !search ||
                e.revelationVerse.toLowerCase().includes(search.toLowerCase()) ||
                e.observation.toLowerCase().includes(search.toLowerCase()) ||
                e.prayer.toLowerCase().includes(search.toLowerCase()) ||
                e.execution.toLowerCase().includes(search.toLowerCase()) ||
                (e.revelationText || "").toLowerCase().includes(search.toLowerCase());
              const matchesBook = !bookFilter || e.revelationVerse.toLowerCase().startsWith(bookFilter.toLowerCase());
              return matchesSearch && matchesBook;
            }).map((entry, i) => (
              <div
                key={entry.id}
                className="card-surface rounded-2xl overflow-hidden"
                style={{ animation: "fadeInUp 0.4s ease-out both", animationDelay: `${Math.min(i * 0.05, 0.5)}s` }}
              >
                <button
                  onClick={() =>
                    setExpandedId(expandedId === entry.id ? null : entry.id)
                  }
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <div>
                    <p className="text-dark text-sm font-medium">
                      {entry.revelationVerse}
                    </p>
                    <p className="text-muted text-xs">
                      {formatDate(entry.createdAt)}
                    </p>
                  </div>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`text-muted transition-transform duration-200 ${
                      expandedId === entry.id ? "rotate-180" : ""
                    }`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    expandedId === entry.id ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  {editingId === entry.id ? (
                    <div className="px-4 pb-4 space-y-3 border-t border-brown/8 pt-3">
                      {/* Revelation stays read-only */}
                      {entry.revelationText && (
                        <div>
                          <p className="text-xs text-muted uppercase tracking-wide mb-1">Revelation</p>
                          <p className="text-dark text-sm italic leading-relaxed">&ldquo;{entry.revelationText}&rdquo;</p>
                        </div>
                      )}

                      <div>
                        <p className="text-xs text-muted uppercase tracking-wide mb-1">Observation</p>
                        <textarea
                          value={editFields.observation}
                          onChange={(e) => setEditFields(f => ({ ...f, observation: e.target.value }))}
                          rows={3}
                          className="w-full px-3 py-2 bg-ivory border border-brown/10 rounded-xl text-dark text-base leading-relaxed resize-none focus:outline-none"
                        />
                      </div>

                      <div>
                        <p className="text-xs text-muted uppercase tracking-wide mb-1">Prayer</p>
                        <textarea
                          value={editFields.prayer}
                          onChange={(e) => setEditFields(f => ({ ...f, prayer: e.target.value }))}
                          rows={3}
                          className="w-full px-3 py-2 bg-ivory border border-brown/10 rounded-xl text-dark text-base leading-relaxed resize-none focus:outline-none"
                        />
                      </div>

                      <div>
                        <p className="text-xs text-muted uppercase tracking-wide mb-1">Execution</p>
                        <textarea
                          value={editFields.execution}
                          onChange={(e) => setEditFields(f => ({ ...f, execution: e.target.value }))}
                          rows={3}
                          className="w-full px-3 py-2 bg-ivory border border-brown/10 rounded-xl text-dark text-base leading-relaxed resize-none focus:outline-none"
                        />
                      </div>

                      {/* Edit action buttons */}
                      <div className="flex justify-end gap-2 pt-3 border-t border-brown/6">
                        <button onClick={cancelEdit} className="px-3 py-1.5 text-xs text-muted hover:bg-brown/5 rounded-lg transition">
                          Cancel
                        </button>
                        <button
                          onClick={() => saveEdit(entry.id)}
                          className="px-4 py-1.5 text-xs bg-brown text-ivory rounded-lg hover:bg-brown-light transition font-medium"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="px-4 pb-4 space-y-3 border-t border-brown/8 pt-3">
                      {entry.revelationText && (
                        <div>
                          <p className="text-xs text-muted uppercase tracking-wide mb-1">
                            Revelation
                          </p>
                          <p className="text-dark text-sm italic leading-relaxed">
                            &ldquo;{entry.revelationText}&rdquo;
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-muted uppercase tracking-wide mb-1">
                          Observation
                        </p>
                        <p className="text-dark text-sm leading-relaxed">
                          {entry.observation}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted uppercase tracking-wide mb-1">
                          Prayer
                        </p>
                        <p className="text-dark text-sm leading-relaxed">
                          {entry.prayer}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted uppercase tracking-wide mb-1">
                          Execution
                        </p>
                        <p className="text-dark text-sm leading-relaxed">
                          {entry.execution}
                        </p>
                      </div>
                      {entry.executionStatus && (
                        <div>
                          <p className="text-xs text-muted uppercase tracking-wide mb-1">
                            Check-in
                          </p>
                          <p className="text-dark text-sm">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mr-2 ${
                                entry.executionStatus === "yes"
                                  ? "bg-prayer/15 text-prayer"
                                  : entry.executionStatus === "partly"
                                  ? "bg-praise/15 text-praise"
                                  : "bg-struggle/15 text-struggle"
                              }`}
                            >
                              {entry.executionStatus === "yes"
                                ? "Yes"
                                : entry.executionStatus === "partly"
                                ? "Partly"
                                : "Not Yet"}
                            </span>
                          </p>
                          {entry.executionReflection && (
                            <p className="text-dark text-sm leading-relaxed mt-1">
                              {entry.executionReflection}
                            </p>
                          )}
                        </div>
                      )}
                      {/* Action buttons */}
                      <div className="flex justify-end gap-2 pt-3 border-t border-brown/6">
                        <button
                          onClick={(e) => { e.stopPropagation(); startEdit(entry); }}
                          className="px-3 py-1.5 text-xs text-brown hover:bg-brown/5 rounded-lg transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(entry.id); }}
                          className="px-3 py-1.5 text-xs text-struggle hover:bg-struggle/10 rounded-lg transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
          </>
        )}
      </div>

      <div className="section-divider mb-10" />

      {/* Feedback & Support */}
      <div className="card-surface rounded-2xl p-5 mb-8 border border-brown/10">
        <h3 className="font-serif text-lg text-brown mb-2">Help make ROPE better</h3>
        <p className="text-muted text-xs leading-relaxed mb-4">
          Found a bug? Have an idea for a new feature? We&apos;d love to hear from you.
        </p>
        <button
          onClick={() => {
            window.dispatchEvent(new CustomEvent("rope-open-help", { detail: { view: "feedback" } }));
          }}
          className="w-full flex items-center justify-center gap-2 py-3 bg-brown/5 text-brown border border-brown/15 rounded-xl font-bold text-xs hover:bg-brown/10 transition-all active:scale-[0.98]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          Report Bug / Suggest Feature
        </button>
      </div>

      {/* Backup & Portability */}
      <div className="mb-12">
        <h2 className="font-serif text-lg text-brown mb-4 flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-60">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          Account & Data
        </h2>
        <DataManagement />
      </div>

      <div className="flex justify-center">
        <OliveBranch className="opacity-30" />
      </div>
    </div>
  );
}
