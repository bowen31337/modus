import { type VariantProps, cva } from 'class-variance-authority';
import type * as React from 'react';
import { cn } from './utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 hover:scale-105 active:scale-95',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-background-secondary text-foreground-secondary',
        destructive: 'border-transparent bg-destructive text-destructive-foreground',
        outline: 'text-foreground',
        // Priority variants
        'priority-p1': 'border-transparent bg-priority-critical/20 text-priority-critical',
        'priority-p2': 'border-transparent bg-priority-high/20 text-priority-high',
        'priority-p3': 'border-transparent bg-priority-medium/20 text-priority-medium',
        'priority-p4': 'border-transparent bg-priority-low/20 text-priority-low',
        // Sentiment variants
        'sentiment-negative': 'border-transparent bg-sentiment-negative/20 text-sentiment-negative',
        'sentiment-neutral': 'border-transparent bg-sentiment-neutral/20 text-sentiment-neutral',
        'sentiment-positive': 'border-transparent bg-sentiment-positive/20 text-sentiment-positive',
        // Status variants
        'status-open': 'border-transparent bg-primary/20 text-primary',
        'status-in-progress': 'border-transparent bg-priority-high/20 text-priority-high',
        'status-resolved': 'border-transparent bg-priority-low/20 text-priority-low',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
