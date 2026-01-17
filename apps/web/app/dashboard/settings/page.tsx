import { redirect } from 'next/navigation';
import { createServerSideClient } from '@/lib/supabase/server';
import { isDemoMode, hasDemoSession } from '@/lib/demo-session';
import SettingsClient from './settings-client';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
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

  return <SettingsClient />;
}
