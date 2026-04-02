"use client";

import { useState, useEffect } from "react";
import { getVerseComments, postVerseComment, voteComment, deleteVerseComment } from "@/lib/community-actions";
import { useAuth, useUser } from "@clerk/nextjs";

interface Comment {
  id: string;
  userId: string;
  content: string;
  createdAt: string | Date;
  profile: any;
  score: number;
  userVote: 'up' | 'down' | null;
}

export default function VerseDiscussionDrawer({
  book,
  chapter,
  verse,
  onClose,
}: {
  book: string;
  chapter: string;
  verse: string;
  onClose: () => void;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [sortBy, setSortBy] = useState<'top' | 'recent'>('top');
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
 
   const loadComments = async (silent = false) => {
     if (!silent) setLoading(true);
     else setIsRefreshing(true);
     setError(null);
     try {
       const data = await getVerseComments(book, chapter, verse, sortBy);
       setComments(data as any);
     } catch (err: any) {
       console.error(err);
       if (!silent) setError(err.message || "Failed to load reflections");
     } finally {
       setLoading(false);
       setIsRefreshing(false);
     }
   };

   useEffect(() => {
     loadComments();
     
     const interval = setInterval(() => {
       loadComments(true);
     }, 30000); // Poll every 30s
     
     return () => clearInterval(interval);
   }, [book, chapter, verse, sortBy]);

   const handlePost = async () => {
     if (!newComment.trim() || !userId) return;
     
     const commentText = newComment;
     setNewComment(""); // Clear immediately for better UX
     setPosting(true);
     setError(null);

     // Optimistic Update
     const tempId = `temp-${Date.now()}`;
     const optimisticComment: Comment = {
       id: tempId,
       userId,
       content: commentText,
       createdAt: new Date().toISOString(),
       profile: {
         displayName: user?.fullName || user?.username || "You",
         imageUrl: user?.imageUrl,
       },
       score: 0,
       userVote: null,
     };

     if (sortBy === 'recent') {
       setComments(prev => [optimisticComment, ...prev]);
     } else {
       setComments(prev => [...prev, optimisticComment]);
     }

     try {
       await postVerseComment(book, chapter, verse, commentText);
       loadComments(true); // Sync with server silently
     } catch (err: any) {
       console.error(err);
       setError(err.message || "Failed to post reflection. Please try again.");
       // Rollback optimistic update
       setComments(prev => prev.filter(c => c.id !== tempId));
       setNewComment(commentText); // Restore text on failure
     } finally {
       setPosting(false);
     }
   };

  const handleVote = async (commentId: string, type: 'up' | 'down') => {
    if (!userId) return;
    
    // Optimistic UI
    setComments(prev => prev.map(c => {
      if (c.id === commentId) {
        const oldVote = c.userVote;
        const newVote = oldVote === type ? null : type;
        let scoreAdjust = 0;
        
        if (oldVote === type) scoreAdjust = type === 'up' ? -1 : 1;
        else if (!oldVote) scoreAdjust = type === 'up' ? 1 : -1;
        else scoreAdjust = type === 'up' ? 2 : -2;

        return { ...c, userVote: newVote, score: c.score + scoreAdjust };
      }
      return c;
    }));

    try {
      const currentVote = comments.find(c => c.id === commentId)?.userVote;
      const finalVote = currentVote === type ? null : type;
      await voteComment(commentId, finalVote);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to vote. Please try again.");
      loadComments(); // Revert on failure
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    
    // Optimistic delete
    setComments(prev => prev.filter(c => c.id !== id));
    
    try {
      await deleteVerseComment(id);
      loadComments(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to delete.");
      loadComments(true); // Restore on error
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div 
      className="fixed inset-x-0 bottom-0 z-50 flex flex-col max-h-[85vh] bg-ivory rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.15)] border-t border-brown/5 overflow-hidden"
      style={{ animation: "slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both" }}
    >
      {/* Handle */}
      <div className="flex justify-center p-3">
        <div className="w-10 h-1 bg-brown/10 rounded-full" />
      </div>

      {/* Header */}
      <div className="px-6 pb-4 flex items-center justify-between border-b border-brown/5">
        <div>
          <h2 className="font-serif text-lg text-dark">Discussion</h2>
          <p className="text-[10px] text-muted uppercase tracking-widest">{book} {chapter}:{verse}</p>
        </div>
        <button 
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-brown/5 text-muted hover:text-brown transition"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 custom-scrollbar">
        {/* Sort Controls */}
        <div className="flex gap-2">
          <button 
            onClick={() => setSortBy('top')}
            className={`px-3 py-1 text-[10px] uppercase font-bold tracking-widest rounded-full transition ${sortBy === 'top' ? "bg-brown text-ivory" : "text-muted hover:text-brown"}`}
          >
            Top
          </button>
          <button 
            onClick={() => setSortBy('recent')}
            className={`px-3 py-1 text-[10px] uppercase font-bold tracking-widest rounded-full transition ${sortBy === 'recent' ? "bg-brown text-ivory" : "text-muted hover:text-brown"}`}
          >
            Recent
          </button>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center gap-4">
            <div className="w-6 h-6 border-2 border-brown/10 border-t-brown rounded-full animate-spin" />
            <p className="text-xs text-muted italic">Gathering reflections...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-muted italic">No reflections yet. Be the first to share what God is teaching you through this verse.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 group">
                {/* Profile Pic */}
                <div className="w-8 h-8 rounded-full bg-brown/10 flex-shrink-0 overflow-hidden ring-1 ring-brown/5">
                  {comment.profile?.imageUrl ? (
                    <img src={comment.profile.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-brown/40">
                      {comment.profile?.displayName?.charAt(0) || "?"}
                    </div>
                  )}
                </div>

                {/* Body */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-brown">{comment.profile?.displayName || "Anonymous"}</span>
                    <span className="text-[10px] text-muted/60">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-dark leading-relaxed">{comment.content}</p>
                  
                  {/* Voting */}
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={() => handleVote(comment.id, 'up')}
                        className={`transition-colors ${comment.userVote === 'up' ? "text-accent-gold" : "text-muted hover:text-brown"}`}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill={comment.userVote === 'up' ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5"><path d="M7 10l5-5 5 5" /><path d="M12 5v14" /></svg>
                      </button>
                      <span className="text-[10px] font-bold text-brown/60 tabular-nums">{comment.score}</span>
                      <button 
                        onClick={() => handleVote(comment.id, 'down')}
                        className={`transition-colors ${comment.userVote === 'down' ? "text-struggle" : "text-muted hover:text-brown"}`}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill={comment.userVote === 'down' ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5"><path d="M17 14l-5 5-5-5" /><path d="M12 19V5" /></svg>
                      </button>
                    </div>
                    {userId && comment.userId === userId && (
                      <button
                        onClick={() => setConfirmDeleteId(comment.id)}
                        disabled={deletingId === comment.id}
                        className="ml-auto text-[9px] uppercase font-bold tracking-widest text-red-400/60 hover:text-red-400 transition-colors disabled:opacity-50"
                      >
                        {deletingId === comment.id ? "..." : "Delete"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-6 bg-ivory border-t border-brown/5 safe-bottom">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="What is God teaching you here?"
              rows={2}
              className="w-full px-4 py-3 bg-cream/50 border border-brown/10 rounded-2xl text-dark text-base placeholder:text-muted/40 focus:outline-none focus:ring-1 focus:ring-brown/20 resize-none transition-all"
            />
            {error && <p className="absolute -bottom-5 left-1 text-[10px] text-red-500 italic truncate w-[calc(100%-12px)]">{error}</p>}
          </div>
          <button
            onClick={handlePost}
            disabled={posting || !newComment.trim() || !userId}
            className="w-12 h-12 flex items-center justify-center bg-brown text-ivory rounded-2xl disabled:opacity-30 disabled:grayscale transition-all active:scale-95 shadow-md shadow-brown/10"
          >
            {posting ? (
              <div className="w-4 h-4 border-2 border-ivory/20 border-t-ivory rounded-full animate-spin" />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
            )}
          </button>
        </div>
        {!userId && (
          <p className="text-[10px] text-muted text-center mt-2 italic">Sign in to join the conversation.</p>
        )}
      </div>
      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-cream-dark/40 backdrop-blur-sm" style={{ animation: "fadeIn 0.2s ease-out both" }}>
          <div className="bg-ivory rounded-3xl p-6 shadow-2xl border border-brown/10 max-w-sm w-full" style={{ animation: "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) both" }}>
            <h3 className="font-serif text-xl text-dark mb-2">Delete Reflection?</h3>
            <p className="text-sm text-muted mb-6">This action cannot be undone. Your reflection will be permanently removed from this passage.</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 px-4 py-2.5 bg-brown/5 text-brown text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-brown/10 transition"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  handleDelete(confirmDeleteId);
                  setConfirmDeleteId(null);
                }}
                className="flex-1 px-4 py-2.5 bg-red-400/10 text-red-500 text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-red-400/20 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
