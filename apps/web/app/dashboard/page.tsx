'use client';

import { useState } from 'react';
import { LeftRail } from '@/features/layout/components/left-rail';
import { QueuePane } from '@/features/queue/components/queue-pane';
import { WorkPane } from '@/features/work/components/work-pane';
import { type PostCardProps } from '@/features/queue/components/post-card';

// Mock current agent for demo purposes
const CURRENT_AGENT = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  name: 'Agent A',
};

export default function DashboardPage() {
  const [selectedPost, setSelectedPost] = useState<PostCardProps | null>(null);
  const [assignedPosts, setAssignedPosts] = useState<Set<string>>(new Set());

  const handlePostSelect = (post: PostCardProps) => {
    // Auto-assign on click if not already assigned
    if (!assignedPosts.has(post.id)) {
      setAssignedPosts(prev => new Set(prev).add(post.id));
    }
    setSelectedPost(post);
  };

  const handleAssignToMe = () => {
    if (selectedPost) {
      setAssignedPosts(prev => new Set(prev).add(selectedPost.id));
    }
  };

  const handleRelease = () => {
    if (selectedPost) {
      setAssignedPosts(prev => {
        const newSet = new Set(prev);
        newSet.delete(selectedPost.id);
        return newSet;
      });
    }
    // Keep the detail view open so user can reassign
  };

  const handleCloseDetail = () => {
    // Close the detail view and return to queue (called by Escape key)
    setSelectedPost(null);
  };

  const handleResolve = () => {
    // In a real app, this would update the post status via API
  };

  const handleReassign = (postId: string, toAgentId: string) => {
    // Remove from current agent's assigned posts
    setAssignedPosts(prev => {
      const newSet = new Set(prev);
      newSet.delete(postId);
      return newSet;
    });

    // In a real app, this would:
    // 1. Update the post's assigned_to field in the database
    // 2. Send a notification to the new agent
    // 3. Log the reassignment in the audit trail
    console.log(`Reassigned post ${postId} to agent ${toAgentId}`);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left Rail - 64px fixed width */}
      <LeftRail />

      {/* Queue Pane - 320-400px fixed width */}
      <QueuePane
        onPostSelect={handlePostSelect}
        selectedPostId={selectedPost?.id ?? null}
        assignedPosts={assignedPosts}
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
    </div>
  );
}
