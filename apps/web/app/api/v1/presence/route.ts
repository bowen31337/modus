import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/data-store';
import { requireCsrfProtection, csrfErrorResponse } from '@/lib/csrf';

// ============================================================================
// GET /api/v1/presence?post_id=xxx
// Get all presence records for a specific post
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const postId = searchParams.get('post_id');

    if (!postId) {
      return NextResponse.json(
        { error: 'post_id query parameter is required' },
        { status: 400 }
      );
    }

    const presences = dataStore.getPresenceForPost(postId);

    return NextResponse.json({
      presences,
      count: presences.length,
    });
  } catch (error) {
    console.error('Error fetching presence:', error);
    return NextResponse.json(
      { error: 'Failed to fetch presence data' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/v1/presence
// Add or update presence for a post
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Validate CSRF token for state-changing operation
    try {
      await requireCsrfProtection(request);
    } catch (csrfError) {
      return csrfErrorResponse();
    }

    const body = await request.json();
    const { post_id, agent_id, agent_name, agent_status } = body;

    if (!post_id || !agent_id) {
      return NextResponse.json(
        { error: 'post_id and agent_id are required' },
        { status: 400 }
      );
    }

    // Get agent info if not provided
    let agentName = agent_name;
    let agentStatus = agent_status;

    if (!agentName || !agentStatus) {
      const agent = dataStore.getAgent(agent_id);
      if (!agent) {
        return NextResponse.json(
          { error: 'Agent not found' },
          { status: 404 }
        );
      }
      agentName = agent.display_name;
      agentStatus = agent.status;
    }

    const presence = dataStore.addPresence(
      post_id,
      agent_id,
      agentName,
      agent_status || 'online'
    );

    return NextResponse.json(presence, { status: 200 });
  } catch (error) {
    console.error('Error updating presence:', error);
    return NextResponse.json(
      { error: 'Failed to update presence' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/v1/presence?post_id=xxx&agent_id=yyy
// Remove presence for a post
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    // Validate CSRF token for state-changing operation
    try {
      await requireCsrfProtection(request);
    } catch (csrfError) {
      return csrfErrorResponse();
    }

    const searchParams = request.nextUrl.searchParams;
    const postId = searchParams.get('post_id');
    const agentId = searchParams.get('agent_id');

    if (!postId || !agentId) {
      return NextResponse.json(
        { error: 'post_id and agent_id query parameters are required' },
        { status: 400 }
      );
    }

    dataStore.removePresence(postId, agentId);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error removing presence:', error);
    return NextResponse.json(
      { error: 'Failed to remove presence' },
      { status: 500 }
    );
  }
}
