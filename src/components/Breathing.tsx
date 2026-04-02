"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/*
 * Biblical Stillness Gate - Polished & Unified
 */

const IVORY = "#f5efe3";
const GOLD = "#c4a265";
const BG = "#1e1c16";

const STILLNESS_PHASES = [
  { text: "Be still", subtext: "Psalm 46:10", duration: 3000 },
  { text: "and know", subtext: "", duration: 2500 },
  { text: "that I am God", subtext: "", duration: 3000 },
] as const;

const BREATHING_VERSES = [
  { text: "Wait for the LORD; be strong and take heart and wait for the LORD.", ref: "Psalm 27:14" },
  { text: "In quietness and trust is your strength.", ref: "Isaiah 30:15" },
  { text: "The LORD is good to those who wait for him, to the soul who seeks him.", ref: "Lamentations 3:25" },
];

const BREATHING_CYCLES = 3;

export default function Breathing({ onComplete }: { onComplete: () => void }) {
  const [stage, setStage] = useState<"stillness" | "breathing" | "ready">("stillness");
  const [stillnessIdx, setStillnessIdx] = useState(0);
  const [phase, setPhase] = useState<"inhale" | "hold" | "exhale">("inhale");
  const [cycle, setCycle] = useState(0);
  const [scale, setScale] = useState(1);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  /* Stage 1: Stillness */
  useEffect(() => {
    if (stage !== "stillness") return;
    if (stillnessIdx >= STILLNESS_PHASES.length) {
      setStage("breathing");
      return;
    }
    const timer = setTimeout(() => {
      setStillnessIdx(i => i + 1);
    }, STILLNESS_PHASES[stillnessIdx].duration);
    return () => clearTimeout(timer);
  }, [stage, stillnessIdx]);

  /* Stage 2: Breathing */
  const runCycle = useCallback(async () => {
    setPhase("inhale");
    setScale(1.4);
    await new Promise(r => setTimeout(r, 4000));
    
    setPhase("hold");
    await new Promise(r => setTimeout(r, 4000));
    
    setPhase("exhale");
    setScale(1);
    await new Promise(r => setTimeout(r, 4000));
    
    setCycle(c => c + 1);
  }, []);

  useEffect(() => {
    if (stage !== "breathing") return;
    if (cycle >= BREATHING_CYCLES) {
      setStage("ready");
      return;
    }
    runCycle();
  }, [stage, cycle, runCycle]);

  /* Stage 3: Ready */
  useEffect(() => {
    if (stage !== "ready") return;
    const timer = setTimeout(() => onCompleteRef.current(), 3000);
    return () => clearTimeout(timer);
  }, [stage]);

  const currentVerse = BREATHING_VERSES[Math.min(cycle, BREATHING_VERSES.length - 1)];
  const stillnessText = STILLNESS_PHASES.slice(0, stillnessIdx + 1).map(p => p.text).join(" ");

  return (
    <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center overflow-hidden" style={{ background: BG }}>
      {/* 1. Header Slot - The Fixed Anchor */}
      <div className="h-32 flex items-end justify-center pb-8">
        <svg width="20" height="30" viewBox="0 0 16 24" fill="none" className="transition-opacity duration-1000" style={{ opacity: 0.6 }}>
          <rect x="6" y="0" width="4" height="24" rx="1" fill={GOLD} />
          <rect x="0" y="5" width="16" height="4" rx="1" fill={GOLD} />
        </svg>
      </div>

      {/* 2. Central Theater Slot - Locked Vertical Position */}
      <div className="relative w-full h-80 flex items-center justify-center">
        {/* Stillness Text Layer */}
        <div 
          className={`absolute inset-0 flex items-center justify-center px-8 transition-all duration-1000 ${stage === "stillness" ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}
        >
          <p className="font-serif text-3xl md:text-4xl text-center leading-relaxed tracking-wide" style={{ color: IVORY }}>
            {stillnessText}
          </p>
        </div>

        {/* Breathing Circle Layer */}
        <div 
          className={`absolute inset-0 flex items-center justify-center transition-all duration-1000 ${stage === "breathing" ? "opacity-100 scale-100" : "opacity-0 scale-110 pointer-events-none"}`}
        >
          <div 
            className="w-48 h-48 rounded-full border-2 flex items-center justify-center transition-all duration-[4000ms] ease-in-out relative"
            style={{ 
              borderColor: `${GOLD}66`,
              transform: `scale(${scale})`,
              boxShadow: stage === "breathing" ? `0 0 ${phase === "hold" ? "60px" : "20px"} ${GOLD}${phase === "hold" ? "44" : "22"}` : "none"
            }}
          >
            {/* Visual pulse for breath tempo */}
            <div className={`absolute inset-0 rounded-full bg-[#c4a265]/5 transition-opacity duration-1000 ${phase === "inhale" ? "opacity-100" : "opacity-0"}`} />
            
            <span className="font-serif text-xl tracking-wider z-10" style={{ color: IVORY }}>
              {phase === "inhale" ? "Breathe in" : phase === "hold" ? "Hold" : "Release"}
            </span>
          </div>
        </div>

        {/* Ready Message Layer */}
        <div 
          className={`absolute inset-0 flex flex-col items-center justify-center px-8 transition-all duration-1000 ${stage === "ready" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}
        >
          <p className="font-serif text-3xl mb-4 text-center" style={{ color: IVORY }}>Your heart is ready</p>
        </div>
      </div>

      {/* 3. Information Slot - Fixed height to prevent jumps */}
      <div className="h-48 flex flex-col items-center justify-start text-center px-10">
        <div className="h-6 mb-2">
          {stage === "stillness" && stillnessIdx === 0 && (
            <p className="text-[10px] tracking-[0.3em] uppercase opacity-40 animate-in fade-in duration-700" style={{ color: IVORY }}>Psalm 46:10</p>
          )}
        </div>

        <div className="h-24 flex flex-col items-center justify-center transition-opacity duration-500" style={{ opacity: stage === "breathing" || stage === "ready" ? 1 : 0 }}>
          {stage === "breathing" ? (
            <>
              <p className="text-sm italic leading-relaxed max-w-xs transition-opacity duration-[2000ms]" style={{ color: `${IVORY}99` }}>
                &ldquo;{currentVerse.text}&rdquo;
              </p>
              <p className="text-[10px] uppercase tracking-widest mt-3 opacity-30" style={{ color: IVORY }}>{currentVerse.ref}</p>
            </>
          ) : stage === "ready" ? (
            <>
              <p className="text-sm italic leading-relaxed max-w-xs transition-opacity duration-[2000ms]" style={{ color: `${IVORY}99` }}>
                &ldquo;The LORD is in his holy temple; let all the earth be silent before him.&rdquo;
              </p>
              <p className="text-[10px] uppercase tracking-widest mt-3 opacity-30" style={{ color: IVORY }}>Habakkuk 2:20</p>
            </>
          ) : null}
        </div>

        {/* Progress Logic - Stage 2 only */}
        <div className={`mt-8 flex gap-3 transition-opacity duration-500 ${stage === "breathing" || stage === "ready" ? "opacity-100" : "opacity-0"}`}>
          {[0, 1, 2].map(i => (
            <div 
              key={i} 
              className={`w-1.5 h-1.5 rounded-full transition-all duration-700 ${i < cycle || stage === "ready" ? "bg-[#c4a265] scale-110" : i === cycle ? "bg-[#c4a265]/50 scale-125" : "bg-[#f5efe3]/20 scale-100"}`}
            />
          ))}
        </div>
      </div>

      {/* Footer / Skip */}
      <button
        onClick={() => onCompleteRef.current()}
        className="absolute bottom-12 text-[10px] uppercase tracking-[0.3em] font-bold opacity-30 hover:opacity-100 transition-opacity p-4"
        style={{ color: IVORY }}
      >
        Skip Stillness
      </button>

    </div>
  );
}
