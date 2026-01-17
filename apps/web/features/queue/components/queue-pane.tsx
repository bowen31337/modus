'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { PostCard, type PostCardProps } from './post-card';
import { FilterControls, type FilterState, isDateInRange } from './filter-controls';
import { SortControls, type SortState } from './sort-controls';
import { ViewToggle, type ViewMode } from './view-toggle';

interface QueuePaneProps {
  onPostSelect?: (post: PostCardProps) => void;
  selectedPostId?: string | null;
}

// Mock data for initial development
// Using ISO date format for proper date filtering
const mockPosts: PostCardProps[] = [
  {
    id: '1',
    title: 'Unable to access my account after password reset',
    excerpt: 'I reset my password yesterday but still can\'t log in. The system keeps saying my credentials are invalid...',
    bodyContent: 'I reset my password yesterday but still can\'t log in. The system keeps saying my credentials are invalid. I\'ve tried clearing my cache, using incognito mode, and even a different browser, but nothing works. I need to access my account urgently for work purposes. Please help me resolve this issue as soon as possible.',
    priority: 'P1',
    status: 'open',
    sentiment: 'negative',
    category: { name: 'Account Issues', color: '#eab308' },
    author: { name: 'john_doe', postCount: 1 },
    createdAt: '2025-01-18T10:30:00Z',
    responseCount: 0,
  },
  {
    id: '2',
    title: 'Feature request: Dark mode for mobile app',
    excerpt: 'Would love to see a dark mode option in the mobile application. My eyes get tired using the app at night...',
    bodyContent: 'Would love to see a dark mode option in the mobile application. My eyes get tired using the app at night, and the bright white background is really uncomfortable. Many other apps have this feature now, and it would be great if you could implement it. Maybe you could also add an automatic option that switches based on system settings.',
    priority: 'P3',
    status: 'open',
    sentiment: 'positive',
    category: { name: 'Feature Request', color: '#8b5cf6' },
    author: { name: 'sarah_w', postCount: 5 },
    createdAt: '2025-01-17T14:15:00Z',
    responseCount: 0,
  },
  {
    id: '3',
    title: 'Bug: Images not loading in posts',
    excerpt: 'Since the last update, images in community posts are not loading. Just shows a broken image icon...',
    bodyContent: 'Since the last update, images in community posts are not loading. Just shows a broken image icon where the images should be. This is happening on both desktop and mobile versions. I\'ve tried on different internet connections and the issue persists. It\'s really frustrating because images are a big part of the community experience.',
    priority: 'P2',
    status: 'in_progress',
    sentiment: 'negative',
    category: { name: 'Bug Reports', color: '#ef4444' },
    author: { name: 'tech_user', postCount: 12 },
    assignedTo: 'Agent A',
    createdAt: '2025-01-16T09:45:00Z',
    responseCount: 2,
  },
  {
    id: '4',
    title: 'Spam account posting promotional content',
    excerpt: 'This user keeps posting links to dubious websites. Multiple reports from community members...',
    bodyContent: 'This user keeps posting links to dubious websites. Multiple reports from community members. The posts are clearly spam and contain affiliate links to questionable products. They\'re posting multiple times per day and it\'s cluttering up the community feed. Please take action immediately.',
    priority: 'P1',
    status: 'open',
    sentiment: 'negative',
    category: { name: 'Spam', color: '#ec4899' },
    author: { name: 'spammer123', postCount: 15 },
    createdAt: '2025-01-18T02:20:00Z',
    responseCount: 0,
  },
  {
    id: '5',
    title: 'Harassment in community chat',
    excerpt: 'User is repeatedly sending abusive messages to other members. Need immediate intervention...',
    bodyContent: 'User is repeatedly sending abusive messages to other members. Need immediate intervention. This has been going on for days now and multiple users have reported feeling unsafe. The harassment includes personal attacks, threats, and hate speech. We need to ban this user before more people get hurt.',
    priority: 'P1',
    status: 'resolved',
    sentiment: 'negative',
    category: { name: 'Harassment', color: '#f97316' },
    author: { name: 'concerned_user', postCount: 8 },
    assignedTo: 'Agent B',
    createdAt: '2025-01-10T16:30:00Z',
    responseCount: 5,
  },
];

export function QueuePane({ onPostSelect, selectedPostId }: QueuePaneProps) {
  const [filters, setFilters] = useState<FilterState>({
    category: 'all',
    status: 'all',
    priority: 'all',
    search: '',
  });

  const [sort, setSort] = useState<SortState>({
    field: 'priority',
    order: 'desc',
  });

  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // Keyboard navigation state
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const queueContainerRef = useRef<HTMLDivElement>(null);

  // Use refs to avoid stale closures in keyboard handler
  const focusedIndexRef = useRef<number>(0);
  const filteredAndSortedPostsRef = useRef<PostCardProps[]>([]);
  const onPostSelectRef = useRef(onPostSelect);

  // Update refs when values change
  useEffect(() => {
    focusedIndexRef.current = focusedIndex;
  }, [focusedIndex]);

  useEffect(() => {
    onPostSelectRef.current = onPostSelect;
  }, [onPostSelect]);

  // Blur search input on mount to prevent it from capturing keyboard events
  useEffect(() => {
    const searchInput = document.querySelector('input[type="search"]');
    if (searchInput instanceof HTMLInputElement) {
      searchInput.blur();
    }
  }, []);

  // Filter and sort posts
  const filteredAndSortedPosts = useMemo(() => {
    let posts = [...mockPosts];

    // Apply filters
    if (filters.category !== 'all') {
      posts = posts.filter(p => p.category?.name === filters.category);
    }

    if (filters.status !== 'all') {
      posts = posts.filter(p => p.status === filters.status);
    }

    if (filters.priority !== 'all') {
      posts = posts.filter(p => p.priority === filters.priority);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      posts = posts.filter(p =>
        p.title.toLowerCase().includes(searchLower) ||
        p.excerpt.toLowerCase().includes(searchLower) ||
        (p.bodyContent && p.bodyContent.toLowerCase().includes(searchLower))
      );
    }

    // Apply date range filter
    if (filters.dateRange?.startDate || filters.dateRange?.endDate) {
      posts = posts.filter(p =>
        isDateInRange(p.createdAt, filters.dateRange?.startDate, filters.dateRange?.endDate)
      );
    }

    // Apply sorting
    posts.sort((a, b) => {
      let comparison = 0;

      switch (sort.field) {
        case 'priority':
          const priorityOrder = { P1: 1, P2: 2, P3: 3, P4: 4, P5: 5 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          // For priority: ascending = P1, P2, P3 (highest to lowest priority)
          // descending = P3, P2, P1 (lowest to highest priority)
          // But we want "desc" to mean highest priority first (P1, P2, P3)
          // So we flip the logic for priority
          return sort.order === 'asc' ? -comparison : comparison;
        case 'date':
          // Simple sort by createdAt string (in real app, use actual dates)
          comparison = a.createdAt.localeCompare(b.createdAt);
          return sort.order === 'asc' ? comparison : -comparison;
        case 'status':
          const statusOrder = { open: 1, in_progress: 2, resolved: 3 };
          comparison = statusOrder[a.status] - statusOrder[b.status];
          return sort.order === 'asc' ? comparison : -comparison;
        case 'response_count':
          comparison = (a.responseCount || 0) - (b.responseCount || 0);
          return sort.order === 'asc' ? comparison : -comparison;
      }

      return comparison;
    });

    return posts;
  }, [filters, sort]);

  // Update filteredAndSortedPostsRef after filteredAndSortedPosts is computed
  useEffect(() => {
    filteredAndSortedPostsRef.current = filteredAndSortedPosts;
  }, [filteredAndSortedPosts]);

  // Keyboard navigation handler - uses refs to avoid stale closures
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle keyboard navigation if user is typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      // J key: navigate down
      if (e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        const currentPosts = filteredAndSortedPostsRef.current;
        const currentIndex = focusedIndexRef.current;
        const newIndex = (currentIndex + 1) % currentPosts.length;

        console.log(`[J key] currentIndex: ${currentIndex}, newIndex: ${newIndex}, posts length: ${currentPosts.length}`);

        // Scroll the focused item into view
        const cardElement = document.querySelector(`[data-testid="post-card-${currentPosts[newIndex]?.id}"]`);
        if (cardElement) {
          cardElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        setFocusedIndex(newIndex);
      }

      // K key: navigate up
      if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        const currentPosts = filteredAndSortedPostsRef.current;
        const currentIndex = focusedIndexRef.current;
        const newIndex = currentIndex <= 0 ? currentPosts.length - 1 : currentIndex - 1;

        console.log(`[K key] currentIndex: ${currentIndex}, newIndex: ${newIndex}, posts length: ${currentPosts.length}`);

        // Scroll the focused item into view
        const cardElement = document.querySelector(`[data-testid="post-card-${currentPosts[newIndex]?.id}"]`);
        if (cardElement) {
          cardElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        setFocusedIndex(newIndex);
      }

      // Enter key: select the focused post
      if (e.key === 'Enter') {
        const currentPosts = filteredAndSortedPostsRef.current;
        console.log(`[Enter key] posts length: ${currentPosts.length}, focusedIndex: ${focusedIndexRef.current}`);
        if (currentPosts.length > 0) {
          e.preventDefault();
          const focusedPost = currentPosts[focusedIndexRef.current];
          console.log(`[Enter key] focusedPost: ${focusedPost?.id}, onPostSelect exists: ${!!onPostSelectRef.current}`);
          if (focusedPost && onPostSelectRef.current) {
            onPostSelectRef.current(focusedPost);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Reset focused index when filters change
  useEffect(() => {
    setFocusedIndex(0);
  }, [filters, sort]);

  return (
    <aside className="w-80 bg-background-secondary border-r border-border flex flex-col min-w-[320px] max-w-[400px]" data-testid="queue-pane">
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
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="w-full bg-background-tertiary border border-border rounded-md py-2 pl-9 pr-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Filters, Sort, and View Toggle */}
      <div className="p-3 border-b border-border flex gap-2 items-center">
        <FilterControls
          filters={filters}
          onFiltersChange={setFilters}
          postCount={filteredAndSortedPosts.length}
        />
        <SortControls
          sort={sort}
          onSortChange={setSort}
        />
        <div className="ml-auto">
          <ViewToggle
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        </div>
      </div>

      {/* Queue List */}
      <div className="flex-1 overflow-y-auto" ref={queueContainerRef}>
        {filteredAndSortedPosts.length > 0 ? (
          <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-3 p-3' : ''} data-testid="queue-container">
            {filteredAndSortedPosts.map((post, index) => {
              const isFocused = index === focusedIndex;
              return (
                <PostCard
                  key={post.id}
                  {...post}
                  isSelected={selectedPostId === post.id}
                  isKeyboardFocused={isFocused}
                  onClick={() => {
                    setFocusedIndex(index);
                    onPostSelect?.(post);
                  }}
                  viewMode={viewMode}
                />
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 p-6 text-center">
            <div className="w-12 h-12 bg-background-tertiary rounded-full flex items-center justify-center mb-3">
              <div className="text-2xl text-muted-foreground">+</div>
            </div>
            <p className="text-sm text-muted-foreground">No posts match your filters</p>
            <p className="text-xs text-muted-foreground mt-1">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Queue Stats */}
      <div className="p-3 border-t border-border bg-background-secondary">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Total: {filteredAndSortedPosts.length}</span>
          <span>Open: {filteredAndSortedPosts.filter(p => p.status === 'open').length}</span>
        </div>
      </div>
    </aside>
  );
}
