import { initializeCsrf } from '@/lib/csrf';
import { NextResponse } from 'next/server';

/**
 * GET /api/v1/auth/csrf
 *
 * Returns a CSRF token for the client to use in state-changing requests.
 * The token is also stored in an HTTP-only cookie for validation.
 */
export async function GET() {
  try {
    const token = await initializeCsrf();

    return NextResponse.json({
      data: {
        token,
        headerName: 'x-csrf-token',
      },
    });
  } catch (error) {
    console.error('Error generating CSRF token:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate CSRF token',
      },
      { status: 500 }
    );
  }
}
