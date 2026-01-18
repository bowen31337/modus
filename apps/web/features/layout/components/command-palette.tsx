'use client';

import { cn } from '@/lib/utils';
import { AlertCircle, Command, FileText, LogOut, Search, Settings, User, X } from 'lucide-react';
import { type KeyboardEvent, useEffect, useRef, useState } from 'react';

interface Command {
  id: string;
  label: string;
  icon: React.ElementType;
  action: () => void;
  shortcut?: string;
  category: 'navigation' | 'action' | 'help';
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

export function CommandPalette({ isOpen, onClose, onNavigate }: CommandPaletteProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Define available commands
  const commands: Command[] = [
    {
      id: 'go-queue',
      label: 'Go to Moderation Queue',
      icon: AlertCircle,
      action: () => onNavigate('/dashboard'),
      shortcut: 'G Q',
      category: 'navigation',
    },
    {
      id: 'go-settings',
      label: 'Go to Settings',
      icon: Settings,
      action: () => onNavigate('/dashboard/settings'),
      shortcut: 'G S',
      category: 'navigation',
    },
    {
      id: 'view-profile',
      label: 'View Profile',
      icon: User,
      action: () => onNavigate('/dashboard/profile'),
      category: 'navigation',
    },
    {
      id: 'view-templates',
      label: 'Manage Templates',
      icon: FileText,
      action: () => onNavigate('/dashboard/settings'),
      shortcut: 'G T',
      category: 'navigation',
    },
    {
      id: 'logout',
      label: 'Log Out',
      icon: LogOut,
      action: () => {
        // In a real app, this would call an auth logout function
        console.log('Logging out...');
        onNavigate('/login');
      },
      category: 'action',
    },
  ];

  // Filter commands based on search query
  const filteredCommands = commands.filter((cmd) =>
    cmd.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Reset selection when filters change
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Handle keyboard navigation on the container (for clicks on the backdrop)
  // Note: Input handles its own keyboard events to avoid double-processing
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isOpen) return;

    // Only handle Escape at the container level (for when input isn't focused)
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  // Always render the component but hide it visually when closed
  // This allows tests to find the component in the DOM
  if (!isOpen) {
    return <div data-testid="command-palette" className="hidden" aria-hidden="true" />;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* Backdrop - pointer-events-auto ensures it's clickable */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto"
        onClick={onClose}
        data-testid="command-palette-backdrop"
      />

      {/* Command Palette Modal - pointer-events-auto ensures content is interactive */}
      <div
        ref={containerRef}
        className={cn(
          'relative w-full max-w-2xl rounded-lg bg-background-secondary',
          'border border-border shadow-2xl overflow-hidden',
          'animate-in fade-in zoom-in-95 duration-200 pointer-events-auto'
        )}
        onKeyDown={handleKeyDown}
        data-testid="command-palette"
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 border-b border-border p-4">
          <Search size={20} className="text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              // Handle keyboard navigation directly on the input
              switch (e.key) {
                case 'Escape':
                  e.stopPropagation();
                  e.preventDefault();
                  onClose();
                  break;
                case 'ArrowDown':
                  e.stopPropagation();
                  e.preventDefault();
                  setSelectedIndex((prev) => (prev < filteredCommands.length - 1 ? prev + 1 : 0));
                  break;
                case 'ArrowUp':
                  e.stopPropagation();
                  e.preventDefault();
                  setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredCommands.length - 1));
                  break;
                case 'Enter':
                  e.stopPropagation();
                  e.preventDefault();
                  if (filteredCommands[selectedIndex]) {
                    filteredCommands[selectedIndex].action();
                    onClose();
                  }
                  break;
              }
            }}
            className={cn(
              'flex-1 bg-transparent text-foreground text-sm outline-none',
              'placeholder:text-muted-foreground'
            )}
            data-testid="command-palette-input"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground bg-background-tertiary rounded border border-border">
            <Command size={12} />K
          </kbd>
          <button
            onClick={onClose}
            className="p-1 hover:bg-background-tertiary rounded transition-colors"
            aria-label="Close command palette"
            data-testid="command-palette-close"
          >
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>

        {/* Commands List */}
        <div className="max-h-[60vh] overflow-y-auto p-2" data-testid="command-palette-results">
          {filteredCommands.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Search size={32} className="mb-3 opacity-50" />
              <p className="text-sm">No commands found</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredCommands.map((cmd, index) => {
                const Icon = cmd.icon;
                const isSelected = index === selectedIndex;

                return (
                  <button
                    key={cmd.id}
                    onClick={() => {
                      cmd.action();
                      onClose();
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-3 rounded-md text-left transition-colors',
                      'hover:bg-background-tertiary',
                      isSelected && 'bg-background-tertiary ring-1 ring-primary'
                    )}
                    data-testid={`command-${cmd.id}`}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <Icon
                      size={18}
                      className={cn('text-muted-foreground', isSelected && 'text-primary')}
                    />
                    <span
                      className={cn('flex-1 text-sm text-foreground', isSelected && 'text-primary')}
                    >
                      {cmd.label}
                    </span>
                    {cmd.shortcut && (
                      <span className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
                        {cmd.shortcut.split(' ').map((key, i) => (
                          <kbd
                            key={i}
                            className="px-1.5 py-0.5 bg-background-secondary rounded border border-border font-mono"
                          >
                            {key}
                          </kbd>
                        ))}
                      </span>
                    )}
                    {cmd.category === 'action' && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        Action
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-background-tertiary rounded border border-border font-mono">
                ↑↓
              </kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-background-tertiary rounded border border-border font-mono">
                ↵
              </kbd>
              Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-background-tertiary rounded border border-border font-mono">
                Esc
              </kbd>
              Close
            </span>
          </div>
          <span>
            {filteredCommands.length} command{filteredCommands.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  );
}
