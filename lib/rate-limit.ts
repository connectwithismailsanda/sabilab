type Bucket = { count: number; resetsAt: number };

const buckets = new Map<string, Bucket>();

/**
 * Small in-process limiter for the demo. In production this moves to Redis or
 * the platform's rate-limit service; the call sites do not change.
 */
export function rateLimit(
  key: string,
  limit = 6,
  windowMs = 15 * 60 * 1000,
): { ok: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetsAt <= now) {
    buckets.set(key, { count: 1, resetsAt: now + windowMs });
    return { ok: true, retryAfterSeconds: 0 };
  }

  if (bucket.count >= limit) {
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetsAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  return { ok: true, retryAfterSeconds: 0 };
}
