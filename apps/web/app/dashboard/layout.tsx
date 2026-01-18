import { redirect } from 'next/navigation';
import { createServerSideClient } from '@/lib/supabase/server';

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
    // Demo mode: allow access without session cookie
    // In demo mode, we don't require authentication for easier testing
    // The login flow is just for show to simulate a real authentication flow
  }

  return <>{children}</>;
}
