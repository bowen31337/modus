'use client';

import { cn } from '@/lib/utils';
import { Search, UserCheck, X } from 'lucide-react';
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

  if (!isOpen) return null;

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      data-testid="reassign-modal"
    >
      <div className="w-full max-w-md rounded-lg bg-slate-900 shadow-xl border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700 p-4">
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-white">Reassign Post</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            data-testid="close-reassign-modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Post Info */}
          <div className="mb-4 p-3 rounded bg-slate-800 border border-slate-700">
            <p className="text-sm text-slate-400">Reassigning:</p>
            <p
              className="text-sm font-medium text-white truncate mt-1"
              data-testid="reassign-post-title"
            >
              {postTitle}
            </p>
          </div>

          {/* Search */}
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search agents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary"
              data-testid="agent-search-input"
            />
          </div>

          {/* Agent List */}
          <div className="max-h-64 overflow-y-auto space-y-2 mb-4" data-testid="agent-list">
            {filteredAgents.length === 0 ? (
              <p className="text-center text-slate-400 py-4">No agents found</p>
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
                      !isSelected && 'border-slate-700 bg-slate-800 hover:border-slate-600',
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
                            'absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-slate-900',
                            statusColors[agent.status]
                          )}
                          title={agent.status}
                        />
                      </div>

                      {/* Name and Status */}
                      <div className="text-left">
                        <p className="text-sm font-medium text-white">
                          {agent.name}
                          {isCurrentAgent && (
                            <span className="ml-2 text-xs text-slate-400">(Current)</span>
                          )}
                        </p>
                        <p className="text-xs text-slate-400 capitalize">{agent.status}</p>
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
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
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
                  ? 'bg-primary text-white hover:bg-primary/90'
                  : 'bg-slate-700 text-slate-400 cursor-not-allowed'
              )}
              data-testid="confirm-reassign-button"
            >
              Reassign
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
