import { RulesManagement } from '@/features/rules/components/rules-management';
import { requireRole } from '@/lib/role-check';
import { createServerSideClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

export default async function RulesPage() {
  // Check if Supabase is configured
  const isSupabaseConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (isSupabaseConfigured) {
    const supabase = await createServerSideClient();
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      redirect('/login');
    }

    // Require admin role for rules management
    await requireRole('admin', '/dashboard');
  }
  // Demo mode: allow access without session cookie (consistent with layout.tsx)
  // In demo mode, authentication is not required for easier testing
  // Demo mode defaults to admin role for full access

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <RulesManagement />
    </div>
  );
}
