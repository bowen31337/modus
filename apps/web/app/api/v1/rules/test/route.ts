import { checkRole } from '@/lib/role-check';
import { type TestRuleInput, dataStore } from '@/lib/data-store';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/v1/rules/test
 *
 * Tests a rule (or all active rules) against sample post data.
 * Requires admin role.
 *
 * Request Body:
 * {
 *   title: string;
 *   body_content: string;
 *   author_post_count: number;
 *   sentiment_score?: number;
 *   category_id?: string;
 *   created_at?: string;
 *   ruleId?: string;  // Optional: test a specific rule
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Check for admin role
    const isAdmin = await checkRole('admin');
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { ruleId, ...testInput } = body;

    // Validate required fields
    if (!testInput.title || !testInput.body_content || testInput.author_post_count === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: title, body_content, author_post_count' },
        { status: 400 }
      );
    }

    const input: TestRuleInput = {
      title: testInput.title,
      body_content: testInput.body_content,
      author_post_count: testInput.author_post_count,
      sentiment_score: testInput.sentiment_score,
      category_id: testInput.category_id,
      created_at: testInput.created_at,
    };

    const result = dataStore.testRule(input, ruleId);

    return NextResponse.json({
      data: result,
    });
  } catch (error) {
    console.error('Error in POST /api/v1/rules/test:', error);

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
