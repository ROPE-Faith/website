"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

/* ─── Data ─── */
const LETTERS = [
  { letter: "R", word: "Revelation", prompt: "What is God showing you today?" },
  { letter: "O", word: "Observation", prompt: "What stands out, and why?" },
  { letter: "P", word: "Prayer", prompt: "Turn insight into conversation." },
  { letter: "E", word: "Execution", prompt: "How will you live this tomorrow?" },
] as const;

/* ─── Scroll reveal hook ─── */
function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

/* ─── Main Page ─── */
export default function SplashPage() {
  const router = useRouter();
  const [phase, setPhase] = useState(0);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [exiting, setExiting] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [crossHovered, setCrossHovered] = useState(false);

  /* Orchestrated entrance sequence */
  useEffect(() => {
    const delays = [200, 600, 900, 1100, 1300, 1500, 1900, 2200, 2500, 2700];
    const timers = delays.map((d, i) => setTimeout(() => setPhase(i + 1), d));
    return () => timers.forEach(clearTimeout);
  }, []);

  const handleEnter = useCallback(() => {
    setExiting(true);
    setTimeout(() => router.push("/journal"), 900);
  }, [router]);

  /* Scroll sections */
  const s1 = useScrollReveal(0.2);
  const s2 = useScrollReveal(0.2);
  const s3 = useScrollReveal(0.2);
  const s4 = useScrollReveal(0.2);
  const sCta = useScrollReveal(0.3);
  const sVerse = useScrollReveal(0.3);
  const sComing = useScrollReveal(0.2);

  const scrollSections = [s1, s2, s3, s4];

  return (
    <div className="relative">
      {/* ═══════════════════════════════════════════
          HERO — Full viewport with video background
          ═══════════════════════════════════════════ */}
      <section
        className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
        style={{ background: "#0a0804" }}
      >
        {/* ─── Video background — Bible pages turning at night ─── */}
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onLoadedData={() => setVideoLoaded(true)}
          onCanPlay={() => setVideoLoaded(true)}
          onPlaying={() => setVideoLoaded(true)}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-[2000ms] ease-out pointer-events-none"
          style={{ opacity: phase >= 1 ? 0.75 : 0 }}
          src="/mixkit-turning-the-pages-by-night-17384-hd-ready.mp4"
          aria-hidden="true"
        />

        {/* ─── Dark overlays for depth + readability ─── */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0804]/30 via-[#0a0804]/10 to-[#0a0804]/50 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(10,8,4,0.55)_100%)] pointer-events-none" />

        {/* ─── Sacred light bloom from above ─── */}
        <div
          className="absolute inset-0 transition-opacity duration-[2000ms] ease-out pointer-events-none"
          style={{
            opacity: phase >= 1 ? 1 : 0,
            background: `
              radial-gradient(ellipse 50% 35% at 50% 0%, rgba(196, 162, 101, 0.12) 0%, transparent 70%),
              radial-gradient(ellipse 70% 45% at 50% 5%, rgba(245, 239, 227, 0.06) 0%, transparent 60%)
            `,
          }}
        />

        {/* ─── Warm ambient center glow ─── */}
        <div
          className="absolute inset-0 transition-opacity duration-[2500ms] ease-out pointer-events-none"
          style={{
            opacity: phase >= 2 ? 1 : 0,
            background: `radial-gradient(ellipse 45% 45% at 50% 42%, rgba(196, 162, 101, 0.04) 0%, transparent 70%)`,
          }}
        />

        {/* ─── Subtle grain texture ─── */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`,
            backgroundSize: "128px 128px",
          }}
        />

        {/* ─── Exit overlay — expanding light ─── */}
        <div
          className="absolute inset-0 z-50 pointer-events-none transition-all ease-in-out"
          style={{
            background: `radial-gradient(ellipse at 50% 50%, #f5efe3 0%, #f5efe3 40%, rgba(245,239,227,0.8) 70%, transparent 100%)`,
            opacity: exiting ? 1 : 0,
            transform: exiting ? "scale(3)" : "scale(0.3)",
            transitionDuration: exiting ? "900ms" : "0ms",
          }}
        />

        {/* ─── Content ─── */}
        <div className="relative z-10 flex flex-col items-center px-6 w-full pt-20">

          {/* ═══ Small cross icon above ROPE ═══ */}
          <div
            className="mb-5 transition-all duration-700 ease-out cursor-pointer"
            style={{
              opacity: phase >= 1 ? 1 : 0,
              transform: phase >= 1 ? "translateY(0)" : "translateY(12px)",
              position: "relative",
            }}
            onMouseEnter={() => setCrossHovered(true)}
            onMouseLeave={() => setCrossHovered(false)}
          >
            {/* Aura glow behind cross */}
            <div
              className="absolute inset-0 pointer-events-none transition-all duration-500 ease-out"
              style={{
                opacity: crossHovered ? 1 : 0,
                transform: crossHovered ? "scale(1)" : "scale(0.6)",
                background: "radial-gradient(ellipse 60% 80% at 50% 50%, rgba(196, 162, 101, 0.45) 0%, rgba(196, 162, 101, 0.15) 50%, transparent 75%)",
                filter: "blur(8px)",
                borderRadius: "50%",
                width: "80px",
                height: "100px",
                left: "50%",
                top: "50%",
                marginLeft: "-40px",
                marginTop: "-50px",
              }}
            />
            <svg
              width="28"
              height="40"
              viewBox="0 0 20 28"
              fill="none"
              aria-hidden="true"
              className="mx-auto relative transition-all duration-500 ease-out"
              style={{
                filter: crossHovered
                  ? "drop-shadow(0 0 8px rgba(196, 162, 101, 0.8)) drop-shadow(0 0 20px rgba(196, 162, 101, 0.4))"
                  : "none",
                transform: crossHovered ? "scale(1.08)" : "scale(1)",
              }}
            >
              <rect x="8" y="0" width="4" height="28" rx="1" fill={crossHovered ? "rgba(196, 162, 101, 0.85)" : "rgba(196, 162, 101, 0.25)"} style={{ transition: "fill 0.5s ease" }} />
              <rect x="0" y="6" width="20" height="4" rx="1" fill={crossHovered ? "rgba(196, 162, 101, 0.85)" : "rgba(196, 162, 101, 0.25)"} style={{ transition: "fill 0.5s ease" }} />
            </svg>
          </div>

          {/* ═══ ROPE — Giant typography hero ═══ */}
          <div className="flex items-center justify-center mb-6 md:mb-8 select-none">
            {LETTERS.map(({ letter, word, prompt }, i) => {
              const isRevealed = phase >= i + 2;
              const isHovered = hoveredIdx === i;
              const othersHovered = hoveredIdx !== null && hoveredIdx !== i;

              return (
                <div
                  key={letter}
                  className="relative group cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onClick={() => setHoveredIdx(hoveredIdx === i ? null : i)}
                  role="button"
                  aria-label={`${letter} for ${word}: ${prompt}`}
                  aria-expanded={hoveredIdx === i}
                >
                  <span
                    className="font-serif font-bold inline-block transition-all duration-500 ease-out"
                    style={{
                      fontSize: "clamp(4.5rem, 18vw, 14rem)",
                      lineHeight: 0.85,
                      letterSpacing: "0.06em",
                      color: isRevealed
                        ? isHovered
                          ? "rgba(245, 239, 227, 1)"
                          : othersHovered
                            ? "rgba(245, 239, 227, 0.3)"
                            : "rgba(245, 239, 227, 0.9)"
                        : "transparent",
                      textShadow: isRevealed
                        ? isHovered
                          ? "0 0 40px rgba(196, 162, 101, 0.3), 0 0 80px rgba(196, 162, 101, 0.1), 0 2px 4px rgba(0,0,0,0.3)"
                          : "0 0 20px rgba(196, 162, 101, 0.06), 0 2px 4px rgba(0,0,0,0.2)"
                        : "none",
                      opacity: isRevealed ? 1 : 0,
                      transform: isRevealed
                        ? isHovered ? "translateY(-4px)" : "translateY(0)"
                        : "translateY(20px)",
                    }}
                  >
                    {letter}
                  </span>

                  {/* ─── Hover reveal: word + prompt ─── */}
                  <div
                    className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none whitespace-nowrap transition-all duration-300 ease-out"
                    style={{
                      top: "calc(100% + 12px)",
                      opacity: isHovered && isRevealed ? 1 : 0,
                      transform: isHovered && isRevealed ? "translateY(0)" : "translateY(6px)",
                    }}
                  >
                    <span className="font-serif text-sm md:text-base text-[#f5efe3]/70 tracking-[0.2em] uppercase">
                      {word}
                    </span>
                    <span className="text-[#f5efe3]/35 text-xs md:text-sm mt-1 italic font-light">
                      {prompt}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ═══ Decorative gold line ═══ */}
          <div
            className="h-px mb-6 md:mb-8 transition-all duration-700 ease-out"
            style={{
              width: phase >= 6 ? "6rem" : "0rem",
              background: "linear-gradient(90deg, transparent, rgba(196, 162, 101, 0.35), transparent)",
            }}
          />

          {/* ═══ Subtitle ═══ */}
          <p
            className="font-serif text-[#f5efe3]/70 text-sm md:text-base tracking-[0.3em] uppercase mb-8 md:mb-10 text-center transition-all duration-600 ease-out"
            style={{
              opacity: phase >= 6 ? 1 : 0,
              transform: phase >= 6 ? "translateY(0)" : "translateY(10px)",
            }}
          >
            Revelation &middot; Observation &middot; Prayer &middot; Execution
          </p>

          {/* ═══ Supporting copy ═══ */}
          <p
            className="text-[#f5efe3]/60 text-sm md:text-base max-w-md text-center leading-relaxed mb-10 md:mb-12 transition-all duration-600 ease-out"
            style={{
              opacity: phase >= 7 ? 1 : 0,
              transform: phase >= 7 ? "translateY(0)" : "translateY(10px)",
            }}
          >
            A daily practice for reading Scripture with intention. One verse, four steps, a deeper walk.
          </p>

          {/* ═══ Primary CTA ═══ */}
          <button
            onClick={handleEnter}
            disabled={exiting || phase < 8}
            className="group relative px-12 py-4 font-serif font-medium text-base md:text-lg rounded-full transition-all duration-500 ease-out disabled:opacity-0 disabled:pointer-events-none hover:scale-[1.03] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c4a265]/30"
            style={{
              opacity: phase >= 8 ? 1 : 0,
              transform: phase >= 8 ? "translateY(0)" : "translateY(12px)",
              transitionDuration: "600ms",
              background: "linear-gradient(135deg, rgba(196, 162, 101, 0.9) 0%, rgba(166, 132, 71, 0.9) 100%)",
              color: "#1a1714",
              boxShadow: "0 4px 24px rgba(196, 162, 101, 0.2), 0 1px 3px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15)",
              letterSpacing: "0.04em",
            }}
          >
            <span className="relative z-10">Begin today&#39;s journal</span>
            <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ boxShadow: "0 8px 40px rgba(196, 162, 101, 0.35), 0 0 60px rgba(196, 162, 101, 0.1)" }} />
          </button>

          {/* ═══ Trust badge ═══ */}
          <div
            className="flex items-center gap-2 mt-5 text-[#f5efe3]/25 text-[11px] transition-all duration-600 ease-out"
            style={{ opacity: phase >= 8 ? 1 : 0, transitionDelay: "200ms" }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>Your data stays on this device</span>
          </div>

          {/* ═══ Scripture — editorial credit ═══ */}
          <p
            className="text-[#f5efe3]/20 text-xs italic mt-16 md:mt-20 text-center transition-all duration-600 ease-out tracking-wide"
            style={{ opacity: phase >= 9 ? 1 : 0 }}
          >
            &ldquo;Your word is a lamp to my feet and a light to my path.&rdquo;
            <span className="not-italic block mt-1 text-[#f5efe3]/12 text-[10px] tracking-[0.2em] uppercase">
              Psalm 119:105
            </span>
          </p>
        </div>

        {/* ─── Scroll indicator ─── */}
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 transition-opacity duration-600 ease-out"
          style={{ opacity: phase >= 9 && !exiting ? 0.25 : 0 }}
        >
          <div className="w-5 h-8 rounded-full border border-ivory/20 flex items-start justify-center pt-1.5">
            <div
              className="w-1 h-2 rounded-full bg-ivory/40"
              style={{ animation: phase >= 9 ? "scrollDot 2s ease-in-out infinite" : "none" }}
            />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          BELOW THE FOLD — The Practice
          ═══════════════════════════════════════════ */}
      <section
        className="relative py-24 md:py-32 overflow-hidden"
        style={{ background: "#f5efe3" }}
      >
        {/* Subtle top shadow for depth at transition */}
        <div
          className="absolute top-0 left-0 right-0 h-24 pointer-events-none"
          style={{
            background: "linear-gradient(180deg, rgba(10,8,4,0.15) 0%, transparent 100%)",
          }}
        />

        {/* Section heading */}
        <div className="max-w-2xl mx-auto px-6 mb-16 md:mb-24 text-center">
          <p className="text-xs tracking-[0.4em] uppercase mb-4 font-medium" style={{ color: "#8a7a5a" }}>
            The Practice
          </p>
          <h2 className="font-serif text-2xl md:text-3xl font-semibold leading-snug" style={{ color: "#1a1714" }}>
            Four steps. One verse.<br />A daily rhythm of faith.
          </h2>
        </div>

        {/* Four steps */}
        <div className="max-w-3xl mx-auto px-6 space-y-16 md:space-y-20">
          {LETTERS.map(({ letter, word, prompt }, i) => {
            const section = scrollSections[i];
            return (
              <div
                key={letter}
                ref={section.ref}
                className="flex items-start gap-6 md:gap-8 transition-all duration-700 ease-out"
                style={{
                  opacity: section.visible ? 1 : 0,
                  transform: section.visible ? "translateY(0)" : "translateY(24px)",
                  transitionDelay: `${i * 80}ms`,
                }}
              >
                <div className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center" style={{ border: "1px solid #c4a265", background: "rgba(196,162,101,0.08)" }}>
                  <span className="font-serif text-xl md:text-2xl font-bold" style={{ color: "#8a7a5a" }}>
                    {letter}
                  </span>
                </div>
                <div className="pt-1">
                  <h3 className="font-serif text-lg md:text-xl font-semibold mb-2 tracking-wide" style={{ color: "#1a1714" }}>
                    {word}
                  </h3>
                  <p className="text-sm md:text-base leading-relaxed max-w-md" style={{ color: "#5a5247" }}>
                    {prompt}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ═══ Hand of God image ═══ */}
        <div
          ref={sVerse.ref}
          className="relative w-full mt-20 md:mt-28"
        >
          <img
            src="/hand-god.jpg"
            alt="A hand reaching toward the hand of God"
            className="w-full block"
          />
          {/* Fade top into cream */}
          <div
            className="absolute inset-x-0 top-0 h-32 pointer-events-none"
            style={{ background: "linear-gradient(180deg, #f5efe3 0%, transparent 100%)" }}
          />
          {/* Fade bottom into cream */}
          <div
            className="absolute inset-x-0 bottom-0 h-32 pointer-events-none"
            style={{ background: "linear-gradient(0deg, #f5efe3 0%, transparent 100%)" }}
          />
        </div>

        {/* ═══ Scripture interlude ═══ */}
        <div
          className="max-w-xl mx-auto px-6 mt-16 md:mt-20 text-center transition-all duration-700 ease-out"
          style={{
            opacity: sVerse.visible ? 1 : 0,
            transform: sVerse.visible ? "translateY(0)" : "translateY(16px)",
          }}
        >
          <div className="py-8 md:py-10" style={{ borderTop: "1px solid rgba(196,162,101,0.25)", borderBottom: "1px solid rgba(196,162,101,0.25)" }}>
            {/* Small cross */}
            <svg width="14" height="20" viewBox="0 0 14 20" fill="none" className="mx-auto mb-5">
              <rect x="5.5" y="0" width="3" height="20" rx="0.5" fill="rgba(196,162,101,0.5)" />
              <rect x="0" y="4.5" width="14" height="3" rx="0.5" fill="rgba(196,162,101,0.5)" />
            </svg>
            <p className="text-sm md:text-base italic leading-relaxed max-w-sm mx-auto" style={{ color: "#5a5247" }}>
              &ldquo;All Scripture is God-breathed and is useful for teaching, rebuking, correcting and training in righteousness.&rdquo;
            </p>
            <p className="text-xs mt-3 tracking-[0.15em] uppercase" style={{ color: "#8a7a5a" }}>
              2 Timothy 3:16
            </p>
          </div>
        </div>

        {/* ═══ The Experience — Live Features ═══ */}
        <div
          ref={sComing.ref}
          className="max-w-4xl mx-auto px-6 mt-20 md:mt-28 transition-all duration-700 ease-out"
          style={{
            opacity: sComing.visible ? 1 : 0,
            transform: sComing.visible ? "translateY(0)" : "translateY(20px)",
          }}
        >
          <div className="text-center mb-12">
            <p className="text-xs tracking-[0.4em] uppercase mb-3 font-medium" style={{ color: "#c4a265" }}>
              The Experience
            </p>
            <h2 className="font-serif text-2xl md:text-3xl font-semibold leading-snug" style={{ color: "#1a1714" }}>
              Faith is better together.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Global fellowship */}
            <div className="rounded-2xl p-6 text-center" style={{ border: "1px solid rgba(196,162,101,0.2)", background: "rgba(255,255,255,0.5)" }}>
              <div className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ border: "1px solid rgba(196,162,101,0.3)", background: "rgba(196,162,101,0.08)" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8a7a5a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3 className="font-serif text-base font-semibold mb-2" style={{ color: "#1a1714" }}>Global Fellowship</h3>
              <p className="text-xs leading-relaxed" style={{ color: "#6a6058" }}>
                Discuss any verse with the global ROPE community. Share what God is teaching you.
              </p>
            </div>

            {/* Testimonials */}
            <div className="rounded-2xl p-6 text-center" style={{ border: "1px solid rgba(196,162,101,0.2)", background: "rgba(255,255,255,0.5)" }}>
              <div className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ border: "1px solid rgba(196,162,101,0.3)", background: "rgba(196,162,101,0.08)" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8a7a5a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <h3 className="font-serif text-base font-semibold mb-2" style={{ color: "#1a1714" }}>Public Testimony</h3>
              <p className="text-xs leading-relaxed" style={{ color: "#6a6058" }}>
                Share answered prayers. Let your testimony encourage someone else&apos;s faith.
              </p>
            </div>

            {/* Reading Plans */}
            <div className="rounded-2xl p-6 text-center" style={{ border: "1px solid rgba(196,162,101,0.2)", background: "rgba(255,255,255,0.5)" }}>
              <div className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ border: "1px solid rgba(196,162,101,0.3)", background: "rgba(196,162,101,0.08)" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8a7a5a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
              </div>
              <h3 className="font-serif text-base font-semibold mb-2" style={{ color: "#1a1714" }}>Guided Journeys</h3>
              <p className="text-xs leading-relaxed" style={{ color: "#6a6058" }}>
                Structured reading plans to help you master themes and books of the Bible.
              </p>
            </div>

            {/* Sacred Stillness */}
            <div className="rounded-2xl p-6 text-center" style={{ border: "1px solid rgba(196,162,101,0.2)", background: "rgba(255,255,255,0.5)" }}>
              <div className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ border: "1px solid rgba(196,162,101,0.3)", background: "rgba(196,162,101,0.08)" }}>
                <span className="text-xl">🌬️</span>
              </div>
              <h3 className="font-serif text-base font-semibold mb-2" style={{ color: "#1a1714" }}>Sacred Stillness</h3>
              <p className="text-xs leading-relaxed" style={{ color: "#6a6058" }}>
                Quiet your heart with a guided breathing practice designed to help you focus before opening the Word.
              </p>
            </div>
          </div>

          {/* Coming Soon roadmap row */}
          <div className="mt-12 p-6 bg-brown/5 rounded-3xl border border-brown/10">
            <p className="text-[10px] text-accent-gold uppercase tracking-[0.3em] font-medium mb-4 text-center">Roadmap & Coming Soon</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: "👥", label: "Accountability Groups" },
                { icon: "🤝", label: "Prayer Partners" },
                { icon: "🌍", label: "Global Prayer Map" },
                { icon: "📅", label: "Collaborative Study" },
              ].map((f) => (
                <div key={f.label} className="text-center group">
                  <span className="text-xl block mb-1 group-hover:scale-110 transition-transform">{f.icon}</span>
                  <p className="text-[10px] font-medium tracking-wide" style={{ color: "#6a6058" }}>{f.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Closing CTA */}
        <div
          ref={sCta.ref}
          className="flex flex-col items-center mt-16 md:mt-24 transition-all duration-700 ease-out"
          style={{
            opacity: sCta.visible ? 1 : 0,
            transform: sCta.visible ? "translateY(0)" : "translateY(16px)",
          }}
        >
          <div
            className="w-12 h-px mb-10"
            style={{ background: "linear-gradient(90deg, transparent, rgba(196, 162, 101, 0.4), transparent)" }}
          />

          <button
            onClick={handleEnter}
            disabled={exiting}
            className="group relative px-12 py-5 font-medium text-lg rounded-2xl transition-all duration-300 ease-out hover:shadow-xl active:scale-[0.98] disabled:opacity-50"
            style={{ border: "1.5px solid #c4a265", color: "#1a1714", background: "rgba(196,162,101,0.05)" }}
          >
            <span className="tracking-wide font-serif">Enter today&#39;s ROPE</span>
            <div className="absolute inset-0 bg-accent-gold/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-[calc(1rem-1.5px)]" />
          </button>

          <div className="mt-10 flex flex-col items-center gap-4">
            <a 
              href="https://github.com/Shubh-Bhakta/rope-app"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-brown/60 hover:text-brown transition-colors group"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="group-hover:scale-110 transition-transform">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
              </svg>
              <span>View Source on GitHub</span>
            </a>
            <p className="text-[10px] tracking-widest uppercase text-brown/30 font-medium">
              Free &middot; Private &middot; Open Source
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
