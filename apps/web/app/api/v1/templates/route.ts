import { csrfErrorResponse, requireCsrfProtection } from '@/lib/csrf';
import { checkRole } from '@/lib/role-check';
import { dataStore } from '@/lib/data-store';
import { sanitizeTemplateContent } from '@modus/logic';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * GET /api/v1/templates
 *
 * Returns a list of all response templates.
 * Requires supervisor or admin role.
 *
 * Response Format:
 * {
 *   "data": [
 *     {
 *       "id": "template-1",
 *       "name": "Bug Acknowledgment",
 *       "content": "Hi {{authorName}}...",
 *       "placeholders": ["authorName"],
 *       "category_id": "cat-3",
 *       "usage_count": 15,
 *       "created_by": "agent-1",
 *       "created_at": "2025-01-01T00:00:00Z",
 *       "updated_at": "2025-01-15T00:00:00Z"
 *     }
 *   ],
 *   "meta": {
 *     "total": 4
 *   }
 * }
 */
export async function GET(_request: NextRequest) {
  try {
    // Check for supervisor or admin role
    const hasAccess = await checkRole('supervisor');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden: Supervisor access required' }, { status: 403 });
    }

    console.log('[GET /api/v1/templates] Request received');

    // Get all templates from data store
    const templates = dataStore.getAllTemplates();

    console.log('[GET /api/v1/templates] Returning', templates.length, 'templates');

    return NextResponse.json(
      {
        data: templates,
        meta: {
          total: templates.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[GET /api/v1/templates] Error:', error);

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
const createTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  content: z.string().min(1, 'Content is required'),
  placeholders: z.array(z.string()).optional().default([]),
  category_id: z.string().nullable().optional(),
  created_by: z.string().min(1, 'Creator ID is required'),
});

/**
 * POST /api/v1/templates
 *
 * Creates a new response template.
 * Requires supervisor or admin role.
 *
 * Request Body:
 * {
 *   "name": "Template Name",
 *   "content": "Template content with {{placeholders}}",
 *   "placeholders": ["placeholder1", "placeholder2"],
 *   "category_id": "cat-1" | null,
 *   "created_by": "agent-1"
 * }
 *
 * Response Format:
 * {
 *   "data": {
 *     "id": "template-5",
 *     "name": "Template Name",
 *     "content": "Template content...",
 *     "placeholders": ["placeholder1"],
 *     "category_id": "cat-1",
 *     "usage_count": 0,
 *     "created_by": "agent-1",
 *     "created_at": "2025-01-18T00:00:00Z",
 *     "updated_at": "2025-01-18T00:00:00Z"
 *   },
 *   "message": "Template created successfully"
 * }
 */
export async function POST(_request: NextRequest) {
  try {
    // Check for supervisor or admin role
    const hasAccess = await checkRole('supervisor');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden: Supervisor access required' }, { status: 403 });
    }

    // Validate CSRF token for state-changing operation
    try {
      await requireCsrfProtection(_request);
    } catch (csrfError) {
      return csrfErrorResponse();
    }

    console.log('[POST /api/v1/templates] Request received');

    // Parse request body
    const body = await _request.json();

    // Validate request body
    const validatedData = createTemplateSchema.parse(body);

    // Sanitize content to prevent XSS attacks
    const sanitizedContent = sanitizeTemplateContent(validatedData.content);

    console.log('[POST /api/v1/templates] Creating template:', validatedData.name);

    // Create template in data store with sanitized content
    const newTemplate = dataStore.createTemplate({
      name: validatedData.name,
      content: sanitizedContent,
      placeholders: validatedData.placeholders,
      category_id: validatedData.category_id,
      created_by: validatedData.created_by,
    });

    console.log('[POST /api/v1/templates] Template created:', newTemplate.id);

    return NextResponse.json(
      {
        data: newTemplate,
        message: 'Template created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[POST /api/v1/templates] Error:', error);

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
