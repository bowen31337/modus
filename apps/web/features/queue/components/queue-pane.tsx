'use client';

import { ErrorState } from '@/components/ui/error-state';
import { Search } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FilterChips } from './filter-chips';
import { FilterControls, type FilterState, isDateInRange } from './filter-controls';
import { PostCard, type PostCardProps } from './post-card';
import { PostCardSkeleton } from './post-card-skeleton';
import { SortControls, type SortState } from './sort-controls';
import { type ViewMode, ViewToggle } from './view-toggle';

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

// Helper function to map category name to category ID
const getCategoryIdByName = (categoryName: string): string | null => {
  const categoryMap: Record<string, string> = {
    'Account Issues': '11111111-1111-1111-1111-111111111111',
    'Feature Request': '22222222-2222-2222-2222-222222222222',
    'Bug Reports': '33333333-3333-3333-3333-333333333333',
    'Help & Support': '44444444-4444-4444-4444-444444444444',
    'Policy & Guidelines': '55555555-5555-5555-5555-555555555555',
  };
  return categoryMap[categoryName] || null;
};

export function QueuePane({ forceReset, onPostSelect, selectedPostId }: QueuePaneProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize filters from URL query parameters
  const [filters, setFilters] = useState<FilterState>({
    category: (searchParams.get('category') as FilterState['category']) || 'all',
    status: (searchParams.get('status') as FilterState['status']) || 'all',
    priority: (searchParams.get('priority') as FilterState['priority']) || 'all',
    search: searchParams.get('search') || '',
    dateRange: (() => {
      const startDate = searchParams.get('dateFrom');
      const endDate = searchParams.get('dateTo');
      if (startDate || endDate) {
        return { startDate: startDate || '', endDate: endDate || '' };
      }
      return undefined;
    })(),
  });

  // Initialize sort from URL query parameters
  const [sort, setSort] = useState<SortState>({
    field: (searchParams.get('sortBy') as SortState['field']) || 'priority',
    order: (searchParams.get('sortOrder') as SortState['order']) || 'desc',
  });

  // Initialize view mode from URL query parameters
  const [viewMode, setViewMode] = useState<ViewMode>(
    (searchParams.get('view') as ViewMode) || 'list'
  );

  // API state
  const [posts, setPosts] = useState<PostCardProps[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      excerpt: apiPost.excerpt || `${apiPost.body_content.substring(0, 150)}...`,
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
  const fetchPosts = useCallback(
    async (page: number, reset = false) => {
      console.log('[QueuePane] fetchPosts called', { page, reset, loadingRef: loadingRef.current });
      if (loadingRef.current) {
        console.log('[QueuePane] fetchPosts skipped - already loading');
        return;
      }

      setLoading(true);
      setError(null); // Clear previous errors
      try {
        // Build query parameters
        const params = new URLSearchParams({
          page: page.toString(),
          limit: POSTS_PER_PAGE.toString(),
          sort_by: sort.field,
          sort_order: sort.order,
        });
        console.log('[QueuePane] Fetching from API:', `/api/v1/posts?${params.toString()}`);

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
        // Category filter - map category name to category_id
        if (filters.category !== 'all') {
          const categoryId = getCategoryIdByName(filters.category);
          if (categoryId) {
            params.append('category_id', categoryId);
          }
        }
        // Date range filter
        if (filters.dateRange?.startDate) {
          params.append('date_from', filters.dateRange.startDate);
        }
        if (filters.dateRange?.endDate) {
          params.append('date_to', filters.dateRange.endDate);
        }

        const url = `/api/v1/posts?${params.toString()}`;
        console.log('[QueuePane] Fetching posts from:', url);
        console.log('[QueuePane] Current filters:', JSON.stringify(filters));
        console.log('[QueuePane] Current sort:', JSON.stringify(sort));
        const response = await fetch(url);
        console.log('[QueuePane] API response status:', response.status);
        if (!response.ok) {
          const errorText = await response.text();
          console.error('[QueuePane] API error response:', errorText);
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: ApiPostsResponse = await response.json();
        console.log('[QueuePane] API response data:', JSON.stringify(data).substring(0, 500));

        // Transform API posts to PostCardProps
        const transformedPosts = data.data.map(transformApiPost);

        if (reset) {
          setPosts(transformedPosts);
        } else {
          setPosts((prev) => [...prev, ...transformedPosts]);
        }

        setTotalPosts(data.meta.total);
        setHasMore(page < data.meta.pages);
        setCurrentPage(page);
      } catch (error) {
        console.error('Error fetching posts:', error);
        // Set user-friendly error message - always use consistent message for UI
        setError('Failed to load posts');
        // On error, keep existing posts or show empty state
        if (reset) {
          setPosts([]);
        }
      } finally {
        setLoading(false);
      }
    },
    [filters, sort, transformApiPost]
  );

  // Initial fetch and refetch when filters/sort change
  useEffect(() => {
    console.log('[QueuePane] useEffect triggered - filters or sort changed', { filters, sort });
    // Reset and fetch when filters or sort change
    setPosts([]);
    setCurrentPage(1);
    setHasMore(true);
    console.log('[QueuePane] About to call fetchPosts(1, true)');
    fetchPosts(1, true);
    // Note: fetchPosts is intentionally not in the dependency array
    // to prevent infinite loops. The function internally uses filters/sort
    // which are already in the deps, and we only want to refetch when
    // those values change, not when the callback is recreated.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, sort]);

  // Sync filters, sort, and view mode to URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(searchParams);

    // Update filter parameters
    if (filters.category !== 'all') {
      params.set('category', filters.category);
    } else {
      params.delete('category');
    }

    if (filters.status !== 'all') {
      params.set('status', filters.status);
    } else {
      params.delete('status');
    }

    if (filters.priority !== 'all') {
      params.set('priority', filters.priority);
    } else {
      params.delete('priority');
    }

    if (filters.search) {
      params.set('search', filters.search);
    } else {
      params.delete('search');
    }

    if (filters.dateRange?.startDate) {
      params.set('dateFrom', filters.dateRange.startDate);
    } else {
      params.delete('dateFrom');
    }

    if (filters.dateRange?.endDate) {
      params.set('dateTo', filters.dateRange.endDate);
    } else {
      params.delete('dateTo');
    }

    // Update sort parameters
    if (sort.field !== 'priority') {
      params.set('sortBy', sort.field);
    } else {
      params.delete('sortBy');
    }

    if (sort.order !== 'desc') {
      params.set('sortOrder', sort.order);
    } else {
      params.delete('sortOrder');
    }

    // Update view mode parameter
    if (viewMode !== 'list') {
      params.set('view', viewMode);
    } else {
      params.delete('view');
    }

    // Only update URL if there are changes (avoid infinite loops)
    const currentParams = searchParams.toString();
    const newParams = params.toString();

    if (currentParams !== newParams) {
      // Use replace instead of push to avoid cluttering browser history
      // for filter changes (only push when user explicitly navigates)
      router.replace(`/dashboard?${newParams}`, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, sort, viewMode]);

  // Sync from URL to state when URL changes externally (e.g., browser back/forward)
  useEffect(() => {
    const urlCategory = (searchParams.get('category') as FilterState['category']) || 'all';
    const urlStatus = (searchParams.get('status') as FilterState['status']) || 'all';
    const urlPriority = (searchParams.get('priority') as FilterState['priority']) || 'all';
    const urlSearch = searchParams.get('search') || '';
    const urlDateFrom = searchParams.get('dateFrom');
    const urlDateTo = searchParams.get('dateTo');
    const urlSortBy = (searchParams.get('sortBy') as SortState['field']) || 'priority';
    const urlSortOrder = (searchParams.get('sortOrder') as SortState['order']) || 'desc';
    const urlView = (searchParams.get('view') as ViewMode) || 'list';

    const urlDateRange =
      urlDateFrom || urlDateTo
        ? { startDate: urlDateFrom || '', endDate: urlDateTo || '' }
        : undefined;

    // Check if URL state differs from current state
    const needsFilterUpdate =
      filters.category !== urlCategory ||
      filters.status !== urlStatus ||
      filters.priority !== urlPriority ||
      filters.search !== urlSearch ||
      JSON.stringify(filters.dateRange) !== JSON.stringify(urlDateRange);

    const needsSortUpdate = sort.field !== urlSortBy || sort.order !== urlSortOrder;

    const needsViewUpdate = viewMode !== urlView;

    if (needsFilterUpdate) {
      setFilters({
        category: urlCategory,
        status: urlStatus,
        priority: urlPriority,
        search: urlSearch,
        dateRange: urlDateRange,
      });
    }

    if (needsSortUpdate) {
      setSort({
        field: urlSortBy,
        order: urlSortOrder,
      });
    }

    if (needsViewUpdate) {
      setViewMode(urlView);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

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
        const cardElement = document.querySelector(
          `[data-testid="post-card-${currentPosts[newIndex]?.id}"]`
        );
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

        console.log(
          `[K key] currentIndex: ${currentIndex}, newIndex: ${newIndex}, posts length: ${currentPosts.length}`
        );

        // Scroll the focused item into view
        const cardElement = document.querySelector(
          `[data-testid="post-card-${currentPosts[newIndex]?.id}"]`
        );
        if (cardElement) {
          cardElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        setFocusedIndex(newIndex);
      }

      // Enter key: select the focused post
      if (e.key === 'Enter') {
        const currentPosts = postsRef.current;
        const currentIndex = focusedIndexRef.current;
        console.log(
          `[Enter key] posts length: ${currentPosts.length}, focusedIndex: ${currentIndex}`
        );
        console.log(
          '[Enter key] posts content:',
          JSON.stringify(currentPosts.map((p) => ({ id: p?.id, title: p?.title })))
        );
        if (currentPosts.length > 0) {
          e.preventDefault();
          const focusedPost = currentPosts[currentIndex];
          console.log(
            `[Enter key] focusedPost: ${focusedPost?.id}, onPostSelect exists: ${!!onPostSelectRef.current}`
          );
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
  const filteredPosts = posts.filter((post) => {
    // Apply category filter
    if (filters.category !== 'all' && post.category?.name !== filters.category) {
      return false;
    }

    // Apply date range filter
    if (filters.dateRange?.startDate || filters.dateRange?.endDate) {
      if (
        !isDateInRange(post.createdAt, filters.dateRange?.startDate, filters.dateRange?.endDate)
      ) {
        return false;
      }
    }

    return true;
  });

  // Sort posts locally for display
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    let comparison = 0;

    switch (sort.field) {
      case 'priority': {
        const priorityOrder = { P1: 1, P2: 2, P3: 3, P4: 4, P5: 5 };
        comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
        return sort.order === 'asc' ? -comparison : comparison;
      }
      case 'date':
        comparison = a.createdAt.localeCompare(b.createdAt);
        return sort.order === 'asc' ? comparison : -comparison;
      case 'status': {
        const statusOrder = { open: 1, in_progress: 2, resolved: 3 };
        comparison = statusOrder[a.status] - statusOrder[b.status];
        return sort.order === 'asc' ? comparison : -comparison;
      }
      case 'response_count':
        comparison = (a.responseCount || 0) - (b.responseCount || 0);
        return sort.order === 'asc' ? comparison : -comparison;
    }

    return comparison;
  });

  return (
    <aside
      className="w-80 bg-background-secondary border-r border-border flex flex-col min-w-[320px] max-w-[400px]"
      data-testid="queue-pane"
    >
      {/* Queue Header */}
      <div className="p-4 border-b border-border">
        <h1 className="text-lg font-semibold text-foreground mb-3">Moderation Queue</h1>

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
        <SortControls sort={sort} onSortChange={setSort} />
        <div className="ml-auto">
          <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
        </div>
      </div>

      {/* Active Filter Chips */}
      <FilterChips filters={filters} onFiltersChange={setFilters} />

      {/* Queue List */}
      <div className="flex-1 overflow-y-auto" ref={queueContainerRef}>
        {loading && posts.length === 0 && !error ? (
          <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-3 p-3' : ''}>
            {/* Show 5 skeleton cards during initial load */}
            {Array.from({ length: 5 }).map((_, index) => (
              <PostCardSkeleton key={`skeleton-${index}`} viewMode={viewMode} />
            ))}
          </div>
        ) : error && posts.length === 0 ? (
          <ErrorState
            message="Failed to load posts"
            details="There was a problem loading the moderation queue. Please check your connection and try again."
            onRetry={() => fetchPosts(1, true)}
            showRetry
          />
        ) : sortedPosts.length > 0 ? (
          <>
            <div
              className={viewMode === 'grid' ? 'grid grid-cols-2 gap-3 p-3' : ''}
              data-testid="queue-container"
            >
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
              <div className="text-center p-4 text-xs text-muted-foreground">End of list</div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 p-6 text-center">
            <div className="w-12 h-12 bg-background-tertiary rounded-full flex items-center justify-center mb-3">
              <div className="text-2xl text-muted-foreground">+</div>
            </div>
            <p className="text-sm text-muted-foreground">No posts match your filters</p>
            <p className="text-xs text-muted-foreground mt-1">
              Try adjusting your search or filters
            </p>
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
