import { NextRequest, NextResponse } from 'next/server';
import { isDemoMode } from '@/lib/demo-session';
import { sessionSchema } from '@modus/logic';

/**
 * GET /api/v1/auth/session
 *
 * Returns the current session if authenticated
 *
 * Response (200):
 * {
 *   "data": {
 *     "agent_id": string,
 *     "email": string,
 *     "display_name": string,
 *     "role": string,
 *     "status": string,
 *     "expires_at": string
 *   }
 * }
 *
 * Response (401): No active session
 */
export async function GET(request: NextRequest) {
  try {
    // Check for session cookie
    const sessionCookie = request.cookies.get('modus_session');

    // Check for demo session cookie (for backward compatibility)
    const demoSessionCookie = request.cookies.get('modus_demo_session');

    if (!sessionCookie && !demoSessionCookie) {
      return NextResponse.json(
        { error: 'No active session' },
        { status: 401 }
      );
    }

    // If we have a proper session cookie, parse and validate it
    if (sessionCookie) {
      try {
        const sessionData = JSON.parse(sessionCookie.value);
        const validatedSession = sessionSchema.parse(sessionData);

        return NextResponse.json(
          {
            data: validatedSession,
          },
          { status: 200 }
        );
      } catch (parseError) {
        // Session cookie is invalid
        console.error('Invalid session cookie:', parseError);
        return NextResponse.json(
          { error: 'Invalid session' },
          { status: 401 }
        );
      }
    }

    // If we only have demo session cookie, return demo session info
    if (demoSessionCookie && isDemoMode()) {
      // Return a basic demo session
      const demoSession = {
        agent_id: 'demo-agent',
        email: 'demo@modus.app',
        display_name: 'Demo Agent',
        role: 'admin',
        status: 'online',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      return NextResponse.json(
        {
          data: demoSession,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: 'No active session' },
      { status: 401 }
    );

  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
