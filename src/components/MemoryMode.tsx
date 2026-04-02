"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface MemoryModeProps {
  verse: string;
  text: string;
  onClose: () => void;
}

const IVORY = "#f5efe3";
const GOLD = "#c4a265";
const BG = "#1e1c16";

export default function MemoryMode({ verse, text, onClose }: MemoryModeProps) {
  const [mounted, setMounted] = useState(false);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(800); // ms per word (reversed logic)
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    // Prevent body scrolling when modal is open
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentIndex]);

  useEffect(() => {
    if (playing && currentIndex < words.length - 1) {
      timerRef.current = setInterval(() => {
        setCurrentIndex(prev => {
          if (prev >= words.length - 1) {
            setPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1350 - speed); // Reverse: higher slider value = shorter delay
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playing, speed, words.length, currentIndex]);

  if (!mounted) return null;

  const progress = Math.max(0, ((currentIndex + 1) / words.length) * 100);

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-[#1e1c16] text-[#f5efe3] flex flex-col overflow-hidden animate-fade-in-fast">
      {/* Header - Fixed Height */}
      <div className="h-14 px-6 flex items-center justify-between border-b border-white/5 bg-black/20 shrink-0">
        <div className="flex flex-col">
          <h2 className="font-serif text-sm text-accent-gold font-medium leading-none mb-1">{verse}</h2>
          <p className="text-[9px] uppercase tracking-widest opacity-40">Memory Mode</p>
        </div>
        <button 
          onClick={onClose}
          className="p-2 -mr-2 text-white/40 hover:text-white transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Main Content Area - Responsive flex/grid */}
      <div className="flex-1 w-full flex flex-col items-center justify-center p-6 md:p-12 overflow-hidden">
        
        {/* Scrollable Text Container - Centered */}
        <div 
          ref={scrollRef}
          className="w-full max-w-3xl overflow-y-auto no-scrollbar scroll-smooth flex flex-col justify-center min-h-0"
        >
          <p 
            className="font-serif text-xl md:text-3xl lg:text-4xl leading-[1.6] md:leading-[1.8] text-center transition-all duration-300 py-4"
            style={{ textShadow: `0 0 20px ${GOLD}11` }}
          >
            {currentIndex === -1 ? (
              <span className="opacity-20 italic text-lg md:text-xl block">Press play to begin reciting...</span>
            ) : (
              words.slice(0, currentIndex + 1).map((word, i) => (
                <span 
                  key={i} 
                  className={`inline-block mr-[0.35em] transition-all duration-300 ${i === currentIndex ? "text-accent-gold scale-105 font-medium" : "opacity-50"}`}
                >
                  {word}
                </span>
              ))
            )}
          </p>
        </div>
      </div>

      {/* Footer controls - Fixed Height */}
      <div className="w-full bg-black/10 border-t border-white/5 px-6 pt-6 pb-8 flex flex-col items-center gap-6 shrink-0">
        
        {/* Progress Visualizer */}
        <div className="flex flex-wrap justify-center gap-1 w-full max-w-md">
          {words.map((_, i) => (
            <div 
              key={i}
              className={`w-1 h-1 rounded-full transition-all duration-300 ${i <= currentIndex ? "bg-accent-gold" : "bg-white/10"}`}
            />
          ))}
        </div>

        <div className="flex items-center gap-8 md:gap-12">
          <button 
            onClick={() => { setCurrentIndex(-1); setPlaying(false); }}
            className="w-10 h-10 flex items-center justify-center rounded-full border border-white/10 text-white/40 hover:bg-white/5 transition-all active:scale-90"
            title="Reset"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>

          <button 
            onClick={() => setPlaying(!playing)}
            className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center rounded-full bg-accent-gold text-[#1e1c16] shadow-lg shadow-accent-gold/20 hover:scale-105 transition-all active:scale-95 text-xl"
          >
            {playing ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="ml-1">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            )}
          </button>

          <button 
            onClick={() => {
              if (currentIndex < words.length - 1) setCurrentIndex(prev => prev + 1);
              else setPlaying(false);
            }}
            className="w-10 h-10 flex items-center justify-center rounded-full border border-white/10 text-white/40 hover:bg-white/5 transition-all active:scale-90"
            title="Step forward"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="13 17 18 12 13 7" /><polyline points="6 17 11 12 6 7" />
            </svg>
          </button>
        </div>

        {/* Speed Slider */}
        <div className="w-full max-w-xs space-y-2">
          <div className="flex justify-between items-center px-1">
            <span className="text-[8px] uppercase tracking-widest text-white/30 font-bold">Speed</span>
            <span className="text-[10px] text-accent-gold font-mono">{Math.round(60000 / (1350 - speed))} wpm</span>
          </div>
          <input 
            type="range"
            min="150"
            max="1200"
            step="50"
            value={speed}
            onChange={(e) => setSpeed(parseInt(e.target.value))}
            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent-gold"
          />
        </div>
      </div>

      {/* Progress Bar (Bottom Edge) */}
      <div className="absolute bottom-0 left-0 h-1 bg-accent-gold/40 transition-all duration-300" style={{ width: `${progress}%` }} />
    </div>,
    document.body
  );
}
