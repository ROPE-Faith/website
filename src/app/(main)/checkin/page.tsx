"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { getYesterdayEntry, updateRopeEntry, getStreak, type RopeEntry, type ExecutionStatus } from "@/lib/store";
import { LampIcon, OliveBranch, VerseBlock } from "@/components/Accents";

export default function CheckinPage() {
  const [entry, setEntry] = useState<RopeEntry | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState<ExecutionStatus>(null);
  const [reflection, setReflection] = useState("");
  const [saved, setSaved] = useState(false);
  const [streak, setStreakVal] = useState(0);

  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;
    const userId = "any"; 
    const yesterday = getYesterdayEntry(userId);
    if (yesterday && yesterday.executionStatus === null) {
      setEntry(yesterday);
    }
    setStreakVal(getStreak(userId));
    setLoaded(true);
  }, [isLoaded]);

  function handleSave() {
    if (!entry || !status) return;
    updateRopeEntry(entry.id, {
      executionStatus: status,
      executionReflection: reflection.trim(),
    }, isSignedIn || false);
    setSaved(true);
  }

  if (!loaded) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <p className="text-muted font-serif">Loading...</p>
      </div>
    );
  }

  if (saved) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 text-center" style={{ animation: "fadeIn 0.4s ease-out both" }}>
        <div className="w-16 h-16 bg-prayer/10 rounded-full flex items-center justify-center mb-5">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-prayer">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="font-serif text-2xl text-brown mb-2">Reflection Saved</h2>
        <p className="text-muted text-sm max-w-xs mb-6">
          Thank you for reflecting honestly. God is faithfully at work in you.
        </p>
        <div className="max-w-xs w-full">
          <VerseBlock
            verse="He who began a good work in you will carry it on to completion until the day of Christ Jesus."
            reference="Philippians 1:6"
          />
        </div>
      </div>
    );
  }

  // ─── Empty state: no pending entry ────────────────────────────────────────
  if (!entry) {
    return (
      <div
        className="min-h-[80vh] flex flex-col items-center justify-center px-6 text-center"
        style={{ animation: "fadeIn 0.5s ease-out both" }}
      >
        {/* Lamp illustration */}
        <div className="mb-6" style={{ animation: "fadeInUp 0.6s ease-out 0.1s both" }}>
          <LampIcon className="w-14 h-[74px] mx-auto" />
        </div>

        <h2
          className="font-serif text-xl text-brown mb-3 font-medium"
          style={{ animation: "fadeInUp 0.5s ease-out 0.2s both" }}
        >
          You&apos;re all caught up
        </h2>

        <p
          className="text-muted text-sm max-w-xs leading-relaxed mb-8"
          style={{ animation: "fadeInUp 0.5s ease-out 0.3s both" }}
        >
          Rest in His peace. Come back tomorrow after journaling to reflect on how you lived out His word.
        </p>

        {/* Verse block */}
        <div style={{ animation: "fadeInUp 0.5s ease-out 0.4s both" }} className="max-w-xs w-full">
          <VerseBlock
            verse="Do not merely listen to the word, and so deceive yourselves. Do what it says."
            reference="James 1:22"
          />
        </div>

        {/* Olive branch divider */}
        <div className="mt-8" style={{ animation: "fadeIn 0.5s ease-out 0.6s both" }}>
          <OliveBranch className="mx-auto opacity-40" />
        </div>
      </div>
    );
  }

  // ─── Active check-in state ────────────────────────────────────────────────
  const options: {
    value: ExecutionStatus;
    label: string;
    color: string;
    borderColor: string;
    icon: React.ReactNode;
  }[] = [
    {
      value: "yes",
      label: "Yes",
      color: "text-prayer",
      borderColor: "border-l-prayer",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-prayer">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ),
    },
    {
      value: "partly",
      label: "Partly",
      color: "text-praise",
      borderColor: "border-l-praise",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-praise">
          <path d="M12 2a10 10 0 1 0 0 20" />
          <path d="M12 2v20" />
        </svg>
      ),
    },
    {
      value: "not_yet",
      label: "Not Yet",
      color: "text-struggle",
      borderColor: "border-l-struggle",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-struggle">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      ),
    },
  ];

  return (
    <div className="px-5 pt-6 pb-8" style={{ animation: "fadeIn 0.4s ease-out both" }}>
      <h1 className="font-serif text-2xl text-brown mb-1">Execution Check-in</h1>
      <p className="text-muted text-sm mb-1">The &ldquo;E&rdquo; in ROPE is about living it out.</p>
      <p className="text-muted text-sm mb-4">Yesterday you wrote a commitment based on what you read. Did you follow through?</p>

      {/* Streak badge */}
      {streak > 0 && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent-gold/8 rounded-full mb-6" style={{ animation: "fadeIn 0.4s ease-out 0.2s both" }}>
          <span className="text-accent-gold text-xs">&#x2728;</span>
          <span className="text-brown text-xs font-medium">{streak} day streak</span>
        </div>
      )}

      <div className="card-surface rounded-2xl p-5 mb-6">
        <p className="text-xs text-muted uppercase tracking-wide mb-2">
          Your commitment
        </p>
        <p className="text-dark leading-relaxed">{entry.execution}</p>
        <p className="text-muted text-xs mt-3">
          From {entry.revelationVerse}
        </p>
      </div>

      <p className="font-serif text-lg text-dark mb-3">Did you live it out?</p>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {options.map((opt, i) => (
          <button
            key={opt.value}
            onClick={() => setStatus(opt.value)}
            className={`flex flex-col items-center gap-2 p-4 md:p-6 rounded-2xl border-2 transition-all ${
              status === opt.value
                ? `bg-ivory ${opt.borderColor} border-l-3 border-t-transparent border-r-transparent border-b-transparent scale-[1.02] shadow-sm`
                : "bg-ivory/80 border-transparent hover:shadow-sm hover:-translate-y-0.5"
            }`}
            style={{ animation: "fadeInUp 0.4s ease-out both", animationDelay: `${i * 0.1}s` }}
          >
            {opt.icon}
            <span
              className={`text-sm font-medium ${
                status === opt.value ? "text-dark" : "text-muted"
              }`}
            >
              {opt.label}
            </span>
          </button>
        ))}
      </div>

      {status === "yes" && (
        <p className="text-prayer text-sm italic mb-4 px-1">
          Praise God for His faithfulness through you. What fruit did you see?
        </p>
      )}
      {status === "partly" && (
        <p className="text-praise text-sm italic mb-4 px-1">
          Progress is still progress. Where did you see grace in the gap?
        </p>
      )}
      {status === "not_yet" && (
        <p className="text-muted text-sm italic mb-4 px-1">
          His mercies are new every morning. Growth takes time. What got in the way?
        </p>
      )}

      <div className="mb-6">
        <label className="block text-sm font-medium text-dark mb-2">
          How did it go? What did you learn?
        </label>
        <textarea
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          placeholder="Write your reflection..."
          rows={5}
          className="w-full px-4 py-3.5 bg-ivory border border-brown/10 rounded-xl text-dark placeholder:text-muted/50 focus:outline-none text-base leading-relaxed resize-none min-h-[140px]"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={!status}
        className="w-full py-3.5 btn-primary text-center"
      >
        Save Check-in
      </button>

      <div className="mt-8 flex justify-center">
        <OliveBranch className="opacity-30" />
      </div>
    </div>
  );
}
