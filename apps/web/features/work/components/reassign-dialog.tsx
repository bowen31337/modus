'use client';

import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@modus/ui';
import { Search, UserCheck } from 'lucide-react';
import { useState } from 'react';

interface Agent {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'busy';
}

interface ReassignDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onReassign: (agentId: string) => void;
  currentAgentId: string;
  agents: Agent[];
  postTitle: string;
}

export function ReassignDialog({
  isOpen,
  onClose,
  onReassign,
  currentAgentId,
  agents,
  postTitle,
}: ReassignDialogProps) {
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAgents = agents.filter((agent) =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleReassign = () => {
    if (selectedAgentId && selectedAgentId !== currentAgentId) {
      onReassign(selectedAgentId);
      onClose();
      setSelectedAgentId('');
      setSearchQuery('');
    }
  };

  const statusColors = {
    online: 'bg-emerald-500',
    offline: 'bg-gray-400',
    busy: 'bg-orange-500',
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md" data-testid="reassign-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <UserCheck className="h-5 w-5 text-primary" />
            Reassign Post
          </DialogTitle>
        </DialogHeader>

        {/* Content */}
        <div className="space-y-4">
          {/* Post Info */}
          <div className="p-3 rounded-lg bg-background-tertiary border border-border">
            <p className="text-sm text-foreground-secondary">Reassigning:</p>
            <p
              className="text-sm font-medium text-foreground truncate mt-1"
              data-testid="reassign-post-title"
            >
              {postTitle}
            </p>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search agents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background-tertiary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              data-testid="agent-search-input"
            />
          </div>

          {/* Agent List */}
          <div className="max-h-64 overflow-y-auto space-y-2" data-testid="agent-list">
            {filteredAgents.length === 0 ? (
              <p className="text-center text-foreground-secondary py-4">No agents found</p>
            ) : (
              filteredAgents.map((agent) => {
                const isCurrentAgent = agent.id === currentAgentId;
                const isSelected = selectedAgentId === agent.id;

                return (
                  <button
                    key={agent.id}
                    onClick={() => !isCurrentAgent && setSelectedAgentId(agent.id)}
                    disabled={isCurrentAgent}
                    className={cn(
                      'w-full flex items-center justify-between p-3 rounded-lg border transition-all',
                      isSelected && 'border-primary bg-primary/10',
                      !isSelected &&
                        'border-border bg-background-tertiary hover:border-border-hover',
                      isCurrentAgent && 'opacity-50 cursor-not-allowed'
                    )}
                    data-testid={`agent-option-${agent.id}`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="relative">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-medium">
                          {agent.name.charAt(0).toUpperCase()}
                        </div>
                        {/* Status indicator */}
                        <div
                          className={cn(
                            'absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background-secondary',
                            statusColors[agent.status]
                          )}
                          title={agent.status}
                        />
                      </div>

                      {/* Name and Status */}
                      <div className="text-left">
                        <p className="text-sm font-medium text-foreground">
                          {agent.name}
                          {isCurrentAgent && (
                            <span className="ml-2 text-xs text-foreground-secondary">
                              (Current)
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-foreground-secondary capitalize">
                          {agent.status}
                        </p>
                      </div>
                    </div>

                    {/* Selection indicator */}
                    {isSelected && (
                      <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-white" />
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2 border-t border-border">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-border text-foreground-secondary hover:bg-background-tertiary transition-colors"
              data-testid="cancel-reassign-button"
            >
              Cancel
            </button>
            <button
              onClick={handleReassign}
              disabled={!selectedAgentId || selectedAgentId === currentAgentId}
              className={cn(
                'flex-1 px-4 py-2 rounded-lg font-medium transition-colors',
                selectedAgentId && selectedAgentId !== currentAgentId
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-background-tertiary text-foreground-secondary cursor-not-allowed'
              )}
              data-testid="confirm-reassign-button"
            >
              Reassign
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
