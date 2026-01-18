import { LoginForm } from '@/features/auth/components/login-form';
import { hasDemoSession, isDemoMode } from '@/lib/demo-session';
import { createServerSideClient } from '@/lib/supabase/server';
import { Shield } from 'lucide-react';
import { redirect } from 'next/navigation';

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
  } else {
    // Demo mode: check if already logged in
    const hasSession = await hasDemoSession();
    if (hasSession) {
      redirect('/dashboard');
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-background">
      {/* Background gradient for visual depth */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        data-testid="gradient-container"
      >
        <div
          className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl"
          data-testid="gradient-top"
        />
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl"
          data-testid="gradient-bottom"
        />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card container with subtle border and shadow */}
        <div
          className="bg-background-secondary/80 backdrop-blur-sm border border-border rounded-2xl shadow-xl p-8"
          data-testid="login-card"
        >
          {/* Logo and branding */}
          <div className="text-center mb-6">
            <div
              className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4"
              data-testid="shield-icon"
            >
              <Shield size={28} className="text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              m<span className="text-primary">.</span>
            </h1>
            <p className="text-sm text-foreground-secondary mt-2">Sign in to your account</p>
          </div>

          {/* Login form */}
          <LoginForm />

          {/* Demo mode indicator */}
          {isDemoMode() && (
            <div className="mt-6 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-background-tertiary rounded-full border border-border">
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <span className="text-xs text-foreground-muted">Demo Mode Active</span>
              </div>
            </div>
          )}

          {/* Security note */}
          <div className="text-center text-xs text-foreground-muted mt-4 space-y-1">
            <p>
              {isDemoMode()
                ? 'Supabase not configured - using demo authentication'
                : 'Secure authentication with Supabase'}
            </p>
            <p className="text-[10px] text-foreground-muted/70">Enterprise-grade security</p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-foreground-muted mt-4">
          Your data is encrypted and secure
        </p>
      </div>
    </main>
  );
}
