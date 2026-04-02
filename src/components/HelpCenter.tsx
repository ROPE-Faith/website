"use client";

import { useEffect, useRef, useState } from "react";
import FeedbackForm from "./FeedbackForm";

interface HelpCenterProps {
  onClose: () => void;
  onRestartWalkthrough: () => void;
  defaultView?: "guide" | "feedback";
}

export default function HelpCenter({ onClose, onRestartWalkthrough, defaultView = "guide" }: HelpCenterProps) {
  const [view, setView] = useState<"guide" | "feedback">(defaultView);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    // Handle Escape key
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div 
        ref={modalRef}
        className="max-w-md w-full bg-sidebar border border-brown/15 shadow-2xl rounded-3xl overflow-hidden animate-in fade-in zoom-in duration-400"
      >
        {/* Header */}
        <div className="bg-brown/5 px-8 py-6 border-b border-brown/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {view === "feedback" && (
              <button 
                onClick={() => setView("guide")}
                className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:bg-brown/10 hover:text-brown transition-colors"
                title="Back to Guide"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
                </svg>
              </button>
            )}
            <h2 className="font-serif text-xl font-bold text-brown">
              {view === "guide" ? "ROPE Quick Guide" : "Feedback & Bugs"}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:bg-brown/10 hover:text-brown transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-8 text-center">
          {view === "guide" ? (
            <div className="space-y-6">
              <div className="space-y-5 text-left">
                <div className="flex gap-4 group">
                  <div className="w-10 h-10 rounded-full bg-brown/10 border border-brown/20 flex items-center justify-center shrink-0 text-brown font-serif font-bold text-xl group-hover:scale-110 transition-transform">R</div>
                  <div>
                    <p className="text-sm font-bold text-dark mb-1">Revelation</p>
                    <p className="text-xs text-muted leading-relaxed">Simply read. When a verse or phrase stops you, that is God speaking. Write it down.</p>
                  </div>
                </div>

                <div className="flex gap-4 group">
                  <div className="w-10 h-10 rounded-full bg-brown/10 border border-brown/20 flex items-center justify-center shrink-0 text-brown font-serif font-bold text-xl group-hover:scale-110 transition-transform">O</div>
                  <div>
                    <p className="text-sm font-bold text-dark mb-1">Observation</p>
                    <p className="text-xs text-muted leading-relaxed">Why did you stop? What is the pattern, truth, or command? Define the revelation.</p>
                  </div>
                </div>

                <div className="flex gap-4 group">
                  <div className="w-10 h-10 rounded-full bg-brown/10 border border-brown/20 flex items-center justify-center shrink-0 text-brown font-serif font-bold text-xl group-hover:scale-110 transition-transform">P</div>
                  <div>
                    <p className="text-sm font-bold text-dark mb-1">Prayer</p>
                    <p className="text-xs text-muted leading-relaxed">Turn your observation into a conversation. Respond to God honestly and personally.</p>
                  </div>
                </div>

                <div className="flex gap-4 group">
                  <div className="w-10 h-10 rounded-full bg-brown/10 border border-brown/20 flex items-center justify-center shrink-0 text-brown font-serif font-bold text-xl group-hover:scale-110 transition-transform">E</div>
                  <div>
                    <p className="text-sm font-bold text-dark mb-1">Execution</p>
                    <p className="text-xs text-muted leading-relaxed">What is the next step? Write one specific thing you will do tomorrow based on this truth.</p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-brown/10">
                <div className="bg-cream/30 rounded-2xl p-4 mb-6 text-left">
                  <p className="text-[10px] uppercase tracking-widest text-muted font-bold mb-2">Pro Tip</p>
                  <p className="text-xs text-muted leading-snug">Use <kbd className="px-1.5 py-0.5 bg-brown/5 rounded border border-brown/10 font-mono text-[10px]">Cmd + L</kbd> to quickly search for any book or chapter in the Bible.</p>
                </div>

                <div className="space-y-3">
                  <button 
                    onClick={() => { onRestartWalkthrough(); onClose(); }}
                    className="w-full py-4 bg-brown text-ivory rounded-xl font-bold text-sm hover:bg-brown/90 shadow-lg shadow-brown/20 transition-all active:scale-[0.98]"
                  >
                    Restart Full Walkthrough
                  </button>
                  
                  <button 
                    onClick={() => setView("feedback")}
                    className="w-full py-3 bg-brown/5 text-brown border border-brown/15 rounded-xl font-bold text-xs hover:bg-brown/10 transition-all active:scale-[0.98]"
                  >
                    Submit Feedback / Report Bug
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <FeedbackForm onClose={onClose} />
          )}
        </div>
      </div>
    </div>
  );
}
