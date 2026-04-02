"use client";

import { useEffect } from "react";
import { logErrorAction } from "@/lib/actions";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to the database
    logErrorAction({
      message: error.message || "Global Error",
      stack: error.stack,
      pathname: typeof window !== "undefined" ? window.location.pathname : "unknown",
      context: { digest: error.digest, type: "global_error" }
    });
  }, [error]);

  return (
    <div className="min-h-screen bg-ivory flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full space-y-6 animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-struggle/10 rounded-full flex items-center justify-center mx-auto text-struggle border border-struggle/20">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        
        <div className="space-y-2">
          <h1 className="font-serif text-3xl font-bold text-dark">Something went wrong</h1>
          <p className="text-muted text-sm leading-relaxed">
            We&apos;ve logged the error and are looking into it. In the meantime, you can try refreshing or going back.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => reset()}
            className="w-full py-4 bg-brown text-ivory rounded-xl font-bold text-sm hover:bg-brown/90 shadow-lg shadow-brown/20 transition-all active:scale-[0.98]"
          >
            Try Again
          </button>
          
          <button
            onClick={() => window.location.href = "/journal"}
            className="w-full py-3 bg-brown/5 text-brown border border-brown/15 rounded-xl font-bold text-xs hover:bg-brown/10 transition-all"
          >
            Go to Journal
          </button>
        </div>

        <p className="text-[10px] text-muted/40 uppercase tracking-[0.2em]">
          ROPE Bible Journaling
        </p>
      </div>
    </div>
  );
}
