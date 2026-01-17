import { redirect } from 'next/navigation';
import { createServerSideClient } from '@/lib/supabase/server';
import { isDemoMode, hasDemoSession } from '@/lib/demo-session';
import DashboardClient from './dashboard-client';

export default async function DashboardPage() {
  // Check if Supabase is configured
  const isSupabaseConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (isSupabaseConfigured) {
    const supabase = await createServerSideClient();
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      redirect('/login');
    }
  } else {
    // Demo mode: check if authenticated
    const hasSession = await hasDemoSession();
    if (!hasSession) {
      redirect('/login');
    }
  }

  return <DashboardClient />;
}
