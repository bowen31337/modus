import { createBrowserClient } from '@supabase/ssr';

/**
 * Creates a Supabase client for browser-side operations.
 * This client is used for authentication and real-time data fetching.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set in environment variables'
    );
  }

  return createBrowserClient(url, anonKey);
}
