import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/data-store';

/**
 * POST /api/v1/posts/:id/assign
 *
 * Assigns a post to an agent.
 *
 * Path Parameters:
 * - id: Post UUID
 *
 * Request Body:
 * - agent_id: UUID of the agent to assign the post to
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();

    if (!body.agent_id) {
      return NextResponse.json(
        { error: 'agent_id is required' },
        { status: 400 }
      );
    }

    const assignedPost = dataStore.assignPost(id, body.agent_id);

    if (!assignedPost) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: assignedPost,
      message: 'Post assigned successfully',
    });
  } catch (error) {
    console.error('Error in POST /api/v1/posts/:id/assign:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
