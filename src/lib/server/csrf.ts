import { randomBytes, createHmac } from 'crypto';

export interface CSRFToken {
  token: string;
  expiresAt: number;
}

// In-memory store for CSRF tokens (in production, use Redis or database)
const csrfTokenStore = new Map<string, CSRFToken>();

// CSRF token configuration
const CSRF_CONFIG = {
  secret:
    process.env.CSRF_SECRET || 'your-csrf-secret-key-change-in-production',
  tokenLength: 32,
  expirationMs: 24 * 60 * 60 * 1000, // 24 hours
  cleanupInterval: 60 * 60 * 1000, // 1 hour
};

/**
 * Generate a new CSRF token
 */
export function generateCSRFToken(sessionId: string): string {
  const token = randomBytes(CSRF_CONFIG.tokenLength).toString('hex');
  const expiresAt = Date.now() + CSRF_CONFIG.expirationMs;

  // Store token with expiration
  csrfTokenStore.set(token, {
    token,
    expiresAt,
  });

  return token;
}

/**
 * Validate a CSRF token
 */
export function validateCSRFToken(token: string): boolean {
  const storedToken = csrfTokenStore.get(token);

  if (!storedToken) {
    return false;
  }

  // Check if token has expired
  if (Date.now() > storedToken.expiresAt) {
    csrfTokenStore.delete(token);
    return false;
  }

  return true;
}

/**
 * Invalidate a CSRF token (use after successful form submission)
 */
export function invalidateCSRFToken(token: string): void {
  csrfTokenStore.delete(token);
}

/**
 * Clean up expired tokens
 */
function cleanupExpiredTokens(): void {
  const now = Date.now();

  for (const [token, tokenData] of csrfTokenStore.entries()) {
    if (now > tokenData.expiresAt) {
      csrfTokenStore.delete(token);
    }
  }
}

// Set up periodic cleanup
setInterval(cleanupExpiredTokens, CSRF_CONFIG.cleanupInterval);

/**
 * Get CSRF token for a session
 */
export function getCSRFToken(sessionId: string): string {
  return generateCSRFToken(sessionId);
}

/**
 * Verify CSRF token from form submission
 */
export function verifyCSRFToken(token: string): {
  valid: boolean;
  error?: string;
} {
  if (!token) {
    return { valid: false, error: 'CSRF token is required' };
  }

  if (!validateCSRFToken(token)) {
    return { valid: false, error: 'Invalid or expired CSRF token' };
  }

  return { valid: true };
}
