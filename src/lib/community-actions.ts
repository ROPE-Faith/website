"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "./server-db";
import { profiles, verseComments, commentVotes, forumPosts, forumReplies, prayers as prayersTable, postVotes, prayerAmens, publicHighlights, prayerReplies, verseReplies } from "./schema";
import { eq, and, desc, count, sql } from "drizzle-orm";
import profanity from "leo-profanity";
import { enforceRateLimit } from "./rate-limit";
import { ForumPostSchema, VerseCommentSchema, ReplySchema, PublicHighlightSchema } from "./validations";

function containsVulgarity(text: string): boolean {
  return profanity.check(text);
}

// ─── Profile Sync ────────────────────────────────────────────────────────────

export async function syncProfile() {
  const { userId } = await auth();
  if (!userId) return null;

  // Optimize: Only sync once every 24 hours unless data changes
  const existing = await db.query.profiles.findFirst({
    where: eq(profiles.userId, userId),
  });

  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const user = await currentUser();
  if (!user) return null;

  const displayName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username || "Anonymous";
  const imageUrl = user.imageUrl;

  if (existing && existing.updatedAt > oneDayAgo) {
    // If name/image haven't changed, skip sync
    if (existing.displayName === displayName && existing.imageUrl === imageUrl) {
      return existing;
    }
  }

  const profileData = {
    userId,
    displayName,
    imageUrl,
    updatedAt: now,
  };

  await db.insert(profiles).values(profileData).onConflictDoUpdate({
    target: profiles.userId,
    set: profileData,
  });

  return profileData;
}

export async function getProfile(userId: string) {
  return await db.query.profiles.findFirst({
    where: eq(profiles.userId, userId),
  });
}

// ─── Verse Comments ──────────────────────────────────────────────────────────

export async function getVerseComments(book: string, chapter: string, verse: string, sortBy: 'top' | 'recent' = 'recent', limit: number = 20, offset: number = 0) {
  const { userId } = await auth();

  const comments = await db.query.verseComments.findMany({
    where: and(
      eq(verseComments.book, book),
      eq(verseComments.chapter, chapter.toString()),
      eq(verseComments.verse, verse.toString())
    ),
    limit,
    offset,
    orderBy: sortBy === 'recent' ? [desc(verseComments.createdAt)] : undefined,
  });

  // Fetch votes and profiles for these comments
  const enrichedComments = await Promise.all(comments.map(async (c) => {
    const profile = await getProfile(c.userId);
    
    // Calculate score
    const votes = await db.select({ 
      up: sql<number>`count(*) filter (where vote_type = 'up')`,
      down: sql<number>`count(*) filter (where vote_type = 'down')`
    }).from(commentVotes).where(eq(commentVotes.commentId, c.id));
    
    const score = Number(votes[0].up || 0) - Number(votes[0].down || 0);
    
    // Check user's own vote
    let userVote = null;
    if (userId) {
      const v = await db.query.commentVotes.findFirst({
        where: and(eq(commentVotes.commentId, c.id), eq(commentVotes.userId, userId))
      });
      userVote = v?.voteType || null;
    }

    return {
      ...c,
      profile,
      score,
      userVote,
    };
  }));

  if (sortBy === 'top') {
    return enrichedComments.sort((a, b) => b.score - a.score);
  }

  return enrichedComments;
}

export async function getChapterCommentPreviews(book: string, chapter: string) {
  const comments = await db.query.verseComments.findMany({
    where: and(
      eq(verseComments.book, book),
      eq(verseComments.chapter, chapter.toString())
    ),
    orderBy: [desc(verseComments.createdAt)],
  });

  if (comments.length === 0) return {};

  // Batch fetch unique profiles to avoid waterfall
  const uniqueUserIds = Array.from(new Set(comments.map(c => c.userId)));
  const profileList = await db.query.profiles.findMany({
    where: sql`${profiles.userId} IN ${uniqueUserIds}`,
  });
  const profileMap = new Map(profileList.map(p => [p.userId, p]));

  const previews: Record<string, any> = {};
  for (const c of comments) {
    if (!previews[c.verse]) {
      previews[c.verse] = { ...c, profile: profileMap.get(c.userId) || null };
    }
  }
  return previews;
}

export async function postVerseComment(book: string, chapter: string, verse: string, content: string, verseText: string = "") {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await enforceRateLimit("postVerseComment", "Community");
  const validated = VerseCommentSchema.parse({ book, chapter, verse, content, verseText });

  if (containsVulgarity(validated.content)) {
    throw new Error("Content contains inappropriate language. Please keep discussions respectful.");
  }

  await syncProfile();

  const id = crypto.randomUUID();
  await db.insert(verseComments).values({
    id,
    userId,
    book: validated.book,
    chapter: validated.chapter,
    verse: validated.verse,
    content: validated.content,
    verseText: validated.verseText,
  });

  return id;
}

export async function deleteVerseComment(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  
  await enforceRateLimit("deleteVerseComment", "Community");

  await db.delete(verseComments).where(and(eq(verseComments.id, id), eq(verseComments.userId, userId)));
  // Delete associated replies
  await db.delete(verseReplies).where(eq(verseReplies.verseCommentId, id));
  return true;
}

export async function getVerseCommentWithReplies(id: string) {
  const comment = await db.query.verseComments.findFirst({
    where: eq(verseComments.id, id),
  });

  if (!comment) return null;

  const profile = await getProfile(comment.userId);
  const replies = await db.query.verseReplies.findMany({
    where: eq(verseReplies.verseCommentId, id),
    orderBy: [verseReplies.createdAt],
  });

  const enrichedReplies = await Promise.all(replies.map(async (r) => {
    const rp = await getProfile(r.userId);
    return { ...r, profile: rp };
  }));

  return { ...comment, profile, replies: enrichedReplies };
}

export async function postVerseReply(verseCommentId: string, content: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await enforceRateLimit("postVerseReply", "Community");
  const validated = ReplySchema.parse({ content });

  if (containsVulgarity(validated.content)) {
    throw new Error("Content contains inappropriate language. Please keep the conversation respectful.");
  }

  await syncProfile();

  const id = crypto.randomUUID();
  await db.insert(verseReplies).values({
    id,
    verseCommentId,
    userId,
    content: validated.content,
  });

  return id;
}

export async function deleteVerseReply(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  await enforceRateLimit("deleteVerseReply", "Community");
  await db.delete(verseReplies).where(and(eq(verseReplies.id, id), eq(verseReplies.userId, userId)));
  return true;
}

export async function voteComment(commentId: string, voteType: 'up' | 'down' | null) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await enforceRateLimit("voteComment", "Community");

  if (voteType === null) {
    await db.delete(commentVotes).where(and(eq(commentVotes.commentId, commentId), eq(commentVotes.userId, userId)));
  } else {
    const id = `${userId}_${commentId}`;
    await db.insert(commentVotes).values({
      id,
      userId,
      commentId,
      voteType,
    }).onConflictDoUpdate({
      target: commentVotes.id,
      set: { voteType },
    });
  }

  return true;
}

// ─── Public Prayers ──────────────────────────────────────────────────────────

export async function getPublicPrayers(limit: number = 20, offset: number = 0) {
  const { userId } = await auth();
  const results = await db.query.prayers.findMany({
    where: eq(prayersTable.isPublic, true),
    orderBy: [desc(prayersTable.publicAt)],
    limit,
    offset,
  });

  return await Promise.all(results.map(async (p) => {
    const profile = await getProfile(p.userId);
    
    // Get amen count
    const amenCountRes = await db.select({ count: sql<number>`count(*)` }).from(prayerAmens).where(eq(prayerAmens.prayerId, p.id));
    const amenCount = Number(amenCountRes[0].count);

    // Get reply count
    const replyCountRes = await db.select({ count: sql<number>`count(*)` }).from(prayerReplies).where(eq(prayerReplies.prayerId, p.id));
    const replyCount = Number(replyCountRes[0].count);
    
    // Check if current user said amen
    let userAmen = false;
    if (userId) {
      const a = await db.query.prayerAmens.findFirst({
        where: and(eq(prayerAmens.prayerId, p.id), eq(prayerAmens.userId, userId))
      });
      userAmen = !!a;
    }

    return { ...p, profile, amenCount, userAmen, replyCount };
  }));
}

export async function getPrayerWithReplies(prayerId: string) {
  const prayer = await db.query.prayers.findFirst({
    where: eq(prayersTable.id, prayerId),
  });

  if (!prayer) return null;

  const profile = await getProfile(prayer.userId);
  const replies = await db.query.prayerReplies.findMany({
    where: eq(prayerReplies.prayerId, prayerId),
    orderBy: [prayerReplies.createdAt],
  });

  const enrichedReplies = await Promise.all(replies.map(async (r) => {
    const rp = await getProfile(r.userId);
    return { ...r, profile: rp };
  }));

  return { ...prayer, profile, replies: enrichedReplies };
}

export async function postPrayerReply(prayerId: string, content: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await enforceRateLimit("postPrayerReply", "Community");
  const validated = ReplySchema.parse({ content });

  if (containsVulgarity(validated.content)) {
    throw new Error("Content contains inappropriate language. Please keep the conversation respectful.");
  }

  await syncProfile();

  const id = crypto.randomUUID();
  await db.insert(prayerReplies).values({
    id,
    prayerId,
    userId,
    content: validated.content,
  });

  return id;
}

export async function amenPrayer(prayerId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await enforceRateLimit("amenPrayer", "Community");

  const existing = await db.query.prayerAmens.findFirst({
    where: and(eq(prayerAmens.prayerId, prayerId), eq(prayerAmens.userId, userId))
  });

  if (existing) {
    await db.delete(prayerAmens).where(and(eq(prayerAmens.prayerId, prayerId), eq(prayerAmens.userId, userId)));
    return { status: 'un-amened' };
  } else {
    const id = `${userId}_${prayerId}`;
    await db.insert(prayerAmens).values({ id, userId, prayerId });
    return { status: 'amened' };
  }
}

export async function togglePrayerPublic(prayerId: string, isPublic: boolean) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await syncProfile();

  await db.update(prayersTable)
    .set({ isPublic, publicAt: isPublic ? new Date() : null })
    .where(and(eq(prayersTable.id, prayerId), eq(prayersTable.userId, userId)));

  return true;
}

// ─── Forum ───────────────────────────────────────────────────────────────────

export async function getForumPosts(category: string = "General", limit: number = 20, offset: number = 0) {
  const { userId } = await auth();
  const posts = await db.query.forumPosts.findMany({
    where: eq(forumPosts.category, category),
    orderBy: [desc(forumPosts.createdAt)],
    limit,
    offset,
  });

  return await Promise.all(posts.map(async (p) => {
    const profile = await getProfile(p.userId);
    const replyCount = await db.select({ count: sql<number>`count(*)` }).from(forumReplies).where(eq(forumReplies.postId, p.id));
    
    // Get like count
    const likeCountRes = await db.select({ count: sql<number>`count(*)` }).from(postVotes).where(eq(postVotes.postId, p.id));
    const likeCount = Number(likeCountRes[0].count);

    // Check if current user liked
    let userLiked = false;
    if (userId) {
      const v = await db.query.postVotes.findFirst({
        where: and(eq(postVotes.postId, p.id), eq(postVotes.userId, userId))
      });
      userLiked = !!v;
    }

    return { 
      ...p, 
      profile, 
      replyCount: Number(replyCount[0].count),
      likeCount,
      userLiked
    };
  }));
}

export async function deleteForumPost(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  await db.delete(forumPosts).where(and(eq(forumPosts.id, id), eq(forumPosts.userId, userId)));
  // Delete associated replies
  await db.delete(forumReplies).where(eq(forumReplies.postId, id));
  return true;
}

export async function votePost(postId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await enforceRateLimit("votePost", "Community");

  const existing = await db.query.postVotes.findFirst({
    where: and(eq(postVotes.postId, postId), eq(postVotes.userId, userId))
  });

  if (existing) {
    await db.delete(postVotes).where(and(eq(postVotes.postId, postId), eq(postVotes.userId, userId)));
    return { status: 'un-liked' };
  } else {
    const id = `${userId}_${postId}`;
    await db.insert(postVotes).values({ id, userId, postId, voteType: 'up' });
    return { status: 'liked' };
  }
}

export async function getCommunityFeed(page: number = 0, limit: number = 10) {
  const offset = page * limit;
  const [prayers, posts, discussions] = await Promise.all([
    getPublicPrayers(limit, offset),
    getForumPosts("General", limit, offset),
    getGlobalVerseDiscussions(limit, offset)
  ]);

  const feed = [
    ...prayers.map(p => ({ ...p, type: 'prayer', date: new Date(p.publicAt || p.createdAt) })),
    ...posts.map(p => ({ ...p, type: 'post', date: new Date(p.createdAt) })),
    ...discussions.map(d => ({ ...d, type: 'discussion', date: new Date(d.createdAt) }))
  ];

  return feed.sort((a, b) => b.date.getTime() - a.date.getTime());
}

export async function getGlobalVerseDiscussions(limit: number = 50, offset: number = 0) {
  const comments = await db.query.verseComments.findMany({
    orderBy: [desc(verseComments.createdAt)],
    limit: limit,
    offset: offset,
  });

  return await Promise.all(comments.map(async (c) => {
    const profile = await getProfile(c.userId);
    
    // Check if verseText is missing. If it is, we'll return a marker or potentially handle it in UI
    // but the DB should have it for new posts.
    
    // Check user vote for score calculation
    const votes = await db.select({ 
      up: sql<number>`count(*) filter (where vote_type = 'up')`,
      down: sql<number>`count(*) filter (where vote_type = 'down')`
    }).from(commentVotes).where(eq(commentVotes.commentId, c.id));
    
    const score = Number(votes[0].up || 0) - Number(votes[0].down || 0);

    // Get reply count
    const replyCountRes = await db.select({ count: sql<number>`count(*)` }).from(verseReplies).where(eq(verseReplies.verseCommentId, c.id));
    const replyCount = Number(replyCountRes[0].count);

    return { ...c, profile, score, replyCount }; 
  }));
}

export async function createForumPost(title: string, content: string, category: string = "General") {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await enforceRateLimit("createForumPost", "Community");
  const validated = ForumPostSchema.parse({ title, content, category });

  if (containsVulgarity(validated.title) || containsVulgarity(validated.content)) {
    throw new Error("Content contains inappropriate language. Please keep the discussion respectful.");
  }

  await syncProfile();

  const id = crypto.randomUUID();
  await db.insert(forumPosts).values({
    id,
    userId,
    title: validated.title,
    content: validated.content,
    category: validated.category,
  });

  return id;
}

export async function getForumPostWithReplies(postId: string) {
  const post = await db.query.forumPosts.findFirst({
    where: eq(forumPosts.id, postId),
  });

  if (!post) return null;

  const profile = await getProfile(post.userId);
  const replies = await db.query.forumReplies.findMany({
    where: eq(forumReplies.postId, postId),
    orderBy: [forumReplies.createdAt],
  });

  const enrichedReplies = await Promise.all(replies.map(async (r) => {
    const rp = await getProfile(r.userId);
    return { ...r, profile: rp };
  }));

  return { ...post, profile, replies: enrichedReplies };
}

export async function postReply(postId: string, content: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await enforceRateLimit("postReply", "Community");
  const validated = ReplySchema.parse({ content });

  if (containsVulgarity(validated.content)) {
    throw new Error("Content contains inappropriate language. Please keep the conversation respectful.");
  }

  await syncProfile();

  const id = crypto.randomUUID();
  await db.insert(forumReplies).values({
    id,
    postId,
    userId,
    content: validated.content,
  });

  return id;
}

export async function deleteForumReply(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  await enforceRateLimit("deleteForumReply", "Community");
  await db.delete(forumReplies).where(and(eq(forumReplies.id, id), eq(forumReplies.userId, userId)));
  return true;
}

export async function deletePrayerReply(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  await enforceRateLimit("deletePrayerReply", "Community");
  await db.delete(prayerReplies).where(and(eq(prayerReplies.id, id), eq(prayerReplies.userId, userId)));
  return true;
}

// ─── Public Highlights ───────────────────────────────────────────────────────

export async function getPublicHighlights(book: string, chapter: string) {
  return await db.query.publicHighlights.findMany({
    where: and(
      eq(publicHighlights.book, book),
      eq(publicHighlights.chapter, chapter.toString())
    ),
    orderBy: [desc(publicHighlights.createdAt)],
  });
}

export async function addPublicHighlight(book: string, chapter: string, verse: string, color: string, note: string = "") {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await enforceRateLimit("addPublicHighlight", "Community");
  const validated = PublicHighlightSchema.parse({ book, chapter, verse, color, note });

  if (validated.note && containsVulgarity(validated.note)) {
    throw new Error("Note contains inappropriate language. Please keep it respectful.");
  }

  await syncProfile();

  const id = crypto.randomUUID();
  await db.insert(publicHighlights).values({
    id,
    userId,
    book: validated.book,
    chapter: validated.chapter,
    verse: validated.verse,
    color: validated.color,
    note: validated.note,
  });

  return id;
}
