import * as React from 'react';
import { cn } from './utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Base layout and sizing
          'flex h-9 w-full rounded-md border border-border bg-background-secondary px-3 py-1 text-sm shadow-sm',
          // Transitions for smooth state changes
          'transition-all duration-150',
          // Typography
          'file:border-0 file:bg-transparent file:text-sm file:font-medium',
          // Placeholder styling
          'placeholder:text-foreground-muted',
          // Focus state (keyboard navigation)
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          // Hover state (mouse interaction)
          'hover:bg-background-tertiary hover:border-border-hover',
          // Disabled state
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-background-secondary disabled:hover:border-border',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
