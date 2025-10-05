import { json, error, HttpError } from '@sveltejs/kit';
import { db } from '$lib/server/database.js';
import {
  hashPassword,
  validateEmail,
  validatePassword,
} from '$lib/server/auth.js';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  // Disable local auth API routes in production (use Supabase instead)
  if (process.env.NODE_ENV === 'production') {
    throw error(
      404,
      'Local authentication API disabled in production. Use Supabase authentication.'
    );
  }

  try {
    const { email, password, firstName, lastName } = await request.json();

    // Validate input
    if (!email || !password || !firstName || !lastName) {
      throw error(400, 'All fields are required');
    }

    // Check if user already exists
    const existingUser = await db.getUser(email);
    if (existingUser) {
      throw error(409, 'User already exists');
    }

    // Validate email format
    if (!validateEmail(email)) {
      throw error(400, 'Invalid email format');
    }

    // Validate password strength
    if (!validatePassword(password)) {
      throw error(
        400,
        'Password must be at least 8 characters with uppercase, lowercase, and number'
      );
    }

    // Hash password and create user
    const passwordHash = await hashPassword(password);
    const user = await db.createUser({
      email,
      passwordHash,
      firstName,
      lastName,
    });

    return json({
      success: true,
      message: 'User created successfully',
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
    console.error('Registration error:', err);
    throw error(500, 'Registration failed');
  }
}
