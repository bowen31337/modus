'use client';

/**
 * PresenceIndicator Component
 *
 * Displays real-time presence information showing which agents are currently viewing a post.
 * Shows agent avatars, names, and status with visual indicators.
 */

import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Eye, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface Presence {
  post_id: string;
  agent_id: string;
  agent_name: string;
  agent_status: 'online' | 'offline' | 'busy';
  timestamp: string;
}

interface PresenceIndicatorProps {
  postId: string;
  currentAgentId?: string;
  className?: string;
  showLabel?: boolean;
  compact?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function PresenceIndicator({
  postId,
  currentAgentId,
  className,
  showLabel = true,
  compact = false,
}: PresenceIndicatorProps) {
  const [presences, setPresences] = useState<Presence[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter out current agent from presence list
  const otherAgents = presences.filter((p) => p.agent_id !== currentAgentId);
  const viewingCount = otherAgents.length;

  // Fetch presence data
  useEffect(() => {
    if (!postId) return;

    const fetchPresence = async () => {
      try {
        const response = await fetch(`/api/v1/presence?post_id=${postId}`);
        if (response.ok) {
          const data = await response.json();
          setPresences(data.presences || []);
        }
      } catch (error) {
        console.error('Error fetching presence:', error);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchPresence();

    // Poll for updates every 2 seconds
    const interval = setInterval(fetchPresence, 2000);

    return () => clearInterval(interval);
  }, [postId]);

  // Update current agent's presence
  useEffect(() => {
    if (!postId || !currentAgentId) return;

    const updatePresence = async () => {
      try {
        await fetch('/api/v1/presence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            post_id: postId,
            agent_id: currentAgentId,
          }),
        });
      } catch (error) {
        console.error('Error updating presence:', error);
      }
    };

    // Initial update
    updatePresence();

    // Update every 30 seconds to keep presence alive
    const interval = setInterval(updatePresence, 30000);

    return () => {
      // Clean up presence when unmounting
      fetch(`/api/v1/presence?post_id=${postId}&agent_id=${currentAgentId}`, {
        method: 'DELETE',
      }).catch(console.error);
      clearInterval(interval);
    };
  }, [postId, currentAgentId]);

  // Don't show anything if no one else is viewing
  if (loading || viewingCount === 0) {
    return null;
  }

  // Compact mode: just show count
  if (compact) {
    return (
      <div
        className={cn('flex items-center gap-1.5 text-xs text-muted-foreground', className)}
        data-testid="presence-indicator"
      >
        <Users className="w-3 h-3" />
        <span className="font-medium">{viewingCount}</span>
      </div>
    );
  }

  // Full mode: show avatars and names
  return (
    <div
      className={cn(
        'flex items-center gap-2 px-2 py-1.5 bg-background-tertiary/50 rounded-md border border-border/60',
        className
      )}
      data-testid="presence-indicator"
    >
      <Eye className="w-3.5 h-3.5 text-muted-foreground" />
      {showLabel && (
        <span className="text-xs text-muted-foreground">
          {viewingCount === 1 ? 'Viewed by' : 'Viewed by'}:
        </span>
      )}
      <div className="flex items-center gap-1.5">
        {otherAgents.slice(0, 3).map((presence) => (
          <div
            key={presence.agent_id}
            className="flex items-center gap-1.5 px-2 py-0.5 bg-background-secondary rounded-full border border-border/60"
            title={`${presence.agent_name} (${presence.agent_status})`}
          >
            <div
              className={cn(
                'w-2 h-2 rounded-full',
                presence.agent_status === 'online' && 'bg-green-500',
                presence.agent_status === 'busy' && 'bg-yellow-500',
                presence.agent_status === 'offline' && 'bg-gray-400'
              )}
            />
            <span className="text-xs font-medium text-foreground">{presence.agent_name}</span>
          </div>
        ))}
        {otherAgents.length > 3 && (
          <span className="text-xs text-muted-foreground">+{otherAgents.length - 3} more</span>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Avatar-Only Variant
// ============================================================================

interface PresenceAvatarProps {
  presences: Presence[];
  currentAgentId?: string;
  max?: number;
  className?: string;
}

export function PresenceAvatars({
  presences,
  currentAgentId,
  max = 3,
  className,
}: PresenceAvatarProps) {
  const otherAgents = presences.filter((p) => p.agent_id !== currentAgentId);
  const visible = otherAgents.slice(0, max);
  const remaining = Math.max(0, otherAgents.length - max);

  if (otherAgents.length === 0) return null;

  return (
    <div className={cn('flex items-center -space-x-2', className)} data-testid="presence-avatars">
      {visible.map((presence) => (
        <Avatar
          key={presence.agent_id}
          name={presence.agent_name}
          size="sm"
          status={presence.agent_status}
          className="ring-2 ring-background"
          data-testid={`presence-avatar-${presence.agent_id}`}
        />
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            'rounded-full bg-muted border-2 border-background flex items-center justify-center',
            'w-8 h-8 text-xs font-medium text-muted-foreground'
          )}
          data-testid="presence-avatars-more"
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
