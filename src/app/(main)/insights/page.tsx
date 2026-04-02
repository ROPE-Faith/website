"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  getRopeEntries,
  getStreak,
  getBookFrequency,
  getExecutionRate,
  getMostCommonBook,
  getRopeBalance,
  getThemes,
  getNextMilestone,
  getAllReachedMilestones,
  getRecommendedVerses,
  getPrayers,
  type RopeEntry,
} from "@/lib/store";
import { LampIcon, OliveBranch, VerseBlock } from "@/components/Accents";
import Link from "next/link";

export default function InsightsPage() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const [entries, setEntries] = useState<RopeEntry[]>([]);
  const [streak, setStreakVal] = useState(0);
  const [bookFreq, setBookFreq] = useState<{ book: string; count: number }[]>([]);
  const [execRate, setExecRate] = useState(0);
  const [topBook, setTopBook] = useState<string | null>(null);
  const [ropeBalance, setRopeBalance] = useState({ r: 0, o: 0, p: 0, e: 0 });
  const [themes, setThemes] = useState<string[]>([]);
  const [nextMilestone, setNextMilestone] = useState<{ days: number; title: string; verse: string; ref: string } | null>(null);
  const [reachedMilestones, setReachedMilestones] = useState<{ days: number; title: string }[]>([]);
  const [recommendations, setRecommendations] = useState<{ theme: string; verses: string[] }[]>([]);
  const [prayerStats, setPrayerStats] = useState({ total: 0, answered: 0, avgDays: 0 });

  useEffect(() => {
    if (!isLoaded) return;
    const currentUserId = userId || "local";
    setEntries(getRopeEntries(currentUserId));
    setStreakVal(getStreak(currentUserId));
    setBookFreq(getBookFrequency(currentUserId));
    setExecRate(getExecutionRate(currentUserId));
    setTopBook(getMostCommonBook(currentUserId));
    setRopeBalance(getRopeBalance(currentUserId));
    setThemes(getThemes(currentUserId));
    const s = getStreak(currentUserId);
    setNextMilestone(getNextMilestone(s));
    setReachedMilestones(getAllReachedMilestones(s));
    setRecommendations(getRecommendedVerses(currentUserId));
    // Prayer stats
    const allPrayers = getPrayers();
    const answered = allPrayers.filter(p => !!p.answeredAt);
    let avgDays = 0;
    if (answered.length > 0) {
      const totalDays = answered.reduce((sum, p) => {
        const days = Math.round((new Date(p.answeredAt!).getTime() - new Date(p.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        return sum + days;
      }, 0);
      avgDays = Math.round(totalDays / answered.length);
    }
    setPrayerStats({ total: allPrayers.length, answered: answered.length, avgDays });
  }, [isLoaded, userId]);

  if (!isLoaded) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <p className="text-muted font-serif">Loading...</p>
      </div>
    );
  }

  // ─── Empty state ──────────────────────────────────────────────────────────
  if (entries.length === 0) {
    return (
      <div
        className="min-h-[80vh] flex flex-col items-center justify-center px-6 text-center"
        style={{ animation: "fadeIn 0.5s ease-out both" }}
      >
        <div className="mb-6" style={{ animation: "fadeInUp 0.6s ease-out 0.1s both" }}>
          <LampIcon className="w-14 h-[74px] mx-auto" />
        </div>

        <h2
          className="font-serif text-xl text-brown mb-3 font-medium"
          style={{ animation: "fadeInUp 0.5s ease-out 0.2s both" }}
        >
          Start Your Journey
        </h2>

        <p
          className="text-muted text-sm max-w-xs leading-relaxed mb-8"
          style={{ animation: "fadeInUp 0.5s ease-out 0.3s both" }}
        >
          Begin journaling to see your spiritual growth patterns here. Every entry plants a seed.
        </p>

        <div style={{ animation: "fadeInUp 0.5s ease-out 0.4s both" }} className="max-w-xs w-full">
          <VerseBlock
            verse="For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future."
            reference="Jeremiah 29:11"
          />
        </div>

        <div className="mt-8" style={{ animation: "fadeIn 0.5s ease-out 0.6s both" }}>
          <OliveBranch className="mx-auto opacity-40" />
        </div>
      </div>
    );
  }

  const top5Books = bookFreq.slice(0, 5);
  const maxCount = top5Books.length > 0 ? top5Books[0].count : 1;
  const recentEntries = entries.slice(0, 10);
  const hasExecData = entries.some((e) => e.executionStatus !== null);

  // Calculate circumference for the ring
  const ringRadius = 54;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (execRate / 100) * ringCircumference;

  const statAccentColors = [
    "border-t-accent-gold",    // entries — gold
    "border-t-accent-olive",   // streak — olive
    "border-t-brown",          // top book — brown
  ];

  return (
    <div className="px-5 pt-6 pb-8" style={{ animation: "fadeIn 0.4s ease-out both" }}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-serif text-2xl text-brown">Your ROPE Journey</h1>
        <p className="text-muted text-sm">Patterns in your spiritual growth</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { value: entries.length, label: "Total Entries" },
          { value: streak, label: "Day Streak" },
          { value: topBook || "\u2014", label: "Top Book" },
        ].map((stat, i) => (
          <div
            key={stat.label}
            className={`card-surface rounded-2xl p-4 text-center border-t-2 ${statAccentColors[i]}`}
            style={{ animation: "fadeIn 0.4s ease-out both", animationDelay: `${i * 0.1}s` }}
          >
            <p className={`font-serif text-2xl text-brown font-bold ${typeof stat.value === "string" ? "truncate text-lg" : ""}`}>
              {stat.value}
            </p>
            <p className="text-muted text-xs mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Prayer Stats */}
      {prayerStats.total > 0 && (
        <div className="card-surface rounded-2xl p-4 mb-6 flex items-center gap-4 border-l-2 border-l-accent-gold/20"
          style={{ animation: "fadeIn 0.4s ease-out 0.3s both" }}
        >
          <div className="w-12 h-12 rounded-full bg-accent-gold/10 flex items-center justify-center shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-accent-gold">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-serif text-lg text-brown font-bold">
              {prayerStats.answered} of {prayerStats.total} Prayers Answered
            </p>
            {prayerStats.avgDays > 0 && (
              <p className="text-muted text-xs mt-0.5">Average time to answer: {prayerStats.avgDays} day{prayerStats.avgDays !== 1 ? "s" : ""}</p>
            )}
          </div>
        </div>
      )}

      {/* Desktop: Book Frequency + Execution Score side by side */}
      <div className="md:grid md:grid-cols-2 md:gap-6 space-y-6 md:space-y-0 mb-6">
        {/* Book Frequency Chart */}
        {top5Books.length > 0 && (
          <section className="card-surface rounded-2xl p-5">
            <h2 className="font-serif text-lg text-dark mb-4">Most Read Books</h2>
            <div className="space-y-3">
              {top5Books.map(({ book, count }) => (
                <div key={book} className="flex items-center gap-3">
                  <span className="text-sm text-dark w-28 truncate shrink-0">{book}</span>
                  <div className="flex-1 bg-ivory rounded-full h-5 overflow-hidden">
                    <div
                      className="h-full bg-brown/70 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max((count / maxCount) * 100, 8)}%`, borderRadius: "9999px" }}
                    />
                  </div>
                  <span className="text-xs text-muted w-6 text-right">{count}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Execution Score */}
        <section className="card-surface rounded-2xl p-5">
          <h2 className="font-serif text-lg text-dark mb-4">Execution Score</h2>
          {hasExecData ? (
            <div className="flex flex-col items-center">
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r={ringRadius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="10"
                    className="text-ivory"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r={ringRadius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={ringOffset}
                    className="text-accent-gold transition-all duration-700"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-serif text-3xl text-brown font-bold">{execRate}%</span>
                </div>
              </div>
              <p className="text-muted text-xs mt-3 text-center">
                of your commitments fully lived out
              </p>
            </div>
          ) : (
            <p className="text-muted text-sm text-center py-4">
              Complete your first check-in to see your execution score. Keep going!
            </p>
          )}
        </section>
      </div>

      {/* ROPE Balance */}
      <section className="card-surface rounded-2xl p-5 mb-6">
        <h2 className="font-serif text-lg text-dark mb-4">ROPE Balance</h2>
        <p className="text-muted text-xs mb-4">How your reflection time is distributed</p>
        <div className="space-y-3">
          {[
            { letter: "R", label: "Revelation", value: ropeBalance.r, color: "bg-brown" },
            { letter: "O", label: "Observation", value: ropeBalance.o, color: "bg-brown/70" },
            { letter: "P", label: "Prayer", value: ropeBalance.p, color: "bg-accent-olive" },
            { letter: "E", label: "Execution", value: ropeBalance.e, color: "bg-accent-gold" },
          ].map(({ letter, label, value, color }) => (
            <div key={letter} className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-brown/8 flex items-center justify-center text-xs font-serif font-bold text-brown/60 shrink-0">{letter}</span>
              <span className="text-sm text-dark w-24 shrink-0">{label}</span>
              <div className="flex-1 bg-ivory rounded-full h-3 overflow-hidden">
                <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${Math.max(value, 3)}%` }} />
              </div>
              <span className="text-xs text-muted w-8 text-right">{value}%</span>
            </div>
          ))}
        </div>
      </section>

      {/* Spiritual Themes */}
      {themes.length > 0 && (
        <section className="card-surface rounded-2xl p-5 mb-6">
          <h2 className="font-serif text-lg text-dark mb-2">Emerging Themes</h2>
          <p className="text-muted text-xs mb-4">Patterns God may be weaving through your reflections</p>
          <div className="flex flex-wrap gap-2">
            {themes.map((theme) => (
              <span key={theme} className="px-3 py-1.5 bg-brown/6 text-brown text-sm rounded-full border border-brown/8">
                {theme}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Theme Timeline */}
      <section className="card-surface rounded-2xl p-5 mb-6">
        <h2 className="font-serif text-lg text-dark mb-4">Recent Reflections</h2>
        <div className="space-y-0">
          {recentEntries.map((entry, i) => (
            <div key={entry.id} className="flex gap-3">
              {/* Timeline line + dot */}
              <div className="flex flex-col items-center">
                <div className="w-2.5 h-2.5 bg-brown rounded-full shrink-0 mt-1" />
                {i < recentEntries.length - 1 && (
                  <div className="w-px flex-1 bg-brown/20 my-1" />
                )}
                {i === recentEntries.length - 1 && entries.length > recentEntries.length && (
                  <div className="w-px flex-1 bg-gradient-to-b from-brown/20 to-transparent my-1" />
                )}
              </div>

              {/* Content */}
              <div className="pb-4 min-w-0 border-l-2 border-transparent pl-2">
                <p className="text-sm font-medium text-dark">{entry.revelationVerse}</p>
                <p className="text-xs text-muted mt-0.5 line-clamp-1">
                  {entry.observation}
                </p>
                <p className="text-xs text-muted/60 mt-0.5">
                  {new Date(entry.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          ))}
          {entries.length > recentEntries.length && (
            <div className="mt-2 text-center">
              <Link href="/history" className="text-brown text-sm font-serif font-medium hover:underline">
                View All {entries.length} Reflections &rarr;
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Next Milestone */}
      {nextMilestone && (
        <section className="card-surface rounded-2xl p-5 mb-6">
          <h2 className="font-serif text-lg text-dark mb-3">Next Milestone</h2>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-accent-gold/10 border border-accent-gold/20 flex items-center justify-center shrink-0">
              <span className="font-serif text-lg text-accent-gold font-bold">{nextMilestone.days}</span>
            </div>
            <div>
              <p className="text-dark text-sm font-medium">{nextMilestone.title}</p>
              <p className="text-muted text-xs mt-0.5">{nextMilestone.days - streak} days to go</p>
              <div className="w-full h-1.5 bg-brown/8 rounded-full overflow-hidden mt-2" style={{ width: "120px" }}>
                <div className="h-full bg-accent-gold rounded-full transition-all duration-500" style={{ width: `${Math.min((streak / nextMilestone.days) * 100, 100)}%` }} />
              </div>
            </div>
          </div>
          {reachedMilestones.length > 0 && (
            <div className="mt-4 pt-3 border-t border-brown/8">
              <p className="text-xs text-muted mb-2">Milestones reached</p>
              <div className="flex flex-wrap gap-1.5">
                {reachedMilestones.map(m => (
                  <span key={m.days} className="px-2 py-1 bg-accent-gold/8 text-accent-gold text-xs rounded-full">{m.title}</span>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Verse Recommendations */}
      {recommendations.length > 0 && (
        <section className="card-surface rounded-2xl p-5 mb-6">
          <h2 className="font-serif text-lg text-dark mb-2">Recommended Verses</h2>
          <p className="text-muted text-xs mb-4">Based on themes in your reflections</p>
          <div className="space-y-4">
            {recommendations.map(({ theme, verses }) => (
              <div key={theme}>
                <p className="text-xs text-accent-gold uppercase tracking-wider font-medium mb-2">{theme}</p>
                <div className="flex flex-wrap gap-2">
                  {verses.map(v => (
                    <span key={v} className="px-3 py-1.5 bg-brown/[0.04] text-dark text-xs rounded-full border border-brown/8">{v}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
      {/* Reflection Prompt */}
      {topBook && (
        <section className="card-surface rounded-2xl p-5 mb-4 border-l-3 border-l-accent-gold/25"
          style={{ background: "linear-gradient(135deg, var(--color-cream) 0%, rgba(196,162,101,0.06) 50%, var(--color-cream) 100%)" }}
        >
          <p className="text-dark text-sm leading-relaxed italic">
            &ldquo;Based on your entries, you&apos;ve been drawn to{" "}
            <span className="font-medium not-italic text-brown">{topBook}</span>{" "}lately.
            What do you think God is showing you through these passages?&rdquo;
          </p>
        </section>
      )}

      {/* Scripture Watermark */}
      <div className="mt-6 flex flex-col items-center gap-3">
        <OliveBranch className="opacity-30" />
        <p className="text-muted/40 text-xs italic text-center">
          For I know the plans I have for you &mdash; Jeremiah 29:11
        </p>
      </div>
    </div>
  );
}
