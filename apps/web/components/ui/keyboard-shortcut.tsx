'use client';

import { cn } from '@/lib/utils';
import { type HTMLAttributes } from 'react';

interface KeyboardShortcutProps extends HTMLAttributes<HTMLDivElement> {
  keys: string[];
  separator?: '+' | 'or';
  variant?: 'default' | 'subtle';
}

/**
 * KeyboardShortcut component displays keyboard shortcut hints in a styled badge.
 *
 * Features:
 * - Monospace font (Geist Mono) for technical appearance
 * - Supports multiple keys with separator (+ or or)
 * - Two variants: default (prominent) and subtle (less visible)
 * - Consistent styling across the application
 *
 * @example
 * <KeyboardShortcut keys={['⌘', 'K']} />
 * <KeyboardShortcut keys={['J']} />
 * <KeyboardShortcut keys={['Ctrl', 'B']} separator="+" />
 */
export function KeyboardShortcut({
  keys,
  separator = '+',
  variant = 'default',
  className,
  ...props
}: KeyboardShortcutProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded border font-mono text-[10px] sm:text-xs',
        variant === 'default' &&
          'bg-background-tertiary border-border text-muted-foreground',
        variant === 'subtle' &&
          'bg-background-secondary/50 border-border/60 text-muted-foreground/70',
        className
      )}
      {...props}
    >
      {keys.map((key, index) => (
        <span key={index} className="flex items-center">
          {index > 0 && separator === '+' && (
            <span className="mx-0.5 text-muted-foreground/50">+</span>
          )}
          {index > 0 && separator === 'or' && (
            <span className="mx-1 text-muted-foreground/50 text-[9px]">or</span>
          )}
          <kbd className="font-semibold">{key}</kbd>
        </span>
      ))}
    </div>
  );
}

/**
 * TooltipWithShortcut component combines a tooltip with keyboard shortcut hint.
 * This is useful for buttons that have keyboard shortcuts.
 */
interface TooltipWithShortcutProps {
  label: string;
  shortcut: string[];
  children: React.ReactElement;
  showShortcut?: boolean;
}

export function TooltipWithShortcut({
  label,
  shortcut,
  children,
  showShortcut = true,
}: TooltipWithShortcutProps) {
  return (
    <div className="group relative inline-flex">
      {children}
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-obsidian-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
        <div className="flex items-center gap-2">
          <span>{label}</span>
          {showShortcut && <KeyboardShortcut keys={shortcut} variant="subtle" />}
        </div>
        {/* Arrow */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-obsidian-800" />
      </div>
    </div>
  );
}
