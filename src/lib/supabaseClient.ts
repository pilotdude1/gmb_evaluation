import { createClient } from '@supabase/supabase-js';
import type { User, Session, AuthError } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables with enhanced security
if (!supabaseUrl || !supabaseAnonKey) {
  const errorMessage =
    'Missing Supabase environment variables. Please check your .env file.';
  console.error(errorMessage);

  // In production, fail fast and hard
  if (import.meta.env.PROD) {
    throw new Error(errorMessage);
  }

  // In development, provide helpful guidance
  console.warn(
    'Development mode: Using placeholder values. Set up your .env file for full functionality.'
  );
}

// Additional security validation for production
if (import.meta.env.PROD) {
  // Validate URL format
  try {
    new URL(supabaseUrl || '');
  } catch {
    throw new Error('Invalid VITE_SUPABASE_URL format');
  }

  // Validate key format (basic check)
  if (!supabaseAnonKey || supabaseAnonKey.length < 50) {
    throw new Error('Invalid VITE_SUPABASE_ANON_KEY format');
  }
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      // Enhanced security settings
      flowType: 'pkce', // Use PKCE flow for better security
      debug: import.meta.env.DEV, // Only enable debug in development
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'X-Client-Info': 'saas-template/1.0.0',
      },
    },
    // Security-focused configuration
    realtime: {
      params: {
        eventsPerSecond: 10, // Limit realtime events
      },
    },
  }
);

// Enhanced authentication utility functions with security features
export const authUtils = {
  /**
   * Validate email format with enhanced security
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254; // RFC 5321 limit
  },

  /**
   * Validate password strength
   */
  validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return { valid: errors.length === 0, errors };
  },

  /**
   * Sanitize user input
   */
  sanitizeInput(input: string): string {
    return input.trim().replace(/[<>]/g, ''); // Basic XSS prevention
  },
  /**
   * Sign in with email and password (enhanced security)
   */
  async signInWithPassword(email: string, password: string) {
    try {
      // Input validation and sanitization
      const sanitizedEmail = this.sanitizeInput(email);

      if (!this.validateEmail(sanitizedEmail)) {
        return {
          data: null,
          error: {
            message: 'Invalid email format.',
          } as AuthError,
        };
      }

      // Rate limiting check (this would be handled by the server middleware)
      const { data, error } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password,
      });

      if (error) {
        // Don't log sensitive information in production
        if (import.meta.env.PROD) {
          console.error('Sign in error:', error.message);
        } else {
          console.error('Sign in error:', error);
        }
        return { data: null, error };
      }

      // Log successful sign in (without sensitive data)
      if (import.meta.env.PROD) {
        console.log('Sign in successful for user:', data.user?.id);
      } else {
        console.log('Sign in successful:', data.user?.email);
      }

      return { data, error: null };
    } catch (error) {
      console.error('Unexpected sign in error:', error);
      return {
        data: null,
        error: {
          message: 'An unexpected error occurred during sign in.',
        } as AuthError,
      };
    }
  },

  /**
   * Sign out the current user
   */
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Sign out error:', error);
        return { error };
      }

      console.log('Sign out successful');
      return { error: null };
    } catch (error) {
      console.error('Unexpected sign out error:', error);
      return {
        error: {
          message: 'An unexpected error occurred during sign out.',
        } as AuthError,
      };
    }
  },

  /**
   * Get the current session
   */
  async getSession() {
    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Get session error:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Unexpected get session error:', error);
      return {
        data: null,
        error: {
          message: 'An unexpected error occurred while getting session.',
        } as AuthError,
      };
    }
  },

  /**
   * Get the current user
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.error('Get user error:', error);
        return null;
      }

      return user;
    } catch (error) {
      console.error('Unexpected get user error:', error);
      return null;
    }
  },

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(
    callback: (event: string, session: Session | null) => void
  ) {
    return supabase.auth.onAuthStateChange(callback);
  },
};

// Export types for use in components
export type { User, Session, AuthError };
