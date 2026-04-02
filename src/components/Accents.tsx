"use client";

export function OliveBranch({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 24" fill="none" className={`text-accent-olive/30 ${className}`} width="60" height="24">
      <path d="M30 12 C20 8, 8 10, 2 12" stroke="currentColor" strokeWidth="1" fill="none"/>
      <path d="M30 12 C40 8, 52 10, 58 12" stroke="currentColor" strokeWidth="1" fill="none"/>
      <ellipse cx="12" cy="9" rx="4" ry="2.5" fill="currentColor" transform="rotate(-20 12 9)" opacity="0.5"/>
      <ellipse cx="20" cy="8" rx="4" ry="2.5" fill="currentColor" transform="rotate(-10 20 8)" opacity="0.4"/>
      <ellipse cx="40" cy="8" rx="4" ry="2.5" fill="currentColor" transform="rotate(10 40 8)" opacity="0.4"/>
      <ellipse cx="48" cy="9" rx="4" ry="2.5" fill="currentColor" transform="rotate(20 48 9)" opacity="0.5"/>
      <circle cx="30" cy="12" r="1.5" fill="currentColor" opacity="0.6"/>
    </svg>
  );
}

export function LampIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 64" fill="none" className={`text-accent-gold/40 ${className}`} width="48" height="64">
      {/* Flame */}
      <path d="M24 8 C20 16, 16 20, 16 26 C16 30.4, 19.6 34, 24 34 C28.4 34, 32 30.4, 32 26 C32 20, 28 16, 24 8Z" fill="currentColor" opacity="0.3"/>
      <path d="M24 14 C22 18, 20 21, 20 25 C20 27.2, 21.8 29, 24 29 C26.2 29, 28 27.2, 28 25 C28 21, 26 18, 24 14Z" fill="currentColor" opacity="0.5"/>
      {/* Base */}
      <rect x="20" y="34" width="8" height="3" rx="1" fill="currentColor" opacity="0.4"/>
      <path d="M18 37 L30 37 L28 44 L20 44 Z" fill="currentColor" opacity="0.3"/>
      <rect x="19" y="44" width="10" height="2" rx="1" fill="currentColor" opacity="0.4"/>
      {/* Light rays */}
      <line x1="24" y1="2" x2="24" y2="5" stroke="currentColor" strokeWidth="1" opacity="0.2"/>
      <line x1="12" y1="10" x2="14" y2="12" stroke="currentColor" strokeWidth="1" opacity="0.2"/>
      <line x1="36" y1="10" x2="34" y2="12" stroke="currentColor" strokeWidth="1" opacity="0.2"/>
      <line x1="8" y1="22" x2="12" y2="23" stroke="currentColor" strokeWidth="1" opacity="0.15"/>
      <line x1="40" y1="22" x2="36" y2="23" stroke="currentColor" strokeWidth="1" opacity="0.15"/>
    </svg>
  );
}

export function VerseBlock({ verse, reference, className = "" }: { verse: string; reference: string; className?: string }) {
  return (
    <div className={`border-l-2 border-accent-gold/20 pl-4 py-2 ${className}`}>
      <p className="text-dark/70 text-sm italic leading-relaxed">&ldquo;{verse}&rdquo;</p>
      <p className="text-muted text-xs mt-1.5">&mdash; {reference}</p>
    </div>
  );
}
