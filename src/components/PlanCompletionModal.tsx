"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { PlanProgress, READING_PLANS } from "@/lib/store";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  progress: PlanProgress | null;
}

export default function PlanCompletionModal({ isOpen, onClose, progress }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        const duration = 5 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(() => {
          const timeLeft = animationEnd - Date.now();
          if (timeLeft <= 0) return clearInterval(interval);

          const particleCount = 50 * (timeLeft / duration);
          confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
          confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);
        
        return () => clearInterval(interval);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!mounted || !progress) return null;

  const plan = READING_PLANS.find(p => p.id === progress.planId);
  if (!plan) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-ivory rounded-[2.5rem] shadow-2xl overflow-hidden text-center p-10 sm:p-14"
          >
            {/* Success Icon / Emblem */}
            <div className="mb-8 relative inline-block">
              <div className="absolute inset-0 bg-accent-gold/20 blur-2xl rounded-full scale-150 animate-pulse" />
              <div className="relative w-24 h-24 rounded-full border-2 border-accent-gold/30 flex items-center justify-center bg-accent-gold/10">
                <span className="text-5xl">🕊️</span>
              </div>
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl text-brown mb-4 leading-tight">
              Glory to God!
            </h2>
            <p className="text-brown-light text-lg mb-8 leading-relaxed">
              You have completed the <span className="font-semibold text-brown">{plan.title}</span>. 
              May the seeds of this journey grow deep in your heart.
            </p>

            <div className="bg-brown/5 rounded-3xl p-6 mb-10 text-left border border-brown/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-accent-gold/20 flex items-center justify-center text-accent-gold">
                  ✓
                </div>
                <span className="font-medium text-brown uppercase tracking-wider text-xs">Achievement Unlocked</span>
              </div>
              <p className="font-serif italic text-brown leading-relaxed">
                "I have fought the good fight, I have finished the race, I have kept the faith."
              </p>
              <p className="text-accent-gold text-xs mt-2 font-medium tracking-widest text-right">— 2 Timothy 4:7</p>
            </div>

            <button
              onClick={onClose}
              className="w-full py-5 px-8 rounded-2xl bg-brown text-ivory font-serif text-lg tracking-wide hover:bg-brown/90 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg"
            >
              Finish & Look Ahead
            </button>
            
            <p className="mt-6 text-brown-light/40 text-xs tracking-widest uppercase">
              R.O.P.E. Community milestone reached
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
