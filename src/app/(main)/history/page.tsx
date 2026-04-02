"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { getRopeEntries, type RopeEntry } from "@/lib/store";
import SearchEntries from "@/components/SearchEntries";
import { OliveBranch } from "@/components/Accents";
import Link from "next/link";

export default function HistoryPage() {
  const [entries, setEntries] = useState<RopeEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<RopeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { userId } = useAuth();

  useEffect(() => {
    const all = getRopeEntries(userId || undefined);
    setEntries(all);
    setFilteredEntries(all);
    setLoading(false);
  }, [userId]);

  if (loading) return <div className="p-8 text-center text-muted font-serif italic">Loading history...</div>;

  return (
    <div className="px-5 pt-6 pb-24 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl text-brown">Journal History</h1>
          <p className="text-muted text-sm italic">Your walk with God, recorded.</p>
        </div>
        <Link href="/insights" className="text-brown/60 hover:text-brown text-sm flex items-center gap-1 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Back
        </Link>
      </div>

      <SearchEntries entries={entries} onFiltered={setFilteredEntries} />

      <div className="space-y-5">
        {filteredEntries.length === 0 ? (
          <div className="py-20 text-center">
            <OliveBranch className="mx-auto opacity-20 mb-4" />
            <p className="text-muted text-sm italic">No reflections found. Your journey continues...</p>
          </div>
        ) : (
          filteredEntries.map((entry, idx) => (
            <div 
              key={entry.id} 
              className="card-surface rounded-2xl p-6 border-l-2 border-l-brown/10 hover:border-l-brown/40 transition-all duration-300"
              style={{ animation: "fadeInUp 0.4s ease-out both", animationDelay: `${Math.min(idx * 0.05, 0.5)}s` }}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-serif text-lg text-brown font-bold tracking-tight">{entry.revelationVerse}</h3>
                  <p className="text-[10px] text-muted/60 uppercase tracking-widest font-semibold mt-0.5">
                    {new Date(entry.createdAt).toLocaleDateString("en-US", { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {entry.revelationText && (
                <div className="mb-4 pl-3 border-l-2 border-accent-gold/20 italic text-dark/70 text-sm leading-relaxed">
                  &ldquo;{entry.revelationText}&rdquo;
                </div>
              )}
              
              <div className="grid gap-4 md:grid-cols-1">
                {entry.observation && (
                  <div>
                    <span className="text-[9px] uppercase tracking-[0.2em] text-accent-olive font-bold mb-1.5 block">Observation</span>
                    <p className="text-xs text-dark/80 leading-relaxed">{entry.observation}</p>
                  </div>
                )}
                {entry.prayer && (
                  <div>
                    <span className="text-[9px] uppercase tracking-[0.2em] text-brown font-bold mb-1.5 block">Prayer</span>
                    <p className="text-xs text-dark/80 leading-relaxed italic">&ldquo;{entry.prayer}&rdquo;</p>
                  </div>
                )}
                {entry.execution && (
                  <div>
                    <span className="text-[9px] uppercase tracking-[0.2em] text-accent-gold font-bold mb-1.5 block">Execution</span>
                    <p className="text-xs text-dark/80 leading-relaxed font-medium">{entry.execution}</p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-12 mb-8 text-center opacity-30">
        <OliveBranch className="mx-auto" />
      </div>
    </div>
  );
}
