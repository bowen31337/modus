import { redirect } from 'next/navigation';
import { createServerSideClient } from '@/lib/supabase/server';
import { isDemoMode, hasDemoSession } from '@/lib/demo-session';

export default async function QueuePage() {
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
    const hasSession = await hasDemoSession();
    if (!hasSession) {
      redirect('/login');
    }
  }

  // Redirect to main dashboard since queue is a client-side filter
  redirect('/dashboard');
}
