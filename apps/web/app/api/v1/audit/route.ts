import { checkRole } from '@/lib/role-check';
import { dataStore } from '@/lib/data-store';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/v1/audit
 *
 * Retrieves audit log entries with optional filtering and pagination.
 * Requires admin role.
 *
 * Query Parameters:
 * - agent_id: Filter by agent ID
 * - post_id: Filter by post ID
 * - action_type: Filter by action type
 * - limit: Number of entries to return (default: 100, max: 1000)
 * - offset: Pagination offset (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    // Check for admin role (demo mode defaults to admin)
    const isAdmin = await checkRole('admin');
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);

    const agentId = searchParams.get('agent_id');
    const postId = searchParams.get('post_id');
    const actionType = searchParams.get('action_type');
    const limit = Math.min(Number(searchParams.get('limit') || 100), 1000);
    const offset = Number(searchParams.get('offset') || 0);

    const logs = dataStore.getAuditLogs({
      agentId: agentId || undefined,
      postId: postId || undefined,
      actionType: actionType || undefined,
      limit,
      offset,
    });

    const total = dataStore.getAuditLogCount();

    return NextResponse.json({
      data: logs,
      meta: {
        total,
        count: logs.length,
        limit,
        offset,
        has_more: offset + logs.length < total,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/v1/audit:', error);

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/v1/audit
 *
 * Manually record an audit log entry.
 * This endpoint is primarily for testing or special cases where
 * audit logging needs to be triggered manually.
 * Requires admin role.
 *
 * Request Body:
 * - agent_id: UUID of the agent performing the action (required)
 * - action_type: Type of action (required)
 * - post_id: UUID of the related post (optional)
 * - action_details: Additional context (optional)
 * - previous_state: Previous state before change (optional)
 * - new_state: New state after change (optional)
 */
export async function POST(request: NextRequest) {
  try {
    // Check for admin role (demo mode defaults to admin)
    const isAdmin = await checkRole('admin');
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await request.json();

    const { agent_id, action_type, post_id, action_details, previous_state, new_state } = body;

    if (!agent_id) {
      return NextResponse.json({ error: 'agent_id is required' }, { status: 400 });
    }

    if (!action_type) {
      return NextResponse.json({ error: 'action_type is required' }, { status: 400 });
    }

    const auditLog = dataStore.recordAuditLog(
      agent_id,
      action_type,
      post_id,
      action_details,
      previous_state,
      new_state
    );

    return NextResponse.json({
      data: auditLog,
      message: 'Audit log entry created successfully',
    });
  } catch (error) {
    console.error('Error in POST /api/v1/audit:', error);

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
