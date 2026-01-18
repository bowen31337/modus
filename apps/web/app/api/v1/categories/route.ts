import { csrfErrorResponse, requireCsrfProtection } from '@/lib/csrf';
import { checkRole } from '@/lib/role-check';
import { dataStore } from '@/lib/data-store';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * GET /api/v1/categories
 *
 * Returns a list of all categories.
 * Requires admin role.
 *
 * Response Format:
 * {
 *   "data": [
 *     {
 *       "id": "cat-1",
 *       "name": "Bug Reports",
 *       "slug": "bug-reports",
 *       "description": "Reports of bugs...",
 *       "color": "#ef4444",
 *       "icon": "Bug",
 *       "position": 1,
 *       "is_active": true,
 *       "created_at": "2025-01-01T00:00:00Z",
 *       "updated_at": "2025-01-01T00:00:00Z"
 *     }
 *   ],
 *   "meta": {
 *     "total": 5
 *   }
 * }
 */
export async function GET(_request: NextRequest) {
  try {
    // Check for admin role
    const hasAccess = await checkRole('admin');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    console.log('[GET /api/v1/categories] Request received');

    // Get all categories from data store
    const categories = dataStore.getAllCategories();

    console.log('[GET /api/v1/categories] Returning', categories.length, 'categories');

    return NextResponse.json(
      {
        data: categories,
        meta: {
          total: categories.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[GET /api/v1/categories] Error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Validation schema for POST request
const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  slug: z.string().min(1, 'Slug is required').max(100, 'Slug must be less than 100 characters'),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color (e.g., #ef4444)'),
  icon: z.string().optional(),
  position: z.number().int().min(0).optional(),
  is_active: z.boolean().optional(),
});

/**
 * POST /api/v1/categories
 *
 * Creates a new category.
 * Requires admin role.
 *
 * Request Body:
 * {
 *   "name": "Category Name",
 *   "slug": "category-name",
 *   "description": "Category description",
 *   "color": "#6366f1",
 *   "icon": "Category",
 *   "position": 1,
 *   "is_active": true
 * }
 *
 * Response Format:
 * {
 *   "data": {
 *     "id": "cat-6",
 *     "name": "Category Name",
 *     "slug": "category-name",
 *     "description": "Category description",
 *     "color": "#6366f1",
 *     "icon": "Category",
 *     "position": 6,
 *     "is_active": true,
 *     "created_at": "2025-01-18T00:00:00Z",
 *     "updated_at": "2025-01-18T00:00:00Z"
 *   },
 *   "message": "Category created successfully"
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

    console.log('[POST /api/v1/categories] Request received');

    // Parse request body
    const body = await request.json();

    // Validate request body
    const validatedData = createCategorySchema.parse(body);

    console.log('[POST /api/v1/categories] Creating category:', validatedData.name);

    // Create category in data store
    const newCategory = dataStore.createCategory({
      name: validatedData.name,
      slug: validatedData.slug,
      description: validatedData.description,
      color: validatedData.color,
      icon: validatedData.icon,
      position: validatedData.position,
      is_active: validatedData.is_active,
    });

    console.log('[POST /api/v1/categories] Category created:', newCategory.id);

    return NextResponse.json(
      {
        data: newCategory,
        message: 'Category created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[POST /api/v1/categories] Error:', error);

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
