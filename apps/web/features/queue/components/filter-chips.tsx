'use client';

import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import type { FilterState } from './filter-controls';

interface FilterChipsProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

export function FilterChips({ filters, onFiltersChange }: FilterChipsProps) {
  const chips: Array<{
    id: string;
    label: string;
    value: string;
    type: 'category' | 'status' | 'priority' | 'search' | 'date';
    color?: string;
  }> = [];

  // Add category chip
  if (filters.category !== 'all') {
    const categoryColors: Record<string, string> = {
      'Account Issues': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      'Feature Request': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      'Bug Reports': 'bg-red-500/20 text-red-300 border-red-500/30',
      Spam: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
      Harassment: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      Other: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
    };

    chips.push({
      id: `category-${filters.category}`,
      label: 'Category',
      value: filters.category,
      type: 'category',
      color:
        categoryColors[filters.category] || 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    });
  }

  // Add status chip
  if (filters.status !== 'all') {
    const statusLabels: Record<string, string> = {
      open: 'Open',
      in_progress: 'In Progress',
      resolved: 'Resolved',
    };
    const statusColors: Record<string, string> = {
      open: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      in_progress: 'bg-primary/20 text-primary border-primary/30',
      resolved: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    };

    chips.push({
      id: `status-${filters.status}`,
      label: 'Status',
      value: statusLabels[filters.status] || filters.status,
      type: 'status',
      color: statusColors[filters.status],
    });
  }

  // Add priority chip
  if (filters.priority !== 'all') {
    const priorityColors: Record<string, string> = {
      P1: 'bg-red-500/20 text-red-300 border-red-500/30',
      P2: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      P3: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
      P4: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      P5: 'bg-slate-600/20 text-slate-400 border-slate-600/30',
    };

    chips.push({
      id: `priority-${filters.priority}`,
      label: 'Priority',
      value: filters.priority,
      type: 'priority',
      color: priorityColors[filters.priority],
    });
  }

  // Add search chip
  if (filters.search) {
    chips.push({
      id: 'search',
      label: 'Search',
      value: filters.search,
      type: 'search',
    });
  }

  // Add date range chip
  if (filters.dateRange?.startDate || filters.dateRange?.endDate) {
    const formatDate = (date: string) => {
      try {
        return new Date(date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
      } catch {
        return date;
      }
    };

    let dateValue = '';
    if (filters.dateRange?.startDate && filters.dateRange?.endDate) {
      dateValue = `${formatDate(filters.dateRange.startDate)} - ${formatDate(filters.dateRange.endDate)}`;
    } else if (filters.dateRange?.startDate) {
      dateValue = `From ${formatDate(filters.dateRange.startDate)}`;
    } else if (filters.dateRange?.endDate) {
      dateValue = `To ${formatDate(filters.dateRange.endDate)}`;
    }

    chips.push({
      id: 'date-range',
      label: 'Date',
      value: dateValue,
      type: 'date',
    });
  }

  const handleRemoveChip = (type: string) => {
    const newFilters = { ...filters };

    switch (type) {
      case 'category':
        newFilters.category = 'all';
        break;
      case 'status':
        newFilters.status = 'all';
        break;
      case 'priority':
        newFilters.priority = 'all';
        break;
      case 'search':
        newFilters.search = '';
        break;
      case 'date':
        newFilters.dateRange = undefined;
        break;
    }

    onFiltersChange(newFilters);
  };

  const handleClearAll = () => {
    onFiltersChange({
      category: 'all',
      status: 'all',
      priority: 'all',
      search: '',
      dateRange: undefined,
    });
  };

  if (chips.length === 0) {
    return null;
  }

  return (
    <div className="px-3 pb-2 border-b border-border">
      <div className="flex flex-wrap items-center gap-2">
        {chips.map((chip) => (
          <span
            key={chip.id}
            className={cn(
              'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs border',
              'bg-background-tertiary/50 text-foreground border-border/60',
              chip.color
            )}
          >
            <span className="font-medium">{chip.label}:</span>
            <span className="opacity-90">{chip.value}</span>
            <button
              type="button"
              onClick={() => handleRemoveChip(chip.type)}
              className="ml-1 rounded-full p-0.5 hover:bg-white/10 transition-colors duration-150"
              aria-label={`Remove ${chip.label} filter`}
              data-testid={`remove-filter-${chip.type}`}
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <button
          type="button"
          onClick={handleClearAll}
          className="ml-auto text-xs text-primary hover:text-primary/80 active:text-primary/60 transition-colors duration-150 px-2 py-1"
          aria-label="Clear all filters"
          data-testid="clear-all-filters"
        >
          Clear all
        </button>
      </div>
    </div>
  );
}
