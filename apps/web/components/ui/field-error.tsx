'use client';

import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

interface FieldErrorProps {
  /** Error message to display */
  message?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * FieldError component - Displays validation errors for form fields
 *
 * Provides consistent error styling for form validation across the application.
 * Used below form fields to show validation messages.
 *
 * @example
 * ```tsx
 * <input {...register('email')} />
 * {errors.email && <FieldError message={errors.email.message} />}
 * ```
 */
export function FieldError({ message, className = '' }: FieldErrorProps) {
  if (!message) return null;

  return (
    <div
      className={cn('flex items-center gap-2 mt-1.5 text-sm text-red-400', className)}
      role="alert"
      aria-live="polite"
    >
      <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
      <span className="flex-1">{message}</span>
    </div>
  );
}

/**
 * FormError component - Displays form-level error messages
 *
 * Used for errors that apply to the entire form (e.g., API errors,
 * authentication failures) rather than individual fields.
 *
 * @example
 * ```tsx
 * <FormError message="Invalid credentials" />
 * ```
 */
export function FormError({
  message,
  className = '',
}: {
  message: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-md bg-red-500/10 p-3 text-sm text-red-400 border border-red-500/20',
        className
      )}
      role="alert"
      aria-live="polite"
      data-testid="form-error"
    >
      <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
      <span className="flex-1">{message}</span>
    </div>
  );
}
