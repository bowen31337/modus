'use client';

import { Clock, User, MessageSquare, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ViewMode } from './view-toggle';

export type PriorityLevel = 'P1' | 'P2' | 'P3' | 'P4' | 'P5';
export type PostStatus = 'open' | 'in_progress' | 'resolved';
export type SentimentLabel = 'negative' | 'neutral' | 'positive';

export interface PostCardProps {
  id: string;
  title: string;
  excerpt: string;
  priority: PriorityLevel;
  status: PostStatus;
  sentiment?: SentimentLabel;
  category?: {
    name: string;
    color: string;
  };
  author?: {
    name: string;
    postCount: number;
  };
  assignedTo?: string;
  createdAt: string;
  responseCount?: number;
  isSelected?: boolean;
  onClick?: () => void;
  viewMode?: ViewMode;
}

const priorityColors: Record<PriorityLevel, string> = {
  P1: 'bg-red-500',
  P2: 'bg-orange-500',
  P3: 'bg-yellow-500',
  P4: 'bg-blue-500',
  P5: 'bg-gray-500',
};

const sentimentColors: Record<SentimentLabel, string> = {
  negative: 'text-red-400',
  neutral: 'text-foreground-muted',
  positive: 'text-emerald-400',
};

const statusColors: Record<PostStatus, string> = {
  open: 'bg-background-tertiary text-foreground-secondary',
  in_progress: 'bg-primary/20 text-primary',
  resolved: 'bg-emerald-500/20 text-emerald-400',
};

export function PostCard({
  id,
  title,
  excerpt,
  priority,
  status,
  sentiment,
  category,
  author,
  assignedTo,
  createdAt,
  responseCount = 0,
  isSelected = false,
  onClick,
  viewMode = 'list',
}: PostCardProps) {
  const priorityStripColor = priorityColors[priority];

  // Grid view layout
  if (viewMode === 'grid') {
    return (
      <button
        type="button"
        role="button"
        tabIndex={0}
        onClick={onClick}
        aria-pressed={isSelected}
        data-testid={`post-card-${id}`}
        className={cn(
          'group relative flex flex-col w-full bg-background-secondary hover:bg-background-tertiary transition-colors cursor-pointer text-left border border-border rounded-lg overflow-hidden',
          isSelected && 'ring-2 ring-primary'
        )}
      >
        {/* Priority Strip (top) */}
        <div className={cn('h-1 w-full', priorityStripColor)} />

        {/* Content */}
        <div className="flex-1 p-3">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-sm font-medium text-foreground leading-tight line-clamp-2 flex-1">
              {title}
            </h3>

            {/* Status Badge */}
            <span
              className={cn(
                'text-[10px] px-1.5 py-0.5 rounded font-medium whitespace-nowrap',
                statusColors[status]
              )}
            >
              {status === 'open' ? 'Open' : status === 'in_progress' ? 'In Progress' : 'Resolved'}
            </span>
          </div>

          {/* Excerpt */}
          <p className="text-xs text-foreground-muted mb-3 line-clamp-3">{excerpt}</p>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs text-foreground-muted mb-2">
            {/* Priority */}
            <span className={cn('font-mono text-[10px] px-1.5 py-0.5 rounded bg-background-tertiary')}>{priority}</span>

            {/* Sentiment */}
            {sentiment && (
              <span className={cn('flex items-center gap-1', sentimentColors[sentiment])}>
                {sentiment === 'negative' && <AlertCircle size={12} />}
                {sentiment === 'positive' && <CheckCircle2 size={12} />}
                {sentiment === 'neutral' && <MessageSquare size={12} />}
                {sentiment}
              </span>
            )}

            {/* Category */}
            {category && (
              <span
                className="px-1.5 py-0.5 rounded text-[10px] font-medium truncate"
                style={{ backgroundColor: category.color + '33', color: category.color }}
              >
                {category.name}
              </span>
            )}

            {/* Response Count */}
            {responseCount > 0 && (
              <span className="flex items-center gap-1">
                <MessageSquare size={11} />
                {responseCount}
              </span>
            )}
          </div>

          {/* Author and Time */}
          <div className="flex items-center justify-between text-xs text-foreground-muted pt-2 border-t border-border">
            {author && (
              <span className="flex items-center gap-1">
                <User size={11} />
                {author.name}
                {author.postCount === 0 && <span> (new)</span>}
              </span>
            )}
            <span className="flex items-center gap-1 ml-auto">
              <Clock size={11} />
              {createdAt}
            </span>
          </div>
        </div>

        {/* Assignment Indicator */}
        {assignedTo && (
          <div className="px-3 pb-2 text-[10px] text-primary flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            {assignedTo}
          </div>
        )}
      </button>
    );
  }

  // List view layout (original)
  return (
    <button
      type="button"
      role="button"
      tabIndex={0}
      onClick={onClick}
      aria-pressed={isSelected}
      data-testid={`post-card-${id}`}
      className={cn(
        'group relative flex w-full border-b border-border bg-background-secondary hover:bg-background-tertiary transition-colors cursor-pointer text-left',
        isSelected && 'bg-background-tertiary ring-1 ring-primary inset-0'
      )}
    >
      {/* Priority Strip */}
      <div className={cn('w-1 flex-shrink-0', priorityStripColor)} />

      {/* Content */}
      <div className="flex-1 p-3 min-w-0">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-sm font-medium text-foreground leading-tight line-clamp-2 flex-1">
            {title}
          </h3>

          {/* Status Badge */}
          <span
            className={cn(
              'text-[10px] px-1.5 py-0.5 rounded font-medium whitespace-nowrap',
              statusColors[status]
            )}
          >
            {status === 'open' ? 'Open' : status === 'in_progress' ? 'In Progress' : 'Resolved'}
          </span>
        </div>

        {/* Excerpt */}
        <p className="text-xs text-foreground-muted mb-2 line-clamp-2">{excerpt}</p>

        {/* Metadata Row */}
        <div className="flex items-center gap-3 text-xs text-foreground-muted">
          {/* Priority */}
          <span className={cn('font-mono text-[10px] px-1.5 py-0.5 rounded bg-background-tertiary')}>{priority}</span>

          {/* Sentiment */}
          {sentiment && (
            <span className={cn('flex items-center gap-1', sentimentColors[sentiment])}>
              {sentiment === 'negative' && <AlertCircle size={12} />}
              {sentiment === 'positive' && <CheckCircle2 size={12} />}
              {sentiment === 'neutral' && <MessageSquare size={12} />}
            </span>
          )}

          {/* Category */}
          {category && (
            <span
              className="px-1.5 py-0.5 rounded text-[10px] font-medium"
              style={{ backgroundColor: category.color + '33', color: category.color }}
            >
              {category.name}
            </span>
          )}

          {/* Author */}
          {author && (
            <span className="flex items-center gap-1">
              <User size={11} />
              {author.name}
              {author.postCount === 0 && ' (new)'}
            </span>
          )}

          {/* Response Count */}
          {responseCount > 0 && (
            <span className="flex items-center gap-1">
              <MessageSquare size={11} />
              {responseCount}
            </span>
          )}

          {/* Time */}
          <span className="flex items-center gap-1 ml-auto">
            <Clock size={11} />
            {createdAt}
          </span>
        </div>

        {/* Assignment Indicator */}
        {assignedTo && (
          <div className="mt-2 text-[10px] text-primary flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            Assigned to {assignedTo}
          </div>
        )}
      </div>

      {/* Hover Indicator */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="bg-primary text-white text-xs px-2 py-1 rounded">Open</div>
      </div>
    </button>
  );
}
