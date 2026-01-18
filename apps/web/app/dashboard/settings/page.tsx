import { getCurrentUser, getCurrentUserRole } from '@/lib/role-check';
import { createServerSideClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
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
  }
  // Demo mode: allow access without session cookie (consistent with layout.tsx)

  // Get user role for role-based access control
  const userRole = await getCurrentUserRole();
  const currentUser = await getCurrentUser();

  return <SettingsClient userRole={userRole} currentUser={currentUser} />;
}
