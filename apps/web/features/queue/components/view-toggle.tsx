'use client';

import { LayoutGrid, List } from 'lucide-react';
import { Button } from '@modus/ui';

export type ViewMode = 'grid' | 'list';

interface ViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (viewMode: ViewMode) => void;
}

export function ViewToggle({ viewMode, onViewModeChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-1 bg-background-tertiary border border-border rounded-md p-1">
      <Button
        variant={viewMode === 'list' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => onViewModeChange('list')}
        className="h-7 w-7 p-0"
        title="List view"
        data-testid="view-toggle-list"
      >
        <List className="w-4 h-4" />
      </Button>
      <Button
        variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => onViewModeChange('grid')}
        className="h-7 w-7 p-0"
        title="Grid view"
        data-testid="view-toggle-grid"
      >
        <LayoutGrid className="w-4 h-4" />
      </Button>
    </div>
  );
}
