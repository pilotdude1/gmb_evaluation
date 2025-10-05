import { json, error, HttpError } from '@sveltejs/kit';
import { db } from '$lib/server/database.js';
import { verifyPassword, createUserSession } from '$lib/server/auth.js';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, cookies }) {
  // Disable local auth API routes in production (use Supabase instead)
  if (process.env.NODE_ENV === 'production') {
    throw error(404, 'Local authentication API disabled in production. Use Supabase authentication.');
  }
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      throw error(400, 'Email and password are required');
    }

    // Get user from database
    const user = await db.getUser(email);
    if (!user) {
      throw error(401, 'Invalid credentials');
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      throw error(401, 'Invalid credentials');
    }

    // Create session
    const { sessionToken, expiresAt } = await createUserSession(
      user.id,
      request
    );

    // Update last login
    await db.updateLastLogin(user.id);

    // Set session cookie
    cookies.set('session_token', sessionToken, {
      path: '/',
      expires: expiresAt,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    return json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
      },
    });
  } catch (err) {
    if (err instanceof HttpError) {
      throw err;
    }
    console.error('Login error:', err);
    throw error(500, 'Login failed');
  }
}
