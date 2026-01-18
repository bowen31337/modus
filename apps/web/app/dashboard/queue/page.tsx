import { redirect } from 'next/navigation';
import { createServerSideClient } from '@/lib/supabase/server';

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
  }
  // Demo mode: allow access without session cookie (consistent with layout.tsx)

  // Redirect to main dashboard since queue is a client-side filter
  redirect('/dashboard');
}
