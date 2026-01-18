import { z } from 'zod';

// ============================================================================
// Constants
// ============================================================================

/**
 * Allowed file types with their extensions and maximum sizes
 * Size limits are in bytes
 */
export const ALLOWED_FILE_TYPES = {
  'image/jpeg': { extension: 'jpg', maxSize: 5 * 1024 * 1024 }, // 5MB
  'image/png': { extension: 'png', maxSize: 5 * 1024 * 1024 }, // 5MB
  'image/gif': { extension: 'gif', maxSize: 5 * 1024 * 1024 }, // 5MB
  'image/webp': { extension: 'webp', maxSize: 5 * 1024 * 1024 }, // 5MB
  'application/pdf': { extension: 'pdf', maxSize: 10 * 1024 * 1024 }, // 10MB
  'text/plain': { extension: 'txt', maxSize: 1 * 1024 * 1024 }, // 1MB
} as const;

/**
 * Dangerous file extensions that should never be accepted
 */
const DANGEROUS_EXTENSIONS = [
  'exe', 'bat', 'cmd', 'sh', 'bash', 'zsh', 'ps1', // Executables/Scripts
  'js', 'mjs', 'cjs', 'ts', 'tsx', 'jsx', // JavaScript/TypeScript
  'py', 'rb', 'php', 'pl', 'cgi', 'perl', // Other scripts
  'html', 'htm', 'svg', // HTML/SVG (XSS risk)
  'jar', 'war', 'ear', // Java archives
  'dll', 'so', 'dylib', // Libraries
  'vbs', 'vbe', 'wsf', // VBScript
  'scr', 'pif', 'hta', // Windows shortcuts/HTA
];

// ============================================================================
// Zod Schemas
// ============================================================================

/**
 * Schema for file upload request
 */
export const uploadRequestSchema = z.object({
  filename: z.string().min(1).max(255),
  mime_type: z.string().min(1).max(100),
  size: z.number().int().min(1),
  data: z.string().base64('File data must be valid base64 encoded'),
  checksum: z.string().optional(),
});

export type UploadRequest = z.infer<typeof uploadRequestSchema>;

/**
 * Schema for file metadata
 */
export const fileMetadataSchema = z.object({
  filename: z.string().min(1).max(255),
  mime_type: z.string().min(1).max(100),
  size: z.number().int().min(1),
  checksum: z.string().optional(),
});

export type FileMetadata = z.infer<typeof fileMetadataSchema>;

/**
 * Schema for file upload response
 */
export const uploadResponseSchema = z.object({
  id: z.string().uuid(),
  filename: z.string().min(1).max(255),
  mime_type: z.string().min(1).max(100),
  size: z.number().int().min(1),
  checksum: z.string().optional(),
  uploaded_at: z.string().datetime(),
  url: z.string().url(),
});

export type UploadResponse = z.infer<typeof uploadResponseSchema>;

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validates file metadata against allowed types and size limits
 * @param metadata - File metadata to validate
 * @returns Validation result with isValid flag and optional error message
 */
export function validateFileMetadata(metadata: {
  filename: string;
  mime_type: string;
  size: number;
}): { isValid: true } | { isValid: false; error: string } {
  const { filename, mime_type, size } = metadata;

  // Check if MIME type is allowed
  const allowedType = ALLOWED_FILE_TYPES[mime_type as keyof typeof ALLOWED_FILE_TYPES];
  if (!allowedType) {
    return {
      isValid: false,
      error: `File type "${mime_type}" is not allowed. Allowed types: ${Object.keys(ALLOWED_FILE_TYPES).join(', ')}`,
    };
  }

  // Check file size
  if (size > allowedType.maxSize) {
    return {
      isValid: false,
      error: `File size ${formatBytes(size)} exceeds maximum ${formatBytes(allowedType.maxSize)} for ${mime_type}`,
    };
  }

  // Check for dangerous file extensions
  const extension = filename.split('.').pop()?.toLowerCase();
  if (extension && DANGEROUS_EXTENSIONS.includes(extension)) {
    return {
      isValid: false,
      error: `File extension ".${extension}" is not allowed due to security concerns`,
    };
  }

  // Check for path traversal attempts in filename
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return {
      isValid: false,
      error: 'Filename contains invalid characters (path traversal detected)',
    };
  }

  return { isValid: true };
}

/**
 * Sanitizes file metadata to prevent security issues
 * @param metadata - File metadata to sanitize
 * @returns Sanitized file metadata
 */
export function sanitizeFileMetadata(metadata: FileMetadata): FileMetadata {
  return {
    filename: sanitizeFilename(metadata.filename),
    mime_type: metadata.mime_type,
    size: metadata.size,
    checksum: metadata.checksum,
  };
}

/**
 * Sanitizes a filename to remove dangerous characters and prevent path traversal
 * @param filename - Original filename
 * @returns Sanitized filename
 */
export function sanitizeFilename(filename: string): string {
  // Remove path traversal sequences
  let sanitized = filename.replace(/\.\.\//g, '').replace(/\\\\/g, '');

  // Replace dangerous characters with underscores
  sanitized = sanitized.replace(/[<>:"/\\|?*]/g, '_');

  // Remove control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');

  // Trim whitespace
  sanitized = sanitized.trim();

  // If filename becomes empty or only dangerous characters, generate a safe name
  if (!sanitized || sanitized === '') {
    return 'uploaded_file';
  }

  // Ensure filename doesn't start with a dot (hidden file)
  if (sanitized.startsWith('.')) {
    sanitized = 'file_' + sanitized;
  }

  return sanitized;
}

/**
 * Formats bytes into human-readable string
 * @param bytes - Number of bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
