import { dataStore } from '@/lib/data-store';
import { isDemoMode } from '@/lib/demo-session';
import { loginInputSchema, sessionSchema } from '@modus/logic';
import { type NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

/**
 * POST /api/v1/auth/login
 *
 * Authenticates a user and returns a session
 *
 * Request body:
 * {
 *   "email": string,
 *   "password": string
 * }
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
 *   },
 *   "message": "Login successful"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input
    const validatedInput = loginInputSchema.parse(body);

    // In demo mode, accept any email/password and return a demo session
    if (isDemoMode()) {
      // For demo purposes, we'll simulate authentication
      // In production, this would validate against Supabase Auth

      // Get first agent for demo
      const agents = dataStore.getAllAgents();
      const demoAgent = agents[0]; // Use first agent as demo user

      if (!demoAgent) {
        return NextResponse.json({ error: 'No demo agent available' }, { status: 500 });
      }

      // Create session data
      const sessionData = {
        agent_id: demoAgent.id,
        email: validatedInput.email,
        display_name: demoAgent.display_name,
        role: demoAgent.role,
        status: demoAgent.status,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      };

      // Validate session structure
      const validatedSession = sessionSchema.parse(sessionData);

      // Create response with session cookie
      const response = NextResponse.json(
        {
          data: validatedSession,
          message: 'Login successful',
        },
        { status: 200 }
      );

      // Set session cookie
      response.cookies.set('modus_session', JSON.stringify(validatedSession), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/',
      });

      // Also set demo session cookie for compatibility
      response.cookies.set('modus_demo_session', 'active', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/',
      });

      return response;
    }

    // Production mode would integrate with Supabase Auth here
    return NextResponse.json({ error: 'Supabase Auth not configured' }, { status: 501 });
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    // Handle other errors
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
