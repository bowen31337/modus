import { csrfErrorResponse, requireCsrfProtection } from '@/lib/csrf';
import { checkRole } from '@/lib/role-check';
import { dataStore } from '@/lib/data-store';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * GET /api/v1/categories/:id
 *
 * Returns a single category by ID.
 * Requires admin role.
 *
 * Response Format:
 * {
 *   "data": {
 *     "id": "cat-1",
 *     "name": "Bug Reports",
 *     "slug": "bug-reports",
 *     "description": "Reports of bugs...",
 *     "color": "#ef4444",
 *     "icon": "Bug",
 *     "position": 1,
 *     "is_active": true,
 *     "created_at": "2025-01-01T00:00:00Z",
 *     "updated_at": "2025-01-01T00:00:00Z"
 *   }
 * }
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Check for admin role
    const hasAccess = await checkRole('admin');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    console.log('[GET /api/v1/categories/:id] Request received for id:', id);

    // Get category from data store
    const category = dataStore.getCategoryByIdPublic(id);

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    console.log('[GET /api/v1/categories/:id] Returning category:', category.name);

    return NextResponse.json(
      {
        data: category,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[GET /api/v1/categories/:id] Error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Validation schema for PATCH request
const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color').optional(),
  icon: z.string().optional(),
  position: z.number().int().min(0).optional(),
  is_active: z.boolean().optional(),
});

/**
 * PATCH /api/v1/categories/:id
 *
 * Updates an existing category.
 * Requires admin role.
 *
 * Request Body:
 * {
 *   "name": "Updated Name",
 *   "slug": "updated-slug",
 *   "description": "Updated description",
 *   "color": "#8b5cf6",
 *   "icon": "UpdatedIcon",
 *   "position": 2,
 *   "is_active": false
 * }
 *
 * Response Format:
 * {
 *   "data": {
 *     "id": "cat-1",
 *     "name": "Updated Name",
 *     "slug": "updated-slug",
 *     "description": "Updated description",
 *     "color": "#8b5cf6",
 *     "icon": "UpdatedIcon",
 *     "position": 2,
 *     "is_active": false,
 *     "created_at": "2025-01-01T00:00:00Z",
 *     "updated_at": "2025-01-18T01:00:00Z"
 *   },
 *   "message": "Category updated successfully"
 * }
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const { id } = await params;
    console.log('[PATCH /api/v1/categories/:id] Request received for id:', id);

    // Parse request body
    const body = await request.json();

    // Validate request body
    const validatedData = updateCategorySchema.parse(body);

    console.log('[PATCH /api/v1/categories/:id] Updating category with:', validatedData);

    // Update category in data store
    const updatedCategory = dataStore.updateCategory(id, validatedData);

    if (!updatedCategory) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    console.log('[PATCH /api/v1/categories/:id] Category updated:', updatedCategory.name);

    return NextResponse.json(
      {
        data: updatedCategory,
        message: 'Category updated successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[PATCH /api/v1/categories/:id] Error:', error);

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

/**
 * DELETE /api/v1/categories/:id
 *
 * Deletes a category.
 * Requires admin role.
 *
 * Response Format:
 * {
 *   "message": "Category deleted successfully"
 * }
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const { id } = await params;
    console.log('[DELETE /api/v1/categories/:id] Request received for id:', id);

    // Delete category from data store
    const deleted = dataStore.deleteCategory(id);

    if (!deleted) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    console.log('[DELETE /api/v1/categories/:id] Category deleted:', id);

    return NextResponse.json(
      {
        message: 'Category deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[DELETE /api/v1/categories/:id] Error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
