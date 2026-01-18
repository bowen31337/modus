import { createBrowserClient } from '@supabase/ssr';

/**
 * Creates a Supabase client for browser-side operations.
 * This client is used for authentication and real-time data fetching.
 * Returns null in demo mode when Supabase is not configured.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    // In demo mode, return null instead of throwing
    // The calling code should handle null client appropriately
    return null;
  }

  return createBrowserClient(url, anonKey);
}

/**
 * Checks if Supabase is properly configured.
 * Returns false in demo mode.
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !!url && !!anonKey;
}
