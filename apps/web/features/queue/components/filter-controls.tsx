'use client';

import { cn } from '@/lib/utils';
import { Button } from '@modus/ui';
import { ChevronDown, Filter, X } from 'lucide-react';
import { useState } from 'react';

export type CategoryFilter =
  | 'all'
  | 'Account Issues'
  | 'Feature Request'
  | 'Bug Reports'
  | 'Spam'
  | 'Harassment'
  | 'Other';
export type StatusFilter = 'all' | 'open' | 'in_progress' | 'resolved';
export type PriorityFilter = 'all' | 'P1' | 'P2' | 'P3' | 'P4' | 'P5';

export interface DateRangeFilter {
  startDate: string;
  endDate: string;
}

export interface FilterState {
  category: CategoryFilter;
  status: StatusFilter;
  priority: PriorityFilter;
  search: string;
  dateRange?: DateRangeFilter;
}

interface FilterControlsProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  postCount?: number;
}

// Helper to parse date string and compare (ignoring time)
export const isDateInRange = (dateStr: string, startDate?: string, endDate?: string): boolean => {
  if (!startDate && !endDate) return true;

  // Parse the date string - handles both ISO format and relative time strings
  const postDate = new Date(dateStr);

  // If the date string is not a valid ISO date, try to parse relative time
  if (isNaN(postDate.getTime())) {
    const now = new Date();

    if (dateStr.includes('m ago')) {
      const minutes = Number.parseInt(dateStr);
      postDate.setTime(now.getTime() - minutes * 60000);
    } else if (dateStr.includes('h ago')) {
      const hours = Number.parseInt(dateStr);
      postDate.setTime(now.getTime() - hours * 3600000);
    } else if (dateStr.includes('d ago')) {
      const days = Number.parseInt(dateStr);
      postDate.setTime(now.getTime() - days * 86400000);
    } else {
      // Unable to parse, include the post
      return true;
    }
  }

  if (startDate) {
    const start = new Date(startDate);
    // Set to start of day for comparison
    start.setHours(0, 0, 0, 0);
    if (postDate < start) return false;
  }

  if (endDate) {
    const end = new Date(endDate);
    // Include posts on the end date (set to end of day)
    end.setHours(23, 59, 59, 999);
    if (postDate > end) return false;
  }

  return true;
};

const categoryColors: Record<CategoryFilter, string> = {
  all: '#94a3b8',
  'Account Issues': '#eab308',
  'Feature Request': '#8b5cf6',
  'Bug Reports': '#ef4444',
  Spam: '#ec4899',
  Harassment: '#f97316',
  Other: '#6b7280',
};

export function FilterControls({ filters, onFiltersChange, postCount }: FilterControlsProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<
    'category' | 'status' | 'priority' | 'date' | null
  >(null);

  const activeFilterCount = [
    filters.category !== 'all',
    filters.status !== 'all',
    filters.priority !== 'all',
    filters.search.length > 0,
    filters.dateRange?.startDate,
    filters.dateRange?.endDate,
  ].filter(Boolean).length;

  const handleClearAll = () => {
    onFiltersChange({
      category: 'all',
      status: 'all',
      priority: 'all',
      search: '',
      dateRange: undefined,
    });
    setActiveDropdown(null);
  };

  const handleDateRangeChange = (start: string | null, end: string | null) => {
    const newDateRange = start || end ? { startDate: start || '', endDate: end || '' } : undefined;
    onFiltersChange({ ...filters, dateRange: newDateRange });
  };

  const hasActiveFilters = activeFilterCount > 0;

  return (
    <div className="relative">
      {/* Filter Button */}
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          'flex-1 justify-start gap-2 h-8 px-2 text-xs',
          hasActiveFilters && 'bg-primary/10 text-primary border-primary/30'
        )}
        onClick={() => setShowDropdown(!showDropdown)}
        data-testid="filter-controls-button"
      >
        <Filter size={12} />
        Filters
        {hasActiveFilters && (
          <span className="ml-auto bg-primary text-primary-foreground text-[10px] px-1.5 rounded-full">
            {activeFilterCount}
          </span>
        )}
        <ChevronDown
          size={12}
          className={cn('transition-transform', showDropdown && 'rotate-180')}
        />
      </Button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />

          {/* Dropdown Content */}
          <div className="absolute top-full left-0 mt-1 w-72 bg-background-secondary border border-border rounded-lg shadow-lg z-50 p-3 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Filters</span>
              {hasActiveFilters && (
                <button
                  onClick={handleClearAll}
                  className="text-xs text-primary hover:text-primary/80 active:text-primary/60 active:scale-95 transition-all duration-150 flex items-center gap-1"
                >
                  <X size={12} />
                  Clear all
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div>
              <button
                onClick={() => setActiveDropdown(activeDropdown === 'category' ? null : 'category')}
                className="w-full flex items-center justify-between text-xs text-foreground-secondary hover:text-foreground active:text-foreground/70 active:scale-[0.995] transition-all duration-150 py-1"
              >
                <span>Category</span>
                <ChevronDown
                  size={12}
                  className={cn(
                    'transition-transform',
                    activeDropdown === 'category' && 'rotate-180'
                  )}
                />
              </button>
              {activeDropdown === 'category' && (
                <div className="mt-2 space-y-1">
                  {(
                    [
                      'all',
                      'Account Issues',
                      'Feature Request',
                      'Bug Reports',
                      'Spam',
                      'Harassment',
                      'Other',
                    ] as CategoryFilter[]
                  ).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        onFiltersChange({ ...filters, category: cat });
                      }}
                      className={cn(
                        'w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-left transition-all duration-150',
                        filters.category === cat
                          ? 'bg-primary/10 text-primary active:bg-primary/20'
                          : 'hover:bg-background-tertiary text-foreground-secondary active:bg-background-hover active:scale-[0.995]'
                      )}
                      data-testid={`filter-category-${cat}`}
                    >
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: categoryColors[cat] }}
                      />
                      {cat === 'all' ? 'All Categories' : cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Status Filter */}
            <div>
              <button
                onClick={() => setActiveDropdown(activeDropdown === 'status' ? null : 'status')}
                className="w-full flex items-center justify-between text-xs text-foreground-secondary hover:text-foreground active:text-foreground/70 active:scale-[0.995] transition-all duration-150 py-1"
              >
                <span>Status</span>
                <ChevronDown
                  size={12}
                  className={cn(
                    'transition-transform',
                    activeDropdown === 'status' && 'rotate-180'
                  )}
                />
              </button>
              {activeDropdown === 'status' && (
                <div className="mt-2 space-y-1">
                  {(['all', 'open', 'in_progress', 'resolved'] as StatusFilter[]).map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        onFiltersChange({ ...filters, status });
                      }}
                      className={cn(
                        'w-full px-2 py-1.5 rounded text-xs text-left transition-all duration-150',
                        filters.status === status
                          ? 'bg-primary/10 text-primary active:bg-primary/20'
                          : 'hover:bg-background-tertiary text-foreground-secondary active:bg-background-hover active:scale-[0.995]'
                      )}
                      data-testid={`filter-status-${status}`}
                    >
                      {status === 'all'
                        ? 'All Statuses'
                        : status === 'open'
                          ? 'Open'
                          : status === 'in_progress'
                            ? 'In Progress'
                            : 'Resolved'}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Priority Filter */}
            <div>
              <button
                onClick={() => setActiveDropdown(activeDropdown === 'priority' ? null : 'priority')}
                className="w-full flex items-center justify-between text-xs text-foreground-secondary hover:text-foreground active:text-foreground/70 active:scale-[0.995] transition-all duration-150 py-1"
              >
                <span>Priority</span>
                <ChevronDown
                  size={12}
                  className={cn(
                    'transition-transform',
                    activeDropdown === 'priority' && 'rotate-180'
                  )}
                />
              </button>
              {activeDropdown === 'priority' && (
                <div className="mt-2 space-y-1">
                  {(['all', 'P1', 'P2', 'P3', 'P4', 'P5'] as PriorityFilter[]).map((priority) => (
                    <button
                      key={priority}
                      onClick={() => {
                        onFiltersChange({ ...filters, priority });
                      }}
                      className={cn(
                        'w-full px-2 py-1.5 rounded text-xs text-left transition-all duration-150',
                        filters.priority === priority
                          ? 'bg-primary/10 text-primary active:bg-primary/20'
                          : 'hover:bg-background-tertiary text-foreground-secondary active:bg-background-hover active:scale-[0.995]'
                      )}
                      data-testid={`filter-priority-${priority}`}
                    >
                      {priority === 'all' ? 'All Priorities' : priority}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Date Range Filter */}
            <div>
              <button
                onClick={() => setActiveDropdown(activeDropdown === 'date' ? null : 'date')}
                className="w-full flex items-center justify-between text-xs text-foreground-secondary hover:text-foreground active:text-foreground/70 active:scale-[0.995] transition-all duration-150 py-1"
              >
                <span>Date Range</span>
                <ChevronDown
                  size={12}
                  className={cn('transition-transform', activeDropdown === 'date' && 'rotate-180')}
                />
              </button>
              {activeDropdown === 'date' && (
                <div className="mt-2 space-y-2">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-muted-foreground">Start Date</label>
                    <input
                      type="date"
                      value={filters.dateRange?.startDate || ''}
                      onChange={(e) =>
                        handleDateRangeChange(
                          e.target.value || null,
                          filters.dateRange?.endDate || null
                        )
                      }
                      className="w-full bg-background-tertiary border border-border rounded px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      data-testid="date-start-input"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-muted-foreground">End Date</label>
                    <input
                      type="date"
                      value={filters.dateRange?.endDate || ''}
                      onChange={(e) =>
                        handleDateRangeChange(
                          filters.dateRange?.startDate || null,
                          e.target.value || null
                        )
                      }
                      className="w-full bg-background-tertiary border border-border rounded px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      data-testid="date-end-input"
                    />
                  </div>
                  {(filters.dateRange?.startDate || filters.dateRange?.endDate) && (
                    <button
                      onClick={() => handleDateRangeChange(null, null)}
                      className="w-full text-xs text-primary hover:text-primary/80 flex items-center justify-center gap-1 py-1"
                      data-testid="clear-date-filter"
                    >
                      <X size={12} />
                      Clear date filter
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            {postCount !== undefined && (
              <div className="pt-2 border-t border-border text-xs text-muted-foreground text-center">
                {postCount} post{postCount !== 1 ? 's' : ''} found
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
