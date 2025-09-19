import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client using the service role key. This client bypasses RLS
// and must only be used in trusted server contexts (never exposed to the browser).

const serviceUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!serviceUrl) {
  throw new Error('Missing SUPABASE_URL for server admin client');
}

if (!serviceRoleKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY for server admin client');
}

export const supabaseAdmin = createClient(serviceUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  db: {
    schema: 'public',
  },
});


