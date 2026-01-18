import { csrfErrorResponse, requireCsrfProtection } from '@/lib/csrf';
import { dataStore } from '@/lib/data-store';
import { createResponseInputSchema } from '@modus/logic';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/v1/posts/:id/responses
 *
 * Creates a new response for a moderation post.
 *
 * Path Parameters:
 * - id: Post UUID
 *
 * Request Body:
 * - content: Response content (required, min 1 character)
 * - is_internal_note: Whether this is an internal note (default: false)
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    // Validate CSRF token for state-changing operation
    try {
      await requireCsrfProtection(request);
    } catch (csrfError) {
      return csrfErrorResponse();
    }

    // Verify the post exists
    const post = dataStore.getPostById(id);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const body = await request.json();

    // Validate input with Zod
    const validatedInput = createResponseInputSchema.parse(body);

    // For demo purposes, use a hardcoded agent ID that matches the frontend
    // In production, this would come from the authenticated user's session
    const demoAgentId = '550e8400-e29b-41d4-a716-446655440001';

    // Create the response
    const response = dataStore.createResponse({
      post_id: id,
      agent_id: demoAgentId,
      content: validatedInput.content,
      is_internal_note: validatedInput.is_internal_note,
    });

    return NextResponse.json(
      {
        data: response,
        message: 'Response created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/v1/posts/:id/responses:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid request body', details: error }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/v1/posts/:id/responses
 *
 * Returns all responses for a moderation post.
 *
 * Path Parameters:
 * - id: Post UUID
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    // Verify the post exists
    const post = dataStore.getPostById(id);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Get all responses for this post
    const responses = dataStore.getResponsesByPostId(id);

    return NextResponse.json({
      data: responses,
      meta: {
        total: responses.length,
        post_id: id,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/v1/posts/:id/responses:', error);

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Note: PUT and DELETE handlers for individual responses have been moved to:
// /api/v1/posts/[id]/responses/[responseId]/route.ts
// This is required for Next.js App Router to properly capture the responseId parameter
