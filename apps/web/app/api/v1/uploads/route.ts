import { checkRole } from '@/lib/role-check';
import {
  type UploadResponse,
  sanitizeFileMetadata,
  uploadRequestSchema,
  validateFileMetadata,
} from '@modus/logic';
import { type NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

// ============================================================================
// POST /api/v1/uploads
// ============================================================================

/**
 * POST /api/v1/uploads
 *
 * Upload a file with validation and sanitization
 * Requires agent role or higher.
 *
 * Request Body (JSON with base64):
 * - filename: File name (required)
 * - mime_type: MIME type (required)
 * - size: File size in bytes (required)
 * - data: Base64 encoded file data (required)
 * - checksum: Optional SHA-256 hash for integrity verification
 *
 * Response:
 * - data: Upload response with file metadata
 * - message: Success message
 */
export async function POST(request: NextRequest) {
  try {
    // Check for agent role or higher
    const hasAccess = await checkRole('agent');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden: Agent access required' }, { status: 403 });
    }
    // Check content type
    const contentType = request.headers.get('content-type') || '';

    if (!contentType.includes('application/json')) {
      return NextResponse.json(
        {
          error: 'Unsupported content type. Use application/json with base64 encoded data.',
        },
        { status: 400 }
      );
    }

    // Handle JSON with base64 encoded data
    const body = await request.json();

    // Validate request body
    const validatedInput = uploadRequestSchema.parse(body);

    const filename = validatedInput.filename;
    const mimeType = validatedInput.mime_type;
    const size = validatedInput.size;
    const checksum = validatedInput.checksum;

    // Decode base64 data
    let data: Buffer;
    try {
      data = Buffer.from(validatedInput.data, 'base64');
    } catch (error) {
      return NextResponse.json(
        {
          error: 'Invalid base64 encoded data',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 400 }
      );
    }

    // Validate file metadata
    const validation = validateFileMetadata({
      filename,
      mime_type: mimeType,
      size,
    });

    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: 'File validation failed',
          details: validation.error,
        },
        { status: 400 }
      );
    }

    // Verify size matches actual data size
    if (data.length !== size) {
      return NextResponse.json(
        {
          error: 'File size mismatch',
          details: `Expected ${size} bytes, got ${data.length} bytes`,
        },
        { status: 400 }
      );
    }

    // Sanitize file metadata
    const sanitizedMetadata = sanitizeFileMetadata({
      filename,
      mime_type: mimeType,
      size,
      checksum,
    });

    // Generate file ID
    const fileId = uuidv4();
    const uploadedAt = new Date().toISOString();

    // In production, you would save the file to storage (S3, filesystem, etc.)
    // For this demo, we just return the metadata
    // The actual file data is not stored in this mock implementation

    const uploadResponse: UploadResponse = {
      id: fileId,
      filename: sanitizedMetadata.filename,
      mime_type: sanitizedMetadata.mime_type,
      size: sanitizedMetadata.size,
      checksum: sanitizedMetadata.checksum,
      uploaded_at: uploadedAt,
      // In production, this would be the actual URL to access the file
      url: `/api/v1/uploads/${fileId}`,
    };

    return NextResponse.json(
      {
        data: uploadResponse,
        message: 'File uploaded successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/v1/uploads:', error);

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

// ============================================================================
// GET /api/v1/uploads/[id]
// ============================================================================

/**
 * GET /api/v1/uploads/[id]
 *
 * Get file upload information by ID
 * Requires agent role or higher.
 * In production, this would return the actual file or redirect to the file URL
 */
export async function GET(request: NextRequest) {
  try {
    // Check for agent role or higher
    const hasAccess = await checkRole('agent');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden: Agent access required' }, { status: 403 });
    }
    // Extract file ID from URL
    const url = new URL(request.url);
    const segments = url.pathname.split('/');
    const fileId = segments[segments.length - 1];

    if (!fileId || fileId === 'uploads') {
      return NextResponse.json(
        {
          error: 'File ID is required',
        },
        { status: 400 }
      );
    }

    // In production, this would fetch file metadata from database/storage
    // For this demo, we return a mock response
    return NextResponse.json(
      {
        data: {
          id: fileId,
          filename: 'example.jpg',
          mime_type: 'image/jpeg',
          size: 102400,
          uploaded_at: new Date().toISOString(),
          url: `/api/v1/uploads/${fileId}`,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in GET /api/v1/uploads:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
