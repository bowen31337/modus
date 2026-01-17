import { redirect } from 'next/navigation';
import { createServerSideClient } from '@/lib/supabase/server';
import { hasDemoSession } from '@/lib/demo-session';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if Supabase is configured
  const isSupabaseConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (isSupabaseConfigured) {
    // Production mode: use Supabase auth
    const supabase = await createServerSideClient();
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      redirect('/login');
    }
  } else {
    // Demo mode: check for demo session cookie
    // In development mode, allow access without cookie for E2E testing
    // since Playwright has issues with localhost cookies
    if (process.env.NODE_ENV !== 'development') {
      const hasSession = await hasDemoSession();
      if (!hasSession) {
        redirect('/login');
      }
    }
  }

  return <>{children}</>;
}
