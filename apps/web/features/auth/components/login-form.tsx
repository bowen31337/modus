'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@modus/ui';
import { Input } from '@modus/ui';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { demoLogin } from '@/lib/auth-actions';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
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
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // For demo mode, use server action for proper cookie handling
  // The server action handles the redirect directly
  const handleDemoSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      await demoLogin();
      // Server action should redirect, but if it doesn't (e.g., in tests),
      // navigate manually after a short delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 100);
    } catch (error: any) {
      // Check if this is a NEXT_REDIRECT error (which is expected)
      if (error?.message?.includes('NEXT_REDIRECT') || error?.digest?.includes('NEXT_REDIRECT')) {
        // The redirect is handled by Next.js, don't show error
        // Re-throw to let Next.js handle the redirect
        throw error;
      }
      setError('Failed to create demo session');
      setLoading(false);
    }
  };

  // For demo mode, use a form with server action for proper cookie handling
  if (!isSupabaseConfigured) {
    return (
      <form action={handleDemoSubmit} className="space-y-4">
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
          />
        </div>

        {error && (
          <div className="rounded-md bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
        />
        {errors.email && (
          <p className="text-xs text-red-400">{errors.email.message}</p>
        )}
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
        />
        {errors.password && (
          <p className="text-xs text-red-400">{errors.password.message}</p>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Signing in...' : 'Sign In'}
      </Button>
    </form>
  );
}
