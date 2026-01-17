import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/data-store';

/**
 * POST /api/v1/posts/:id/release
 *
 * Releases the assignment of a post, making it available for other agents.
 *
 * Path Parameters:
 * - id: Post UUID
 */
export async function POST(
  _request: NextRequest,
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

    const releasedPost = dataStore.releasePost(id);

    if (!releasedPost) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: releasedPost,
      message: 'Post released successfully',
    });
  } catch (error) {
    console.error('Error in POST /api/v1/posts/:id/release:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
