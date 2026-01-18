'use client';

import { Button } from '@modus/ui';
import { ChevronDown, ChevronUp, Edit, Shield, User, Users } from 'lucide-react';
import { useState } from 'react';

export interface Agent {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url?: string | null;
  role: 'agent' | 'supervisor' | 'admin' | 'moderator';
  status: 'online' | 'offline' | 'busy';
  last_active_at: string;
  created_at: string;
}

interface AgentManagementProps {
  agents: Agent[];
  onUpdateAgentRole: (agentId: string, newRole: Agent['role']) => Promise<void>;
}

export function AgentManagement({ agents, onUpdateAgentRole }: AgentManagementProps) {
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);
  const [expandedAgentId, setExpandedAgentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const roleColors = {
    agent: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    supervisor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    admin: 'bg-red-500/10 text-red-400 border-red-500/20',
    moderator: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  };

  const statusColors = {
    online: 'bg-emerald-500',
    offline: 'bg-muted-foreground',
    busy: 'bg-orange-500',
  };

  const handleRoleChange = async (agentId: string, newRole: Agent['role']) => {
    setIsLoading(true);
    try {
      await onUpdateAgentRole(agentId, newRole);
      setEditingAgentId(null);
    } catch (error) {
      console.error('Failed to update agent role:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto" data-testid="agent-management">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Users size={24} className="text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Agent Management</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Manage team members and their roles. Admins can change agent permissions.
        </p>
      </div>

      {/* Role Legend */}
      <div className="bg-background-secondary rounded-lg border border-border p-4 mb-6">
        <h3 className="text-sm font-semibold text-foreground mb-3">Roles & Permissions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 rounded-full bg-red-400 mt-1" />
            <div>
              <span className="font-medium text-foreground">Admin</span>
              <span className="text-muted-foreground ml-2">
                Full system access, can manage all agents and settings
              </span>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-400 mt-1" />
            <div>
              <span className="font-medium text-foreground">Supervisor</span>
              <span className="text-muted-foreground ml-2">
                Can reassign posts, view team metrics, manage templates
              </span>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1" />
            <div>
              <span className="font-medium text-foreground">Moderator</span>
              <span className="text-muted-foreground ml-2">
                Moderation privileges, limited admin access
              </span>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-400 mt-1" />
            <div>
              <span className="font-medium text-foreground">Agent</span>
              <span className="text-muted-foreground ml-2">
                Standard moderation workflow access
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Agents List */}
      <div className="space-y-3">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="bg-background-secondary rounded-lg border border-border overflow-hidden"
            data-testid={`agent-card-${agent.id}`}
          >
            {/* Agent Summary */}
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  {/* Status Indicator */}
                  <div
                    className={`w-2 h-2 rounded-full ${statusColors[agent.status]}`}
                    data-testid={`agent-status-${agent.id}`}
                  />

                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-background-tertiary border border-border flex items-center justify-center">
                    {agent.avatar_url ? (
                      <img
                        src={agent.avatar_url}
                        alt={agent.display_name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User size={18} className="text-muted-foreground" />
                    )}
                  </div>

                  {/* Agent Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-foreground">{agent.display_name}</h4>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${roleColors[agent.role]}`}
                        data-testid={`agent-role-${agent.id}`}
                      >
                        <Shield size={10} />
                        {agent.role.charAt(0).toUpperCase() + agent.role.slice(1)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{agent.user_id}</p>
                  </div>

                  {/* Status Text */}
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground capitalize" data-testid={`agent-status-text-${agent.id}`}>
                      {agent.status}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(agent.last_active_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    onClick={() => setExpandedAgentId(expandedAgentId === agent.id ? null : agent.id)}
                    variant="ghost"
                    size="icon"
                    data-testid={`expand-agent-${agent.id}`}
                  >
                    {expandedAgentId === agent.id ? (
                      <ChevronUp size={16} className="text-foreground-secondary" />
                    ) : (
                      <ChevronDown size={16} className="text-foreground-secondary" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Expanded Details */}
            {expandedAgentId === agent.id && (
              <div className="border-t border-border p-4 bg-background-tertiary/30" data-testid={`agent-details-${agent.id}`}>
                <div className="space-y-3">
                  {/* Account Information */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground">Agent ID:</span>
                      <span className="ml-2 font-mono text-foreground">{agent.id}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Member Since:</span>
                      <span className="ml-2 text-foreground">
                        {new Date(agent.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">User ID:</span>
                      <span className="ml-2 font-mono text-foreground">{agent.user_id}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Last Active:</span>
                      <span className="ml-2 text-foreground">
                        {new Date(agent.last_active_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Role Change Section */}
                  <div className="pt-3 border-t border-border/50">
                    {editingAgentId === agent.id ? (
                      <div className="space-y-3" data-testid={`role-editor-${agent.id}`}>
                        <label className="block text-sm font-medium text-foreground">
                          Change Role for {agent.display_name}
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {(['agent', 'supervisor', 'admin', 'moderator'] as const).map((role) => (
                            <button
                              key={role}
                              onClick={() => handleRoleChange(agent.id, role)}
                              disabled={isLoading || agent.role === role}
                              className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${
                                agent.role === role
                                  ? 'bg-primary text-primary-foreground border-primary'
                                  : roleColors[role]
                              } hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed`}
                              data-testid={`role-option-${role}-${agent.id}`}
                            >
                              {role.charAt(0).toUpperCase() + role.slice(1)}
                            </button>
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => setEditingAgentId(null)}
                            variant="outline"
                            size="sm"
                            disabled={isLoading}
                            data-testid={`cancel-role-change-${agent.id}`}
                          >
                            Cancel
                          </Button>
                          <p className="text-xs text-muted-foreground">
                            Click a role button above to change immediately
                          </p>
                        </div>
                      </div>
                    ) : (
                      <Button
                        onClick={() => setEditingAgentId(agent.id)}
                        variant="outline"
                        size="sm"
                        data-testid={`edit-role-${agent.id}`}
                      >
                        <Edit size={14} className="mr-2" />
                        Change Role
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {agents.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Users size={48} className="mx-auto mb-3 opacity-50" />
          <p className="text-lg font-medium">No agents found</p>
          <p className="text-sm">Add agents to your team to get started</p>
        </div>
      )}
    </div>
  );
}
