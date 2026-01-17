import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const DEMO_SESSION_COOKIE = 'modus_demo_session';

/**
 * Check if demo mode is active (Supabase not configured)
 */
export function isDemoMode(): boolean {
  return !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

/**
 * Check if there's an active demo session
 */
export async function hasDemoSession(): Promise<boolean> {
  if (!isDemoMode()) return false;

  const cookieStore = await cookies();
  const session = cookieStore.get(DEMO_SESSION_COOKIE);
  return session?.value === 'active';
}

/**
 * Create a demo session (called after login)
 */
export async function createDemoSession(): Promise<void> {
  if (!isDemoMode()) return;

  const cookieStore = await cookies();
  cookieStore.set(DEMO_SESSION_COOKIE, 'active', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });
}

/**
 * Destroy the demo session (called on logout)
 */
export async function destroyDemoSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(DEMO_SESSION_COOKIE);
}

/**
 * Require demo session - redirect to login if not authenticated
 */
export async function requireDemoSession(): Promise<void> {
  if (!isDemoMode()) return;

  const hasSession = await hasDemoSession();
  if (!hasSession) {
    redirect('/login');
  }
}
