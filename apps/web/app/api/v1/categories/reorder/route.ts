import { csrfErrorResponse, requireCsrfProtection } from '@/lib/csrf';
import { checkRole } from '@/lib/role-check';
import { dataStore } from '@/lib/data-store';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema for reorder request
const reorderSchema = z.object({
  categoryIds: z.array(z.string()).min(1, 'At least one category ID is required'),
});

/**
 * POST /api/v1/categories/reorder
 *
 * Reorders categories by position.
 * Requires admin role.
 *
 * Request Body:
 * {
 *   "categoryIds": ["cat-3", "cat-1", "cat-2", "cat-4", "cat-5"]
 * }
 *
 * Response Format:
 * {
 *   "data": [
 *     {
 *       "id": "cat-3",
 *       "name": "Bug Reports",
 *       "position": 1,
 *       ...
 *     },
 *     ...
 *   ],
 *   "message": "Categories reordered successfully"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Check for admin role
    const hasAccess = await checkRole('admin');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Validate CSRF token for state-changing operation
    try {
      await requireCsrfProtection(request);
    } catch (csrfError) {
      return csrfErrorResponse();
    }

    console.log('[POST /api/v1/categories/reorder] Request received');

    // Parse request body
    const body = await request.json();

    // Validate request body
    const validatedData = reorderSchema.parse(body);

    console.log('[POST /api/v1/categories/reorder] Reordering categories');

    // Reorder categories in data store
    const updatedCategories = dataStore.reorderCategories(validatedData.categoryIds);

    console.log('[POST /api/v1/categories/reorder] Categories reordered:', updatedCategories.length);

    return NextResponse.json(
      {
        data: updatedCategories,
        message: 'Categories reordered successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[POST /api/v1/categories/reorder] Error:', error);

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
