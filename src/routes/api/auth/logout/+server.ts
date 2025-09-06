import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/database.js';

/** @type {import('./$types').RequestHandler} */
export async function POST({ cookies }) {
  // Disable local auth API routes in production (use Supabase instead)
  if (process.env.NODE_ENV === 'production') {
    throw error(
      404,
      'Local authentication API disabled in production. Use Supabase authentication.'
    );
  }
  const sessionToken = cookies.get('session_token');

  if (sessionToken) {
    // Delete session from database
    await db.deleteSession(sessionToken);
  }

  // Clear session cookie
  cookies.delete('session_token', { path: '/' });

  return json({ success: true });
}
