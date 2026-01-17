import { NextRequest, NextResponse } from 'next/server';
import { dataStore, type CreateRuleInput } from '@/lib/data-store';

/**
 * GET /api/v1/rules
 *
 * Returns all priority rules, sorted by position.
 */
export async function GET() {
  try {
    const rules = dataStore.getAllRules();

    return NextResponse.json({
      data: rules,
      meta: {
        total: rules.length,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/v1/rules:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/rules
 *
 * Creates a new priority rule.
 *
 * Request Body:
 * {
 *   name: string;
 *   description?: string;
 *   condition_type: string;
 *   condition_value: string;
 *   action_type: string;
 *   action_value: string;
 *   is_active?: boolean;
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const input: CreateRuleInput = {
      name: body.name,
      description: body.description,
      condition_type: body.condition_type,
      condition_value: body.condition_value,
      action_type: body.action_type,
      action_value: body.action_value,
      is_active: body.is_active,
    };

    // Validate required fields
    if (!input.name || !input.condition_type || !input.condition_value || !input.action_type || !input.action_value) {
      return NextResponse.json(
        { error: 'Missing required fields: name, condition_type, condition_value, action_type, action_value' },
        { status: 400 }
      );
    }

    const rule = dataStore.createRule(input);

    return NextResponse.json(
      { data: rule },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/v1/rules:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request body', details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
