/**
 * Rate Limiting Utilities
 *
 * This module provides rate limiting for API endpoints to protect against abuse.
 * Uses an in-memory store for demo purposes. In production, use Redis or similar.
 */

import { cookies } from 'next/headers';

// Rate limit configuration
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS_PER_WINDOW = 100; // 100 requests per 15 minutes per IP

// In-memory store for rate limiting (demo only - use Redis in production)
// In production, this should be a distributed cache like Redis
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Get client identifier (IP address or session token)
 */
async function getClientIdentifier(): Promise<string> {
  // Try to get IP from headers (common in proxy setups)
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session_id')?.value;

  // In production, use request.ip or x-forwarded-for
  // For demo, use session ID or a fallback
  return sessionId || 'anonymous';
}

/**
 * Check if request is within rate limit
 */
export async function checkRateLimit(
  identifier?: string
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const clientIdentifier = identifier || (await getClientIdentifier());
  const now = Date.now();

  // Clean up old entries periodically
  cleanupOldEntries(now);

  const existing = rateLimitStore.get(clientIdentifier);

  if (!existing) {
    // First request in window
    const resetTime = now + RATE_LIMIT_WINDOW_MS;
    rateLimitStore.set(clientIdentifier, { count: 1, resetTime });
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1, resetTime };
  }

  // Check if window has expired
  if (now > existing.resetTime) {
    // Reset counter
    const resetTime = now + RATE_LIMIT_WINDOW_MS;
    rateLimitStore.set(clientIdentifier, { count: 1, resetTime });
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1, resetTime };
  }

  // Within window - check limit
  if (existing.count >= MAX_REQUESTS_PER_WINDOW) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: existing.resetTime,
    };
  }

  // Increment counter
  existing.count++;
  rateLimitStore.set(clientIdentifier, existing);

  return {
    allowed: true,
    remaining: MAX_REQUESTS_PER_WINDOW - existing.count,
    resetTime: existing.resetTime,
  };
}

/**
 * Middleware-style rate limit check for API routes
 */
export async function rateLimitMiddleware(_request: Request): Promise<Response | null> {
  const { allowed, resetTime } = await checkRateLimit();

  if (!allowed) {
    const resetInSeconds = Math.ceil((resetTime - Date.now()) / 1000);
    return new Response(
      JSON.stringify({
        error: 'Rate limit exceeded',
        message: `Too many requests. Please try again in ${resetInSeconds} seconds.`,
        retryAfter: resetInSeconds,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': resetTime.toString(),
          'Retry-After': resetInSeconds.toString(),
        },
      }
    );
  }

  // Add rate limit headers to response
  // Note: This is a simplified version. In production, you'd need to modify
  // the response after it's created using Next.js middleware
  return null;
}

/**
 * Clean up old entries from the store
 */
function cleanupOldEntries(now: number): void {
  // Clean up entries older than 2 windows to prevent memory bloat
  const maxAge = RATE_LIMIT_WINDOW_MS * 2;

  for (const [key, value] of rateLimitStore.entries()) {
    if (now - value.resetTime > maxAge) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Reset rate limit for a specific identifier
 */
export async function resetRateLimit(identifier: string): Promise<void> {
  rateLimitStore.delete(identifier);
}

/**
 * Get rate limit status for a client
 */
export async function getRateLimitStatus(identifier?: string): Promise<{
  limit: number;
  remaining: number;
  resetTime: number;
}> {
  const clientIdentifier = identifier || (await getClientIdentifier());
  const now = Date.now();
  const existing = rateLimitStore.get(clientIdentifier);

  if (!existing || now > existing.resetTime) {
    return {
      limit: MAX_REQUESTS_PER_WINDOW,
      remaining: MAX_REQUESTS_PER_WINDOW,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    };
  }

  return {
    limit: MAX_REQUESTS_PER_WINDOW,
    remaining: MAX_REQUESTS_PER_WINDOW - existing.count,
    resetTime: existing.resetTime,
  };
}
