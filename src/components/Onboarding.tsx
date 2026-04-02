"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { completeOnboarding } from "@/lib/store";

const STEPS = [
  {
    letter: "R",
    title: "Revelation",
    description: "Open your Bible and just read. Don\u2019t set a goal. Silence your mind, and let God\u2019s Word speak. Wherever you feel Him stop you, that\u2019s your revelation. Write down that verse.",
  },
  {
    letter: "O",
    title: "Observation",
    description: "Why did God stop you there? What stood out? Write down what you noticed: a pattern, a command, a promise, a truth that hit differently today.",
  },
  {
    letter: "P",
    title: "Prayer",
    description: "Talk to God about what you just read. Be honest. This isn\u2019t a formula, it\u2019s a conversation. Tell Him what you\u2019re feeling, what you need, what you\u2019re grateful for.",
  },
  {
    letter: "E",
    title: "Execution",
    description: "Write one specific thing you\u2019ll do differently tomorrow because of this verse. Not vague, but specific. Something you can check in on. This is where faith becomes action.",
  },
];

export default function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [animating, setAnimating] = useState(false);
  const touchStartX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const goTo = useCallback((target: number) => {
    if (target === step || animating) return;
    if (target < 0 || target >= STEPS.length) return;
    setDirection(target > step ? "forward" : "back");
    setAnimating(true);
    setTimeout(() => {
      setStep(target);
      setAnimating(false);
    }, 200);
  }, [step, animating]);

  function handleNext() {
    if (step < STEPS.length - 1) {
      goTo(step + 1);
    } else {
      completeOnboarding();
      onComplete();
    }
  }

  function handlePrev() {
    if (step > 0) goTo(step - 1);
  }

  function handleSkip() {
    completeOnboarding();
    onComplete();
  }

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        handlePrev();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  // Touch swipe
  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function onTouchEnd(e: React.TouchEvent) {
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(delta) > 50) {
      if (delta > 0) handleNext();
      else handlePrev();
    }
  }

  const current = STEPS[step];

  const contentStyle: React.CSSProperties = animating
    ? {
        opacity: 0,
        transform: direction === "forward" ? "translateX(20px)" : "translateX(-20px)",
        transition: "opacity 0.2s ease-out, transform 0.2s ease-out",
      }
    : {
        opacity: 1,
        transform: "translateX(0)",
        transition: "opacity 0.2s ease-out, transform 0.2s ease-out",
      };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[120] flex items-center justify-center px-6"
      style={{
        background: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(12px)",
        animation: "fadeIn 0.3s ease-out both",
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Card container for readability */}
      <div
        className="max-w-md w-full text-center rounded-2xl px-8 py-10 md:px-10 md:py-12"
        style={{
          background: "linear-gradient(135deg, #2a2418 0%, #1e1a14 50%, #2a2418 100%)",
          border: "1px solid rgba(196, 162, 101, 0.15)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(196,162,101,0.05)",
          animation: "fadeInUp 0.4s ease-out both",
        }}
      >
        {/* Progress dots — tappable */}
        <div className="flex justify-center gap-2.5 mb-8">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className="h-1.5 rounded-full transition-all duration-300 cursor-pointer py-1"
              aria-label={`Go to step ${i + 1}`}
              style={{
                width: i === step ? "2rem" : "0.5rem",
                background: i === step
                  ? "#c4a265"
                  : i < step
                    ? "rgba(196, 162, 101, 0.5)"
                    : "rgba(245, 239, 227, 0.15)",
              }}
            />
          ))}
        </div>

        {/* Animated content */}
        <div style={contentStyle}>
          {/* Step letter circle */}
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{
              background: "rgba(196, 162, 101, 0.12)",
              border: "2px solid rgba(196, 162, 101, 0.3)",
            }}
          >
            <span
              className="font-serif text-4xl font-bold"
              style={{ color: "#c4a265" }}
            >
              {current.letter}
            </span>
          </div>

          {/* Title */}
          <h2
            className="font-serif text-3xl font-semibold mb-5"
            style={{ color: "#f5efe3" }}
          >
            {current.title}
          </h2>

          {/* Description */}
          <p
            className="text-base leading-relaxed mb-10 max-w-sm mx-auto"
            style={{ color: "rgba(245, 239, 227, 0.75)" }}
          >
            {current.description}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={handleNext}
            className="px-10 py-3.5 font-semibold rounded-xl text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: "#c4a265",
              color: "#1a1714",
              boxShadow: "0 2px 8px rgba(196, 162, 101, 0.3)",
            }}
          >
            {step < STEPS.length - 1 ? "Next" : "Start Journaling"}
          </button>
          <button
            onClick={handleSkip}
            className="text-xs transition-colors"
            style={{ color: "rgba(245, 239, 227, 0.35)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(245, 239, 227, 0.6)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(245, 239, 227, 0.35)")}
          >
            Skip walkthrough
          </button>
        </div>

        {/* Step counter */}
        <p className="text-xs mt-8" style={{ color: "rgba(245, 239, 227, 0.2)" }}>
          {step + 1} of {STEPS.length}
        </p>
      </div>
    </div>
  );
}
