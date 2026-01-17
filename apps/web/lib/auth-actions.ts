'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { isDemoMode } from './demo-session';

const DEMO_SESSION_COOKIE = 'modus_demo_session';

/**
 * Server action for demo mode login
 * This sets the cookie directly on the cookie store, which will be
 * available to subsequent requests including page navigations
 */
export async function demoLogin() {
  if (!isDemoMode()) {
    throw new Error('Demo mode not available');
  }

  const cookieStore = await cookies();
  cookieStore.set(DEMO_SESSION_COOKIE, 'active', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });

  redirect('/dashboard');
}

/**
 * Server action for demo mode login - to be used directly as form action
 * This is a wrapper that can be used directly with form's action prop
 */
export async function demoLoginAction(): Promise<void> {
  await demoLogin();
}

/**
 * Server action for logout
 * Clears the demo session cookie
 * The client should handle navigation to the login page
 */
export async function logout() {
  const cookieStore = await cookies();

  if (isDemoMode()) {
    // Demo mode: delete demo session cookie by setting maxAge to 0
    // Using set() instead of delete() for better browser compatibility
    cookieStore.set(DEMO_SESSION_COOKIE, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/',
    });
  }
}

/**
 * Server action to check if user is authenticated in demo mode
 * Returns true if authenticated, false otherwise
 */
export async function isAuthenticated() {
  if (!isDemoMode()) {
    return false;
  }

  const cookieStore = await cookies();
  const session = cookieStore.get(DEMO_SESSION_COOKIE);
  return session?.value === 'active';
}
