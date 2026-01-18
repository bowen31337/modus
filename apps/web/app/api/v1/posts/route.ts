import { csrfErrorResponse, requireCsrfProtection } from '@/lib/csrf';
import { dataStore } from '@/lib/data-store';
import { type PostsQuery, generatePostEmbedding, postsQuerySchema } from '@modus/logic';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

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

    // Debug logging
    console.log('[GET /api/v1/posts] Request received');
    const allPosts = dataStore.getAllPosts();
    console.log('[GET /api/v1/posts] Total posts in dataStore:', allPosts.length);

    // Parse and validate query parameters
    const queryParams: Record<string, unknown> = {};
    for (const [key, value] of searchParams.entries()) {
      if (key === 'priority') {
        // Handle array parameter
        const priorities = searchParams.getAll('priority');
        queryParams.priority = priorities;
      } else if (key === 'page' || key === 'limit') {
        queryParams[key] = Number.parseInt(value, 10);
      } else {
        queryParams[key] = value;
      }
    }

    const validatedQuery = postsQuerySchema.parse(queryParams) as PostsQuery;

    // Get all posts from data store
    let posts = allPosts;

    // Apply filters
    if (validatedQuery.category_id) {
      posts = posts.filter((post) => post.category_id === validatedQuery.category_id);
    }

    if (validatedQuery.status) {
      posts = posts.filter((post) => post.status === validatedQuery.status);
    }

    if (validatedQuery.priority && validatedQuery.priority.length > 0) {
      posts = posts.filter((post) => validatedQuery.priority?.includes(post.priority));
    }

    if (validatedQuery.assigned_to_id) {
      posts = posts.filter((post) => post.assigned_to_id === validatedQuery.assigned_to_id);
    }

    if (validatedQuery.date_from) {
      // Set to start of day to include all posts from that date
      const fromDate = new Date(validatedQuery.date_from);
      fromDate.setHours(0, 0, 0, 0);
      posts = posts.filter((post) => new Date(post.created_at) >= fromDate);
    }

    if (validatedQuery.date_to) {
      // Set to end of day to include all posts from that date
      const toDate = new Date(validatedQuery.date_to);
      toDate.setHours(23, 59, 59, 999);
      posts = posts.filter((post) => new Date(post.created_at) <= toDate);
    }

    if (validatedQuery.search) {
      const searchTerm = validatedQuery.search.toLowerCase();
      posts = posts.filter(
        (post) =>
          post.title.toLowerCase().includes(searchTerm) ||
          post.body_content.toLowerCase().includes(searchTerm)
      );
    }

    // Apply sorting
    posts.sort((a, b) => {
      let comparison = 0;

      switch (validatedQuery.sort_by) {
        case 'priority': {
          // Priority order: P1 < P2 < P3 < P4 < P5
          const priorityOrder = { P1: 1, P2: 2, P3: 3, P4: 4, P5: 5 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        }

        case 'date':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;

        case 'status': {
          const statusOrder = { open: 1, in_progress: 2, resolved: 3 };
          comparison = statusOrder[a.status] - statusOrder[b.status];
          break;
        }

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

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================================
// POST /api/v1/posts
// ============================================================================

/**
 * Create a new moderation post with automatic embedding generation
 *
 * Request Body:
 * - title: Post title (required, max 500 chars)
 * - body_content: Post content (required)
 * - excerpt: Optional excerpt (max 300 chars)
 * - category_id: Optional category UUID
 * - status: Post status (open, in_progress, resolved) - default: open
 * - priority: Priority level (P1, P2, P3, P4, P5) - default: P4
 * - sentiment_score: Optional sentiment score (-1 to 1)
 * - sentiment_label: Optional sentiment label (negative, neutral, positive)
 * - author_user_id: Author user ID (required, UUID)
 * - author_post_count: Number of posts by this author (required)
 * - assigned_to_id: Optional agent ID to assign to
 * - embedding: Optional pre-computed embedding array (1536 dimensions)
 *
 * Response:
 * - data: The created post with generated embedding
 * - message: Success message
 */
const createPostInputSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500, 'Title must be 500 characters or less'),
  body_content: z.string().min(1, 'Body content is required'),
  excerpt: z.string().max(300, 'Excerpt must be 300 characters or less').optional(),
  category_id: z.string().uuid().optional().nullable(),
  status: z.enum(['open', 'in_progress', 'resolved']).default('open'),
  priority: z.enum(['P1', 'P2', 'P3', 'P4', 'P5']).default('P4'),
  sentiment_score: z.number().min(-1).max(1).optional().nullable(),
  sentiment_label: z.enum(['negative', 'neutral', 'positive']).optional().nullable(),
  author_user_id: z.string().uuid('Author user ID must be a valid UUID'),
  author_post_count: z.number().int().min(0, 'Author post count must be 0 or greater'),
  assigned_to_id: z.string().uuid().optional().nullable(),
  embedding: z.array(z.number()).length(1536).optional().nullable(),
  created_at: z.string().datetime().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Validate CSRF token for state-changing operation
    try {
      await requireCsrfProtection(request);
    } catch (csrfError) {
      return csrfErrorResponse();
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedInput = createPostInputSchema.parse(body);

    // Generate embedding if not provided
    const embedding = validatedInput.embedding ?? generatePostEmbedding(validatedInput);

    // Create the post
    const post = dataStore.createPost({
      ...validatedInput,
      embedding,
    });

    return NextResponse.json(
      {
        data: post,
        message: 'Post created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/v1/posts:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
