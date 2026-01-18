import { createServerSideClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { RulesManagement } from '@/features/rules/components/rules-management';

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
  }
  // Demo mode: allow access without session cookie (consistent with layout.tsx)
  // In demo mode, authentication is not required for easier testing

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <RulesManagement />
    </div>
  );
}
