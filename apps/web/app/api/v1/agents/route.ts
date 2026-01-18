import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/data-store';

/**
 * GET /api/v1/agents
 *
 * Returns a list of all agents with their current status.
 *
 * Response Format:
 * {
 *   "data": [
 *     {
 *       "id": "agent-1",
 *       "user_id": "user-agent-1",
 *       "display_name": "Agent A",
 *       "avatar_url": null,
 *       "role": "agent",
 *       "status": "online",
 *       "last_active_at": "2025-01-17T10:00:00Z",
 *       "created_at": "2025-01-01T00:00:00Z"
 *     }
 *   ],
 *   "meta": {
 *     "total": 3
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[GET /api/v1/agents] Request received');

    // Get all agents from data store
    const agents = dataStore.getAllAgents();

    console.log('[GET /api/v1/agents] Returning', agents.length, 'agents');

    return NextResponse.json({
      data: agents,
      meta: {
        total: agents.length,
      },
    }, { status: 200 });
  } catch (error) {
    console.error('[GET /api/v1/agents] Error:', error);

    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
