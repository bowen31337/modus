import { type CookieOptions, createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Set Content Security Policy headers
  // Using a strict policy that allows only necessary resources
  const cspHeader = [
    // Default sources - allow self
    "default-src 'self'",
    // Scripts - allow self and inline for React/Next.js runtime
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // 'unsafe-inline' needed for Next.js HMR, 'unsafe-eval' for webpack
    // Styles - allow self and inline for Tailwind
    "style-src 'self' 'unsafe-inline'",
    // Images - allow self and data URIs for avatars
    "img-src 'self' data: https:",
    // Fonts - allow self and common font CDNs
    "font-src 'self' data:",
    // Connect - allow self for API calls
    "connect-src 'self'",
    // Frames - none (no iframes)
    "frame-src 'none'",
    // Media - none (no audio/video)
    "media-src 'none'",
    // Object - none (no plugins)
    "object-src 'none'",
    // Base URI - allow self
    "base-uri 'self'",
    // Form actions - allow self
    "form-action 'self'",
    // Upgrade insecure requests in production
    'upgrade-insecure-requests',
    // Block mixed content
    'block-all-mixed-content',
  ].join('; ');

  // Add CSP header (lowercase for Next.js compatibility)
  response.headers.set('content-security-policy', cspHeader);

  // Additional security headers
  response.headers.set('x-frame-options', 'DENY');
  response.headers.set('x-content-type-options', 'nosniff');
  response.headers.set('referrer-policy', 'strict-origin-when-cross-origin');
  response.headers.set('permissions-policy', 'camera=(), microphone=(), geolocation=()');

  // Skip Supabase auth if environment variables are not configured
  // This allows the app to run in a demo/development mode without Supabase
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // Refresh session if expired
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|ico)$).*)',
  ],
};
