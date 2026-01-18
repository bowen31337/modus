import { checkRole } from '@/lib/role-check';
import { dataStore } from '@/lib/data-store';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * GET /api/v1/templates/:id
 *
 * Returns a single template by ID.
 * Requires supervisor or admin role.
 *
 * Response Format:
 * {
 *   "data": {
 *     "id": "template-1",
 *     "name": "Bug Acknowledgment",
 *     "content": "Hi {{authorName}}...",
 *     "placeholders": ["authorName"],
 *     "category_id": "cat-3",
 *     "usage_count": 15,
 *     "created_by": "agent-1",
 *     "created_at": "2025-01-01T00:00:00Z",
 *     "updated_at": "2025-01-15T00:00:00Z"
 *   }
 * }
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Check for supervisor or admin role
    const hasAccess = await checkRole('supervisor');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden: Supervisor access required' }, { status: 403 });
    }

    const { id } = await params;

    console.log('[GET /api/v1/templates/:id] Request received for template:', id);

    // Get template from data store
    const template = dataStore.getTemplate(id);

    if (!template) {
      console.log('[GET /api/v1/templates/:id] Template not found:', id);
      return NextResponse.json(
        {
          error: 'Template not found',
        },
        { status: 404 }
      );
    }

    console.log('[GET /api/v1/templates/:id] Returning template:', template.id);

    return NextResponse.json(
      {
        data: template,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[GET /api/v1/templates/:id] Error:', error);

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
const updateTemplateSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    content: z.string().min(1).optional(),
    placeholders: z.array(z.string()).optional(),
    category_id: z.string().nullable().optional(),
  })
  .refine(
    (data) => {
      // Ensure at least one field is being updated
      return (
        data.name !== undefined ||
        data.content !== undefined ||
        data.placeholders !== undefined ||
        data.category_id !== undefined
      );
    },
    {
      message: 'At least one field must be provided for update',
    }
  );

/**
 * PATCH /api/v1/templates/:id
 *
 * Updates a template's name, content, placeholders, or category.
 * Requires supervisor or admin role.
 *
 * Request Body:
 * {
 *   "name": "Updated Name" | undefined,
 *   "content": "Updated content" | undefined,
 *   "placeholders": ["p1", "p2"] | undefined,
 *   "category_id": "cat-1" | null | undefined
 * }
 *
 * Response Format:
 * {
 *   "data": {
 *     "id": "template-1",
 *     "name": "Updated Name",
 *     "content": "Updated content",
 *     "placeholders": ["p1", "p2"],
 *     "category_id": "cat-1",
 *     "usage_count": 15,
 *     "created_by": "agent-1",
 *     "created_at": "2025-01-01T00:00:00Z",
 *     "updated_at": "2025-01-18T00:00:00Z"
 *   },
 *   "message": "Template updated successfully"
 * }
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Check for supervisor or admin role
    const hasAccess = await checkRole('supervisor');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden: Supervisor access required' }, { status: 403 });
    }

    const { id } = await params;

    console.log('[PATCH /api/v1/templates/:id] Request received for template:', id);

    // Parse request body
    const body = await request.json();

    // Validate request body
    const validatedData = updateTemplateSchema.parse(body);

    console.log(
      '[PATCH /api/v1/templates/:id] Updating template with fields:',
      Object.keys(validatedData)
    );

    // Update template in data store
    const updatedTemplate = dataStore.updateTemplate(id, validatedData);

    if (!updatedTemplate) {
      console.log('[PATCH /api/v1/templates/:id] Template not found:', id);
      return NextResponse.json(
        {
          error: 'Template not found',
        },
        { status: 404 }
      );
    }

    console.log('[PATCH /api/v1/templates/:id] Template updated:', updatedTemplate.id);

    return NextResponse.json(
      {
        data: updatedTemplate,
        message: 'Template updated successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[PATCH /api/v1/templates/:id] Error:', error);

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
 * DELETE /api/v1/templates/:id
 *
 * Deletes a template by ID.
 * Requires supervisor or admin role.
 *
 * Response Format:
 * {
 *   "message": "Template deleted successfully"
 * }
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check for supervisor or admin role
    const hasAccess = await checkRole('supervisor');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden: Supervisor access required' }, { status: 403 });
    }

    const { id } = await params;

    console.log('[DELETE /api/v1/templates/:id] Request received for template:', id);

    // Delete template from data store
    const deleted = dataStore.deleteTemplate(id);

    if (!deleted) {
      console.log('[DELETE /api/v1/templates/:id] Template not found:', id);
      return NextResponse.json(
        {
          error: 'Template not found',
        },
        { status: 404 }
      );
    }

    console.log('[DELETE /api/v1/templates/:id] Template deleted:', id);

    return NextResponse.json(
      {
        message: 'Template deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[DELETE /api/v1/templates/:id] Error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
