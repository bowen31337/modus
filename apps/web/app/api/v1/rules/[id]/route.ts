import { checkRole } from '@/lib/role-check';
import { type UpdateRuleInput, dataStore } from '@/lib/data-store';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/v1/rules/[id]
 *
 * Returns a specific priority rule by ID.
 * Requires admin role.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Check for admin role (demo mode defaults to admin)
    const isAdmin = await checkRole('admin');
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const rule = dataStore.getRuleById(id);

    if (!rule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    return NextResponse.json({
      data: rule,
    });
  } catch (error) {
    console.error('Error in GET /api/v1/rules/[id]:', error);

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/v1/rules/[id]
 *
 * Updates an existing priority rule.
 * Requires admin role.
 *
 * Request Body:
 * {
 *   name?: string;
 *   description?: string;
 *   condition_type?: string;
 *   condition_value?: string;
 *   action_type?: string;
 *   action_value?: string;
 *   is_active?: boolean;
 * }
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Check for admin role (demo mode defaults to admin)
    const isAdmin = await checkRole('admin');
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const input: UpdateRuleInput = {
      name: body.name,
      description: body.description,
      condition_type: body.condition_type,
      condition_value: body.condition_value,
      action_type: body.action_type,
      action_value: body.action_value,
      is_active: body.is_active,
    };

    const rule = dataStore.updateRule(id, input);

    if (!rule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    return NextResponse.json({
      data: rule,
    });
  } catch (error) {
    console.error('Error in PATCH /api/v1/rules/[id]:', error);

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/v1/rules/[id]
 *
 * Deletes a priority rule.
 * Requires admin role.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check for admin role (demo mode defaults to admin)
    const isAdmin = await checkRole('admin');
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const deleted = dataStore.deleteRule(id);

    if (!deleted) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Rule deleted successfully',
    });
  } catch (error) {
    console.error('Error in DELETE /api/v1/rules/[id]:', error);

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
