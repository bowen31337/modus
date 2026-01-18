'use client';

import { cn } from '@/lib/utils';

export type PostStatus = 'open' | 'in_progress' | 'resolved';

interface StatusBadgeProps {
  /** The status to display */
  status: PostStatus;
  /** Additional CSS classes */
  className?: string;
  /** Size variant */
  size?: 'xs' | 'sm' | 'md';
}

const statusConfig: Record<PostStatus, { bg: string; text: string; label: string }> = {
  open: {
    bg: 'bg-background-tertiary',
    text: 'text-foreground-secondary',
    label: 'Open',
  },
  in_progress: {
    bg: 'bg-primary-600',
    text: 'text-foreground font-semibold',
    label: 'In Progress',
  },
  resolved: {
    bg: 'bg-emerald-500/30',
    text: 'text-emerald-100 font-semibold',
    label: 'Resolved',
  },
};

const sizeConfig = {
  xs: 'text-[10px] px-1.5 py-0.5',
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-3 py-1',
};

/**
 * StatusBadge component - Displays post status with consistent styling
 *
 * A shared component for displaying post status (open, in_progress, resolved)
 * across the application. Ensures consistent visual design and typography.
 *
 * @example
 * ```tsx
 * <StatusBadge status="open" />
 * <StatusBadge status="in_progress" size="sm" />
 * <StatusBadge status="resolved" className="ml-2" />
 * ```
 */
export function StatusBadge({ status, className, size = 'xs' }: StatusBadgeProps) {
  const config = statusConfig[status];
  const sizeClass = sizeConfig[size];

  return (
    <span
      className={cn(
        'rounded font-medium whitespace-nowrap inline-flex items-center',
        'transition-all duration-150 hover:scale-105 active:scale-95',
        sizeClass,
        config.bg,
        config.text,
        className
      )}
      data-testid={`status-badge-${status}`}
      data-status={status}
    >
      {config.label}
    </span>
  );
}
