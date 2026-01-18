import { csrfErrorResponse, requireCsrfProtection } from '@/lib/csrf';
import { dataStore } from '@/lib/data-store';
import { createResponseInputSchema, updateResponseInputSchema } from '@modus/logic';
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

    // For demo purposes, use a hardcoded agent ID
    // In production, this would come from the authenticated user's session
    const demoAgentId = 'agent-1';

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

/**
 * PUT /api/v1/posts/:id/responses/:responseId
 *
 * Updates an existing response for a moderation post.
 *
 * Path Parameters:
 * - id: Post UUID
 * - responseId: Response UUID
 *
 * Request Body:
 * - content: Response content (optional, min 1 character if provided)
 * - is_internal_note: Whether this is an internal note (optional)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; responseId: string }> }
) {
  try {
    const { id, responseId } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    if (!responseId) {
      return NextResponse.json({ error: 'Response ID is required' }, { status: 400 });
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
    const validatedInput = updateResponseInputSchema.parse(body);

    // For demo purposes, use a hardcoded agent ID
    // In production, this would come from the authenticated user's session
    const demoAgentId = 'agent-1';

    // Update the response
    const response = dataStore.updateResponse(responseId, demoAgentId, {
      content: validatedInput.content,
      is_internal_note: validatedInput.is_internal_note,
    });

    if (!response) {
      return NextResponse.json(
        { error: 'Response not found or you do not have permission to edit it' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        data: response,
        message: 'Response updated successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in PUT /api/v1/posts/:id/responses/:responseId:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid request body', details: error }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/v1/posts/:id/responses/:responseId
 *
 * Deletes an existing response for a moderation post.
 *
 * Path Parameters:
 * - id: Post UUID
 * - responseId: Response UUID
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; responseId: string }> }
) {
  try {
    const { id, responseId } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    if (!responseId) {
      return NextResponse.json({ error: 'Response ID is required' }, { status: 400 });
    }

    // Verify the post exists
    const post = dataStore.getPostById(id);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // For demo purposes, use a hardcoded agent ID
    // In production, this would come from the authenticated user's session
    const demoAgentId = 'agent-1';

    // Delete the response
    const deleted = dataStore.deleteResponse(responseId, demoAgentId);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Response not found or you do not have permission to delete it' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: 'Response deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in DELETE /api/v1/posts/:id/responses/:responseId:', error);

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
