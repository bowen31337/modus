'use client';

import { useState, useEffect } from 'react';
import { LeftRail } from '@/features/layout/components/left-rail';
import { QueuePane } from '@/features/queue/components/queue-pane';
import { WorkPane } from '@/features/work/components/work-pane';
import { CommandPalette } from '@/features/layout/components/command-palette';
import { type PostCardProps } from '@/features/queue/components/post-card';

// Mock current agent for demo purposes
const CURRENT_AGENT = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  name: 'Agent A',
};

export default function DashboardPage() {
  const [selectedPost, setSelectedPost] = useState<PostCardProps | null>(null);
  const [assignedPosts, setAssignedPosts] = useState<Set<string>>(new Set());
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [forceReset, setForceReset] = useState(0);

  // Cmd+K keyboard shortcut to open command palette
  useEffect(() => {
    console.log('[DashboardPage] useEffect running');
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K (Mac) or Ctrl+K (Windows/Linux) opens command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        console.log('[DashboardPage] Cmd+K detected, opening command palette');
        setIsCommandPaletteOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    // Add a visible marker to the DOM for testing
    const marker = document.createElement('div');
    marker.id = 'cmd-k-listener-attached';
    marker.style.display = 'none';
    document.body.appendChild(marker);
    console.log('[DashboardPage] Marker created');

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      // Remove the marker
      const m = document.getElementById('cmd-k-listener-attached');
      if (m) m.remove();
    };
  }, []);

  const handlePostSelect = async (post: PostCardProps) => {
    // Auto-assign on click if not already assigned
    if (!assignedPosts.has(post.id)) {
      try {
        const response = await fetch(`/api/v1/posts/${post.id}/assign`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agent_id: CURRENT_AGENT.id }),
        });

        if (response.ok) {
          setAssignedPosts(prev => new Set(prev).add(post.id));
        } else {
          console.error('Failed to assign post:', await response.text());
        }
      } catch (error) {
        console.error('Error assigning post:', error);
      }
    }
    setSelectedPost(post);
  };

  const handleAssignToMe = async () => {
    if (selectedPost) {
      try {
        const response = await fetch(`/api/v1/posts/${selectedPost.id}/assign`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agent_id: CURRENT_AGENT.id }),
        });

        if (response.ok) {
          setAssignedPosts(prev => new Set(prev).add(selectedPost.id));
        } else {
          console.error('Failed to assign post:', await response.text());
        }
      } catch (error) {
        console.error('Error assigning post:', error);
      }
    }
  };

  const handleRelease = async () => {
    if (selectedPost) {
      try {
        const response = await fetch(`/api/v1/posts/${selectedPost.id}/release`, {
          method: 'POST',
        });

        if (response.ok) {
          setAssignedPosts(prev => {
            const newSet = new Set(prev);
            newSet.delete(selectedPost.id);
            return newSet;
          });
        } else {
          console.error('Failed to release post:', await response.text());
        }
      } catch (error) {
        console.error('Error releasing post:', error);
      }
    }
    // Note: We keep the detail view open after release so the user can see
    // the post and choose to reassign. The post is removed from assignedPosts
    // but remains selected.
  };

  const handleCloseDetail = () => {
    // Close the detail view and return to queue (called by Escape key)
    setSelectedPost(null);
    // Force QueuePane to reset its keyboard focus state
    setForceReset(prev => prev + 1);
  };

  const handleResolve = async () => {
    if (!selectedPost) return;

    try {
      const response = await fetch(`/api/v1/posts/${selectedPost.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'resolved' }),
      });

      if (response.ok) {
        // Successfully resolved - post will be updated in queue via refetch
        // For now, just clear the selected post
        setSelectedPost(null);
      } else {
        console.error('Failed to resolve post:', await response.text());
      }
    } catch (error) {
      console.error('Error resolving post:', error);
    }
  };

  const handleReassign = async (postId: string, toAgentId: string) => {
    try {
      const response = await fetch(`/api/v1/posts/${postId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_id: toAgentId }),
      });

      if (response.ok) {
        // Remove from current agent's assigned posts
        setAssignedPosts(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });

        // Log the reassignment (in production, this would be an audit log entry)
        console.log(`Reassigned post ${postId} to agent ${toAgentId}`);
      } else {
        console.error('Failed to reassign post:', await response.text());
      }
    } catch (error) {
      console.error('Error reassigning post:', error);
    }
  };

  const handleCommandPaletteNavigate = (path: string) => {
    // Handle navigation from command palette
    if (path === '/dashboard/settings') {
      // Navigate to settings
      console.log('Navigating to settings');
    } else if (path === '/login') {
      // Handle logout
      console.log('Logging out');
    } else {
      console.log('Navigating to:', path);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left Rail - 64px fixed width */}
      <LeftRail />

      {/* Queue Pane - 320-400px fixed width */}
      <QueuePane
        forceReset={forceReset}
        onPostSelect={handlePostSelect}
        selectedPostId={selectedPost?.id ?? null}
      />

      {/* Work Pane - Flexible, fills remaining space */}
      <WorkPane
        selectedPost={selectedPost}
        currentAgent={CURRENT_AGENT}
        assignedPosts={assignedPosts}
        onAssignToMe={handleAssignToMe}
        onRelease={handleRelease}
        onResolve={handleResolve}
        onCloseDetail={handleCloseDetail}
        onReassign={handleReassign}
      />

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={handleCommandPaletteNavigate}
      />
    </div>
  );
}
