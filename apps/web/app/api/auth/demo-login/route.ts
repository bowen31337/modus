import { NextRequest, NextResponse } from 'next/server';
import { isDemoMode } from '@/lib/demo-session';

export async function POST(_request: NextRequest) {
  // Only allow in demo mode
  if (!isDemoMode()) {
    return NextResponse.json(
      { error: 'Demo mode not available' },
      { status: 403 }
    );
  }

  const response = NextResponse.json({ success: true }, { status: 200 });

  // Set demo session cookie
  response.cookies.set('modus_demo_session', 'active', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });

  return response;
}
