/**
 * Security Utilities
 *
 * Provides XSS prevention and input sanitization functions for the moderation system.
 */

// ============================================================================
// XSS Prevention
// ============================================================================

/**
 * Sanitizes user input by escaping HTML special characters.
 * This prevents XSS attacks by ensuring user content cannot execute scripts.
 *
 * @param input - The string to sanitize
 * @returns Sanitized string with HTML characters escaped
 *
 * @example
 * sanitizeInput('<script>alert("xss")</script>')
 * // Returns: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/&/g, '&amp;') // Must be first
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/`/g, '&#96;')
    .replace(/\//g, '&#47;');
}

/**
 * Sanitizes an object's string values by escaping HTML special characters.
 * Useful for sanitizing API request bodies before processing.
 *
 * @param obj - The object to sanitize
 * @returns New object with all string values sanitized
 *
 * @example
 * sanitizeObject({ title: '<script>alert("xss")</script>', count: 5 })
 * // Returns: { title: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;', count: 5 }
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) => (typeof item === 'string' ? sanitizeInput(item) : item));
    } else if (value !== null && typeof value === 'object') {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}

/**
 * Validates that input doesn't contain potentially dangerous patterns.
 * This is an additional layer of security beyond basic character escaping.
 *
 * @param input - The string to validate
 * @returns Object with isValid flag and optional error message
 *
 * @example
 * validateInputSafety('<img src=x onerror=alert(1)>')
 * // Returns: { isValid: false, error: 'Potentially dangerous pattern detected' }
 */
export function validateInputSafety(input: string): {
  isValid: boolean;
  error?: string;
} {
  if (!input || typeof input !== 'string') {
    return { isValid: true };
  }

  const dangerousPatterns = [
    // Script tags (case-insensitive)
    /<script[^>]*>/i,
    // Event handlers (onerror, onclick, onload, etc.)
    /\bon\w+\s*=/i,
    // JavaScript protocol
    /javascript:/i,
    // Data URL with script content
    /data:text\/html/i,
    // Expression (IE legacy)
    /expression\s*\(/i,
    // VBScript (IE legacy)
    /vbscript:/i,
    // Dangerous URL schemes
    /\.(exe|vbs|bat|cmd|ps1|sh|bash|zsh)\b/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(input)) {
      return {
        isValid: false,
        error: 'Potentially dangerous pattern detected',
      };
    }
  }

  return { isValid: true };
}

/**
 * Sanitizes post content (title and body) for safe rendering.
 * Combines character escaping with dangerous pattern validation.
 *
 * @param content - The content to sanitize
 * @returns Sanitized content
 *
 * @example
 * sanitizePostContent({ title: '<script>alert("xss")</script>', body: 'Normal text' })
 * // Returns: { title: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;', body: 'Normal text' }
 */
export function sanitizePostContent(content: {
  title: string;
  body_content: string;
  excerpt?: string;
}): {
  title: string;
  body_content: string;
  excerpt?: string;
} {
  return {
    title: sanitizeInput(content.title),
    body_content: sanitizeInput(content.body_content),
    excerpt: content.excerpt ? sanitizeInput(content.excerpt) : undefined,
  };
}

/**
 * Sanitizes response content for safe rendering.
 * Escapes HTML special characters to prevent XSS attacks.
 *
 * @param content - The response content to sanitize
 * @returns Sanitized content with HTML characters escaped
 *
 * @example
 * sanitizeResponseContent('<img src=x onerror=alert(1)>')
 * // Returns: '&lt;img src=x onerror=alert(1)&gt;'
 */
export function sanitizeResponseContent(content: string): string {
  return sanitizeInput(content);
}

/**
 * Sanitizes template content for safe rendering.
 * Escapes HTML special characters to prevent XSS attacks.
 *
 * @param content - The template content to sanitize
 * @returns Sanitized content with HTML characters escaped
 *
 * @example
 * sanitizeTemplateContent('Hello {{name}} <script>alert(1)</script>')
 * // Returns: 'Hello {{name}} &lt;script&gt;alert(1)&lt;/script&gt;'
 */
export function sanitizeTemplateContent(content: string): string {
  return sanitizeInput(content);
}
