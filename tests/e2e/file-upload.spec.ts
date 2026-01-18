import { test, expect } from '@playwright/test';

// ============================================================================
// File Upload Validation and Sanitization E2E Tests
// ============================================================================

test.describe('File Upload - Validation and Sanitization', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the dashboard before each test
    await page.goto('/dashboard');
    await page.waitForSelector('[data-testid="queue-pane"]', { timeout: 10000 });
    // Wait for posts to load
    await page.waitForSelector('[data-testid^="post-card-"]', { timeout: 10000 });
  });

  // ============================================================================
  // File Type Validation Tests
  // ============================================================================

  test('should reject file with unsupported MIME type', async ({ page }) => {
    const response = await page.request.post('/api/v1/uploads', {
      data: {
        filename: 'test.exe',
        mime_type: 'application/x-msdownload',
        size: 1024,
        data: Buffer.from([0x4D, 0x5A]).toString('base64'), // Fake executable header
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('File validation failed');
    expect(body.details).toContain('not allowed');
  });

  test('should accept valid JPEG image', async ({ page }) => {
    // Create a minimal valid JPEG file (1x1 pixel)
    const jpegBase64 = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=';
    const fileSize = Buffer.from(jpegBase64, 'base64').length;

    const response = await page.request.post('/api/v1/uploads', {
      data: {
        filename: 'test.jpg',
        mime_type: 'image/jpeg',
        size: fileSize,
        data: jpegBase64,
      },
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.data.filename).toBe('test.jpg');
    expect(body.data.mime_type).toBe('image/jpeg');
    expect(body.data.size).toBe(fileSize);
    expect(body.data.id).toBeDefined();
    expect(body.data.uploaded_at).toBeDefined();
  });

  test('should accept valid PNG image', async ({ page }) => {
    // Minimal valid PNG (1x1 pixel, red)
    const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
    const fileSize = Buffer.from(pngBase64, 'base64').length;

    const response = await page.request.post('/api/v1/uploads', {
      data: {
        filename: 'test.png',
        mime_type: 'image/png',
        size: fileSize,
        data: pngBase64,
      },
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.data.filename).toBe('test.png');
    expect(body.data.mime_type).toBe('image/png');
  });

  test('should accept valid PDF file', async ({ page }) => {
    // Minimal valid PDF header
    const pdfContent = '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n180\n%%EOF';
    const pdfBase64 = Buffer.from(pdfContent, 'utf8').toString('base64');
    const fileSize = Buffer.from(pdfBase64, 'base64').length;

    const response = await page.request.post('/api/v1/uploads', {
      data: {
        filename: 'test.pdf',
        mime_type: 'application/pdf',
        size: fileSize,
        data: pdfBase64,
      },
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.data.filename).toBe('test.pdf');
    expect(body.data.mime_type).toBe('application/pdf');
  });

  // ============================================================================
  // File Size Validation Tests
  // ============================================================================

  test('should reject file exceeding maximum size for type', async ({ page }) => {
    // Create a large buffer (6MB) - exceeds 5MB limit for JPEG
    // Note: We use a smaller size for testing to avoid memory issues
    const largeData = Buffer.alloc(6 * 1024 * 1024).toString('base64');

    const response = await page.request.post('/api/v1/uploads', {
      data: {
        filename: 'large.jpg',
        mime_type: 'image/jpeg',
        size: 6 * 1024 * 1024,
        data: largeData,
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('File validation failed');
    expect(body.details).toContain('exceeds maximum');
  });

  test('should accept file within size limit', async ({ page }) => {
    // Create a buffer within 5MB limit
    const data = Buffer.alloc(1024).toString('base64'); // 1KB

    const response = await page.request.post('/api/v1/uploads', {
      data: {
        filename: 'small.jpg',
        mime_type: 'image/jpeg',
        size: 1024,
        data,
      },
    });

    expect(response.status()).toBe(201);
  });

  // ============================================================================
  // Filename Sanitization Tests
  // ============================================================================

  test('should reject filename with directory traversal attempts', async ({ page }) => {
    const response = await page.request.post('/api/v1/uploads', {
      data: {
        filename: '../../../etc/passwd.jpg',
        mime_type: 'image/jpeg',
        size: 1024,
        data: Buffer.alloc(1024).toString('base64'),
      },
    });

    // Directory traversal should be rejected, not sanitized
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('File validation failed');
    expect(body.details).toContain('path traversal');
  });

  test('should sanitize filename with dangerous characters', async ({ page }) => {
    const response = await page.request.post('/api/v1/uploads', {
      data: {
        filename: 'test file<script>alert(1)</script>.jpg',
        mime_type: 'image/jpeg',
        size: 1024,
        data: Buffer.alloc(1024).toString('base64'),
      },
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    // Dangerous characters should be replaced
    expect(body.data.filename).not.toContain('<');
    expect(body.data.filename).not.toContain('>');
    expect(body.data.filename).not.toContain('script');
  });

  // ============================================================================
  // Checksum Verification Tests
  // ============================================================================

  test('should accept file with checksum', async ({ page }) => {
    const data = Buffer.alloc(1024).toString('base64');
    const checksum = 'a1b2c3d4e5f6'; // Mock checksum

    const response = await page.request.post('/api/v1/uploads', {
      data: {
        filename: 'test.jpg',
        mime_type: 'image/jpeg',
        size: 1024,
        data,
        checksum,
      },
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.data.checksum).toBe(checksum);
  });

  // ============================================================================
  // Size Mismatch Validation Tests
  // ============================================================================

  test('should reject file with size mismatch', async ({ page }) => {
    const data = Buffer.alloc(1024).toString('base64'); // 1KB data

    const response = await page.request.post('/api/v1/uploads', {
      data: {
        filename: 'test.jpg',
        mime_type: 'image/jpeg',
        size: 2048, // Claim 2KB
        data, // But only send 1KB
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('File size mismatch');
  });

  // ============================================================================
  // Base64 Encoding Validation Tests
  // ============================================================================

  test('should reject invalid base64 data', async ({ page }) => {
    const response = await page.request.post('/api/v1/uploads', {
      data: {
        filename: 'test.jpg',
        mime_type: 'image/jpeg',
        size: 1024,
        data: 'invalid base64!!!',
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('Invalid base64');
  });

  // ============================================================================
  // Required Field Validation Tests
  // ============================================================================

  test('should reject request without filename', async ({ page }) => {
    const response = await page.request.post('/api/v1/uploads', {
      data: {
        mime_type: 'image/jpeg',
        size: 1024,
        data: Buffer.alloc(1024).toString('base64'),
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('Invalid request body');
  });

  test('should reject request without MIME type', async ({ page }) => {
    const response = await page.request.post('/api/v1/uploads', {
      data: {
        filename: 'test.jpg',
        size: 1024,
        data: Buffer.alloc(1024).toString('base64'),
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('Invalid request body');
  });

  test('should reject request without file data', async ({ page }) => {
    const response = await page.request.post('/api/v1/uploads', {
      data: {
        filename: 'test.jpg',
        mime_type: 'image/jpeg',
        size: 1024,
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('Invalid request body');
  });

  // ============================================================================
  // Security Tests
  // ============================================================================

  test('should reject executable file type', async ({ page }) => {
    const response = await page.request.post('/api/v1/uploads', {
      data: {
        filename: 'malware.exe',
        mime_type: 'application/x-msdownload',
        size: 1024,
        data: Buffer.alloc(1024).toString('base64'),
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.details).toContain('not allowed');
  });

  test('should reject script file type', async ({ page }) => {
    const response = await page.request.post('/api/v1/uploads', {
      data: {
        filename: 'script.sh',
        mime_type: 'application/x-sh',
        size: 1024,
        data: Buffer.alloc(1024).toString('base64'),
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.details).toContain('not allowed');
  });

  // ============================================================================
  // Response Format Tests
  // ============================================================================

  test('should return consistent response format', async ({ page }) => {
    const data = Buffer.alloc(1024).toString('base64');

    const response = await page.request.post('/api/v1/uploads', {
      data: {
        filename: 'test.jpg',
        mime_type: 'image/jpeg',
        size: 1024,
        data,
      },
    });

    expect(response.status()).toBe(201);
    const body = await response.json();

    // Check response structure
    expect(body).toHaveProperty('data');
    expect(body).toHaveProperty('message');
    expect(body.message).toBe('File uploaded successfully');

    // Check data structure
    expect(body.data).toHaveProperty('id');
    expect(body.data).toHaveProperty('filename');
    expect(body.data).toHaveProperty('mime_type');
    expect(body.data).toHaveProperty('size');
    expect(body.data).toHaveProperty('uploaded_at');
    expect(body.data).toHaveProperty('url');

    // Check types
    expect(typeof body.data.id).toBe('string');
    expect(typeof body.data.filename).toBe('string');
    expect(typeof body.data.mime_type).toBe('string');
    expect(typeof body.data.size).toBe('number');
    expect(typeof body.data.uploaded_at).toBe('string');
  });
});
