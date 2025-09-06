import type { Handle } from '@sveltejs/kit';

// Security headers configuration
const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co; frame-ancestors 'none';",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-XSS-Protection': '1; mode=block',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
};

// Rate limiting configuration
const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
};

// In-memory store for rate limiting (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limiting function
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowStart = now - rateLimitConfig.windowMs;
  
  const record = rateLimitStore.get(ip);
  
  if (!record || record.resetTime < windowStart) {
    // First request or window expired
    rateLimitStore.set(ip, { count: 1, resetTime: now });
    return true;
  }
  
  if (record.count >= rateLimitConfig.max) {
    return false; // Rate limit exceeded
  }
  
  // Increment count
  record.count++;
  return true;
}

// Clean up old rate limit records
setInterval(() => {
  const now = Date.now();
  const windowStart = now - rateLimitConfig.windowMs;
  
  for (const [ip, record] of rateLimitStore.entries()) {
    if (record.resetTime < windowStart) {
      rateLimitStore.delete(ip);
    }
  }
}, rateLimitConfig.windowMs);

export const handle: Handle = async ({ event, resolve }) => {
  // Get client IP (handle proxy forwarding)
  // Skip client address during prerendering
  let clientIP: string | undefined;
  try {
    clientIP = event.request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               event.request.headers.get('x-real-ip') ||
               event.getClientAddress();
  } catch (error) {
    // During prerendering, getClientAddress() is not available
    // This is expected and we can safely ignore it
    clientIP = undefined;
  }

  // Rate limiting for authentication endpoints
  const isAuthEndpoint = event.url.pathname.startsWith('/api/auth') || 
                        event.url.pathname.startsWith('/auth');
  
  if (isAuthEndpoint && clientIP) {
    if (!checkRateLimit(clientIP)) {
      return new Response(rateLimitConfig.message, {
        status: 429,
        headers: {
          'Content-Type': 'text/plain',
          'Retry-After': Math.ceil(rateLimitConfig.windowMs / 1000).toString()
        }
      });
    }
  }

  // Add security headers to all responses
  const response = await resolve(event);
  
  // Apply security headers
  for (const [header, value] of Object.entries(securityHeaders)) {
    response.headers.set(header, value);
  }

  // Add rate limit headers for auth endpoints
  if (isAuthEndpoint && clientIP) {
    const record = rateLimitStore.get(clientIP);
    if (record) {
      response.headers.set('X-RateLimit-Limit', rateLimitConfig.max.toString());
      response.headers.set('X-RateLimit-Remaining', Math.max(0, rateLimitConfig.max - record.count).toString());
      response.headers.set('X-RateLimit-Reset', new Date(record.resetTime + rateLimitConfig.windowMs).toISOString());
    }
  }

  return response;
};
