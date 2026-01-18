import { dataStore } from '@/lib/data-store';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/v1/rules/reorder
 *
 * Reorders priority rules based on the provided array of rule IDs.
 *
 * Request Body:
 * {
 *   ruleIds: string[];
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ruleIds } = body;

    if (!Array.isArray(ruleIds)) {
      return NextResponse.json({ error: 'ruleIds must be an array' }, { status: 400 });
    }

    const rules = dataStore.reorderRules(ruleIds);

    return NextResponse.json({
      data: rules,
      message: 'Rules reordered successfully',
    });
  } catch (error) {
    console.error('Error in POST /api/v1/rules/reorder:', error);

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
