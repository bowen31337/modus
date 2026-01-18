import { csrfErrorResponse, requireCsrfProtection } from '@/lib/csrf';
import { checkRole } from '@/lib/role-check';
import { dataStore } from '@/lib/data-store';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * GET /api/v1/agents/:id
 *
 * Returns a single agent by ID.
 * Requires admin role.
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
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Check for admin role (demo mode defaults to admin)
    const isAdmin = await checkRole('admin');
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { id } = await params;

    console.log('[GET /api/v1/agents/:id] Request received for agent:', id);

    // Get agent from data store
    const agent = dataStore.getAgent(id);

    if (!agent) {
      console.log('[GET /api/v1/agents/:id] Agent not found:', id);
      return NextResponse.json(
        {
          error: 'Agent not found',
        },
        { status: 404 }
      );
    }

    console.log('[GET /api/v1/agents/:id] Returning agent:', agent.id);

    return NextResponse.json(
      {
        data: agent,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[GET /api/v1/agents/:id] Error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Validation schema for PATCH request - Status Update
const updateAgentStatusSchema = z.object({
  status: z.enum(['online', 'offline', 'busy']),
});

// Validation schema for PATCH request - Profile Update
const updateAgentProfileSchema = z.object({
  display_name: z.string().min(2).max(50).optional(),
  avatar_url: z.string().url().nullable().optional(),
});

// Validation schema for PATCH request - Role Update (Admin only)
const updateAgentRoleSchema = z.object({
  role: z.enum(['agent', 'supervisor', 'admin', 'moderator']),
});

/**
 * PATCH /api/v1/agents/:id
 *
 * Updates an agent's status, profile information, or role.
 * Also updates the last_active_at timestamp.
 *
 * Request Body (Status Update):
 * {
 *   "status": "online" | "offline" | "busy"
 * }
 *
 * Request Body (Profile Update):
 * {
 *   "display_name": "Agent A",
 *   "avatar_url": "https://example.com/avatar.jpg" | null
 * }
 *
 * Request Body (Role Update - Admin only):
 * {
 *   "role": "agent" | "supervisor" | "admin" | "moderator"
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
 *   "message": "Agent updated successfully"
 * }
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    console.log('[PATCH /api/v1/agents/:id] Request received for agent:', id);

    // Validate CSRF token for state-changing operation
    try {
      await requireCsrfProtection(request);
    } catch (csrfError) {
      return csrfErrorResponse();
    }

    // Parse request body
    const body = await request.json();

    // Determine update type based on request body
    let updatedAgent: ReturnType<
      | typeof dataStore.updateAgentStatus
      | typeof dataStore.updateAgentProfile
      | typeof dataStore.updateAgentRole
    >;
    let message: string;

    if ('status' in body) {
      // Status update - any authenticated user can update their own status
      const validatedData = updateAgentStatusSchema.parse(body);
      console.log('[PATCH /api/v1/agents/:id] Updating status to:', validatedData.status);

      updatedAgent = dataStore.updateAgentStatus(id, validatedData.status);
      message = 'Agent status updated successfully';
    } else if ('display_name' in body || 'avatar_url' in body) {
      // Profile update - any authenticated user can update their own profile
      const validatedData = updateAgentProfileSchema.parse(body);
      console.log('[PATCH /api/v1/agents/:id] Updating profile:', validatedData);

      updatedAgent = dataStore.updateAgentProfile(id, validatedData);
      message = 'Agent profile updated successfully';
    } else if ('role' in body) {
      // Role update (admin only)
      const isAdmin = await checkRole('admin');
      if (!isAdmin) {
        return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
      }

      const validatedData = updateAgentRoleSchema.parse(body);
      console.log('[PATCH /api/v1/agents/:id] Updating role to:', validatedData.role);

      updatedAgent = dataStore.updateAgentRole(id, validatedData.role);
      message = 'Agent role updated successfully';
    } else {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details:
            'Must provide either "status", profile fields (display_name, avatar_url), or "role"',
        },
        { status: 400 }
      );
    }

    if (!updatedAgent) {
      console.log('[PATCH /api/v1/agents/:id] Agent not found:', id);
      return NextResponse.json(
        {
          error: 'Agent not found',
        },
        { status: 404 }
      );
    }

    console.log('[PATCH /api/v1/agents/:id] Agent updated:', updatedAgent.id);

    return NextResponse.json(
      {
        data: updatedAgent,
        message,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[PATCH /api/v1/agents/:id] Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
