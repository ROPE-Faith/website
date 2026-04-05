"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  addRopeEntry,
  suggestBooks,
  getStreak,
  getTranslation,
  setTranslation,
  getGatewayVersion,
  TRANSLATIONS,
  getPlanSuggestedVerse,
  advancePlan,
  getActivePlan,
  getReachedMilestone,
  getNextMilestone,
  addMemoryVerse,
  getMemoryVerses,
  getBibleHistory,
  fetchVerse,
  BIBLE_BOOKS,
  PlanProgress
} from "@/lib/store";
import { OliveBranch } from "@/components/Accents";
import ShareCard from "@/components/ShareCard";
import Breathing from "@/components/Breathing";
import PlanCompletionModal from "@/components/PlanCompletionModal";

const steps = [
  { letter: "R", word: "Revelation", placeholder: "" },
  { letter: "O", word: "Observation", placeholder: "What did you observe? Why did you stop here? Reflect deeply, from your heart." },
  { letter: "P", word: "Prayer", placeholder: "Write your prayer about this passage." },
  { letter: "E", word: "Execution", placeholder: "How will you live this out tomorrow?" },
];

// ─── Daily Verse ──────────────────────────────────────────────────────────────

const DAILY_VERSES = [
  "John 3:16", "Romans 8:28", "Philippians 4:13", "Jeremiah 29:11", "Proverbs 3:5-6",
  "Isaiah 41:10", "Psalm 23:1-3", "Matthew 11:28-30", "Romans 12:2", "2 Timothy 1:7",
  "Joshua 1:9", "Psalm 46:10", "Galatians 5:22-23", "Ephesians 2:8-9", "1 Corinthians 13:4-7",
  "Psalm 119:105", "Hebrews 11:1", "James 1:2-4", "Micah 6:8", "Colossians 3:23-24",
  "Matthew 6:33", "Romans 5:8", "Psalm 27:1", "Isaiah 40:31", "Philippians 4:6-7",
  "Lamentations 3:22-23", "Proverbs 16:3", "2 Corinthians 5:17", "Psalm 37:4", "Romans 15:13",
];

function getTodaysVerse(): string {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  return DAILY_VERSES[dayOfYear % DAILY_VERSES.length];
}

// ─── Motivational Verses ──────────────────────────────────────────────────────

const motivationalVerses = [
  { text: "Well done, good and faithful servant.", ref: "Matthew 25:21" },
  { text: "Let us not become weary in doing good.", ref: "Galatians 6:9" },
  { text: "Your labor in the Lord is not in vain.", ref: "1 Corinthians 15:58" },
  { text: "He who began a good work in you will carry it on to completion.", ref: "Philippians 1:6" },
];

// ─── AI Suggestion Helpers ──────────────────────────────────────────────────

function generatePrayerSuggestion(verseRef: string, verseText: string, observation: string): string {
  const ref = verseRef.trim() || "this passage";
  const verseSnippet = verseText ? verseText.split(/[.!?]/)[0].trim() : "";

  if (!observation.trim() && !verseSnippet) {
    return `Lord, speak to me through ${ref}. Open my eyes to see what You want me to learn. Help me to be still and listen for Your voice. Amen.`;
  }

  if (verseSnippet && !observation.trim()) {
    return `Father, as I read "${verseSnippet}..." from ${ref}, I ask that You would illuminate the truth in these words. Reveal what You want me to carry from this passage into my life. I surrender my understanding to Yours. Amen.`;
  }

  const theme = observation.trim().split(/[.!?]/)[0].trim();
  const shortTheme = theme.length > 80 ? theme.slice(0, 80) + "..." : theme;
  return `Lord, as I meditate on ${ref}, I've noticed that ${shortTheme.toLowerCase()}. I ask You to deepen this revelation in my heart. Show me how this truth applies to my life right now, and give me the courage to live it out. Transform my thinking through Your word. Amen.`;
}

function generateExecutionSuggestion(verseRef: string, verseText: string, observation: string): string {
  const ref = verseRef.trim() || "this passage";
  void verseText; // used for future context

  if (!observation.trim()) {
    return `Tomorrow, I will set aside 5 minutes to re-read ${ref} and identify one specific way I can apply its truth in my interactions with others.`;
  }

  const theme = observation.trim().split(/[.!?]/)[0].trim().toLowerCase();
  if (theme.includes("trust") || theme.includes("faith")) {
    return `Tomorrow, when I face a moment of uncertainty, I will pause and remember ${ref}. Instead of relying on my own understanding, I will choose to trust God's plan and take one step of faith.`;
  }
  if (theme.includes("love") || theme.includes("kind") || theme.includes("compassion")) {
    return `Tomorrow, I will intentionally show love to someone in my life — through a kind word, an act of service, or simply being fully present — as a reflection of what ${ref} teaches.`;
  }
  if (theme.includes("fear") || theme.includes("anxiety") || theme.includes("worry")) {
    return `Tomorrow, when anxiety rises, I will stop and recall ${ref}. I will take a deep breath, release my worry to God, and choose peace over fear in that moment.`;
  }

  return `Tomorrow, I will carry the truth of ${ref} into my day. I will look for one specific moment to put this passage into practice — whether in my words, my choices, or my attitude toward others.`;
}

// ─── Voice Input Hook ────────────────────────────────────────────────────────

function useSpeechRecognition() {
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    const w = window as unknown as Record<string, unknown>;
    setSupported(!!(w.SpeechRecognition || w.webkitSpeechRecognition));
  }, []);

  const startListening = useCallback(
    (onResult: (text: string) => void, onEnd: () => void) => {
      const w = window as unknown as Record<string, unknown>;
      const SpeechRecognition = (w.SpeechRecognition || w.webkitSpeechRecognition) as {
        new(): {
          continuous: boolean;
          interimResults: boolean;
          lang: string;
          onresult: ((e: { results: { item: (i: number) => { item: (i: number) => { transcript: string } }; length: number }; resultIndex: number }) => void) | null;
          onend: (() => void) | null;
          onerror: (() => void) | null;
          start: () => void;
          stop: () => void;
        };
      };

      if (!SpeechRecognition) return null;

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onresult = (e) => {
        let transcript = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          transcript += e.results.item(i).item(0).transcript;
        }
        if (transcript.trim()) onResult(transcript.trim());
      };

      recognition.onend = onEnd;
      recognition.onerror = onEnd;

      recognition.start();
      return recognition;
    },
    []
  );

  return { supported, startListening };
}

// ─── Mic Button Component ────────────────────────────────────────────────────

function MicButton({
  onTranscript,
  supported,
  startListening,
}: {
  onTranscript: (text: string) => void;
  supported: boolean;
  startListening: (
    onResult: (text: string) => void,
    onEnd: () => void
  ) => { stop: () => void } | null;
}) {
  const [listening, setListening] = useState(false);
  const [volume, setVolume] = useState(0);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (listening) {
      const startAnalysis = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          streamRef.current = stream;
          const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
          const context = new AudioContextClass();
          audioContextRef.current = context;
          const source = context.createMediaStreamSource(stream);
          const analyser = context.createAnalyser();
          analyser.fftSize = 32;
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const render = () => {
            analyser.getByteFrequencyData(dataArray);
            const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
            setVolume(avg);
            animationRef.current = requestAnimationFrame(render);
          };
          render();
        } catch (err) {
          console.error("Mic analysis failed", err);
        }
      };
      startAnalysis();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => { });
        audioContextRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      setVolume(0);
    };
  }, [listening]);

  if (!supported) return null;

  function toggle() {
    if (listening) {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      setListening(false);
    } else {
      setListening(true);
      recognitionRef.current = startListening(
        (text) => onTranscript(text),
        () => {
          setListening(false);
          recognitionRef.current = null;
        }
      );
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={`absolute bottom-2.5 right-2.5 w-9 h-9 rounded-full flex items-center justify-center transition-all ${listening
        ? "bg-struggle text-white shadow-[0_0_20px_rgba(235,87,87,0.4)]"
        : "bg-brown/8 text-brown hover:bg-brown/15"
        }`}
      aria-label={listening ? "Stop listening" : "Voice input"}
      title={listening ? "Stop listening" : "Voice input"}
    >
      {listening && (
        <div
          className="absolute inset-0 rounded-full bg-struggle/30 animate-pulse pointer-events-none"
          style={{ transform: `scale(${1 + (volume / 100)})` }}
        />
      )}
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </svg>
    </button>
  );
}

// ─── Suggestion Card Component ───────────────────────────────────────────────

function SuggestionCard({
  suggestion,
  onUse,
  onDismiss,
}: {
  suggestion: string;
  onUse: () => void;
  onDismiss: () => void;
}) {
  return (
    <div
      className="mt-3 card-surface rounded-xl p-4 border-l-3 border-l-accent-gold/30"
      style={{ animation: "fadeInUp 0.3s ease-out both" }}
    >
      <p className="text-dark text-sm leading-relaxed italic mb-3">{suggestion}</p>
      <div className="flex gap-2">
        <button
          onClick={onUse}
          className="px-3 py-1.5 bg-brown text-ivory text-xs font-medium rounded-lg hover:bg-brown-light transition"
        >
          Use this
        </button>
        <button
          onClick={onDismiss}
          className="px-3 py-1.5 text-muted text-xs font-medium rounded-lg hover:bg-brown/5 transition"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

// ─── Journal Page ────────────────────────────────────────────────────────────

export default function JournalPage() {
  const [verseRef, setVerseRef] = useState("");
  const [verseText, setVerseText] = useState("");
  const [verseLookedUp, setVerseLookedUp] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [observation, setObservation] = useState("");
  const [prayer, setPrayer] = useState("");
  const [execution, setExecution] = useState("");
  const [saved, setSaved] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [isQuickEntry, setIsQuickEntry] = useState(true);
  const [selectedBook, setSelectedBook] = useState("");
  const [selectedChapter, setSelectedChapter] = useState("");
  const [selectedVerses, setSelectedVerses] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [translation, setTranslationState] = useState("kjv");

  // AI suggestion state
  const [prayerSuggestion, setPrayerSuggestion] = useState<string | null>(null);
  const [executionSuggestion, setExecutionSuggestion] = useState<string | null>(null);

  // New feature state
  const [showShare, setShowShare] = useState(false);
  const [showBreathing, setShowBreathing] = useState(() => {
    if (typeof window === "undefined") return false;
    return !sessionStorage.getItem("rope-breathing-done");
  });
  const [milestoneReached, setMilestoneReached] = useState<{ title: string; verse: string; ref: string } | null>(null);
  const [isMemoryVerse, setIsMemoryVerse] = useState(false);
  const [showPlanCompletion, setShowPlanCompletion] = useState(false);
  const [completedPlan, setCompletedPlan] = useState<PlanProgress | null>(null);
  const [planSuggestedVerse, setPlanSuggestedVerse] = useState<string | null>(null);

  const { isLoaded, isSignedIn } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { supported: speechSupported, startListening } = useSpeechRecognition();

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Refs for keyboard navigation
  const observationRef = useRef<HTMLTextAreaElement>(null);
  const prayerRef = useRef<HTMLTextAreaElement>(null);
  const executionRef = useRef<HTMLTextAreaElement>(null);

  // Load translation and last read on mount
  useEffect(() => {
    setTranslationState(getTranslation());
    const history = getBibleHistory();
    if (history.length > 0) {
      setSelectedBook(history[0].book);
      setSelectedChapter(history[0].chapter.toString());
    }
  }, [isLoaded]);

  // ─── Draft persistence ─────────────────────────────────────────────────────
  const todayKey = `rope_draft_${new Date().toISOString().split("T")[0]}`;

  // Restore draft and check for incoming Bible verses (URL/Session)
  useEffect(() => {
    // Only run when loaded
    if (!isLoaded) return;

    function checkIncoming() {
      // 1. Check URL Parameters (Highest Priority)
      const urlVerse = searchParams.get("verse");
      const urlText = searchParams.get("text");
      const urlTrans = searchParams.get("t");

      if (urlVerse) {
        // Clear previous draft text to start fresh
        setObservation("");
        setPrayer("");
        setExecution("");
        setPrayerSuggestion(null);
        setExecutionSuggestion(null);

        setVerseRef(urlVerse);
        if (urlText) {
          setVerseText(urlText);
          setVerseLookedUp(true);
        } else {
          // If text wasn't provided, we'd normally lookup, but bible/page.tsx provides it
          setVerseLookedUp(false);
          lookupVerse();
        }

        if (urlTrans) {
          setTranslationState(urlTrans);
          setTranslation(urlTrans);
        }

        // Check if it's already a memory verse
        const memVerses = getMemoryVerses();
        setIsMemoryVerse(memVerses.some(v => v.verse === urlVerse));

        // Clean up URL to avoid re-applying on refresh
        router.replace(pathname);

        // Force scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });

        setPlanSuggestedVerse(getPlanSuggestedVerse());
        return;
      }

      // 2. Check if Bible reader sent a verse via Session (Middle Priority)
      try {
        const bibleData = sessionStorage.getItem("rope_bible_to_journal");
        if (bibleData) {
          const { ref, text, translation: trans } = JSON.parse(bibleData);
          sessionStorage.removeItem("rope_bible_to_journal");

          setObservation("");
          setPrayer("");
          setExecution("");

          setVerseRef(ref);
          setVerseText(text);
          setVerseLookedUp(true);

          if (trans) {
            setTranslationState(trans);
            setTranslation(trans);
          }

          const memVerses = getMemoryVerses();
          setIsMemoryVerse(memVerses.some(v => v.verse === ref));

          window.scrollTo({ top: 0, behavior: 'smooth' });
          setPlanSuggestedVerse(getPlanSuggestedVerse());
          return;
        }
      } catch { /* ignore */ }

      // 3. Restore draft (only if no incoming bible data)
      try {
        const raw = localStorage.getItem(todayKey);
        if (raw) {
          const d = JSON.parse(raw);
          if (d.verseRef) setVerseRef(d.verseRef);
          if (d.verseText) { setVerseText(d.verseText); setVerseLookedUp(true); }
          if (d.observation) setObservation(d.observation);
          if (d.prayer) setPrayer(d.prayer);
          if (d.execution) setExecution(d.execution);

          const memVerses = getMemoryVerses();
          setIsMemoryVerse(memVerses.some(v => v.verse === d.verseRef));
        }
      } catch { /* ignore */ }

      setPlanSuggestedVerse(getPlanSuggestedVerse());
    }

    checkIncoming();

    const handleMemoryChange = (e: any) => {
      if (verseRef) {
        setIsMemoryVerse(e.detail.verses.some((mv: any) => mv.verse === verseRef));
      }
    };

    // Re-check when window refocuses or user navigates
    window.addEventListener('focus', checkIncoming);
    window.addEventListener("rope-memory-update", handleMemoryChange as any);
    return () => {
      window.removeEventListener('focus', checkIncoming);
      window.removeEventListener("rope-memory-update", handleMemoryChange as any);
    };
  }, [isLoaded, todayKey, translation, pathname, verseRef]);

  // Auto-save draft on field changes (debounced)
  useEffect(() => {
    if (saved) return; // don't save after explicit save
    const timer = setTimeout(() => {
      const draft = { verseRef, verseText, observation, prayer, execution };
      // Only save if there's actual content
      if (verseRef || observation || prayer || execution) {
        localStorage.setItem(todayKey, JSON.stringify(draft));
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [verseRef, verseText, observation, prayer, execution, todayKey, saved]);

  // Keyboard shortcuts: Cmd+Enter to save, Cmd+L to focus verse lookup
  const canSave = !!(verseRef.trim() && observation.trim() && prayer.trim() && execution.trim());
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        const btn = document.querySelector("[data-save-btn]") as HTMLButtonElement;
        if (btn && !btn.disabled) btn.click();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "l") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [canSave]);

  // Close suggestions on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleVerseInput(value: string) {
    setVerseRef(value);
    setVerseLookedUp(false);
    setLookupError("");
    const results = suggestBooks(value);
    setSuggestions(results);
    setShowSuggestions(results.length > 0);
  }

  function selectSuggestion(book: string) {
    setVerseRef(book + " ");
    setShowSuggestions(false);
    setSuggestions([]);
    inputRef.current?.focus();
  }

  async function lookupVerse() {
    let ref = verseRef.trim();
    if (!isQuickEntry) {
      if (!selectedBook || !selectedChapter) {
        setLookupError("Please select a book and enter a chapter.");
        return;
      }
      ref = `${selectedBook} ${selectedChapter}${selectedVerses ? ":" + selectedVerses : ""}`;
      setVerseRef(ref);
    }

    if (!ref) return;
    setLookingUp(true);
    setLookupError("");
    setVerseText("");
    try {
      const text = await fetchVerse(ref, translation);
      setVerseText(text);
      setVerseLookedUp(true);
      // Check if already a memory verse
      const memVerses = getMemoryVerses();
      setIsMemoryVerse(memVerses.some(v => v.verse === ref));
    } catch {
      setLookupError("Could not find that verse. Try a format like 'John 3:16' or 'Romans 8:28'.");
    } finally {
      setLookingUp(false);
    }
  }

  function handleSave() {
    addRopeEntry({
      userId: "local", // This will be overridden by Clerk on the server if authenticated
      revelationVerse: verseRef.trim(),
      revelationText: verseText,
      observation: observation.trim(),
      prayer: prayer.trim(),
      execution: execution.trim(),
    }, isSignedIn || false);

    // Advance reading plan if active
    if (getActivePlan()) {
      advancePlan();
    }

    // Check for milestone
    const currentStreak = getStreak("local");
    const milestone = getReachedMilestone(currentStreak);
    if (milestone) {
      setMilestoneReached(milestone);
    }

    // Reading Plan Advancement
    const { progress: planProgress, newlyAdvanced } = advancePlan();
    if (newlyAdvanced && planProgress?.isCompleted) {
      setCompletedPlan(planProgress);
      setShowPlanCompletion(true);
    }

    setSavedCount((c) => c + 1);
    setSaved(true);
  }

  const allFilled = !!(verseRef.trim() && observation.trim() && prayer.trim() && execution.trim());

  if (saved) {
    const currentStreak = getStreak("any");
    const saveVerse = motivationalVerses[(savedCount - 1) % motivationalVerses.length];

    return (
      <div
        className="min-h-[80vh] flex flex-col items-center justify-center px-6 text-center"
        style={{ animation: "fadeIn 0.4s ease-out both" }}
      >
        {/* Milestone celebration */}
        {milestoneReached && (
          <div className="mb-6 p-5 bg-accent-gold/10 border border-accent-gold/20 rounded-2xl max-w-xs w-full" style={{ animation: "fadeInUp 0.5s ease-out both" }}>
            <p className="text-accent-gold text-xs uppercase tracking-wider font-medium mb-2">Milestone Reached!</p>
            <h3 className="font-serif text-lg text-dark mb-2">{milestoneReached.title}</h3>
            <p className="text-dark text-sm italic mb-1">&ldquo;{milestoneReached.verse}&rdquo;</p>
            <p className="text-muted text-xs">&mdash; {milestoneReached.ref}</p>
          </div>
        )}

        <div
          className="w-16 h-16 bg-brown/10 rounded-full flex items-center justify-center mb-5"
          style={{
            backgroundImage: "linear-gradient(135deg, rgba(196,162,101,0.1), rgba(92,67,39,0.1))",
            animation: "shimmer 2s ease-in-out infinite",
            backgroundSize: "200% auto",
          }}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-brown"
          >
            <line x1="12" y1="2" x2="12" y2="6" />
            <line x1="12" y1="18" x2="12" y2="22" />
            <line x1="2" y1="12" x2="6" y2="12" />
            <line x1="18" y1="12" x2="22" y2="12" />
          </svg>
        </div>
        <h2 className="font-serif text-2xl text-brown mb-2">Entry Saved</h2>
        {currentStreak > 0 && (
          <p className="text-accent-gold text-sm font-medium mb-4">
            &#x2728; {currentStreak} day streak
          </p>
        )}
        <p className="text-dark text-sm italic max-w-xs mb-1">
          &ldquo;{saveVerse.text}&rdquo;
        </p>
        <p className="text-muted text-xs mb-4">&mdash; {saveVerse.ref}</p>
        <p className="text-muted text-sm max-w-xs">
          Come back tomorrow to check in on your execution.
        </p>

        {/* Share button */}
        {verseText && (
          <button
            onClick={() => setShowShare(true)}
            className="mt-4 px-5 py-2 text-accent-gold border border-accent-gold/20 rounded-xl text-sm font-medium hover:bg-accent-gold/5 transition flex items-center gap-2 mx-auto"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            Share Verse Card
          </button>
        )}

        <button
          onClick={() => {
            setSaved(false);
            setVerseRef("");
            setVerseText("");
            setVerseLookedUp(false);
            setObservation("");
            setPrayer("");
            setExecution("");
            setPrayerSuggestion(null);
            setExecutionSuggestion(null);
            setMilestoneReached(null);
            setIsMemoryVerse(false);
          }}
          className="mt-4 px-6 py-2.5 text-brown border border-brown/30 rounded-xl text-sm font-medium hover:bg-brown/5 transition"
        >
          Write Another Entry
        </button>

        {showShare && (
          <ShareCard
            verse={verseText}
            reference={verseRef}
            onClose={() => setShowShare(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="px-5 pt-6 pb-8">
      {/* Date + Title with olive branch */}
      <div className="flex justify-between items-start mb-1">
        <p className="text-muted text-sm">{today}</p>
        <a
          href="/me"
          className="text-[10px] uppercase font-bold tracking-widest text-accent-gold hover:text-accent-gold/80 transition-colors flex items-center gap-1.5"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
          View Past Entries
        </a>
      </div>
      <div className="flex items-center gap-3 mb-2">
        <h1 className="font-serif text-2xl text-brown">Daily ROPE</h1>
      </div>
      <div className="flex justify-start mb-5">
        <OliveBranch className="opacity-50" />
      </div>

      {showBreathing && <Breathing onComplete={() => { sessionStorage.setItem("rope-breathing-done", "1"); setShowBreathing(false); }} />}

      {/* ROPE Progress */}
      <div className="flex items-center gap-1.5 mb-6">
        {["R", "O", "P", "E"].map((letter, i) => {
          const filled =
            (i === 0 && (verseLookedUp || verseRef.trim())) ||
            (i === 1 && observation.trim()) ||
            (i === 2 && prayer.trim()) ||
            (i === 3 && execution.trim());
          return (
            <div key={letter} className="flex items-center gap-1.5 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-serif font-bold transition-all duration-300 ${filled
                ? "bg-brown text-ivory shadow-sm scale-100"
                : "bg-brown/8 text-brown/40 scale-95"
                }`}>
                {letter}
              </div>
              {i < 3 && (
                <div className="flex-1 h-0.5 rounded-full transition-all duration-500" style={{
                  background: filled ? "var(--color-brown)" : "rgba(92,67,39,0.08)"
                }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Section divider */}
      <div className="section-divider mb-5" />

      <div className="space-y-5">
        {/* Step 1: Revelation */}
        <section
          className={`card-surface rounded-2xl p-5 border-l-2 ${verseLookedUp ? "border-l-brown/30" : "border-l-transparent"}`}
          style={{ animation: "fadeInUp 0.5s ease-out both", animationDelay: "0s" }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="step-badge">R</div>
            <h2 className="font-serif text-lg text-dark">Revelation</h2>
          </div>

          {/* Reading plan suggestion */}
          {planSuggestedVerse && (
            <div className="mb-3 p-3 bg-accent-gold/5 border border-accent-gold/10 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[10px] text-accent-gold uppercase tracking-wider font-medium">Reading Plan</p>
                <p className="text-dark text-sm">{planSuggestedVerse}</p>
              </div>
              <button
                onClick={async () => {
                  setVerseRef(planSuggestedVerse);
                  setIsQuickEntry(true);
                  setShowSuggestions(false);
                  setLookingUp(true);
                  setLookupError("");
                  try {
                    const text = await fetchVerse(planSuggestedVerse, translation);
                    setVerseText(text);
                    setVerseLookedUp(true);
                    const memVerses = getMemoryVerses();
                    setIsMemoryVerse(memVerses.some(v => v.verse === planSuggestedVerse));
                  } catch (err: any) {
                    setLookupError(err.message || "Could not find that verse.");
                  } finally {
                    setLookingUp(false);
                  }
                }}
                className="px-3 py-1.5 text-xs text-accent-gold border border-accent-gold/20 rounded-lg hover:bg-accent-gold/5 transition shrink-0"
              >
                Use this
              </button>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => setIsQuickEntry(!isQuickEntry)}
                className="text-[10px] text-muted hover:text-brown transition italic px-2 py-1"
              >
                {isQuickEntry ? "Try structured lookup" : "Switch to quick entry"}
              </button>
            </div>

            <div className="relative">
              {isQuickEntry ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={verseRef}
                      onChange={(e) => handleVerseInput(e.target.value)}
                      onFocus={() => {
                        if (suggestions.length > 0) setShowSuggestions(true);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Tab" && showSuggestions && suggestions.length > 0) {
                          e.preventDefault();
                          selectSuggestion(suggestions[0]);
                        }
                      }}
                      placeholder="e.g. Romans 8:28"
                      className="flex-1 min-w-[200px] px-4 py-2.5 bg-ivory border border-brown/10 rounded-xl text-dark placeholder:text-muted/50 focus:outline-none text-sm"
                    />
                    <select
                      value={translation}
                      onChange={(e) => { setTranslationState(e.target.value); setTranslation(e.target.value); }}
                      className="px-2 py-2.5 bg-ivory border border-brown/10 rounded-xl text-dark text-xs focus:outline-none shrink-0"
                    >
                      {TRANSLATIONS.map(t => (
                        <option key={t.id} value={t.id}>{t.label}</option>
                      ))}
                    </select>
                    <button
                      onClick={lookupVerse}
                      disabled={lookingUp || !verseRef.trim()}
                      className="px-4 py-2.5 bg-brown text-ivory rounded-xl text-sm font-medium hover:bg-brown-light disabled:opacity-40 transition shrink-0 w-full sm:w-auto"
                    >
                      {lookingUp ? "..." : "Look up"}
                    </button>
                  </div>

                  {/* About Quick Entry */}
                  <div className="mt-4 px-3 py-2 bg-brown/[0.03] rounded-lg border border-brown/5">
                    <p className="text-[11px] text-muted/70 leading-relaxed italic">
                      <span className="font-semibold text-brown/60 not-italic uppercase tracking-wider mr-1">Pro Tip:</span>
                      Type any reference like <span className="text-brown/80 font-medium">John 3:16</span> or <span className="text-brown/80 font-medium">Ps 23</span>.
                      Use <span className="text-brown font-semibold not-italic">Tab</span> to auto-complete suggestions!
                      You can even select multiple verses like <span className="text-brown/80 font-medium">3,5-7</span>.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <div className="sm:col-span-2">
                      <select
                        value={selectedBook}
                        onChange={(e) => setSelectedBook(e.target.value)}
                        className="w-full px-4 py-2.5 bg-ivory border border-brown/10 rounded-xl text-dark text-sm focus:outline-none focus:ring-1 focus:ring-brown/20 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%235C4327%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px] bg-[right_10px_center] bg-no-repeat"
                      >
                        <option value="">Select Bible Book</option>
                        {BIBLE_BOOKS.map(book => (
                          <option key={book.name} value={book.name}>{book.name}</option>
                        ))}
                      </select>
                    </div>
                    <input
                      type="number"
                      min="1"
                      placeholder="Ch"
                      value={selectedChapter}
                      onChange={(e) => setSelectedChapter(e.target.value)}
                      className="px-4 py-2.5 bg-ivory border border-brown/10 rounded-xl text-dark placeholder:text-muted/50 focus:outline-none text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Verse(s) ex: 1-5"
                      value={selectedVerses}
                      onChange={(e) => setSelectedVerses(e.target.value)}
                      className="px-4 py-2.5 bg-ivory border border-brown/10 rounded-xl text-dark placeholder:text-muted/50 focus:outline-none text-sm"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <select
                      value={translation}
                      onChange={(e) => { setTranslationState(e.target.value); setTranslation(e.target.value); }}
                      className="flex-1 sm:flex-initial px-4 py-2.5 bg-ivory border border-brown/10 rounded-xl text-dark text-xs focus:outline-none shrink-0"
                    >
                      {TRANSLATIONS.map(t => (
                        <option key={t.id} value={t.id}>{t.label}</option>
                      ))}
                    </select>
                    <button
                      onClick={lookupVerse}
                      disabled={lookingUp || !selectedBook || !selectedChapter}
                      className="flex-1 sm:flex-initial px-8 py-2.5 bg-brown text-ivory rounded-xl text-sm font-medium hover:bg-brown-light disabled:opacity-40 transition"
                    >
                      {lookingUp ? "..." : "Look up passage"}
                    </button>
                  </div>
                </div>
              )}

              {/* Autocomplete dropdown for quick entry */}
              {isQuickEntry && showSuggestions && suggestions.length > 0 && (
                <div
                  ref={suggestionsRef}
                  className="absolute left-0 right-16 top-12 z-30 bg-ivory border border-brown/10 rounded-xl overflow-hidden max-h-48 overflow-y-auto shadow-elevated"
                  style={{ animation: "fadeIn 0.15s ease-out both" }}
                >
                  {suggestions.map((book) => (
                    <button
                      key={book}
                      onClick={() => selectSuggestion(book)}
                      className="w-full text-left px-4 py-2.5 text-sm text-brown hover:bg-cream transition"
                    >
                      {book}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={async () => {
                const verse = getTodaysVerse();
                setVerseRef(verse);

                // If in structured mode, try to parse and populate fields
                if (!isQuickEntry) {
                  const m = verse.match(/^(.+?)\s+(\d+)(?:[ :]+(.+))?$/);
                  if (m) {
                    setSelectedBook(m[1]);
                    setSelectedChapter(m[2]);
                    setSelectedVerses(m[3] || "");
                  }
                }

                setShowSuggestions(false);
                setLookingUp(true);
                setLookupError("");
                setVerseText("");
                try {
                  const text = await fetchVerse(verse, translation);
                  setVerseText(text);
                  setVerseLookedUp(true);
                } catch { setLookupError("Could not fetch today's verse."); }
                finally { setLookingUp(false); }
              }}
              className="w-full px-3 py-2 text-accent-olive text-xs font-medium border border-accent-olive/20 rounded-xl hover:bg-accent-olive/5 transition whitespace-nowrap md:w-auto"
              title="Get today's suggested verse"
            >
              ✦ Today&apos;s verse
            </button>

            {lookupError && (
              <p className="text-struggle text-xs italic">{lookupError}</p>
            )}
          </div>

          {verseLookedUp && verseText && (
            <div className="mt-4 rounded-xl overflow-hidden" style={{ animation: "fadeInUp 0.3s ease-out both" }}>
              <div className="bg-ivory/80 p-4 border-l-2 border-accent-gold/30">
                <p className="text-dark text-sm leading-relaxed italic">
                  &ldquo;{verseText}&rdquo;
                </p>
                <div className="flex items-center justify-between mt-3">
                  <p className="text-muted text-xs">&mdash; {verseRef}</p>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end">
                      <button
                        onClick={() => {
                          if (isMemoryVerse) return;
                          addMemoryVerse(verseRef.trim(), verseText);
                          setIsMemoryVerse(true);
                        }}
                        className={`text-[10px] uppercase tracking-wider transition-colors flex items-center gap-1 ${isMemoryVerse ? "text-accent-gold" : "text-muted/50 hover:text-accent-gold"}`}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill={isMemoryVerse ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                        {isMemoryVerse ? "Added to Memory" : "Memorize"}
                      </button>
                      {isMemoryVerse && (
                        <a href="/me" className="text-[9px] text-accent-gold/60 underline hover:text-accent-gold transition-all animate-in fade-in slide-in-from-top-1">
                          View in Profile
                        </a>
                      )}
                    </div>
                    <a
                      href={`https://www.biblegateway.com/passage/?search=${encodeURIComponent(verseRef.trim().replace(/:\d+[-–]?\d*$/, ""))}&version=${getGatewayVersion(translation)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-accent-olive/60 uppercase tracking-wider hover:text-accent-olive transition-colors"
                    >
                      Read full chapter &rarr;
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Step 2: Observation */}
        <section
          className={`card-surface rounded-2xl p-5 border-l-2 ${observation.trim() ? "border-l-brown/30" : "border-l-transparent"}`}
          style={{ animation: "fadeInUp 0.5s ease-out both", animationDelay: "0.1s" }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="step-badge">O</div>
            <h2 className="font-serif text-lg text-dark">Observation</h2>
          </div>
          <div className="space-y-4">
            <div className="relative">
              <textarea
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                placeholder={steps[1].placeholder}
                rows={4}
                className="w-full px-4 py-3 bg-ivory border border-brown/10 rounded-xl text-dark placeholder:text-muted/50 focus:outline-none text-sm leading-relaxed resize-none min-h-[120px]"
              />
              <MicButton
                supported={speechSupported}
                startListening={startListening}
                onTranscript={(text) =>
                  setObservation((prev) => (prev ? prev + " " + text : text))
                }
              />
            </div>
          </div>
        </section>

        {/* Step 3: Prayer */}
        <section
          className={`card-surface rounded-2xl p-5 border-l-2 ${prayer.trim() ? "border-l-brown/30" : "border-l-transparent"}`}
          style={{ animation: "fadeInUp 0.5s ease-out both", animationDelay: "0.2s" }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="step-badge">P</div>
            <div className="flex items-center gap-2 flex-1">
              <h2 className="font-serif text-lg text-dark">Prayer</h2>
              <button
                onClick={() => {
                  const suggestion = generatePrayerSuggestion(verseRef, verseText, observation);
                  setPrayerSuggestion(suggestion);
                }}
                className="px-2.5 py-1 text-xs text-muted hover:text-brown bg-brown/5 hover:bg-brown/10 rounded-full transition flex items-center gap-1"
              >
                <span>&#10024;</span> Suggest
              </button>
            </div>
          </div>
          <div className="relative">
            <textarea
              value={prayer}
              onChange={(e) => setPrayer(e.target.value)}
              placeholder={steps[2].placeholder}
              rows={4}
              className="w-full px-4 py-3 bg-ivory border border-brown/10 rounded-xl text-dark placeholder:text-muted/50 focus:outline-none text-sm leading-relaxed resize-none min-h-[120px]"
            />
            <MicButton
              supported={speechSupported}
              startListening={startListening}
              onTranscript={(text) =>
                setPrayer((prev) => (prev ? prev + " " + text : text))
              }
            />
          </div>
          {prayerSuggestion && (
            <SuggestionCard
              suggestion={prayerSuggestion}
              onUse={() => {
                setPrayer(prayerSuggestion);
                setPrayerSuggestion(null);
              }}
              onDismiss={() => setPrayerSuggestion(null)}
            />
          )}
        </section>

        {/* Step 4: Execution */}
        <section
          className={`card-surface rounded-2xl p-5 border-l-2 ${execution.trim() ? "border-l-brown/30" : "border-l-transparent"}`}
          style={{ animation: "fadeInUp 0.5s ease-out both", animationDelay: "0.3s" }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="step-badge">E</div>
            <div className="flex items-center gap-2 flex-1">
              <h2 className="font-serif text-lg text-dark">Execution</h2>
              <button
                onClick={() => {
                  const suggestion = generateExecutionSuggestion(verseRef, verseText, observation);
                  setExecutionSuggestion(suggestion);
                }}
                className="px-2.5 py-1 text-xs text-muted hover:text-brown bg-brown/5 hover:bg-brown/10 rounded-full transition flex items-center gap-1"
              >
                <span>&#10024;</span> Suggest
              </button>
            </div>
          </div>
          <div className="relative">
            <textarea
              value={execution}
              onChange={(e) => setExecution(e.target.value)}
              placeholder={steps[3].placeholder}
              rows={4}
              className="w-full px-4 py-3 bg-ivory border border-brown/10 rounded-xl text-dark placeholder:text-muted/50 focus:outline-none text-sm leading-relaxed resize-none min-h-[120px]"
            />
            <MicButton
              supported={speechSupported}
              startListening={startListening}
              onTranscript={(text) =>
                setExecution((prev) => (prev ? prev + " " + text : text))
              }
            />
          </div>
          {executionSuggestion && (
            <SuggestionCard
              suggestion={executionSuggestion}
              onUse={() => {
                setExecution(executionSuggestion);
                setExecutionSuggestion(null);
              }}
              onDismiss={() => setExecutionSuggestion(null)}
            />
          )}
          <p className="text-muted/50 text-xs italic mt-3 px-1">
            Tomorrow, you&apos;ll check in on this commitment.
          </p>
        </section>
      </div>

      {/* Save area */}
      <div className="mt-8 pt-6 border-t border-brown/8">
        <button
          data-save-btn
          onClick={handleSave}
          disabled={!allFilled}
          className={`w-full py-3.5 btn-primary text-center text-base ${allFilled ? "animate-breathe" : ""}`}
        >
          Save Entry
        </button>
        {!allFilled && (
          <p className="text-center text-struggle text-xs mt-3">
            Complete all four ROPE steps to save &mdash;{" "}
            {[
              !verseRef.trim() && "Verse",
              !observation.trim() && "Observation",
              !prayer.trim() && "Prayer",
              !execution.trim() && "Execution",
            ]
              .filter(Boolean)
              .join(", ")}{" "}
            {[!verseRef.trim(), !observation.trim(), !prayer.trim(), !execution.trim()].filter(Boolean).length === 1 ? "is" : "are"} missing.
          </p>
        )}
        <p className="text-center text-muted/40 text-xs mt-3 italic">
          Your words are kept safely on this device
        </p>
      </div>

      <PlanCompletionModal
        isOpen={showPlanCompletion}
        onClose={() => setShowPlanCompletion(false)}
        progress={completedPlan}
      />
    </div>
  );
}
