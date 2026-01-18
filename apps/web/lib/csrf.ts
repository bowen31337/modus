/**
 * CSRF Protection Utilities
 *
 * This module provides CSRF (Cross-Site Request Forgery) protection
 * for state-changing API endpoints.
 */

import { cookies } from 'next/headers';

const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * Generates a cryptographically random CSRF token.
 *
 * @returns Random CSRF token
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(CSRF_TOKEN_LENGTH);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Sets the CSRF token in an HTTP-only cookie.
 *
 * @param token - CSRF token to set
 */
export async function setCsrfCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  });
}

/**
 * Gets the CSRF token from cookies.
 *
 * @returns CSRF token or null
 */
export async function getCsrfToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(CSRF_COOKIE_NAME);
  return token?.value || null;
}

/**
 * Validates CSRF token from request headers against cookie.
 *
 * @param requestToken - Token from request headers
 * @returns true if valid, false otherwise
 */
export async function validateCsrfToken(requestToken?: string | null): Promise<boolean> {
  if (!requestToken) {
    return false;
  }

  const cookieToken = await getCsrfToken();

  if (!cookieToken) {
    return false;
  }

  // Use constant-time comparison to prevent timing attacks
  if (requestToken.length !== cookieToken.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < requestToken.length; i++) {
    result |= requestToken.charCodeAt(i) ^ cookieToken.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Initializes CSRF protection for a session.
 * Generates a new token if none exists.
 *
 * @returns CSRF token
 */
export async function initializeCsrf(): Promise<string> {
  let token = await getCsrfToken();

  if (!token) {
    token = generateCsrfToken();
    await setCsrfCookie(token);
  }

  return token;
}

/**
 * Middleware function to validate CSRF token for API routes.
 * Use this in state-changing endpoints (POST, PATCH, DELETE, PUT).
 *
 * @param request - Next.js Request object
 * @returns true if valid, throws error if invalid
 */
export async function requireCsrfProtection(request: Request): Promise<boolean> {
  const requestToken = request.headers.get(CSRF_HEADER_NAME);

  const isValid = await validateCsrfToken(requestToken);

  if (!isValid) {
    throw new Error('CSRF token validation failed');
  }

  return true;
}

/**
 * Checks if a request method requires CSRF protection.
 * State-changing methods require protection, safe methods do not.
 *
 * @param method - HTTP method
 * @returns true if CSRF protection is required
 */
export function requiresCsrfProtection(method: string): boolean {
  const stateChangingMethods = ['POST', 'PATCH', 'DELETE', 'PUT'];
  return stateChangingMethods.includes(method.toUpperCase());
}

/**
 * Response helper for CSRF validation errors.
 *
 * @returns Response object with 403 status
 */
export function csrfErrorResponse(): Response {
  return new Response(
    JSON.stringify({
      error: 'CSRF validation failed',
      message: 'Invalid or missing CSRF token. Please refresh the page and try again.',
    }),
    {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}
