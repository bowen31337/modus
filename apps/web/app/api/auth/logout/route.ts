import { NextRequest, NextResponse } from 'next/server';
import { isDemoMode } from '@/lib/demo-session';
import { createServerSideClient } from '@/lib/supabase/server';

export async function POST(_request: NextRequest) {
  const isSupabaseConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const response = NextResponse.json({ success: true }, { status: 200 });

  if (isSupabaseConfigured) {
    // Production mode: sign out from Supabase
    const supabase = await createServerSideClient();
    await supabase.auth.signOut();
  } else if (isDemoMode()) {
    // Demo mode: clear demo session cookie
    response.cookies.delete('modus_demo_session');
  }

  // Redirect to login
  response.headers.set('Location', '/login');

  return response;
}
