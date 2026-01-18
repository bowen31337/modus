'use client';

import { FieldError, FormError } from '@/components/ui/field-error';
import { demoLoginAction } from '@/lib/auth-actions';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@modus/ui';
import { Input } from '@modus/ui';
import { Loader2, LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'all',
  });

  // Check if Supabase is configured
  const isSupabaseConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      router.push('/dashboard');
    } catch (_err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // For demo mode, use a form with server action for proper cookie handling
  // demoLoginAction is a server action that handles the redirect directly
  if (!isSupabaseConfigured) {
    const handleDemoLogin = demoLoginAction;

    return (
      <form action={handleDemoLogin} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-foreground">
            Email
          </label>
          <Input
            id="email"
            type="text"
            placeholder="agent@example.com"
            autoComplete="email"
            name="email"
            className="bg-background-tertiary border-border hover:border-border/80 focus:border-primary focus:ring-primary/20 transition-colors"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-foreground">
            Password
          </label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            name="password"
            className="bg-background-tertiary border-border hover:border-border/80 focus:border-primary focus:ring-primary/20 transition-colors"
          />
        </div>

        {error && <FormError message={error} />}

        <Button
          type="submit"
          className="w-full h-11 text-sm font-medium bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30"
        >
          <LogIn size={16} className="mr-2" />
          Sign In
        </Button>

        {/* Demo mode hint */}
        <div className="pt-2 text-center">
          <p className="text-xs text-muted-foreground">
            Demo mode: Use any email/password combination
          </p>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium text-foreground">
          Email
        </label>
        <Input
          id="email"
          type="email"
          placeholder="agent@example.com"
          autoComplete="email"
          {...register('email')}
          className={cn(
            'bg-background-tertiary border-border hover:border-border/80 transition-colors',
            errors.email
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
              : 'focus:border-primary focus:ring-primary/20'
          )}
        />
        <FieldError message={errors.email?.message} />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium text-foreground">
          Password
        </label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          {...register('password')}
          className={cn(
            'bg-background-tertiary border-border hover:border-border/80 transition-colors',
            errors.password
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
              : 'focus:border-primary focus:ring-primary/20'
          )}
        />
        <FieldError message={errors.password?.message} />
      </div>

      {error && <FormError message={error} />}

      <Button
        type="submit"
        disabled={loading}
        className="w-full h-11 text-sm font-medium bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30"
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin mr-2" data-testid="loading-spinner" />
            Signing in...
          </>
        ) : (
          <>
            <LogIn size={16} className="mr-2" />
            Sign In
          </>
        )}
      </Button>
    </form>
  );
}
