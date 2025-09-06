import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Get JWT secret from environment
const JWT_SECRET = (process.env.JWT_SECRET ||
  'your_jwt_secret_key_minimum_32_characters') as string;

import { db } from './database.js';

// Password utilities
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

// JWT utilities
export function generateToken(payload: any, expiresIn: string = '7d'): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Session utilities
export async function createUserSession(userId: string, request: Request) {
  const sessionToken = generateToken({ userId }, '7d');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const ipAddress =
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  await db.createSession(userId, sessionToken, expiresAt, ipAddress, userAgent);

  return {
    sessionToken,
    expiresAt,
  };
}

export async function getUserFromSession(sessionToken: string) {
  if (!sessionToken) return null;

  try {
    const session = await db.getSession(sessionToken);
    if (!session) return null;

    return {
      id: session.user_id,
      email: session.email,
      firstName: session.first_name,
      lastName: session.last_name,
    };
  } catch (error) {
    console.error('Session validation error:', error);
    return null;
  }
}

// Validation utilities
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): boolean {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password)
  );
}

// Auth middleware for protecting routes
export async function requireAuth(request: Request) {
  const sessionToken = request.headers
    .get('cookie')
    ?.match(/session_token=([^;]+)/)?.[1];
  const user = await getUserFromSession(sessionToken || '');

  if (!user) {
    throw new Error('Authentication required');
  }

  return user;
}
