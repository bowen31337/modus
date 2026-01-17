import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/data-store';
import { postsQuerySchema, type PostsQuery } from '@modus/logic';

/**
 * GET /api/v1/posts
 *
 * Returns a paginated list of moderation posts with filtering and sorting.
 *
 * Query Parameters:
 * - category_id: Filter by category UUID
 * - status: Filter by status (open, in_progress, resolved)
 * - priority: Array of priorities to include (P1, P2, P3, P4, P5)
 * - assigned_to_id: Filter by assigned agent UUID
 * - date_from: ISO datetime string for start date filter
 * - date_to: ISO datetime string for end date filter
 * - search: Full-text search across title and body_content
 * - sort_by: Field to sort by (priority, date, status)
 * - sort_order: Sort order (asc, desc)
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse and validate query parameters
    const queryParams: Record<string, unknown> = {};
    for (const [key, value] of searchParams.entries()) {
      if (key === 'priority') {
        // Handle array parameter
        const priorities = searchParams.getAll('priority');
        queryParams.priority = priorities;
      } else if (key === 'page' || key === 'limit') {
        queryParams[key] = parseInt(value, 10);
      } else {
        queryParams[key] = value;
      }
    }

    const validatedQuery = postsQuerySchema.parse(queryParams) as PostsQuery;

    // Get all posts from data store
    let posts = dataStore.getAllPosts();

    // Apply filters
    if (validatedQuery.category_id) {
      posts = posts.filter(post => post.category_id === validatedQuery.category_id);
    }

    if (validatedQuery.status) {
      posts = posts.filter(post => post.status === validatedQuery.status);
    }

    if (validatedQuery.priority && validatedQuery.priority.length > 0) {
      posts = posts.filter(post => validatedQuery.priority!.includes(post.priority));
    }

    if (validatedQuery.assigned_to_id) {
      posts = posts.filter(post => post.assigned_to_id === validatedQuery.assigned_to_id);
    }

    if (validatedQuery.date_from) {
      const fromDate = new Date(validatedQuery.date_from);
      posts = posts.filter(post => new Date(post.created_at) >= fromDate);
    }

    if (validatedQuery.date_to) {
      const toDate = new Date(validatedQuery.date_to);
      posts = posts.filter(post => new Date(post.created_at) <= toDate);
    }

    if (validatedQuery.search) {
      const searchTerm = validatedQuery.search.toLowerCase();
      posts = posts.filter(
        post =>
          post.title.toLowerCase().includes(searchTerm) ||
          post.body_content.toLowerCase().includes(searchTerm)
      );
    }

    // Apply sorting
    posts.sort((a, b) => {
      let comparison = 0;

      switch (validatedQuery.sort_by) {
        case 'priority':
          // Priority order: P1 < P2 < P3 < P4 < P5
          const priorityOrder = { P1: 1, P2: 2, P3: 3, P4: 4, P5: 5 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;

        case 'date':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;

        case 'status':
          const statusOrder = { open: 1, in_progress: 2, resolved: 3 };
          comparison = statusOrder[a.status] - statusOrder[b.status];
          break;

        default:
          comparison = 0;
      }

      return validatedQuery.sort_order === 'desc' ? -comparison : comparison;
    });

    // Calculate pagination
    const total = posts.length;
    const offset = (validatedQuery.page - 1) * validatedQuery.limit;
    const paginatedPosts = posts.slice(offset, offset + validatedQuery.limit);

    return NextResponse.json({
      data: paginatedPosts,
      meta: {
        total,
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        pages: Math.ceil(total / validatedQuery.limit),
      },
    });
  } catch (error) {
    console.error('Error in GET /api/v1/posts:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
