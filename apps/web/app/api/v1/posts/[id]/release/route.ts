import { checkRole } from '@/lib/role-check';
import { dataStore } from '@/lib/data-store';
import { requireCsrfProtection } from '@/lib/csrf';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/v1/posts/:id/release
 *
 * Releases the assignment of a post, making it available for other agents.
 * Requires agent role or higher.
 *
 * Path Parameters:
 * - id: Post UUID
 *
 * Request Body:
 * - agent_id: UUID of the agent releasing the post (for audit logging)
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    const agentId = body.agent_id;

    const releasedPost = dataStore.releasePost(id, agentId);

    if (!releasedPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({
      data: releasedPost,
      message: 'Post released successfully',
    });
  } catch (error) {
    console.error('Error in POST /api/v1/posts/:id/release:', error);

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
