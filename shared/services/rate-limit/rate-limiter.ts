export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterMs: number;
}

interface RequestRecord {
  timestamps: number[];
}

export class RateLimiter {
  private readonly records = new Map<string, RequestRecord>();
  private readonly config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  check(key: string, now: number = Date.now()): RateLimitResult {
    const record = this.records.get(key) ?? { timestamps: [] };
    const windowStart = now - this.config.windowMs;

    record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

    const remaining = Math.max(0, this.config.maxRequests - record.timestamps.length);
    const allowed = record.timestamps.length < this.config.maxRequests;

    if (allowed) {
      record.timestamps.push(now);
    }

    this.records.set(key, record);

    const oldest = record.timestamps[0] ?? now;
    const resetAt = oldest + this.config.windowMs;
    const retryAfterMs = allowed ? 0 : Math.max(0, resetAt - now);

    return { allowed, remaining: allowed ? remaining - 1 : 0, resetAt, retryAfterMs };
  }

  reset(key: string): void {
    this.records.delete(key);
  }

  clear(): void {
    this.records.clear();
  }
}

export const apiRateLimiter = new RateLimiter({
  maxRequests: 60,
  windowMs: 60_000,
});

export const aiRateLimiter = new RateLimiter({
  maxRequests: 10,
  windowMs: 60_000,
});

export async function waitForRateLimit(retryAfterMs: number): Promise<void> {
  if (retryAfterMs <= 0) return;
  await new Promise<void>((resolve) => setTimeout(resolve, retryAfterMs));
}
