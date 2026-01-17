'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
  /** Error message to display */
  message?: string;
  /** Optional detailed error description */
  details?: string;
  /** Callback when retry is clicked */
  onRetry?: () => void;
  /** Whether to show retry button */
  showRetry?: boolean;
  /** Custom retry button text */
  retryText?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * ErrorState component - Displays user-friendly error messages
 *
 * Used throughout the app to show error states when API calls fail.
 * Provides consistent error messaging with optional retry functionality.
 *
 * @example
 * ```tsx
 * <ErrorState
 *   message="Failed to load posts"
 *   details="Please check your connection and try again"
 *   onRetry={() => fetchPosts()}
 *   showRetry
 * />
 * ```
 */
export function ErrorState({
  message = 'Something went wrong',
  details,
  onRetry,
  showRetry = true,
  retryText = 'Try Again',
  className = '',
}: ErrorStateProps) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center p-8 text-center', className)}
      role="alert"
      aria-live="polite"
    >
      {/* Error icon */}
      <div className="mb-4 rounded-full bg-red-500/10 p-4">
        <AlertCircle className="h-8 w-8 text-red-500" aria-hidden="true" />
      </div>

      {/* Error message */}
      <h3 className="mb-2 text-lg font-semibold text-white">{message}</h3>

      {/* Error details */}
      {details && (
        <p className="mb-6 max-w-md text-sm text-slate-400">{details}</p>
      )}

      {/* Retry button */}
      {showRetry && onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-background"
          type="button"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          {retryText}
        </button>
      )}
    </div>
  );
}

/**
 * Inline error state for smaller containers
 */
export function InlineError({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      className="flex items-center gap-3 rounded-md bg-red-500/10 p-4 text-red-400"
      role="alert"
      aria-live="polite"
    >
      <AlertCircle className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
      <p className="flex-1 text-sm">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex-shrink-0 text-sm font-medium text-red-400 underline hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-background rounded"
          type="button"
        >
          Retry
        </button>
      )}
    </div>
  );
}
