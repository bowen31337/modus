'use client';

/**
 * Avatar Component
 *
 * A reusable avatar component with consistent circular styling.
 * Supports image avatars, fallback initials, and placeholder icons.
 */

import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface AvatarProps {
  /** URL of the avatar image */
  src?: string | null;
  /** Alt text for the avatar image */
  alt?: string;
  /** Display name for fallback initials */
  name?: string;
  /** Size of the avatar */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /** Additional CSS classes */
  className?: string;
  /** Show border ring around avatar */
  withBorder?: boolean;
  /** Show status indicator */
  status?: 'online' | 'offline' | 'busy' | null;
}

// ============================================================================
// Constants
// ============================================================================

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl',
  '2xl': 'w-24 h-24 text-2xl',
};

const statusColors = {
  online: 'bg-emerald-500',
  offline: 'bg-muted-foreground',
  busy: 'bg-orange-500',
};

// ============================================================================
// Component
// ============================================================================

export function Avatar({
  src,
  alt,
  name,
  size = 'md',
  className,
  withBorder = true,
  status = null,
}: AvatarProps) {
  const initials = name
    ?.split(' ')
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const baseClasses = cn(
    'rounded-full bg-background-tertiary flex items-center justify-center overflow-hidden',
    sizeClasses[size],
    withBorder && 'border border-border',
    className
  );

  if (src) {
    return (
      <div className="relative inline-flex">
        <img
          src={src}
          alt={alt || name || 'Avatar'}
          className={cn(baseClasses, 'object-cover')}
          data-testid="avatar-image"
        />
        {status && (
          <span
            className={cn(
              'absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-background',
              statusColors[status]
            )}
            data-testid="avatar-status-indicator"
          />
        )}
      </div>
    );
  }

  // Fallback to initials or icon
  return (
    <div className="relative inline-flex">
      <div className={cn(baseClasses)} data-testid="avatar-fallback">
        {initials ? (
          <span className="font-medium text-foreground">{initials}</span>
        ) : (
          <User
            className={cn(
              size === 'xs' && 'w-3 h-3',
              size === 'sm' && 'w-4 h-4',
              size === 'md' && 'w-5 h-5',
              size === 'lg' && 'w-6 h-6',
              size === 'xl' && 'w-8 h-8',
              size === '2xl' && 'w-12 h-12',
              'text-muted-foreground'
            )}
          />
        )}
      </div>
      {status && (
        <span
          className={cn(
            'absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-background',
            statusColors[status]
          )}
          data-testid="avatar-status-indicator"
        />
      )}
    </div>
  );
}

// ============================================================================
// Avatar Group Component (for stacked avatars)
// ============================================================================

interface AvatarGroupProps {
  /** Array of avatar props */
  avatars: Omit<AvatarProps, 'size'>[];
  /** Maximum number of avatars to show */
  max?: number;
  /** Size of avatars in the group */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Additional CSS classes */
  className?: string;
}

export function AvatarGroup({ avatars, max = 3, size = 'sm', className }: AvatarGroupProps) {
  const visible = avatars.slice(0, max);
  const remaining = Math.max(0, avatars.length - max);

  return (
    <div className={cn('flex items-center -space-x-2', className)} data-testid="avatar-group">
      {visible.map((avatar, index) => (
        <div key={index} className="relative" style={{ zIndex: max - index }}>
          <Avatar
            {...avatar}
            size={size}
            withBorder
            className="ring-2 ring-background"
          />
        </div>
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            'rounded-full bg-muted border-2 border-background flex items-center justify-center',
            sizeClasses[size],
            'text-xs font-medium text-muted-foreground'
          )}
          data-testid="avatar-group-more"
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
