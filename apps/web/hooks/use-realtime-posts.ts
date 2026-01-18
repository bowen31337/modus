'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { ModerationPost } from '@modus/logic';

type PostUpdate = RealtimePostgresChangesPayload<ModerationPost>;

interface UseRealtimePostsOptions {
  enabled?: boolean;
  onPostUpdate?: (payload: PostUpdate) => void;
  onPostInsert?: (payload: PostUpdate) => void;
  onPostDelete?: (payload: PostUpdate) => void;
}

/**
 * Hook for subscribing to real-time updates on moderation_posts table.
 * Updates reflect across all connected clients within 2 seconds.
 *
 * @param options - Configuration options for the subscription
 * @returns Object containing subscription status and error state
 */
export function useRealtimePosts(options: UseRealtimePostsOptions = {}) {
  const { enabled = true, onPostUpdate, onPostInsert, onPostDelete } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled || !isSupabaseConfigured()) {
      return;
    }

    const supabase = createClient();
    if (!supabase) return;

    // Create a unique channel name
    const channelName = `moderation_posts_changes_${Date.now()}`;

    // Create channel
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'moderation_posts'
        },
        (payload: PostUpdate) => {
          console.log('[Realtime] Post change detected:', payload.eventType, (payload.new as Record<string, unknown>)?.id);

          // Call appropriate callback based on event type
          switch (payload.eventType) {
            case 'UPDATE':
              onPostUpdate?.(payload);
              break;
            case 'INSERT':
              onPostInsert?.(payload);
              break;
            case 'DELETE':
              onPostDelete?.(payload);
              break;
          }
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Subscription status:', status);

        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          setError(null);
        } else if (status === 'CHANNEL_ERROR') {
          const err = new Error('Realtime subscription failed');
          setError(err);
          setIsConnected(false);
        }
      });

    channelRef.current = channel;

    // Cleanup function
    return () => {
      console.log('[Realtime] Cleaning up subscription');
      if (channelRef.current && supabase) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setIsConnected(false);
    };
  }, [enabled, onPostUpdate, onPostInsert, onPostDelete]);

  return {
    isConnected,
    error
  };
}

/**
 * Hook for subscribing to real-time updates on a specific post.
 * Useful for the work pane to show updates to the currently viewed post.
 *
 * @param postId - The ID of the post to watch
 * @param onPostUpdate - Callback when the post is updated
 */
export function useRealtimePost(
  postId: string | null,
  onPostUpdate?: (payload: PostUpdate) => void
) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!postId || !isSupabaseConfigured()) {
      return;
    }

    const supabase = createClient();
    if (!supabase) return;

    const channelName = `post_${postId}_changes_${Date.now()}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'moderation_posts',
          filter: `id=eq.${postId}`
        },
        (payload: PostUpdate) => {
          console.log('[Realtime] Post update detected:', postId, payload);
          onPostUpdate?.(payload);
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Post subscription status:', status);

        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          setError(null);
        } else if (status === 'CHANNEL_ERROR') {
          const err = new Error('Post realtime subscription failed');
          setError(err);
          setIsConnected(false);
        }
      });

    channelRef.current = channel;

    return () => {
      console.log('[Realtime] Cleaning up post subscription');
      if (channelRef.current && supabase) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setIsConnected(false);
    };
  }, [postId, onPostUpdate]);

  return {
    isConnected,
    error
  };
}

/**
 * Hook for tracking agent presence in real-time.
 * Shows which agents are currently viewing or working on posts.
 */
export function useAgentPresence() {
  const [presenceState, setPresenceState] = useState<Map<string, any>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const trackPresence = useCallback((postId: string, presenceStatus: 'viewing' | 'editing') => {
    if (!isSupabaseConfigured()) {
      return;
    }

    const supabase = createClient();
    if (!supabase) return;

    const user = supabase.auth.getUser();

    user.then(({ data: { user } }) => {
      if (!user) return;

      const channelName = `presence_${postId}`;
      const channel = supabase.channel(channelName, {
        config: {
          presence: {
            key: user.id
          }
        }
      });

      channel.on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<Map<string, any>>();
        setPresenceState(new Map(Object.entries(state)));
      });

      channel.subscribe((subscriptionStatus) => {
        if (subscriptionStatus === 'SUBSCRIBED') {
          setIsConnected(true);
          // Track this user's presence
          channel.track({
            user_id: user.id,
            post_id: postId,
            status: presenceStatus,
            online_at: new Date().toISOString()
          });
        }
      });

      channelRef.current = channel;
    });
  }, []);

  const untrackPresence = useCallback(() => {
    if (channelRef.current && isSupabaseConfigured()) {
      const supabase = createClient();
      if (supabase) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        setIsConnected(false);
        setPresenceState(new Map());
      }
    }
  }, []);

  return {
    presenceState,
    isConnected,
    trackPresence,
    untrackPresence
  };
}
