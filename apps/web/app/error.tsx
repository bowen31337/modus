'use client';

import { AlertCircle, Home, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-background">
      <div className="text-center space-y-6 max-w-lg">
        {/* Error icon with consistent styling */}
        <div className="flex justify-center">
          <div className="rounded-full bg-red-500/10 p-6">
            <AlertCircle className="h-16 w-16 text-red-500" aria-hidden="true" />
          </div>
        </div>

        {/* Error heading */}
        <h1 className="text-5xl font-bold text-foreground">Something went wrong</h1>

        {/* Error message */}
        <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
          An unexpected error occurred. Don't worry, your work is safe. You can try refreshing the
          page or go back to the dashboard.
        </p>

        {/* Error details (in development) */}
        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="mx-auto max-w-md rounded-md bg-background-tertiary border border-border/60 p-4 text-left">
            <p className="text-xs font-mono text-red-400 break-words">{error.message}</p>
            {error.digest && (
              <p className="text-xs font-mono text-muted-foreground/60 mt-2">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-3 pt-4">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-all duration-150 active:scale-95 font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
            type="button"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Try Again
          </button>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-background-tertiary text-foreground rounded-md hover:bg-background-tertiary/80 transition-all duration-150 active:scale-95 font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background border border-border/60"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            Dashboard
          </Link>
        </div>

        {/* Additional help text */}
        <p className="text-xs text-muted-foreground/60 pt-4">
          If this problem persists, please contact your system administrator with the error details
          above
        </p>
      </div>
    </main>
  );
}
