'use client';

import * as React from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { cn } from '@/lib/utils';

// Toast types
export type ToastType = 'success' | 'error' | 'info' | 'warning';

// Toast variant configurations
const toastVariants = {
  success: {
    icon: CheckCircle,
    iconColor: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
  },
  error: {
    icon: AlertCircle,
    iconColor: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
  },
  info: {
    icon: Info,
    iconColor: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
  },
} as const;

// Toast props
interface ToastProps {
  id: string;
  title?: string;
  description?: string;
  type?: ToastType;
  duration?: number;
  onDismiss?: (id: string) => void;
}

// Toast component
const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Root>,
  ToastProps
>(({ id, title, description, type = 'info', onDismiss }, ref) => {
  const variant = toastVariants[type];
  const Icon = variant.icon;

  return (
    <ToastPrimitive.Root
      ref={ref as React.Ref<HTMLLIElement>}
      className={cn(
        // Layout and positioning
        'pointer-events-auto relative flex w-full items-start gap-3 rounded-lg border p-4',
        // Background and border (subtle layering)
        'bg-background-secondary',
        variant.bg,
        variant.border,
        // Smooth transitions
        'transition-all duration-150',
        // Swipe animations
        'data-[swipe=cancel]:translate-x-0 data-[swipe=cancel]:opacity-100',
        'data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=end]:opacity-0',
        'data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none',
      )}
      data-testid={`toast-${type}`}
      data-toast-type={type}
    >
      <Icon className={cn('h-4.5 w-4.5 flex-shrink-0 mt-0.5', variant.iconColor)} />
      <div className="flex-1 space-y-1.5 min-w-0">
        {title && (
          <ToastPrimitive.Title className="text-sm font-semibold text-foreground leading-tight">
            {title}
          </ToastPrimitive.Title>
        )}
        {description && (
          <ToastPrimitive.Description className="text-sm text-foreground-secondary leading-tight">
            {description}
          </ToastPrimitive.Description>
        )}
      </div>
      <ToastPrimitive.Close
        asChild
        onClick={() => onDismiss?.(id)}
        className="ml-auto flex-shrink-0"
      >
        <button
          className="rounded-md p-1 hover:bg-background-tertiary transition-all duration-150 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/50"
          aria-label="Close notification"
        >
          <X size={14} className="text-muted-foreground" />
        </button>
      </ToastPrimitive.Close>
    </ToastPrimitive.Root>
  );
});
Toast.displayName = ToastPrimitive.Root.displayName;

// Toast viewport
const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    className={cn(
      // Positioning - top-right corner with breathing room
      'fixed top-4 right-4 z-[100]',
      // Layout - stack toasts vertically
      'flex max-w-sm flex-col gap-2',
      // Padding for viewport bounds
      'p-4',
      // Focus handling
      'focus:outline-none',
      className,
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitive.Viewport.displayName;

// Toast provider
interface ToastProviderProps {
  children: React.ReactNode;
  duration?: number;
}

function ToastProvider({ children, duration = 5000 }: ToastProviderProps) {
  return (
    <ToastPrimitive.Provider duration={duration}>
      {children}
      <ToastViewport />
    </ToastPrimitive.Provider>
  );
}

// Toast promise helper
interface ToastPromiseOptions {
  loading: string;
  success: string;
  error: string;
}

async function toastPromise<T>(
  promise: Promise<T>,
  options: ToastPromiseOptions,
  toast: (toast: Omit<ToastProps, 'id'>) => void,
): Promise<T> {
  toast({
    title: options.loading,
    type: 'info',
  });

  try {
    const result = await promise;
    toast({
      title: options.success,
      type: 'success',
    });
    return result;
  } catch (error) {
    toast({
      title: options.error,
      type: 'error',
    });
    throw error;
  }
}

export {
  Toast,
  ToastViewport,
  ToastProvider,
  toastPromise,
  toastVariants,
};
export type { ToastProps };
export { ToastPrimitive as ToastRoot };
