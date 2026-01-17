'use client';

import { Search, Filter } from 'lucide-react';
import { PostCard, type PostCardProps } from './post-card';

interface QueuePaneProps {
  onPostSelect?: (post: PostCardProps) => void;
  selectedPostId?: string | null;
}

// Mock data for initial development
const mockPosts: PostCardProps[] = [
  {
    id: '1',
    title: 'Unable to access my account after password reset',
    excerpt: 'I reset my password yesterday but still can\'t log in. The system keeps saying my credentials are invalid...',
    priority: 'P1',
    status: 'open',
    sentiment: 'negative',
    category: { name: 'Account Issues', color: '#eab308' },
    author: { name: 'john_doe', postCount: 1 },
    createdAt: '30m ago',
    responseCount: 0,
  },
  {
    id: '2',
    title: 'Feature request: Dark mode for mobile app',
    excerpt: 'Would love to see a dark mode option in the mobile application. My eyes get tired using the app at night...',
    priority: 'P3',
    status: 'open',
    sentiment: 'positive',
    category: { name: 'Feature Request', color: '#8b5cf6' },
    author: { name: 'sarah_w', postCount: 5 },
    createdAt: '2h ago',
    responseCount: 0,
  },
  {
    id: '3',
    title: 'Bug: Images not loading in posts',
    excerpt: 'Since the last update, images in community posts are not loading. Just shows a broken image icon...',
    priority: 'P2',
    status: 'in_progress',
    sentiment: 'negative',
    category: { name: 'Bug Reports', color: '#ef4444' },
    author: { name: 'tech_user', postCount: 12 },
    assignedTo: 'Agent A',
    createdAt: '5h ago',
    responseCount: 2,
  },
];

export function QueuePane({ onPostSelect, selectedPostId }: QueuePaneProps) {
  return (
    <aside className="w-80 bg-background-secondary border-r border-border flex flex-col min-w-[320px] max-w-[400px]">
      {/* Queue Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground mb-3">Moderation Queue</h2>

        {/* Search Bar */}
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4"
            size={16}
          />
          <input
            type="search"
            placeholder="Search posts..."
            className="w-full bg-background-tertiary border border-border rounded-md py-2 pl-9 pr-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="p-3 border-b border-border flex gap-2">
        <button className="flex-1 px-2 py-1.5 bg-background-tertiary border border-border rounded-md text-xs text-foreground-secondary hover:bg-background-hover transition-colors flex items-center justify-center gap-1">
          <Filter size={12} />
          Filters
        </button>
        <button className="flex-1 px-2 py-1.5 bg-background-tertiary border border-border rounded-md text-xs text-foreground-secondary hover:bg-background-hover transition-colors">
          Sort
        </button>
      </div>

      {/* Queue List */}
      <div className="flex-1 overflow-y-auto">
        {mockPosts.length > 0 ? (
          mockPosts.map((post) => (
            <PostCard
              key={post.id}
              {...post}
              isSelected={selectedPostId === post.id}
              onClick={() => onPostSelect?.(post)}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-64 p-6 text-center">
            <div className="w-12 h-12 bg-background-tertiary rounded-full flex items-center justify-center mb-3">
              <div className="text-2xl text-muted-foreground">+</div>
            </div>
            <p className="text-sm text-muted-foreground">No posts in queue</p>
            <p className="text-xs text-muted-foreground mt-1">Posts will appear here when available</p>
          </div>
        )}
      </div>

      {/* Queue Stats */}
      <div className="p-3 border-t border-border bg-background-secondary">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Total: {mockPosts.length}</span>
          <span>Open: {mockPosts.filter(p => p.status === 'open').length}</span>
        </div>
      </div>
    </aside>
  );
}
