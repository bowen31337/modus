'use client';

import { cn } from '@/lib/utils';
import { Button } from '@modus/ui';
import { ArrowUpDown, Check, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export type SortField = 'priority' | 'date' | 'status' | 'response_count';
export type SortOrder = 'asc' | 'desc';

export interface SortState {
  field: SortField;
  order: SortOrder;
}

interface SortControlsProps {
  sort: SortState;
  onSortChange: (sort: SortState) => void;
}

const sortOptions: { field: SortField; label: string; description: string }[] = [
  { field: 'priority', label: 'Priority', description: 'P1 (Critical) first' },
  { field: 'date', label: 'Date', description: 'Newest first' },
  { field: 'status', label: 'Status', description: 'Open → In Progress → Resolved' },
  { field: 'response_count', label: 'Response Count', description: 'Least responses first' },
];

export function SortControls({ sort, onSortChange }: SortControlsProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  const currentSortOption = sortOptions.find((opt) => opt.field === sort.field);

  const handleSortFieldChange = (field: SortField) => {
    onSortChange({ field, order: 'desc' });
    setShowDropdown(false);
  };

  const toggleSortOrder = () => {
    onSortChange({ ...sort, order: sort.order === 'asc' ? 'desc' : 'asc' });
    setShowDropdown(false);
  };

  return (
    <div className="relative">
      {/* Sort Button */}
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          'flex-1 justify-start gap-2 h-8 px-2 text-xs',
          'text-foreground-secondary hover:text-foreground'
        )}
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <ArrowUpDown size={12} />
        Sort
        {currentSortOption && (
          <span className="text-foreground-secondary">: {currentSortOption.label}</span>
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
          <div className="absolute top-full right-0 mt-1 w-56 bg-background-secondary border border-border rounded-lg shadow-lg z-50 p-2 space-y-1">
            {/* Sort Field Options */}
            <div className="space-y-0.5">
              <div className="px-2 py-1 text-xs text-foreground-muted font-medium">Sort by</div>
              {sortOptions.map((option) => (
                <button
                  key={option.field}
                  onClick={() => handleSortFieldChange(option.field)}
                  className={cn(
                    'w-full flex items-center justify-between px-2 py-1.5 rounded text-xs text-left transition-colors',
                    sort.field === option.field
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-background-tertiary text-foreground-secondary'
                  )}
                >
                  <div className="flex flex-col">
                    <span>{option.label}</span>
                    <span className="text-[10px] opacity-70">{option.description}</span>
                  </div>
                  {sort.field === option.field && <Check size={14} />}
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="border-t border-border my-1" />

            {/* Sort Order Toggle */}
            <button
              onClick={toggleSortOrder}
              className="w-full flex items-center justify-between px-2 py-1.5 rounded text-xs text-left hover:bg-background-tertiary text-foreground-secondary transition-colors"
            >
              <span>Order</span>
              <span
                className={cn('font-mono text-[10px] px-1.5 py-0.5 rounded bg-background-tertiary')}
              >
                {sort.order === 'asc' ? 'Ascending' : 'Descending'}
              </span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
