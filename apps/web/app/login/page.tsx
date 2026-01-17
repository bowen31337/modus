import { redirect } from 'next/navigation';
import { createServerSideClient } from '@/lib/supabase/server';
import { LoginForm } from '@/features/auth/components/login-form';

export default async function LoginPage() {
  // Check if Supabase is configured
  const isSupabaseConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (isSupabaseConfigured) {
    const supabase = await createServerSideClient();
    const { data } = await supabase.auth.getUser();

    if (data.user) {
      redirect('/dashboard');
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            m<span className="text-primary">.</span>
          </h1>
          <p className="text-foreground-secondary">Sign in to your account</p>
          <p className="text-sm text-foreground-muted">
            Enter your credentials to access the moderation dashboard
          </p>
        </div>
        <LoginForm />
        <p className="text-center text-xs text-foreground-muted">
          {isSupabaseConfigured ? 'Protected by Supabase Auth' : 'Demo Mode - Supabase not configured'}
        </p>
      </div>
    </main>
  );
}
