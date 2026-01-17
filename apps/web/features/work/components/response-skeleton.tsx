'use client';

/**
 * Skeleton loader for response items in activity history
 * Matches the visual structure of response items with animated placeholders
 */

export function ResponseSkeleton() {
  return (
    <div className="flex gap-3 p-3 border-b border-border">
      {/* Avatar placeholder */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-background-tertiary animate-pulse" />

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* Header Row (Agent name + timestamp) */}
        <div className="flex items-center gap-2">
          <div className="h-4 w-24 bg-background-tertiary rounded animate-pulse" />
          <div className="h-3 w-16 bg-background-tertiary rounded animate-pulse" />
        </div>

        {/* Response text lines */}
        <div className="space-y-1.5">
          <div className="h-4 w-full bg-background-tertiary rounded animate-pulse" />
          <div className="h-4 w-5/6 bg-background-tertiary rounded animate-pulse" />
          <div className="h-4 w-4/6 bg-background-tertiary rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}
