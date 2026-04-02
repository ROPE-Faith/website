"use client";

import { useState, useEffect } from "react";
import { READING_PLANS, getActivePlan, startPlan, pausePlan, quitPlan, getPlanHistory, isPlanAdvancedToday, type PlanProgress } from "@/lib/store";
import { OliveBranch } from "@/components/Accents";

export default function PlansPage() {
  const [active, setActive] = useState<PlanProgress | null>(null);
  const [history, setHistory] = useState<PlanProgress[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [advancedToday, setAdvancedToday] = useState(false);

  useEffect(() => {
    setActive(getActivePlan());
    setHistory(getPlanHistory());
    setAdvancedToday(isPlanAdvancedToday());
    setLoaded(true);
  }, []);

  if (!loaded) return <div className="min-h-[80vh] flex items-center justify-center"><p className="text-muted font-serif">Loading...</p></div>;

  const activePlan = active ? READING_PLANS.find(p => p.id === active.planId) : null;

  return (
    <div className="px-5 pt-6 pb-8" style={{ animation: "fadeIn 0.4s ease-out both" }}>
      <h1 className="font-serif text-2xl text-brown mb-1">Reading Plans</h1>
      <p className="text-muted text-sm mb-6">Guided paths through Scripture</p>

      {/* Active plan */}
      {active && activePlan && !active.paused && (
        <div className="card-surface rounded-2xl p-5 mb-6 border-l-2 border-l-accent-gold/30" style={{ animation: "fadeInUp 0.3s ease-out both" }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] text-accent-gold uppercase tracking-wider font-medium">Active Plan</p>
              <h2 className="font-serif text-lg text-dark">{activePlan.title}</h2>
            </div>
            <span className="text-xs text-muted">
              {advancedToday ? "Completed for today" : `Day ${active.currentDay + 1} of ${activePlan.days}`}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-brown/8 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-accent-gold rounded-full transition-all duration-500"
              style={{ width: `${((active.completedDays.length) / activePlan.days) * 100}%` }}
            />
          </div>

          <div className="mb-4">
            {advancedToday ? (
              <div className="flex items-center gap-2 text-accent-olive">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                <span className="text-sm font-medium">Today&apos;s reading completed</span>
              </div>
            ) : (
              <p className="text-dark text-sm">
                Today&apos;s reading: <span className="font-medium">{activePlan.verses[active.currentDay]}</span>
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <button onClick={() => { pausePlan(); setActive(getActivePlan()); }} className="px-3 py-1.5 text-xs text-muted border border-brown/10 rounded-lg hover:bg-brown/5 transition">
              Pause
            </button>
            <button onClick={() => { quitPlan(); setActive(null); }} className="px-3 py-1.5 text-xs text-struggle border border-struggle/20 rounded-lg hover:bg-struggle/5 transition">
              End Plan
            </button>
          </div>
        </div>
      )}

      {/* Paused plan */}
      {active && active.paused && activePlan && (
        <div className="card-surface rounded-2xl p-5 mb-6 opacity-70">
          <p className="text-xs text-muted mb-2">Paused: {activePlan.title} &mdash; Day {active.currentDay + 1} of {activePlan.days}</p>
          <div className="flex gap-2">
            <button onClick={() => { pausePlan(); setActive(getActivePlan()); }} className="px-3 py-1.5 text-xs text-brown border border-brown/10 rounded-lg hover:bg-brown/5 transition">
              Resume
            </button>
            <button onClick={() => { quitPlan(); setActive(null); }} className="px-3 py-1.5 text-xs text-struggle border border-struggle/20 rounded-lg hover:bg-struggle/5 transition">
              End Plan
            </button>
          </div>
        </div>
      )}

      {/* Available plans */}
      <div className="space-y-3">
        {READING_PLANS.map((plan, i) => {
          const isActive = active?.planId === plan.id;
          return (
            <div
              key={plan.id}
              className={`card-surface rounded-2xl p-5 ${isActive ? "ring-1 ring-accent-gold/20" : ""}`}
              style={{ animation: "fadeInUp 0.4s ease-out both", animationDelay: `${i * 0.08}s` }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-serif text-base text-dark font-medium">{plan.title}</h3>
                  <p className="text-muted text-xs mt-0.5">{plan.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] text-muted/60 uppercase tracking-widest">{plan.days} days</span>
                    {history.some(h => h.planId === plan.id) && (
                      <span className="text-[10px] text-accent-olive uppercase tracking-widest font-medium flex items-center gap-0.5">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                        Completed
                      </span>
                    )}
                  </div>
                </div>
                {!active && (
                  <button
                    onClick={() => { const p = startPlan(plan.id); setActive(p); }}
                    className="px-4 py-2 text-xs font-medium bg-brown text-ivory rounded-lg hover:bg-brown-light transition shrink-0"
                  >
                    {history.some(h => h.planId === plan.id) ? "Restart" : "Start"}
                  </button>
                )}
                {isActive && (
                  <span className="text-xs text-accent-gold font-medium">Active</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Completion History */}
      {history.length > 0 && (
        <div className="mt-10 pt-8 border-t border-brown/10">
          <h2 className="font-serif text-xl text-brown mb-4 flex items-center gap-2">
            <span>⌛</span> History
          </h2>
          <div className="space-y-3">
            {history.map((h, i) => {
              const p = READING_PLANS.find(plan => plan.id === h.planId);
              if (!p) return null;
              return (
                <div key={`${h.planId}-${h.startedAt}`} className="flex items-center justify-between p-4 bg-brown/5 rounded-xl border border-brown/10">
                  <div>
                    <h4 className="font-serif text-sm text-brown font-medium">{p.title}</h4>
                    <p className="text-[10px] text-muted/60 uppercase tracking-wider mt-0.5">
                      Completed {h.completedAt ? new Date(h.completedAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-accent-gold/10 flex items-center justify-center text-accent-gold">
                    ✓
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-12 flex justify-center">
        <OliveBranch className="opacity-30" />
      </div>
    </div>
  );
}
