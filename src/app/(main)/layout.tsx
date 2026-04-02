"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { getDarkMode, setDarkMode, hasCompletedOnboarding, resetOnboarding, initializeStore } from "@/lib/store";
import BottomNav from "@/components/BottomNav";
import Onboarding from "@/components/Onboarding";
import HelpCenter from "@/components/HelpCenter";
import { OliveBranch } from "@/components/Accents";
import { logErrorAction } from "@/lib/actions";

const navItems = [
  {
    label: "Journal",
    href: "/journal",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? "1.5" : "1.8"} strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        {!active && <line x1="8" y1="7" x2="16" y2="7" />}
        {!active && <line x1="8" y1="11" x2="14" y2="11" />}
      </svg>
    ),
  },
  {
    label: "Check-in",
    href: "/checkin",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.2" : "1.8"} strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  },
  {
    label: "Insights",
    href: "/insights",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.2" : "1.8"} strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    label: "Plans",
    href: "/plans",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.2" : "1.8"} strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
  {
    label: "Bible",
    href: "/bible",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? "1.5" : "1.8"} strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
  {
    label: "Prayers",
    href: "/prayers",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? "1.5" : "1.8"} strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.78-8.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    label: "Community",
    href: "/community",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? "1.5" : "1.8"} strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: "Me",
    href: "/me",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? "1.5" : "1.8"} strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

const dailyVerses = [
  { text: "The Lord is my shepherd; I shall not want.", ref: "Psalm 23:1" },
  { text: "Trust in the Lord with all your heart, and lean not on your own understanding.", ref: "Proverbs 3:5" },
  { text: "I can do all things through Christ who strengthens me.", ref: "Philippians 4:13" },
  { text: "Be strong and courageous. Do not be afraid; do not be discouraged.", ref: "Joshua 1:9" },
  { text: "For I know the plans I have for you, declares the Lord, plans to prosper you.", ref: "Jeremiah 29:11" },
  { text: "The Lord is my light and my salvation — whom shall I fear?", ref: "Psalm 27:1" },
  { text: "Come to me, all who are weary and burdened, and I will give you rest.", ref: "Matthew 11:28" },
];

const reflectionPrompts = [
  "What is God teaching you this season?",
  "Where have you seen God at work this week?",
  "What truth is He pressing into your heart?",
  "How is God shaping your character right now?",
  "What promise of God are you standing on today?",
  "Where do you need to trust Him more deeply?",
  "How can you be a light to someone today?",
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useAuth();
  const [ready, setReady] = useState(false);
  const [darkMode, setDarkModeState] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return false;
  });
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;

    async function init() {
      try {
        await initializeStore(isSignedIn || false);
      } catch (e) {
        console.error("Store initialization failed in layout", e);
      }
      
      const initialDark = getDarkMode();
      setDarkModeState(initialDark);
      
      if (!hasCompletedOnboarding()) setShowOnboarding(true);
      setReady(true);
    }
    init();

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = (e: MediaQueryListEvent) => {
      if (localStorage.getItem("rope_dark_mode") === null) {
        setDarkModeState(e.matches);
      }
    };
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "rope_dark_mode") {
        setDarkModeState(e.newValue === "true");
      }
    };

    const handleCustomChange = (e: any) => {
      setDarkModeState(e.detail.darkMode);
    };
 
    const handleOpenHelp = (e: any) => {
      if (e.detail?.view) setDefaultHelpView(e.detail.view);
      setShowHelpCenter(true);
    };
 
    mediaQuery.addEventListener("change", handleSystemChange);
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("rope-theme-toggle", handleCustomChange as any);
    window.addEventListener("rope-open-help", handleOpenHelp as any);
    return () => {
      mediaQuery.removeEventListener("change", handleSystemChange);
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("rope-theme-toggle", handleCustomChange as any);
      window.removeEventListener("rope-open-help", handleOpenHelp as any);
    };
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    // Only toggle if the current DOM state differs from our state
    const isCurrentlyDark = document.documentElement.classList.contains("dark");
    if (darkMode !== isCurrentlyDark) {
      if (darkMode) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, [darkMode]);

  function toggleDarkMode() {
    const next = !darkMode;
    setDarkModeState(next);
    setDarkMode(next);
    window.dispatchEvent(new CustomEvent("rope-theme-toggle", { detail: { darkMode: next } }));
  }

  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const [defaultHelpView, setDefaultHelpView] = useState<"guide" | "feedback">("guide");

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      logErrorAction({
        message: event.message,
        stack: event.error?.stack,
        pathname: window.location.pathname,
        context: { type: "onerror", browser: navigator.userAgent }
      });
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      logErrorAction({
        message: event.reason?.message || "Unhandled Promise Rejection",
        stack: event.reason?.stack,
        pathname: window.location.pathname,
        context: { type: "unhandledrejection", browser: navigator.userAgent }
      });
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <p className="text-muted font-serif text-lg">Loading...</p>
      </div>
    );
  }

  const dayIndex = new Date().getDay();
  const todayVerse = dailyVerses[dayIndex];
  const todayPrompt = reflectionPrompts[dayIndex];

  return (
    <div className="min-h-[100dvh] bg-ivory overflow-x-hidden">
      <aside className="hidden md:flex md:fixed md:inset-y-0 md:left-0 md:w-64 md:flex-col bg-sidebar border-r border-brown/8 z-40">
        <div className="px-3 pt-20 space-y-1">
          <button
            onClick={() => { setDefaultHelpView("guide"); setShowHelpCenter(true); }}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all text-muted hover:text-brown hover:bg-cream/50 group"
            aria-label="Help and info"
          >
            <span className="w-5 h-5 flex items-center justify-center rounded-full bg-brown/5 text-muted group-hover:bg-brown/10 group-hover:text-brown transition-colors">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </span>
            Quick Guide
          </button>
          <button
            onClick={() => { setDefaultHelpView("feedback"); setShowHelpCenter(true); }}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all text-muted hover:text-brown hover:bg-cream/50 group"
            aria-label="Report bugs or suggest features"
          >
            <span className="w-5 h-5 flex items-center justify-center rounded-full bg-struggle/5 text-muted group-hover:bg-struggle/10 group-hover:text-struggle transition-colors">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </span>
            Bugs & Features
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all relative ${
                  isActive
                    ? "bg-cream-dark/60 text-brown"
                    : "text-muted hover:text-brown hover:bg-cream/50"
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-brown rounded-r-full" />
                )}
                <span className={isActive ? "text-brown" : "text-muted"}>{item.icon(isActive)}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-6 py-3">
          <button
            onClick={toggleDarkMode}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs text-muted hover:text-brown hover:bg-cream/50 transition"
          >
            {darkMode ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
            {darkMode ? "Light mode" : "Dark mode"}
          </button>
        </div>

        <div className="px-6 py-6 space-y-3">
          <OliveBranch className="mx-auto opacity-60" />
          <p className="text-muted/40 text-xs italic leading-relaxed text-center">
            Your word is a lamp to my feet
            <br />
            &mdash; Psalm 119:105
          </p>
        </div>
      </aside>

      <main className="pb-24 pt-16 md:pb-8 md:ml-64 xl:mr-[280px]">
        <div className="max-w-lg mx-auto md:max-w-2xl md:px-4">
          {children}
          
          <footer className="mt-12 py-8 border-t border-brown/5 text-center px-4">
            <p className="text-muted/30 text-[10px] uppercase tracking-[0.2em] font-medium leading-loose">
              Created by <span className="text-muted/40">Shubh Bhakta</span> & <span className="text-muted/40">Tiernan Lindauer</span>
              <br />
              ROPE Bible Journaling &copy; {new Date().getFullYear()}
            </p>
          </footer>
        </div>
      </main>

      {/* Devotional side rail — xl+ only */}
      <aside className="hidden xl:flex xl:fixed xl:inset-y-0 xl:right-0 xl:w-[280px] xl:flex-col bg-cream-dark/50 border-l border-brown/6 z-40 px-6 pt-20 pb-10">
        {(() => {
          const pageContext = (() => {
            if (pathname.startsWith("/journal")) return {
              label: "As You Journal",
              verse: { text: "Be still, and know that I am God.", ref: "Psalm 46:10" },
              prompt: "Let each section be a conversation with God, not just a task.",
              footerLabel: "Journal with intention",
            };
            if (pathname.startsWith("/checkin")) return {
              label: "Walking It Out",
              verse: { text: "But be doers of the word, and not hearers only, deceiving yourselves.", ref: "James 1:22" },
              prompt: "Honest reflection is where growth begins. God already knows your heart.",
              footerLabel: "Grace upon grace",
            };
            if (pathname.startsWith("/plans")) return {
              label: "Guided Journey",
              verse: { text: "Thy word is a lamp unto my feet, and a light unto my path.", ref: "Psalm 119:105" },
              prompt: "A reading plan gives structure to your devotion. Trust the journey.",
              footerLabel: "One step at a time",
            };
            if (pathname.startsWith("/bible")) return {
              label: "The Living Word",
              verse: { text: "All Scripture is God-breathed and is useful for teaching, rebuking, correcting and training in righteousness.", ref: "2 Tim. 3:16" },
              prompt: "A grateful heart sees His hand in every season.",
              footerLabel: "His goodness endures",
            };
            if (pathname.startsWith("/prayers")) return {
              label: "The Prayer Closet",
              verse: { text: "The prayer of a righteous person is powerful and effective.", ref: "James 5:16" },
              prompt: "Pour out your heart to Him. He is always listening.",
              footerLabel: "He hears you",
            };
            if (pathname.startsWith("/insights")) return {
              label: "Seeing the Pattern",
              verse: { text: "And we know that in all things God works for the good of those who love him.", ref: "Romans 8:28" },
              prompt: "Your entries reveal how God has been shaping your heart over time.",
              footerLabel: "His faithfulness endures",
            };
            return {
              label: "Daily Word",
              verse: todayVerse,
              prompt: todayPrompt,
              footerLabel: "Walk in the light",
            };
          })();

          return (
            <div className="flex-1 flex flex-col">
              {/* Contextual verse */}
              <div className="mb-8">
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted font-medium mb-4">{pageContext.label}</p>
                <div className="border-l-2 border-accent-gold/25 pl-4 py-1">
                  <p className="text-dark/70 text-sm italic leading-relaxed">
                    &ldquo;{pageContext.verse.text}&rdquo;
                  </p>
                  <p className="text-muted text-xs mt-2">&mdash; {pageContext.verse.ref}</p>
                </div>
              </div>

              {/* Divider */}
              <div className="section-divider mb-8" />

              {/* Contextual prompt */}
              <div className="mb-8">
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted font-medium mb-4">Reflection</p>
                <p className="text-dark/60 text-sm leading-relaxed font-serif italic">
                  {pageContext.prompt}
                </p>
              </div>

              {/* Olive branch accent at bottom */}
              <div className="mt-auto flex flex-col items-center gap-4">
                <OliveBranch className="opacity-40" />
                <p className="text-muted/30 text-[10px] tracking-[0.15em] uppercase">
                  {pageContext.footerLabel}
                </p>
              </div>
            </div>
          );
        })()}
      </aside>

      {/* Bottom nav — mobile only */}
      <BottomNav />

      {showOnboarding && <Onboarding onComplete={() => setShowOnboarding(false)} />}
      
      {showHelpCenter && (
        <HelpCenter 
          onClose={() => setShowHelpCenter(false)} 
          onRestartWalkthrough={() => { resetOnboarding(); setShowOnboarding(true); }} 
          defaultView={defaultHelpView}
        />
      )}
    </div>
  );
}
