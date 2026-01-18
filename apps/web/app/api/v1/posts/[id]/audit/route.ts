import { checkRole } from '@/lib/role-check';
import { dataStore } from '@/lib/data-store';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/v1/posts/:id/audit
 *
 * Retrieves audit log entries for a specific post.
 * Requires admin role.
 *
 * Path Parameters:
 * - id: Post UUID
 *
 * Query Parameters:
 * - action_type: Filter by action type (optional)
 * - limit: Number of entries to return (default: 100, max: 1000)
 * - offset: Pagination offset (default: 0)
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Check for admin role
    const isAdmin = await checkRole('admin');
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const actionType = searchParams.get('action_type');
    const limit = Math.min(Number(searchParams.get('limit') || 100), 1000);
    const offset = Number(searchParams.get('offset') || 0);

    // Get all logs for the post, then filter by action type if specified
    let logs = dataStore.getAuditLogsForPost(id);

    if (actionType) {
      logs = logs.filter((log) => log.action_type === actionType);
    }

    // Apply pagination
    const paginatedLogs = logs.slice(offset, offset + limit);

    return NextResponse.json({
      data: paginatedLogs,
      meta: {
        post_id: id,
        total: logs.length,
        count: paginatedLogs.length,
        limit,
        offset,
        has_more: offset + paginatedLogs.length < logs.length,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/v1/posts/:id/audit:', error);

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
