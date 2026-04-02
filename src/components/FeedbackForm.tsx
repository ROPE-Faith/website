"use client";

import { useState } from "react";
import { submitFeedback } from "@/lib/actions";

interface FeedbackFormProps {
  onClose: () => void;
}

export default function FeedbackForm({ onClose }: FeedbackFormProps) {
  const [type, setType] = useState<"bug" | "suggestion">("suggestion");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !description) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const result = await submitFeedback({ type, title, description });
      if (result.success) {
        setIsSuccess(true);
        setTimeout(() => onClose(), 2000);
      } else {
        setError(result.error || "Failed to submit feedback");
      }
    } catch (e: any) {
      console.error(e);
      setError(e.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {isSuccess ? (
        <div className="py-12 text-center space-y-4 animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 bg-brown/10 rounded-full flex items-center justify-center mx-auto text-brown border border-brown/20">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div className="space-y-1">
            <p className="font-serif text-xl font-bold text-brown">Thank you!</p>
            <p className="text-sm text-muted">Your feedback helps us make ROPE better.</p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex gap-2 p-1 bg-brown/5 rounded-xl border border-brown/10">
            <button
              type="button"
              onClick={() => setType("suggestion")}
              className={`flex-1 py-2 px-4 rounded-lg text-[10px] uppercase tracking-wider font-bold transition-all ${
                type === "suggestion" 
                  ? "bg-sidebar border border-brown/15 shadow-sm text-brown" 
                  : "text-muted hover:text-brown"
              }`}
            >
              Suggestion
            </button>
            <button
              type="button"
              onClick={() => setType("bug")}
              className={`flex-1 py-2 px-4 rounded-lg text-[10px] uppercase tracking-wider font-bold transition-all ${
                type === "bug" 
                  ? "bg-sidebar border border-red-500/20 shadow-sm text-red-600" 
                  : "text-muted hover:text-red-500"
              }`}
            >
              Bug Report
            </button>
          </div>

          <div className="space-y-2 text-left">
            <label className="text-[10px] uppercase tracking-widest font-bold text-muted ml-1">Title</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={type === "bug" ? "What's broken?" : "What's your idea?"}
              className="w-full bg-brown/5 border border-brown/10 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brown/20 transition-all placeholder:text-muted/50 text-dark"
            />
          </div>

          <div className="space-y-2 text-left">
            <label className="text-[10px] uppercase tracking-widest font-bold text-muted ml-1">Description</label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={type === "bug" ? "How can we reproduce this? What happened?" : "Tell us more about your suggestion..."}
              className="w-full bg-brown/5 border border-brown/10 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brown/20 transition-all placeholder:text-muted/50 resize-none text-dark"
            />
          </div>

          <button
            disabled={isSubmitting}
            className="w-full py-4 bg-brown text-ivory rounded-xl font-bold text-sm hover:bg-brown/90 shadow-lg shadow-brown/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:scale-100 mt-2"
          >
            {isSubmitting ? "Submitting..." : "Send Feedback"}
          </button>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl animate-in fade-in slide-in-from-top-1 duration-200">
              <p className="text-[11px] text-red-600 font-medium text-center">
                {error}
              </p>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
