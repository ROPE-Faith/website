"use client";

import { useState, useEffect } from "react";
import { getGratitudeItems, addGratitudeItem, deleteGratitudeItem, type GratitudeItem } from "@/lib/store";
import { OliveBranch } from "@/components/Accents";

export default function GratitudePage() {
  const [items, setItems] = useState<GratitudeItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [text, setText] = useState("");
  const [verse, setVerse] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setItems(getGratitudeItems());
    setLoaded(true);
  }, []);

  function handleAdd() {
    if (!text.trim()) return;
    addGratitudeItem(text.trim(), verse.trim());
    setItems(getGratitudeItems());
    setText("");
    setVerse("");
    setShowForm(false);
  }

  function handleDelete(id: string) {
    if (deletingId === id) {
      deleteGratitudeItem(id);
      setItems(getGratitudeItems());
      setDeletingId(null);
    } else {
      setDeletingId(id);
    }
  }

  if (!loaded) return <div className="min-h-[80vh] flex items-center justify-center"><p className="text-muted font-serif">Loading...</p></div>;

  return (
    <div className="px-5 pt-6 pb-8" style={{ animation: "fadeIn 0.4s ease-out both" }}>
      <h1 className="font-serif text-2xl text-brown mb-1">Gratitude</h1>
      <p className="text-muted text-sm mb-6">What He has done for you</p>

      {/* Add button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 py-3 mb-6 rounded-xl border border-dashed border-brown/15 text-muted text-sm hover:border-brown/30 hover:text-brown transition"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Count a blessing
        </button>
      )}

      {/* Quick-add form */}
      {showForm && (
        <div className="card-surface rounded-2xl p-4 mb-6" style={{ animation: "fadeInUp 0.3s ease-out both" }}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What are you grateful for today?"
            rows={3}
            className="w-full px-3 py-2.5 bg-ivory border border-brown/10 rounded-xl text-dark text-base resize-none focus:outline-none placeholder:text-muted/50 mb-3"
            autoFocus
          />
          <input
            value={verse}
            onChange={(e) => setVerse(e.target.value)}
            placeholder="Verse reference (optional)"
            className="w-full px-3 py-2 bg-ivory border border-brown/10 rounded-xl text-dark text-base focus:outline-none placeholder:text-muted/50 mb-3"
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
              className="text-xs bg-accent-gold/10 text-accent-gold px-4 py-1.5 rounded-lg font-medium disabled:opacity-40"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Gratitude list */}
      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="flex flex-col items-center py-10">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-accent-gold/30 mb-4">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <p className="text-muted text-sm text-center max-w-xs leading-relaxed">
              Keep a record of His goodness. The things He&apos;s done, the moments of grace, the blessings you&apos;ve witnessed.
            </p>
            <p className="text-muted/60 text-xs mt-3 italic">
              &ldquo;Give thanks in all circumstances.&rdquo; &mdash; 1 Thess. 5:18
            </p>
          </div>
        ) : (
          items.map((item, i) => (
            <div
              key={item.id}
              className="card-surface rounded-2xl p-4 border-l-2 border-l-accent-gold/20"
              style={{ animation: "fadeInUp 0.3s ease-out both", animationDelay: `${Math.min(i * 0.05, 0.3)}s` }}
            >
              <p className="text-dark text-sm leading-relaxed">{item.text}</p>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  <p className="text-muted text-xs">
                    {new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                  {item.verse && (
                    <span className="text-accent-gold/60 text-xs">&middot; {item.verse}</span>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  className={`text-[10px] transition ${deletingId === item.id ? "text-red-400" : "text-muted/40 hover:text-muted"}`}
                >
                  {deletingId === item.id ? "Confirm delete" : "Remove"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-8 flex justify-center">
        <OliveBranch className="opacity-30" />
      </div>
    </div>
  );
}
