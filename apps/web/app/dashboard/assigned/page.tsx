import { createServerSideClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

export default async function AssignedPage() {
  // Check if Supabase is configured
  const isSupabaseConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (isSupabaseConfigured) {
    const supabase = await createServerSideClient();
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      redirect('/login');
    }
  }
  // Demo mode: allow access without session cookie (consistent with layout.tsx)

  // Redirect to main dashboard since assigned is a client-side filter
  redirect('/dashboard');
}
