'use client';

import { useState } from 'react';
import { LeftRail } from '@/features/layout/components/left-rail';
import { QueuePane } from '@/features/queue/components/queue-pane';
import { type PostCardProps } from '@/features/queue/components/post-card';

export default function DashboardPage() {
  const [selectedPost, setSelectedPost] = useState<PostCardProps | null>(null);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left Rail - 64px fixed width */}
      <LeftRail />

      {/* Queue Pane - 320-400px fixed width */}
      <QueuePane
        onPostSelect={setSelectedPost}
        selectedPostId={selectedPost?.id ?? null}
      />

      {/* Work Pane - Flexible, fills remaining space */}
      {selectedPost ? (
        <div className="flex-1 flex flex-col p-6 overflow-y-auto">
          <div className="max-w-4xl w-full mx-auto">
            <h1 className="text-2xl font-semibold text-foreground mb-4">
              {selectedPost.title}
            </h1>
            <div className="bg-background-secondary rounded-lg p-4 border border-border">
              <p className="text-sm text-foreground-muted">{selectedPost.excerpt}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-foreground-muted">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Select a post</h2>
            <p className="text-sm">Choose a post from the queue to view details and respond</p>
          </div>
        </div>
      )}
    </div>
  );
}