"use client";

import { useState, useMemo, useEffect } from "react";
import { RopeEntry } from "@/lib/store";

interface SearchEntriesProps {
  entries: RopeEntry[];
  onFiltered: (filtered: RopeEntry[]) => void;
}

export default function SearchEntries({ entries, onFiltered }: SearchEntriesProps) {
  const [query, setQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return entries.filter((entry) => {
      const matchesQuery = !q ||
        entry.revelationVerse.toLowerCase().includes(q) ||
        entry.revelationText.toLowerCase().includes(q) ||
        entry.observation.toLowerCase().includes(q) ||
        entry.prayer.toLowerCase().includes(q) ||
        entry.execution.toLowerCase().includes(q);

      const matchesDate = !dateFilter || entry.createdAt.startsWith(dateFilter);

      return matchesQuery && matchesDate;
    });
  }, [entries, query, dateFilter]);

  useEffect(() => {
    onFiltered(filtered);
  }, [filtered, onFiltered]);

  return (
    <div className="space-y-4 mb-6" style={{ animation: "fadeInDown 0.4s ease-out both" }}>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/40">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </div>
          <input
            type="text"
            placeholder="Search verse, theme, or text..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-ivory border border-brown/10 rounded-xl text-dark placeholder:text-muted/50 focus:outline-none focus:ring-1 focus:ring-brown/20 text-base shadow-sm"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted/40 hover:text-muted transition-colors"
              aria-label="Clear search"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          )}
        </div>
        <div className="relative shrink-0">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full sm:w-auto px-4 py-2.5 bg-ivory border border-brown/10 rounded-xl text-dark text-base focus:outline-none focus:ring-1 focus:ring-brown/20 shadow-sm appearance-none"
          />
          {!dateFilter && <div className="absolute inset-0 pointer-events-none flex items-center px-4 text-muted/40 text-base">Filter by date</div>}
        </div>
      </div>
      {(query || dateFilter) && (
        <div className="flex items-center justify-between text-[11px] text-muted px-1">
          <span>Found {filtered.length} {filtered.length === 1 ? "entry" : "entries"}</span>
          <button 
            onClick={() => { setQuery(""); setDateFilter(""); }}
            className="text-brown hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
