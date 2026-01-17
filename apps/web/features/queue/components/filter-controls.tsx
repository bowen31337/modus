'use client';

import { useState } from 'react';
import { Filter, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@modus/ui';

export type CategoryFilter = 'all' | 'Account Issues' | 'Feature Request' | 'Bug Reports' | 'Spam' | 'Harassment' | 'Other';
export type StatusFilter = 'all' | 'open' | 'in_progress' | 'resolved';
export type PriorityFilter = 'all' | 'P1' | 'P2' | 'P3' | 'P4' | 'P5';

export interface FilterState {
  category: CategoryFilter;
  status: StatusFilter;
  priority: PriorityFilter;
  search: string;
}

interface FilterControlsProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  postCount?: number;
}

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
  const [activeDropdown, setActiveDropdown] = useState<'category' | 'status' | 'priority' | null>(null);

  const activeFilterCount = [
    filters.category !== 'all',
    filters.status !== 'all',
    filters.priority !== 'all',
    filters.search.length > 0,
  ].filter(Boolean).length;

  const handleClearAll = () => {
    onFiltersChange({
      category: 'all',
      status: 'all',
      priority: 'all',
      search: '',
    });
    setActiveDropdown(null);
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
      >
        <Filter size={12} />
        Filters
        {hasActiveFilters && (
          <span className="ml-auto bg-primary text-primary-foreground text-[10px] px-1.5 rounded-full">
            {activeFilterCount}
          </span>
        )}
        <ChevronDown size={12} className={cn('transition-transform', showDropdown && 'rotate-180')} />
      </Button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />

          {/* Dropdown Content */}
          <div className="absolute top-full left-0 mt-1 w-72 bg-background-secondary border border-border rounded-lg shadow-lg z-50 p-3 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Filters</span>
              {hasActiveFilters && (
                <button
                  onClick={handleClearAll}
                  className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
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
                className="w-full flex items-center justify-between text-xs text-foreground-secondary hover:text-foreground transition-colors py-1"
              >
                <span>Category</span>
                <ChevronDown size={12} className={cn('transition-transform', activeDropdown === 'category' && 'rotate-180')} />
              </button>
              {activeDropdown === 'category' && (
                <div className="mt-2 space-y-1">
                  {(['all', 'Account Issues', 'Feature Request', 'Bug Reports', 'Spam', 'Harassment', 'Other'] as CategoryFilter[]).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        onFiltersChange({ ...filters, category: cat });
                      }}
                      className={cn(
                        'w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-left transition-colors',
                        filters.category === cat
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-background-tertiary text-foreground-secondary'
                      )}
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
                className="w-full flex items-center justify-between text-xs text-foreground-secondary hover:text-foreground transition-colors py-1"
              >
                <span>Status</span>
                <ChevronDown size={12} className={cn('transition-transform', activeDropdown === 'status' && 'rotate-180')} />
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
                        'w-full px-2 py-1.5 rounded text-xs text-left transition-colors',
                        filters.status === status
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-background-tertiary text-foreground-secondary'
                      )}
                    >
                      {status === 'all' ? 'All Statuses' :
                       status === 'open' ? 'Open' :
                       status === 'in_progress' ? 'In Progress' :
                       'Resolved'}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Priority Filter */}
            <div>
              <button
                onClick={() => setActiveDropdown(activeDropdown === 'priority' ? null : 'priority')}
                className="w-full flex items-center justify-between text-xs text-foreground-secondary hover:text-foreground transition-colors py-1"
              >
                <span>Priority</span>
                <ChevronDown size={12} className={cn('transition-transform', activeDropdown === 'priority' && 'rotate-180')} />
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
                        'w-full px-2 py-1.5 rounded text-xs text-left transition-colors',
                        filters.priority === priority
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-background-tertiary text-foreground-secondary'
                      )}
                    >
                      {priority === 'all' ? 'All Priorities' : priority}
                    </button>
                  ))}
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
