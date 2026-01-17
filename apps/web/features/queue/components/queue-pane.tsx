'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { PostCard, type PostCardProps } from './post-card';
import { PostCardSkeleton } from './post-card-skeleton';
import { FilterControls, type FilterState, isDateInRange } from './filter-controls';
import { SortControls, type SortState } from './sort-controls';
import { ViewToggle, type ViewMode } from './view-toggle';

interface QueuePaneProps {
  forceReset?: number;
  onPostSelect?: (post: PostCardProps) => void;
  selectedPostId?: string | null;
}

// API response type for posts
interface ApiPost {
  id: string;
  title: string;
  body_content: string;
  excerpt?: string;
  status: 'open' | 'in_progress' | 'resolved';
  priority: 'P1' | 'P2' | 'P3' | 'P4' | 'P5';
  sentiment_label?: 'negative' | 'neutral' | 'positive' | null;
  sentiment_score?: number | null;
  category_id?: string;
  category?: {
    id: string;
    name: string;
    color: string;
  };
  author_user_id: string;
  author_post_count: number;
  assigned_to_id?: string | null;
  assigned_agent?: {
    id: string;
    display_name: string;
  } | null;
  assigned_at?: string | null;
  created_at: string;
  updated_at: string;
  resolved_at?: string | null;
  response_count?: number;
}

interface ApiPostsResponse {
  data: ApiPost[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// Constants for API pagination
const POSTS_PER_PAGE = 20;

export function QueuePane({ forceReset, onPostSelect, selectedPostId }: QueuePaneProps) {
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

  // API state
  const [posts, setPosts] = useState<PostCardProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);

  // Keyboard navigation state
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const queueContainerRef = useRef<HTMLDivElement>(null);

  // Refs for keyboard handler
  const focusedIndexRef = useRef<number>(0);
  const postsRef = useRef<PostCardProps[]>([]);
  const onPostSelectRef = useRef(onPostSelect);
  const loadingRef = useRef(false);

  // Update refs when values change
  useEffect(() => {
    focusedIndexRef.current = focusedIndex;
  }, [focusedIndex]);

  useEffect(() => {
    postsRef.current = posts;
  }, [posts]);

  useEffect(() => {
    onPostSelectRef.current = onPostSelect;
  }, [onPostSelect]);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  // Reset focused index when forceReset changes (e.g., when closing detail view)
  useEffect(() => {
    if (forceReset && forceReset > 0) {
      setFocusedIndex(0);
    }
  }, [forceReset]);

  // Blur search input on mount to prevent it from capturing keyboard events
  useEffect(() => {
    const searchInput = document.querySelector('input[type="search"]');
    if (searchInput instanceof HTMLInputElement) {
      searchInput.blur();
    }
  }, []);

  // Transform API post to PostCardProps
  const transformApiPost = useCallback((apiPost: ApiPost): PostCardProps => {
    return {
      id: apiPost.id,
      title: apiPost.title,
      excerpt: apiPost.excerpt || apiPost.body_content.substring(0, 150) + '...',
      bodyContent: apiPost.body_content,
      priority: apiPost.priority,
      status: apiPost.status,
      sentiment: apiPost.sentiment_label || undefined,
      category: apiPost.category,
      author: {
        name: apiPost.author_user_id,
        postCount: apiPost.author_post_count,
      },
      assignedTo: apiPost.assigned_agent?.display_name || undefined,
      createdAt: apiPost.created_at,
      responseCount: apiPost.response_count || 0,
    };
  }, []);

  // Fetch posts from API
  const fetchPosts = useCallback(async (page: number, reset: boolean = false) => {
    if (loadingRef.current) return;

    setLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: POSTS_PER_PAGE.toString(),
        sort_by: sort.field,
        sort_order: sort.order,
      });

      // Add filters
      if (filters.status !== 'all') {
        params.append('status', filters.status);
      }
      if (filters.priority !== 'all') {
        params.append('priority', filters.priority);
      }
      if (filters.search) {
        params.append('search', filters.search);
      }
      // Note: category filter would need category_id, not name
      // Date range would use date_from and date_to

      const response = await fetch(`/api/v1/posts?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiPostsResponse = await response.json();

      // Transform API posts to PostCardProps
      const transformedPosts = data.data.map(transformApiPost);

      if (reset) {
        setPosts(transformedPosts);
      } else {
        setPosts(prev => [...prev, ...transformedPosts]);
      }

      setTotalPosts(data.meta.total);
      setHasMore(page < data.meta.pages);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching posts:', error);
      // On error, keep existing posts or show empty state
      if (reset) {
        setPosts([]);
      }
    } finally {
      setLoading(false);
    }
  }, [filters, sort, transformApiPost]);

  // Initial fetch and refetch when filters/sort change
  useEffect(() => {
    // Reset and fetch when filters or sort change
    setPosts([]);
    setCurrentPage(1);
    setHasMore(true);
    fetchPosts(1, true);
  }, [filters, sort, fetchPosts]);

  // Keyboard navigation handler
  useEffect(() => {
    console.log('[QueuePane] Keyboard event listener ATTACHED!');
    // Add a marker to the DOM for testing
    const marker = document.createElement('div');
    marker.id = 'keyboard-handler-attached';
    marker.style.display = 'none';
    document.body.appendChild(marker);

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle keyboard navigation if user is typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      // J key: navigate down
      if (e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        const currentPosts = postsRef.current;
        const currentIndex = focusedIndexRef.current;
        const newIndex = (currentIndex + 1) % currentPosts.length;

        console.log('[QueuePane] J key pressed', {
          currentPostsLength: currentPosts.length,
          currentIndex,
          newIndex,
        });

        // Scroll the focused item into view
        const cardElement = document.querySelector(`[data-testid="post-card-${currentPosts[newIndex]?.id}"]`);
        if (cardElement) {
          cardElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        setFocusedIndex(newIndex);
      }

      // K key: navigate up (but not when Cmd/Ctrl is pressed - that's a shortcut)
      if ((e.key === 'k' || e.key === 'K') && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        const currentPosts = postsRef.current;
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
        const currentPosts = postsRef.current;
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
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      // Remove the marker
      const m = document.getElementById('keyboard-handler-attached');
      if (m) m.remove();
    };
  }, []);

  // Reset focused index when filters or sort change
  useEffect(() => {
    setFocusedIndex(0);
  }, [filters, sort]);

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    if (!queueContainerRef.current || loading || !hasMore) return;

    const container = queueContainerRef.current;
    const scrollBottom = container.scrollTop + container.clientHeight;
    const threshold = container.scrollHeight - 200; // Load more when 200px from bottom

    if (scrollBottom >= threshold) {
      fetchPosts(currentPage + 1);
    }
  }, [loading, hasMore, currentPage, fetchPosts]);

  // Attach scroll listener
  useEffect(() => {
    const container = queueContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Filter posts locally for display (client-side filtering for already loaded posts)
  // Note: In production, all filtering would be done server-side via API
  const filteredPosts = posts.filter(post => {
    // Apply category filter
    if (filters.category !== 'all' && post.category?.name !== filters.category) {
      return false;
    }

    // Apply date range filter
    if (filters.dateRange?.startDate || filters.dateRange?.endDate) {
      if (!isDateInRange(post.createdAt, filters.dateRange?.startDate, filters.dateRange?.endDate)) {
        return false;
      }
    }

    return true;
  });

  // Sort posts locally for display
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    let comparison = 0;

    switch (sort.field) {
      case 'priority':
        const priorityOrder = { P1: 1, P2: 2, P3: 3, P4: 4, P5: 5 };
        comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
        return sort.order === 'asc' ? -comparison : comparison;
      case 'date':
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
          postCount={sortedPosts.length}
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
        {loading && posts.length === 0 ? (
          <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-3 p-3' : ''}>
            {/* Show 5 skeleton cards during initial load */}
            {Array.from({ length: 5 }).map((_, index) => (
              <PostCardSkeleton key={`skeleton-${index}`} viewMode={viewMode} />
            ))}
          </div>
        ) : sortedPosts.length > 0 ? (
          <>
            <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-3 p-3' : ''} data-testid="queue-container">
              {sortedPosts.map((post, index) => {
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
            {loading && (
              <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-3 p-3' : ''}>
                {/* Show 2 skeleton cards when loading more */}
                {Array.from({ length: 2 }).map((_, index) => (
                  <PostCardSkeleton key={`skeleton-more-${index}`} viewMode={viewMode} />
                ))}
              </div>
            )}
            {!hasMore && sortedPosts.length > 0 && (
              <div className="text-center p-4 text-xs text-muted-foreground">
                End of list
              </div>
            )}
          </>
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
          <span>Total: {totalPosts}</span>
          <span>Loaded: {posts.length}</span>
        </div>
      </div>
    </aside>
  );
}
