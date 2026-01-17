'use client';

import { cn } from '@/lib/utils';
import type { ViewMode } from './view-toggle';

interface PostCardSkeletonProps {
  viewMode?: ViewMode;
}

/**
 * Skeleton loader for PostCard component
 * Matches the visual structure of PostCard with animated placeholders
 */
export function PostCardSkeleton({ viewMode = 'list' }: PostCardSkeletonProps) {
  // Grid view skeleton
  if (viewMode === 'grid') {
    return (
      <div className="relative flex flex-col w-full bg-background-secondary border border-border rounded-lg overflow-hidden">
        {/* Priority Strip (top) - animated shimmer */}
        <div className="h-1 w-full bg-background-tertiary animate-pulse" />

        {/* Content */}
        <div className="flex-1 p-3">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-2 mb-2">
            {/* Title placeholder */}
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 bg-background-tertiary rounded animate-pulse" />
              <div className="h-3.5 w-3/4 bg-background-tertiary rounded animate-pulse" />
            </div>

            {/* Status Badge */}
            <div className="h-5 w-16 bg-background-tertiary rounded animate-pulse" />
          </div>

          {/* Excerpt placeholder */}
          <div className="space-y-1.5 mb-3">
            <div className="h-2.5 bg-background-tertiary rounded animate-pulse" />
            <div className="h-2.5 w-5/6 bg-background-tertiary rounded animate-pulse" />
            <div className="h-2.5 w-4/6 bg-background-tertiary rounded animate-pulse" />
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="h-5 bg-background-tertiary rounded animate-pulse" />
            <div className="h-5 bg-background-tertiary rounded animate-pulse" />
            <div className="h-5 bg-background-tertiary rounded animate-pulse" />
            <div className="h-5 bg-background-tertiary rounded animate-pulse" />
          </div>

          {/* Author and Time */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="h-4 w-20 bg-background-tertiary rounded animate-pulse" />
            <div className="h-4 w-16 bg-background-tertiary rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // List view skeleton (original)
  return (
    <div className="relative flex w-full border-b border-border bg-background-secondary">
      {/* Priority Strip - animated shimmer */}
      <div className="w-1 flex-shrink-0 bg-background-tertiary animate-pulse" />

      {/* Content */}
      <div className="flex-1 p-3 min-w-0">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-2 mb-1">
          {/* Title placeholder */}
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 bg-background-tertiary rounded animate-pulse" />
            <div className="h-3.5 w-2/3 bg-background-tertiary rounded animate-pulse" />
          </div>

          {/* Status Badge */}
          <div className="h-5 w-16 bg-background-tertiary rounded animate-pulse" />
        </div>

        {/* Excerpt placeholder */}
        <div className="space-y-1.5 mb-2">
          <div className="h-2.5 bg-background-tertiary rounded animate-pulse" />
          <div className="h-2.5 w-5/6 bg-background-tertiary rounded animate-pulse" />
        </div>

        {/* Metadata Row */}
        <div className="flex items-center gap-3">
          <div className="h-5 w-12 bg-background-tertiary rounded animate-pulse" />
          <div className="h-5 w-8 bg-background-tertiary rounded animate-pulse" />
          <div className="h-5 w-14 bg-background-tertiary rounded animate-pulse" />
          <div className="h-5 w-16 bg-background-tertiary rounded animate-pulse ml-auto" />
        </div>
      </div>
    </div>
  );
}
