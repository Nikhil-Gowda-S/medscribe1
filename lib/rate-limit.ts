// In-memory rate limiter for document generation and expensive APIs.
// For production at scale, use Redis (e.g. @upstash/ratelimit).

const store = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 20; // per user per minute for generate

function getKey(identifier: string, prefix: string): string {
  return `${prefix}:${identifier}`;
}

export function rateLimitDocumentGenerate(userId: string): { success: boolean; remaining: number } {
  const key = getKey(userId, 'docgen');
  const now = Date.now();
  let entry = store.get(key);

  if (!entry) {
    entry = { count: 1, resetAt: now + WINDOW_MS };
    store.set(key, entry);
    return { success: true, remaining: MAX_REQUESTS - 1 };
  }

  if (now > entry.resetAt) {
    entry.count = 1;
    entry.resetAt = now + WINDOW_MS;
    store.set(key, entry);
    return { success: true, remaining: MAX_REQUESTS - 1 };
  }

  entry.count += 1;
  if (entry.count > MAX_REQUESTS) {
    return { success: false, remaining: 0 };
  }
  return { success: true, remaining: MAX_REQUESTS - entry.count };
}

// Optional: cleanup old keys periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of store.entries()) {
      if (now > v.resetAt) store.delete(k);
    }
  }, 60000);
}
