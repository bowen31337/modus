import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/data-store';
import { z } from 'zod';

/**
 * GET /api/v1/agents/:id
 *
 * Returns a single agent by ID.
 *
 * Response Format:
 * {
 *   "data": {
 *     "id": "agent-1",
 *     "user_id": "user-agent-1",
 *     "display_name": "Agent A",
 *     "avatar_url": null,
 *     "role": "agent",
 *     "status": "online",
 *     "last_active_at": "2025-01-17T10:00:00Z",
 *     "created_at": "2025-01-01T00:00:00Z"
 *   }
 * }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    console.log('[GET /api/v1/agents/:id] Request received for agent:', id);

    // Get agent from data store
    const agent = dataStore.getAgent(id);

    if (!agent) {
      console.log('[GET /api/v1/agents/:id] Agent not found:', id);
      return NextResponse.json({
        error: 'Agent not found',
      }, { status: 404 });
    }

    console.log('[GET /api/v1/agents/:id] Returning agent:', agent.id);

    return NextResponse.json({
      data: agent,
    }, { status: 200 });
  } catch (error) {
    console.error('[GET /api/v1/agents/:id] Error:', error);

    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// Validation schema for PATCH request
const updateAgentStatusSchema = z.object({
  status: z.enum(['online', 'offline', 'busy']),
});

/**
 * PATCH /api/v1/agents/:id
 *
 * Updates an agent's status (online, offline, busy).
 * Also updates the last_active_at timestamp.
 *
 * Request Body:
 * {
 *   "status": "online" | "offline" | "busy"
 * }
 *
 * Response Format:
 * {
 *   "data": {
 *     "id": "agent-1",
 *     "user_id": "user-agent-1",
 *     "display_name": "Agent A",
 *     "avatar_url": null,
 *     "role": "agent",
 *     "status": "online",
 *     "last_active_at": "2025-01-17T10:00:00Z",
 *     "created_at": "2025-01-01T00:00:00Z"
 *   },
 *   "message": "Agent status updated successfully"
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    console.log('[PATCH /api/v1/agents/:id] Request received for agent:', id);

    // Parse request body
    const body = await request.json();

    // Validate request body
    const validatedData = updateAgentStatusSchema.parse(body);

    console.log('[PATCH /api/v1/agents/:id] Updating status to:', validatedData.status);

    // Update agent status in data store
    const updatedAgent = dataStore.updateAgentStatus(id, validatedData.status);

    if (!updatedAgent) {
      console.log('[PATCH /api/v1/agents/:id] Agent not found:', id);
      return NextResponse.json({
        error: 'Agent not found',
      }, { status: 404 });
    }

    console.log('[PATCH /api/v1/agents/:id] Agent status updated:', updatedAgent.id);

    return NextResponse.json({
      data: updatedAgent,
      message: 'Agent status updated successfully',
    }, { status: 200 });
  } catch (error) {
    console.error('[PATCH /api/v1/agents/:id] Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid request body',
        details: error.errors,
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
