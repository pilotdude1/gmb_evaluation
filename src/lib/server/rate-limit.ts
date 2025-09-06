// Rate limiting utility for authentication and API endpoints
export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (request: Request) => string;
}

export interface RateLimitRecord {
  count: number;
  resetTime: number;
}

export class RateLimiter {
  private store: Map<string, RateLimitRecord>;
  private config: RateLimitConfig;
  private cleanupInterval: NodeJS.Timeout;

  constructor(config: RateLimitConfig) {
    this.store = new Map();
    this.config = {
      message: 'Too many requests, please try again later.',
      keyGenerator: (request: Request) => {
        // Default key generator uses IP address
        const forwarded = request.headers.get('x-forwarded-for');
        const realIP = request.headers.get('x-real-ip');
        return forwarded?.split(',')[0]?.trim() || realIP || 'unknown';
      },
      ...config
    };

    // Clean up old records periodically
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.config.windowMs);
  }

  /**
   * Check if a request is within rate limits
   */
  check(request: Request): { allowed: boolean; remaining: number; resetTime: number } {
    const key = this.config.keyGenerator!(request);
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    const record = this.store.get(key);

    if (!record || record.resetTime < windowStart) {
      // First request or window expired
      const newRecord: RateLimitRecord = { count: 1, resetTime: now };
      this.store.set(key, newRecord);
      return {
        allowed: true,
        remaining: this.config.max - 1,
        resetTime: now + this.config.windowMs
      };
    }

    if (record.count >= this.config.max) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: record.resetTime + this.config.windowMs
      };
    }

    // Increment count
    record.count++;
    return {
      allowed: true,
      remaining: this.config.max - record.count,
      resetTime: record.resetTime + this.config.windowMs
    };
  }

  /**
   * Get rate limit headers for a request
   */
  getHeaders(request: Request): Record<string, string> {
    const result = this.check(request);
    return {
      'X-RateLimit-Limit': this.config.max.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': new Date(result.resetTime).toISOString()
    };
  }

  /**
   * Clean up expired records
   */
  private cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    for (const [key, record] of this.store.entries()) {
      if (record.resetTime < windowStart) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Destroy the rate limiter and clean up resources
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

// Pre-configured rate limiters for different use cases
export const authRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes for auth endpoints
  message: 'Too many authentication attempts, please try again later.'
});

export const apiRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes for API endpoints
  message: 'Too many API requests, please try again later.'
});

export const generalRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per 15 minutes for general endpoints
  message: 'Too many requests, please try again later.'
});
