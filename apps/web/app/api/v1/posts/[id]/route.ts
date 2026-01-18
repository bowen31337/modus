import { checkRole } from '@/lib/role-check';
import { dataStore } from '@/lib/data-store';
import { requireCsrfProtection } from '@/lib/csrf';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/v1/posts/:id
 *
 * Returns a single moderation post by ID.
 * Requires agent role or higher.
 *
 * Path Parameters:
 * - id: Post UUID
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Check for agent role or higher
    const hasAccess = await checkRole('agent');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden: Agent access required' }, { status: 403 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    const post = dataStore.getPostById(id);

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({
      data: post,
    });
  } catch (error) {
    console.error('Error in GET /api/v1/posts/:id:', error);

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/v1/posts/:id
 *
 * Updates a single moderation post by ID.
 * Requires agent role or higher.
 *
 * Path Parameters:
 * - id: Post UUID
 *
 * Request Body:
 * - status: New status (open, in_progress, resolved)
 * - priority: New priority (P1, P2, P3, P4, P5)
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Validate CSRF token for state-changing requests
    await requireCsrfProtection(request);

    // Check for agent role or higher
    const hasAccess = await checkRole('agent');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden: Agent access required' }, { status: 403 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    const body = await request.json();

    // Validate that at least one field is being updated
    if (!body.status && !body.priority) {
      return NextResponse.json(
        { error: 'At least one field (status or priority) must be provided' },
        { status: 400 }
      );
    }

    const updatedPost = dataStore.updatePost(id, body);

    if (!updatedPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({
      data: updatedPost,
    });
  } catch (error) {
    console.error('Error in PATCH /api/v1/posts/:id:', error);

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
