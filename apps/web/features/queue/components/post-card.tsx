'use client';

import { PresenceIndicator } from '@/components/presence-indicator';
import { type PostStatus, StatusBadge } from '@/components/ui/status-badge';
import { sanitizePostContent } from '@/lib/sanitize';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle2, Clock, MessageSquare, User } from 'lucide-react';
import type { ViewMode } from './view-toggle';

export type PriorityLevel = 'P1' | 'P2' | 'P3' | 'P4' | 'P5';
export type { PostStatus } from '@/components/ui/status-badge';
export type SentimentLabel = 'negative' | 'neutral' | 'positive';

export interface PostCardProps {
  id: string;
  title: string;
  excerpt: string;
  bodyContent?: string;
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
  isKeyboardFocused?: boolean;
  onClick?: () => void;
  viewMode?: ViewMode;
  currentAgentId?: string;
  showPresence?: boolean;
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
  isKeyboardFocused = false,
  onClick,
  viewMode = 'list',
  currentAgentId,
  showPresence = true,
}: PostCardProps) {
  const priorityStripColor = priorityColors[priority];

  // Grid view layout
  if (viewMode === 'grid') {
    return (
      <button
        type="button"
        tabIndex={0}
        onClick={onClick}
        aria-pressed={isSelected}
        data-testid={`post-card-${id}`}
        className={cn(
          'group relative flex flex-col w-full bg-background-secondary hover:bg-background-tertiary hover:-translate-y-0.5 hover:shadow-lg active:bg-background-hover active:scale-[0.99] active:translate-y-0 transition-all duration-150 cursor-pointer text-left border border-border rounded-lg overflow-hidden',
          isSelected && 'ring-2 ring-primary',
          isKeyboardFocused && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
        )}
      >
        {/* Priority Strip (top) */}
        <div className={cn('h-1 w-full', priorityStripColor)} />

        {/* Content */}
        <div className="flex-1 p-3">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-sm font-medium text-foreground leading-tight line-clamp-2 flex-1">
              <span
                dangerouslySetInnerHTML={{
                  __html: sanitizePostContent(title, { allowHtml: false, escapeHtml: false }),
                }}
              />
            </h3>

            {/* Status Badge */}
            <StatusBadge status={status} />
          </div>

          {/* Excerpt */}
          <p
            className="text-xs text-foreground-muted mb-3 line-clamp-3"
            dangerouslySetInnerHTML={{
              __html: sanitizePostContent(excerpt, { allowHtml: false, escapeHtml: false }),
            }}
          />

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs text-foreground-muted mb-2">
            {/* Priority */}
            <span
              className={cn('font-mono text-[10px] px-1.5 py-0.5 rounded bg-background-tertiary')}
            >
              {priority}
            </span>

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
                style={{ backgroundColor: `${category.color}33`, color: category.color }}
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
            <div className="flex items-center gap-2">
              {author && (
                <span className="flex items-center gap-1">
                  <User size={11} />
                  {author.name}
                  {author.postCount === 0 && <span> (new)</span>}
                </span>
              )}
              {showPresence && (
                <PresenceIndicator postId={id} currentAgentId={currentAgentId} compact />
              )}
            </div>
            <span className="flex items-center gap-1">
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
      tabIndex={0}
      onClick={onClick}
      aria-pressed={isSelected}
      data-testid={`post-card-${id}`}
      className={cn(
        'group relative flex w-full border-b border-border bg-background-secondary hover:bg-background-tertiary hover:-translate-y-px active:bg-background-hover active:scale-[0.995] active:translate-x-px transition-all duration-150 cursor-pointer text-left',
        isSelected && 'bg-background-tertiary ring-1 ring-primary inset-0',
        isKeyboardFocused && 'outline-none ring-2 ring-primary ring-offset-2 ring-offset-background'
      )}
    >
      {/* Priority Strip */}
      <div className={cn('w-1 flex-shrink-0', priorityStripColor)} />

      {/* Content */}
      <div className="flex-1 p-3 min-w-0">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-sm font-medium text-foreground leading-tight line-clamp-2 flex-1">
            <span
              dangerouslySetInnerHTML={{
                __html: sanitizePostContent(title, { allowHtml: false, escapeHtml: false }),
              }}
            />
          </h3>

          {/* Status Badge */}
          <StatusBadge status={status} />
        </div>

        {/* Excerpt */}
        <p
          className="text-xs text-foreground-muted mb-2 line-clamp-2"
          dangerouslySetInnerHTML={{
            __html: sanitizePostContent(excerpt, { allowHtml: false, escapeHtml: false }),
          }}
        />

        {/* Metadata Row */}
        <div className="flex items-center gap-3 text-xs text-foreground-muted">
          {/* Priority */}
          <span
            className={cn('font-mono text-[10px] px-1.5 py-0.5 rounded bg-background-tertiary')}
          >
            {priority}
          </span>

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
              style={{ backgroundColor: `${category.color}33`, color: category.color }}
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

          {/* Presence Indicator */}
          {showPresence && (
            <PresenceIndicator postId={id} currentAgentId={currentAgentId} compact />
          )}
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
