'use client';

import { Button } from '@modus/ui';
import { Download, Filter, RefreshCw, Search } from 'lucide-react';
import { useEffect, useState } from 'react';

interface AuditLogEntry {
  id: string;
  agent_id: string;
  post_id?: string | null;
  action_type: string;
  action_details?: Record<string, unknown>;
  previous_state?: Record<string, unknown> | null;
  new_state?: Record<string, unknown> | null;
  created_at: string;
}

interface Agent {
  id: string;
  display_name: string;
  role: string;
}

interface AuditLogProps {
  currentAgentId: string;
}

export function AuditLog({ currentAgentId }: AuditLogProps) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agents, setAgents] = useState<Map<string, Agent>>(new Map());
  const [filters, setFilters] = useState({
    agentId: '',
    postId: '',
    actionType: '',
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch audit logs
  const fetchAuditLogs = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters.agentId) params.append('agent_id', filters.agentId);
      if (filters.postId) params.append('post_id', filters.postId);
      if (filters.actionType) params.append('action_type', filters.actionType);

      const response = await fetch(`/api/v1/audit?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch audit logs');
      }

      const data = await response.json();
      setLogs(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch agents for display names
  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/v1/agents');
      if (response.ok) {
        const data = await response.json();
        const agentMap = new Map<string, Agent>();
        data.data.forEach((agent: Agent) => {
          agentMap.set(agent.id, agent);
        });
        setAgents(agentMap);
      }
    } catch (err) {
      console.error('Failed to fetch agents:', err);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
    fetchAgents();
  }, []);

  // Filter logs based on search term
  const filteredLogs = logs.filter((log) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();

    const agentName = agents.get(log.agent_id)?.display_name || log.agent_id;
    const actionType = log.action_type.toLowerCase();
    const postId = log.post_id?.toLowerCase() || '';

    return (
      agentName.toLowerCase().includes(searchLower) ||
      actionType.includes(searchLower) ||
      postId.includes(searchLower)
    );
  });

  // Format timestamp to relative time
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Format action details for display
  const formatDetails = (details: Record<string, unknown> | null | undefined) => {
    if (!details) return '';
    return Object.entries(details)
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join(', ');
  };

  // Format state changes
  const formatStateChange = (
    previous: Record<string, unknown> | null | undefined,
    current: Record<string, unknown> | null | undefined
  ) => {
    if (!previous && !current) return '';

    const prevStr = previous ? JSON.stringify(previous) : 'null';
    const currStr = current ? JSON.stringify(current) : 'null';

    return `${prevStr} → ${currStr}`;
  };

  // Download logs as CSV
  const downloadCSV = () => {
    const headers = [
      'Timestamp',
      'Agent',
      'Action Type',
      'Post ID',
      'Details',
      'Previous State',
      'New State',
    ];

    const rows = filteredLogs.map((log) => {
      const agentName = agents.get(log.agent_id)?.display_name || log.agent_id;
      return [
        log.created_at,
        agentName,
        log.action_type,
        log.post_id || '',
        formatDetails(log.action_details),
        JSON.stringify(log.previous_state),
        JSON.stringify(log.new_state),
      ];
    });

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Audit Log</h2>
          <p className="text-sm text-muted-foreground">
            Track all agent actions for compliance and debugging
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={fetchAuditLogs}
            variant="outline"
            size="sm"
            disabled={loading}
            data-testid="refresh-audit-log"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </Button>
          <Button
            onClick={downloadCSV}
            variant="outline"
            size="sm"
            disabled={logs.length === 0}
            data-testid="download-audit-log"
          >
            <Download size={14} />
            Download CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-background-secondary rounded-lg border border-border p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                data-testid="audit-log-search"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Filter size={14} className="text-muted-foreground" />
            <input
              type="text"
              placeholder="Agent ID"
              value={filters.agentId}
              onChange={(e) => setFilters({ ...filters, agentId: e.target.value })}
              className="w-32 px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              data-testid="filter-agent-id"
            />
            <input
              type="text"
              placeholder="Post ID"
              value={filters.postId}
              onChange={(e) => setFilters({ ...filters, postId: e.target.value })}
              className="w-32 px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              data-testid="filter-post-id"
            />
            <input
              type="text"
              placeholder="Action Type"
              value={filters.actionType}
              onChange={(e) => setFilters({ ...filters, actionType: e.target.value })}
              className="w-32 px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              data-testid="filter-action-type"
            />
            <Button
              onClick={fetchAuditLogs}
              variant="default"
              size="sm"
              data-testid="apply-filters"
            >
              Apply
            </Button>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && logs.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>Loading audit logs...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredLogs.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Filter size={48} className="mx-auto mb-3 opacity-50" />
          <p className="text-lg font-medium">No audit logs found</p>
          <p className="text-sm">Try adjusting your filters</p>
        </div>
      )}

      {/* Log List */}
      {!loading && !error && filteredLogs.length > 0 && (
        <div className="bg-background-secondary rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="audit-log-table">
              <thead className="bg-background-tertiary border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-foreground">Timestamp</th>
                  <th className="px-4 py-3 text-left font-medium text-foreground">Agent</th>
                  <th className="px-4 py-3 text-left font-medium text-foreground">Action</th>
                  <th className="px-4 py-3 text-left font-medium text-foreground">Post</th>
                  <th className="px-4 py-3 text-left font-medium text-foreground">Details</th>
                  <th className="px-4 py-3 text-left font-medium text-foreground">State Change</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => {
                  const agent = agents.get(log.agent_id);
                  const isCurrentAgent = log.agent_id === currentAgentId;

                  return (
                    <tr
                      key={log.id}
                      className="border-b border-border last:border-b-0 hover:bg-background-tertiary/50 transition-colors"
                      data-testid={`audit-log-entry-${log.id}`}
                    >
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {formatTimestamp(log.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">
                            {agent?.display_name || log.agent_id}
                          </span>
                          {isCurrentAgent && (
                            <span className="text-xs px-1.5 py-0.5 bg-primary/20 text-primary rounded">
                              You
                            </span>
                          )}
                          {agent && (
                            <span className="text-xs text-muted-foreground">({agent.role})</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-primary/10 text-primary rounded-md font-mono text-xs">
                          {log.action_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                        {log.post_id || '-'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
                        {formatDetails(log.action_details) || '-'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                        {formatStateChange(log.previous_state, log.new_state) || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Stats */}
          <div className="px-4 py-3 border-t border-border bg-background-tertiary/50 flex items-center justify-between text-xs text-muted-foreground">
            <span>Total: {filteredLogs.length} entries</span>
            <span>Showing all results</span>
          </div>
        </div>
      )}
    </div>
  );
}
