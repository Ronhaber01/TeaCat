/**
 * Simple in-memory rate limiter for Next.js API routes.
 *
 * Runs per-serverless-instance. For fully distributed limiting across all
 * Vercel instances, swap this for @upstash/ratelimit + @upstash/redis and
 * add UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN to Vercel env vars.
 */

interface RateLimitRecord {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitRecord>()

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): boolean {
  const now = Date.now()
  const record = store.get(key)

  if (!record || record.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (record.count >= maxRequests) {
    return false
  }

  record.count++
  return true
}

export const rateLimits = {
  /** OTP send: 3 per email per 10 minutes */
  otp: (email: string) =>
    checkRateLimit(`otp:${email}`, 3, 10 * 60 * 1000),

  /** Ticket purchase: 5 per user per minute */
  purchase: (userId: string) =>
    checkRateLimit(`purchase:${userId}`, 5, 60 * 1000),
}
