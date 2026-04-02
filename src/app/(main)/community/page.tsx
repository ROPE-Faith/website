"use client";

import { useState, useEffect, useRef } from "react";
import {
  getPublicPrayers,
  getForumPosts,
  createForumPost,
  amenPrayer,
  votePost,
  postReply,
  getForumPostWithReplies,
  togglePrayerPublic,
  getPrayerWithReplies,
  postPrayerReply,
  getCommunityFeed,
  deleteForumPost,
  deleteVerseComment,
  deleteForumReply,
  deletePrayerReply,
  getVerseCommentWithReplies,
  postVerseReply,
  deleteVerseReply
} from "@/lib/community-actions";
import { useAuth } from "@clerk/nextjs";
import { OliveBranch } from "@/components/Accents";
import { fetchVerse } from "@/lib/store";

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<'feed' | 'forum' | 'prayers'>('feed');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [prayers, setPrayers] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [feed, setFeed] = useState<any[]>([]);
  const [feedPage, setFeedPage] = useState(0);
  const [hasMoreFeed, setHasMoreFeed] = useState(true);

  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedPrayerId, setSelectedPrayerId] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [newPost, setNewPost] = useState({ title: "", content: "", category: "General" });
  const [posting, setPosting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { userId } = useAuth();

  useEffect(() => {
    if (errorNotice) {
      const timer = setTimeout(() => setErrorNotice(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorNotice]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prayersData, postsData, feedData] = await Promise.all([
        getPublicPrayers(20, 0),
        getForumPosts("General", 20, 0),
        getCommunityFeed(0, 10)
      ]);
      setPrayers(prayersData);
      setPosts(postsData);
      setFeed(feedData);
      setFeedPage(0);
      setHasMoreFeed(feedData.length >= 10);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreFeed = async () => {
    if (loadingMore || !hasMoreFeed) return;
    setLoadingMore(true);
    try {
      const nextPage = feedPage + 1;
      const moreData = await getCommunityFeed(nextPage, 10);
      if (moreData.length === 0) {
        setHasMoreFeed(false);
      } else {
        setFeed(prev => [...prev, ...moreData]);
        setFeedPage(nextPage);
        setHasMoreFeed(moreData.length >= 10);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  async function handleCreatePost() {
    if (!newPost.title.trim() || !newPost.content.trim()) return;
    setPosting(true);
    setErrorNotice(null);
    try {
      await createForumPost(newPost.title, newPost.content, newPost.category);
      setNewPost({ title: "", content: "", category: "General" });
      setShowCreatePost(false);
      loadData();
    } catch (err: any) {
      setErrorNotice(err.message || "Could not create discussion. Please try again.");
    } finally {
      setPosting(false);
    }
  }

  const handleAmen = async (id: string) => {
    if (!userId) return;
    setPrayers(prev => prev.map(p => {
      if (p.id === id) {
        return {
          ...p,
          amenCount: p.userAmen ? p.amenCount - 1 : p.amenCount + 1,
          userAmen: !p.userAmen
        };
      }
      return p;
    }));
    setFeed(prev => prev.map(item => {
      if (item.id === id && item.type === 'prayer') {
        return {
          ...item,
          amenCount: item.userAmen ? item.amenCount - 1 : item.amenCount + 1,
          userAmen: !item.userAmen
        };
      }
      return item;
    }));
    await amenPrayer(id);
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      // Optimistic delete from state
      setPosts(prev => prev.filter(p => p.id !== id));
      setFeed(prev => prev.filter(f => f.id !== id));
      await deleteForumPost(id);
    } catch (err) {
      console.error(err);
      setErrorNotice("Could not delete post.");
      loadData(); // Rollback/Refresh
    }
  };

  const handleDeleteComment = async (id: string) => {
    if (!confirm("Are you sure you want to delete this discussion?")) return;
    try {
      // Optimistic delete from state
      setFeed(prev => prev.filter(f => f.id !== id));
      await deleteVerseComment(id);
    } catch (err) {
      console.error(err);
      setErrorNotice("Could not delete discussion.");
      loadData(); // Rollback/Refresh
    }
  };

  const handleDeletePrayer = async (id: string) => {
    if (!confirm("Remove this testimony from the community feed?")) return;
    try {
      // Optimistic delete from state
      setPrayers(prev => prev.filter(p => p.id !== id));
      setFeed(prev => prev.filter(f => f.id !== id));
      await togglePrayerPublic(id, false);
    } catch (err) {
      console.error(err);
      setErrorNotice("Could not remove testimony.");
      loadData(); // Rollback/Refresh
    }
  };

  const handleLike = async (id: string) => {
    if (!userId) return;
    setPosts(prev => prev.map(p => {
      if (p.id === id) {
        return {
          ...p,
          likeCount: p.userLiked ? p.likeCount - 1 : p.likeCount + 1,
          userLiked: !p.userLiked
        };
      }
      return p;
    }));
    setFeed(prev => prev.map(item => {
      if (item.id === id && item.type === 'post') {
        return {
          ...item,
          likeCount: item.userLiked ? item.likeCount - 1 : item.likeCount + 1,
          userLiked: !item.userLiked
        };
      }
      return item;
    }));
    await votePost(id);
  };

  const handleToggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  return (
    <div className="px-5 pt-6 pb-20 max-w-2xl mx-auto relative min-h-screen" style={{ animation: "fadeIn 0.4s ease-out both" }}>
      <div className="flex items-center justify-center gap-4 mb-6 relative">
        <h1 className="font-serif text-3xl text-brown">Community</h1>
        <button
          onClick={() => setShowHelp(true)}
          className="w-8 h-8 rounded-full bg-brown/5 flex items-center justify-center text-muted hover:text-brown transition-all"
          title="Community Help"
        >
          <span className="font-serif text-lg leading-none italic opacity-50">?</span>
        </button>
      </div>

      {errorNotice && (
        <div className="fixed top-6 left-5 right-5 z-[100] p-4 bg-red-500 text-white text-xs font-bold rounded-2xl shadow-lg animate-bounce">
          {errorNotice}
        </div>
      )}
      <div className="flex justify-center mb-8 relative">
        <div className="inline-flex p-1 bg-brown/5 rounded-2xl relative">
          <button
            onClick={() => setActiveTab('feed')}
            className={`px-6 py-2 text-[10px] uppercase font-bold tracking-widest rounded-xl transition ${activeTab === 'feed' ? "bg-brown text-ivory shadow-lg shadow-brown/20" : "text-muted hover:text-brown"}`}
          >
            Stream
          </button>
          <button
            onClick={() => setActiveTab('forum')}
            className={`px-6 py-2 text-[10px] uppercase font-bold tracking-widest rounded-xl transition ${activeTab === 'forum' ? "bg-brown text-ivory shadow-lg shadow-brown/20" : "text-muted hover:text-brown"}`}
          >
            Forum
          </button>
          <button
            onClick={() => setActiveTab('prayers')}
            className={`px-6 py-2 text-[10px] uppercase font-bold tracking-widest rounded-xl transition ${activeTab === 'prayers' ? "bg-brown text-ivory shadow-lg shadow-brown/20" : "text-muted hover:text-brown"}`}
          >
            Prayers
          </button>
        </div>
      </div>

      {/* Support ROPE - Donation Section */}
      <div className="mb-8 p-6 bg-accent-gold/5 border border-accent-gold/20 rounded-3xl text-center relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent-gold/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-accent-gold/10 transition-colors" />
        <h3 className="font-serif text-lg text-brown mb-2">Support the Mission</h3>
        <p className="text-xs text-muted-dark/70 mb-4 max-w-sm mx-auto leading-relaxed">
          ROPE is free and ad-free. If this tool has helped your walk with God, consider supporting its maintenance. All funds go to site maintenance.
        </p>
        <a
          href="https://www.buymeacoffee.com/ropescripture"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-accent-gold text-dark-brown text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-accent-gold/90 transition-all shadow-lg shadow-accent-gold/10"
        >
          <span>☕</span> Support ROPE
        </a>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-8 h-8 border-2 border-brown/20 border-t-brown rounded-full animate-spin" />
          <p className="text-muted font-serif italic text-sm">Gathering the community...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Stream Tab */}
          {activeTab === 'feed' && (
            <div className="space-y-6">
              <div className="p-6 bg-brown/[0.03] border border-brown/10 rounded-[2rem] text-center mb-8">
                <p className="text-dark text-sm italic font-serif">"Encourage one another and build each other up."</p>
              </div>
              {feed.map((item) => (
                <div key={item.id} className="space-y-2">
                  {item.type === 'discussion' ? (
                    <VerseDiscussionCard
                      item={item}
                      currentUserId={userId}
                      onDelete={() => handleDeleteComment(item.id)}
                      onToggleExpand={() => handleToggleExpand(item.id)}
                      isExpanded={expandedId === item.id}
                    />
                  ) : (
                    <CommunityCard
                      item={item}
                      type={item.type as any}
                      onAmen={() => handleAmen(item.id)}
                      onLike={() => handleLike(item.id)}
                      onOpen={() => handleToggleExpand(item.id)}
                      onUnshare={() => togglePrayerPublic(item.id, false).then(loadData)}
                      onDelete={() => item.type === 'post' ? handleDeletePost(item.id) : handleDeletePrayer(item.id)}
                      currentUserId={userId}
                    />
                  )}
                  {expandedId === item.id && (
                    <div className="ml-4 pl-4 border-l-2 border-brown/5 pt-2 pb-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      <DiscussionExpansion
                        postId={item.type === 'post' ? item.id : null}
                        prayerId={item.type === 'prayer' ? item.id : null}
                        verseCommentId={item.type === 'discussion' ? item.id : null}
                        onClose={() => setExpandedId(null)}
                      />
                    </div>
                  )}
                </div>
              ))}
              {hasMoreFeed && (
                <button
                  onClick={loadMoreFeed}
                  disabled={loadingMore}
                  className="w-full py-4 text-[10px] text-brown/40 font-bold uppercase tracking-[0.2em] hover:text-brown transition-all"
                >
                  {loadingMore ? "Gathering more..." : "Load more stream"}
                </button>
              )}
            </div>
          )}

          {activeTab === 'forum' && (
            <div className="space-y-6">
              <button
                onClick={() => setShowCreatePost(true)}
                className="w-full py-4 bg-brown/5 text-brown text-[10px] uppercase font-bold tracking-widest rounded-2xl hover:bg-brown/10 transition-all border border-brown/5"
              >
                + Start a New Discussion
              </button>
              {posts.map((post) => (
                <div key={post.id} className="space-y-2">
                  <CommunityCard
                    item={post}
                    type="post"
                    onLike={() => handleLike(post.id)}
                    onOpen={() => handleToggleExpand(post.id)}
                    onDelete={() => handleDeletePost(post.id)}
                    currentUserId={userId}
                  />
                  {expandedId === post.id && (
                    <div className="ml-4 pl-4 border-l-2 border-brown/5 pt-2 pb-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      <DiscussionExpansion
                        postId={post.id}
                        prayerId={null}
                        verseCommentId={null}
                        onClose={() => setExpandedId(null)}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'prayers' && (
            <div className="space-y-6">
              {prayers.map((prayer) => (
                <div key={prayer.id} className="space-y-2">
                  <CommunityCard
                    item={prayer}
                    type="prayer"
                    onAmen={() => handleAmen(prayer.id)}
                    onOpen={() => handleToggleExpand(prayer.id)}
                    onUnshare={() => togglePrayerPublic(prayer.id, false).then(loadData)}
                    onDelete={() => handleDeletePrayer(prayer.id)}
                    currentUserId={userId}
                  />
                  {expandedId === prayer.id && (
                    <div className="ml-4 pl-4 border-l-2 border-brown/5 pt-2 pb-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      <DiscussionExpansion
                        postId={null}
                        prayerId={prayer.id}
                        verseCommentId={null}
                        onClose={() => setExpandedId(null)}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showCreatePost && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center px-4 bg-black/20 backdrop-blur-sm animate-in fade-in duration-300">
          <div
            className="w-full max-w-lg bg-ivory rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom-10"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-serif text-2xl text-brown">Start a Topic</h3>
              <button onClick={() => setShowCreatePost(false)} className="text-muted hover:text-brown transition">✕</button>
            </div>
            <div className="space-y-4">
              <input
                value={newPost.title}
                onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                placeholder="Title"
                className="w-full px-4 py-3 bg-brown/5 border border-brown/10 rounded-xl text-dark text-base focus:outline-none focus:ring-1 focus:ring-brown/30"
              />
              <textarea
                value={newPost.content}
                onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                placeholder="What's on your heart?"
                rows={4}
                className="w-full px-4 py-3 bg-brown/5 border border-brown/10 rounded-xl text-dark text-base focus:outline-none focus:ring-1 focus:ring-brown/30 resize-none"
              />
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowCreatePost(false)}
                  className="px-6 py-2 text-[10px] uppercase font-bold tracking-widest text-muted hover:text-brown transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePost}
                  disabled={posting || !newPost.title || !newPost.content}
                  className="px-8 py-2 bg-brown text-ivory text-[10px] uppercase font-bold tracking-widest rounded-xl shadow-lg shadow-brown/20 hover:scale-105 active:scale-95 transition disabled:opacity-50"
                >
                  {posting ? "Posting..." : "Publish Topic"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showHelp && (
        <CommunityHelpModal onClose={() => setShowHelp(false)} />
      )}
    </div>
  );
}

function CommunityHelpModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[200] overflow-y-auto">
      <div
        className="fixed inset-0 animate-in fade-in duration-700"
        onClick={onClose}
      />

      <div className="flex min-h-full items-start justify-center p-6 pt-12 sm:pt-24">
        <div
          className="relative w-full max-w-xl bg-ivory/90 rounded-[2.5rem] shadow-2xl border border-brown/10 p-10 md:p-14 animate-in fade-in zoom-in-95 duration-500"
          style={{ backgroundImage: "radial-gradient(circle at top right, rgba(163, 137, 72, 0.05) 0%, transparent 70%)" }}
        >
          <div className="text-center mb-10">
            <h2 className="font-serif text-4xl text-brown mb-3">Community Life</h2>
            <p className="text-muted-dark/50 text-[10px] uppercase tracking-[0.2em] font-bold">A guide to ROPE collective wisdom</p>
          </div>

          <div className="space-y-10">
            <div className="grid gap-8 sm:grid-cols-2">
              <section className="space-y-3">
                <div className="w-8 h-8 rounded-full bg-brown/5 flex items-center justify-center mb-4">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-7.6 8.38 8.38 0 0 1 3.8.9L21 3z" /></svg>
                </div>
                <h3 className="font-serif text-lg text-brown leading-none">Shared Discussions</h3>
                <p className="text-xs text-muted-dark/70 leading-relaxed">
                  Every verse has a global conversation. When you share a discussion post from the Bible reader, it appears here and anchored to that specific verse for others to read and respond.
                </p>
              </section>

              <section className="space-y-3">
                <div className="w-8 h-8 rounded-full bg-brown/5 flex items-center justify-center mb-4">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                </div>
                <h3 className="font-serif text-lg text-brown leading-none">Public Testimony</h3>
                <p className="text-xs text-muted-dark/70 leading-relaxed">
                  Answered prayers can be shared with the community. These testimonies serve to encourage others on their journey. Use the "Amen" button to join in gratitude.
                </p>
              </section>

              <section className="space-y-3">
                <div className="w-8 h-8 rounded-full bg-brown/5 flex items-center justify-center mb-4">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                </div>
                <h3 className="font-serif text-lg text-brown leading-none">The Forum</h3>
                <p className="text-xs text-muted-dark/70 leading-relaxed">
                  The Forum is for general spiritual topics, questions, and community-wide dialogue. Anyone can start a topic or reply to existing ones.
                </p>
              </section>

              <section className="space-y-3">
                <div className="w-8 h-8 rounded-full bg-brown/5 flex items-center justify-center mb-4">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                </div>
                <h3 className="font-serif text-lg text-brown leading-none">Moderation</h3>
                <p className="text-xs text-muted-dark/70 leading-relaxed">
                  We maintain a clean environment through automated filters and community standards. You can always delete your own posts if you wish to remove them from public view.
                </p>
              </section>
            </div>
          </div>

          <div className="mt-12 text-center">
            <button
              onClick={onClose}
              className="px-10 py-3.5 bg-brown text-ivory rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-brown/90 shadow-xl shadow-brown/20 transition-all active:scale-[0.98]"
            >
              Continue Journey
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CommunityCard({ item, type, onAmen, onLike, onOpen, onUnshare, onDelete, currentUserId }: {
  item: any;
  type: 'prayer' | 'post';
  onAmen?: () => void;
  onLike?: () => void;
  onOpen?: () => void;
  onUnshare?: () => void;
  onDelete?: () => void;
  currentUserId?: string | null;
}) {
  const isAmen = item.userAmen;
  const isLiked = item.userLiked;
  const isOwner = currentUserId && item.userId === currentUserId;
  const replyCount = item.replyCount || 0;

  return (
    <div
      className="card-surface rounded-2xl p-5 border-l-3 border-l-transparent hover:border-l-brown/30 transition-all duration-300 group cursor-pointer"
      onClick={onOpen}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-brown/5 flex-shrink-0 overflow-hidden ring-2 ring-ivory group-hover:ring-brown/10 transition-all">
          {item.profile?.imageUrl ? (
            <img src={item.profile.imageUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-brown/40">
              {item.profile?.displayName?.charAt(0) || "?"}
            </div>
          )}
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold text-brown leading-tight">{item.profile?.displayName || "Anonymous"}</p>
          <p className="text-[10px] text-muted-dark/50 uppercase tracking-tighter">
            {type === 'prayer' ? "Answered Prayer" : item.category || "Forum Topic"}
          </p>
        </div>
        <div className="text-right">
          <span className="text-[9px] text-muted-dark/30 font-medium">
            {new Date(item.createdAt || item.publicAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="mb-5 pl-13 space-y-4">
        {item.title && <h3 className="font-serif text-lg text-brown mb-2 leading-snug">{item.title}</h3>}
        {type === 'prayer' ? (
          <div className="space-y-4">
            <div className="relative">
              <p className="text-sm text-dark leading-relaxed whitespace-pre-wrap italic opacity-80">{item.text}</p>
              <div className="absolute -left-4 top-0 bottom-0 w-0.5 bg-brown/10" />
            </div>
            {item.answeredNote && (
              <div className="p-4 bg-accent-gold/5 rounded-2xl border border-accent-gold/10">
                <p className="text-[10px] text-accent-gold uppercase font-bold tracking-[0.2em] mb-2">The Provision</p>
                <p className="text-sm text-dark-brown/90 leading-relaxed font-serif">{item.answeredNote}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-dark leading-relaxed line-clamp-3 select-none whitespace-pre-wrap">{item.content}</p>
        )}
      </div>

      <div className="flex items-center gap-4 pt-4 border-t border-brown/5 pl-13">
        <button
          onClick={(e) => { e.stopPropagation(); type === 'prayer' ? onAmen?.() : onLike?.(); }}
          className={`flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest transition-colors ${(type === 'prayer' ? isAmen : isLiked) ? "text-accent-gold" : "text-muted hover:text-brown"}`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill={(type === 'prayer' ? isAmen : isLiked) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
          {type === 'prayer' ? (item.amenCount || 0) : (item.likeCount || 0)} {type === 'prayer' ? "Amen" : "Like"}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onOpen?.(); }}
          className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-muted hover:text-brown transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-7.6 8.38 8.38 0 0 1 3.8.9L21 3z" /></svg>
          {replyCount} Replies
        </button>
        {isOwner && (
          <div className="ml-auto flex items-center gap-4">
            {type === 'prayer' && (
              <button
                onClick={(e) => { e.stopPropagation(); if (confirm("Make this prayer private again?")) onUnshare?.(); }}
                className="text-[9px] uppercase font-bold tracking-widest text-muted/40 hover:text-muted transition-colors underline underline-offset-4"
              >
                Unshare
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
              className="text-[9px] uppercase font-bold tracking-widest text-red-400/60 hover:text-red-400 transition-colors"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function VerseDiscussionCard({ item, currentUserId, onDelete, onToggleExpand, isExpanded }: { item: any; currentUserId?: string | null; onDelete?: () => void; onToggleExpand?: () => void; isExpanded?: boolean }) {
  const isOwner = currentUserId && item.userId === currentUserId;
  const [verseText, setVerseText] = useState(item.verseText || "");
  const [loadingText, setLoadingText] = useState(false);

  useEffect(() => {
    if (!verseText && item.book && item.chapter && item.verse) {
      setLoadingText(true);
      fetchVerse(`${item.book} ${item.chapter}:${item.verse}`, 'kjv')
        .then(text => setVerseText(text))
        .finally(() => setLoadingText(false));
    }
  }, [item.id, verseText]);

  return (
    <div
      className="card-surface rounded-2xl p-5 border-l-3 border-l-accent-gold/20 hover:border-l-accent-gold/50 transition-all duration-300 group cursor-pointer"
      onClick={onToggleExpand}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-accent-gold/5 flex-shrink-0 overflow-hidden ring-2 ring-ivory group-hover:ring-accent-gold/10 transition-all">
          {item.profile?.imageUrl ? (
            <img src={item.profile.imageUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-accent-gold/40">
              {item.profile?.displayName?.charAt(0) || "?"}
            </div>
          )}
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold text-brown leading-tight">{item.profile?.displayName || "Anonymous"}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[9px] text-accent-gold uppercase font-bold tracking-widest">Shared Discussion</span>
            <span className="w-1 h-1 bg-brown/10 rounded-full" />
            <span className="text-[9px] text-muted-dark/40 font-medium">{item.book} {item.chapter}:{item.verse}</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[9px] text-muted-dark/30 font-medium">
            {new Date(item.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="mb-5 pl-13 space-y-3">
        <div className="p-4 bg-brown/[0.02] border border-brown/5 rounded-xl border-l-2 border-l-brown/10 relative overflow-hidden">
          {loadingText ? (
            <div className="h-4 w-3/4 bg-brown/5 animate-pulse rounded" />
          ) : (
            <p className="text-xs text-muted-dark italic leading-relaxed">&ldquo;{verseText || "(Reference recorded)"}&rdquo;</p>
          )}
          <div className="absolute top-0 right-0 p-1 opacity-10">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" /></svg>
          </div>
        </div>
        <p className="text-sm text-dark leading-relaxed whitespace-pre-wrap">{item.content}</p>
      </div>

      <div className="flex items-center gap-4 pt-4 border-t border-brown/5 pl-13">
        <button
          onClick={(e) => { e.stopPropagation(); onToggleExpand?.(); }}
          className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-muted hover:text-brown transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-7.6 8.38 8.38 0 0 1 3.8.9L21 3z" /></svg>
          View Context & Replies
        </button>
        {isOwner && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
            className="ml-auto text-[9px] uppercase font-bold tracking-widest text-red-400/60 hover:text-red-400 transition-colors"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

function DiscussionExpansion({ postId, prayerId, verseCommentId, onClose }: { postId: string | null; prayerId: string | null; verseCommentId: string | null; onClose: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { userId } = useAuth();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      if (postId) {
        const d = await getForumPostWithReplies(postId);
        setData(d);
      } else if (prayerId) {
        const d = await getPrayerWithReplies(prayerId);
        setData(d);
      } else if (verseCommentId) {
        const d = await getVerseCommentWithReplies(verseCommentId);
        setData(d);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [postId, prayerId, verseCommentId]);

  async function handlePostReply() {
    if (!reply.trim() || !userId) return;
    setPosting(true);
    setError(null);
    try {
      if (postId) await postReply(postId, reply);
      else if (prayerId) await postPrayerReply(prayerId, reply);
      else if (verseCommentId) await postVerseReply(verseCommentId, reply);
      setReply("");
      loadData();
    } catch (err: any) {
      setError(err.message || "Could not post reply.");
    } finally {
      setPosting(false);
    }
  }

  const handleDeleteReply = async (replyId: string) => {
    if (!confirm("Delete this reply?")) return;
    setDeletingId(replyId);
    try {
      if (postId) await deleteForumReply(replyId);
      else if (prayerId) await deletePrayerReply(replyId);
      else if (verseCommentId) await deleteVerseReply(replyId);
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return (
    <div className="py-8 text-center animate-pulse">
      <div className="w-6 h-6 border-2 border-brown/10 border-t-brown rounded-full animate-spin mx-auto mb-2" />
      <p className="text-[10px] text-muted-dark/40 uppercase tracking-widest">Gathering replies...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="space-y-4 max-h-[30rem] overflow-y-auto px-1 custom-scrollbar">
        {data?.replies?.map((r: any) => (
          <div key={r.id} className="flex gap-3 group/reply animate-in fade-in slide-in-from-left-2 duration-300">
            <div className="w-8 h-8 rounded-full bg-brown/5 shrink-0 overflow-hidden ring-1 ring-brown/5">
              {r.profile?.imageUrl ? <img src={r.profile.imageUrl} alt="" className="w-full h-full object-cover" /> : r.profile?.displayName?.charAt(0) || "?"}
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-brown">{r.profile?.displayName}</span>
                  <span className="text-[9px] text-muted/50">{new Date(r.createdAt).toLocaleDateString()}</span>
                </div>
                {userId && r.userId === userId && (
                  <button
                    onClick={() => handleDeleteReply(r.id)}
                    disabled={deletingId === r.id}
                    className="opacity-0 group-hover/reply:opacity-100 transition-opacity text-[8px] uppercase tracking-widest text-red-400/60 hover:text-red-400"
                  >
                    {deletingId === r.id ? "..." : "Delete"}
                  </button>
                )}
              </div>
              <p className="text-xs text-dark leading-relaxed">{r.content}</p>
            </div>
          </div>
        ))}
        {(!data?.replies || data.replies.length === 0) && (
          <p className="text-[10px] text-muted-dark/30 italic">No replies yet. Be the first to start the conversation.</p>
        )}
      </div>

      <div className="flex gap-2 items-center w-full overflow-hidden">
        <input
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Write a respectful reply..."
          className="flex-1 min-w-0 px-4 py-3 bg-ivory/50 border border-brown/10 rounded-xl text-base text-dark focus:outline-none focus:ring-1 focus:ring-brown/20"
        />
        <button
          onClick={handlePostReply}
          disabled={posting || !reply.trim()}
          className="px-5 py-3 bg-brown text-ivory text-[10px] font-bold uppercase tracking-widest rounded-xl disabled:opacity-30 transition-all hover:scale-105 active:scale-95 shrink-0 whitespace-nowrap"
        >
          {posting ? "..." : "Reply"}
        </button>
      </div>
      {error && <p className="text-[10px] text-red-500 italic mt-1">{error}</p>}
    </div>
  );
}
