import { auth } from "@clerk/nextjs/server";

type RateLimitConfig = {
  windowMs: number;
  max: number;
};

// Memory-based store for rate limiting
// In production, use Upstash Redis for multi-instance support
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * A professional, memory-persistent rate limiter for Server Actions.
 * Defaults to 60 requests per minute per user.
 */
export async function checkRateLimit(
  actionName: string, 
  config: RateLimitConfig = { windowMs: 60 * 1000, max: 60 }
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  const { userId } = await auth();
  const identifier = userId || "anonymous"; // Fallback to anonymous if needed, but actions are protected
  const key = `${actionName}:${identifier}`;
  
  const now = Date.now();
  const record = rateLimitStore.get(key);
  
  if (!record || now > record.resetTime) {
    const newRecord = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(key, newRecord);
    return {
      success: true,
      limit: config.max,
      remaining: config.max - 1,
      reset: newRecord.resetTime,
    };
  }
  
  if (record.count >= config.max) {
    return {
      success: false,
      limit: config.max,
      remaining: 0,
      reset: record.resetTime,
    };
  }
  
  record.count += 1;
  return {
    success: true,
    limit: config.max,
    remaining: config.max - record.count,
    reset: record.resetTime,
  };
}

/**
 * Specialized tiers for different action types
 */
export const RATE_LIMITS = {
  Standard: { windowMs: 60 * 1000, max: 30 },   // 30/min (Journal, Highlights)
  Community: { windowMs: 60 * 1000, max: 10 },  // 10/min (Posts, Comments)
  Support: { windowMs: 60 * 1000, max: 5 },    // 5/min (Feedback, Dev logs)
  Destructive: { windowMs: 60 * 1000, max: 5 }, // 5/min (Clear Data)
};

/**
 * Helper to throw an error if rate limit exceeded
 */
export async function enforceRateLimit(actionName: string, tier: keyof typeof RATE_LIMITS) {
  const result = await checkRateLimit(actionName, RATE_LIMITS[tier]);
  if (!result.success) {
    throw new Error(`Rate limit exceeded for ${actionName}. Please wait a moment before trying again.`);
  }
}
