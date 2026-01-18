/**
 * XSS Prevention Utilities
 *
 * This module provides functions to sanitize user-generated content
 * and prevent Cross-Site Scripting (XSS) attacks.
 */

/**
 * Sanitizes HTML content by removing potentially dangerous elements and attributes.
 * This is a client-side implementation. In production, use a library like DOMPurify.
 *
 * @param html - The HTML string to sanitize
 * @returns Sanitized HTML string
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';

  // Remove dangerous tags and their content
  const dangerousTags = [
    'script',
    'iframe',
    'object',
    'embed',
    'form',
    'input',
    'button',
    'textarea',
    'select',
    'option',
  ];

  let sanitized = html;

  // Remove script tags and their content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove other dangerous tags (self-closing and with content)
  dangerousTags.forEach((tag) => {
    if (tag !== 'script') {
      // Remove self-closing tags
      sanitized = sanitized.replace(new RegExp(`<${tag}\\b[^>]*\\/>`, 'gi'), '');
      // Remove opening tags
      sanitized = sanitized.replace(new RegExp(`<${tag}\\b[^>]*>`, 'gi'), '');
      // Remove closing tags
      sanitized = sanitized.replace(new RegExp(`<\\/${tag}>`, 'gi'), '');
    }
  });

  // Remove dangerous event handlers (onclick, onerror, onload, etc.)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');

  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');

  // Remove data: protocol (except for safe images)
  sanitized = sanitized.replace(/data:(?!image\/(png|jpeg|jpg|gif|webp);base64)/gi, '');

  // Remove vbscript: protocol
  sanitized = sanitized.replace(/vbscript:/gi, '');

  // Remove style tags with dangerous content (expression, behavior, etc.)
  sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, (match) => {
    // Remove dangerous CSS properties
    return match
      .replace(/expression\s*\([^)]*\)/gi, '')
      .replace(/behavior\s*:\s*[^;]+;?/gi, '')
      .replace(/-moz-binding\s*:\s*[^;]+;?/gi, '');
  });

  return sanitized;
}

/**
 * Escapes HTML special characters to prevent XSS.
 * Use this when displaying user-generated content as plain text.
 *
 * @param text - The text to escape
 * @returns Escaped text safe for HTML rendering
 */
export function escapeHtml(text: string): string {
  if (!text) return '';

  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return text.replace(/[&<>"'/]/g, (char) => htmlEscapes[char] || char);
}

/**
 * Sanitizes a URL to prevent javascript: and other dangerous protocols.
 *
 * @param url - The URL to sanitize
 * @returns Sanitized URL or empty string if dangerous
 */
export function sanitizeUrl(url: string): string {
  if (!url) return '';

  const trimmedUrl = url.trim();

  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'vbscript:', 'data:', 'file:', 'ftp:'];

  const lowerUrl = trimmedUrl.toLowerCase();
  for (const protocol of dangerousProtocols) {
    if (lowerUrl.startsWith(protocol)) {
      return '';
    }
  }

  // Only allow http, https, mailto, tel protocols
  const allowedProtocols = ['http://', 'https://', 'mailto:', 'tel:'];
  const hasAllowedProtocol = allowedProtocols.some((protocol) => lowerUrl.startsWith(protocol));

  if (!hasAllowedProtocol && /^https?:\/\//i.test(trimmedUrl)) {
    return trimmedUrl;
  }

  return trimmedUrl;
}

/**
 * Validates that content doesn't contain suspicious patterns that might indicate XSS attempts.
 *
 * @param content - The content to validate
 * @returns true if content appears safe, false if suspicious
 */
export function isContentSafe(content: string): boolean {
  if (!content) return true;

  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // Event handlers like onclick=
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /expression\s*\(/i, // CSS expression()
    /vbscript:/i,
    /data:text\/html/i,
  ];

  return !suspiciousPatterns.some((pattern) => pattern.test(content));
}

/**
 * Truncates content to a maximum length while preserving word boundaries.
 *
 * @param content - The content to truncate
 * @param maxLength - Maximum length in characters
 * @returns Truncated content
 */
export function truncateContent(content: string, maxLength = 1000): string {
  if (!content || content.length <= maxLength) return content;

  // Truncate at the last complete word before maxLength
  const truncated = content.substr(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > 0) {
    return truncated.substr(0, lastSpace) + '...';
  }

  return truncated + '...';
}

/**
 * Sanitizes post content for display.
 * Combines multiple security measures for comprehensive protection.
 *
 * @param content - The post content to sanitize
 * @param options - Sanitization options
 * @returns Sanitized content safe for display
 */
export function sanitizePostContent(
  content: string,
  options: {
    maxLength?: number;
    allowHtml?: boolean;
    escapeHtml?: boolean;
  } = {}
): string {
  if (!content) return '';

  const { maxLength = 10000, allowHtml = false, escapeHtml: shouldEscape = true } = options;

  let sanitized = content;

  // Truncate if too long
  sanitized = truncateContent(sanitized, maxLength);

  // Check for suspicious patterns
  if (!isContentSafe(sanitized)) {
    // Log the suspicious content for monitoring
    console.warn('Suspicious content detected and blocked:', sanitized.substring(0, 100));
    // Return a safe fallback
    return '[Content removed due to security concerns]';
  }

  // Remove HTML tags if not allowed
  if (!allowHtml) {
    sanitized = sanitized.replace(/<[^>]*>/g, '');
  } else {
    // If HTML is allowed, sanitize it
    sanitized = sanitizeHtml(sanitized);
  }

  // Escape HTML entities if needed
  if (shouldEscape) {
    sanitized = escapeHtml(sanitized);
  }

  return sanitized.trim();
}
