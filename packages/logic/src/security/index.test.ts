import { describe, it, expect } from 'vitest';
import {
  sanitizeInput,
  sanitizeObject,
  validateInputSafety,
  sanitizePostContent,
  sanitizeResponseContent,
  sanitizeTemplateContent,
} from './index';

describe('Security Utilities', () => {
  describe('sanitizeInput', () => {
    it('should escape HTML special characters', () => {
      const input = '<script>alert("xss")</script>';
      const result = sanitizeInput(input);
      expect(result).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#47;script&gt;');
    });

    it('should escape ampersand first to prevent double escaping', () => {
      const input = '&lt;';
      const result = sanitizeInput(input);
      expect(result).toBe('&amp;lt;');
    });

    it('should escape single quotes', () => {
      const input = "O'Reilly";
      const result = sanitizeInput(input);
      expect(result).toBe('O&#39;Reilly');
    });

    it('should escape backticks', () => {
      const input = '`code`';
      const result = sanitizeInput(input);
      expect(result).toBe('&#96;code&#96;');
    });

    it('should escape forward slashes', () => {
      const input = '</div>';
      const result = sanitizeInput(input);
      expect(result).toBe('&lt;&#47;div&gt;');
    });

    it('should return empty string for null input', () => {
      const result = sanitizeInput(null as unknown as string);
      expect(result).toBe('');
    });

    it('should return empty string for undefined input', () => {
      const result = sanitizeInput(undefined as unknown as string);
      expect(result).toBe('');
    });

    it('should handle empty string', () => {
      const result = sanitizeInput('');
      expect(result).toBe('');
    });

    it('should handle normal text without special characters', () => {
      const input = 'Hello, World!';
      const result = sanitizeInput(input);
      expect(result).toBe('Hello, World!');
    });

    it('should escape all special characters in complex XSS attempt', () => {
      const input = '<img src=x onerror="alert(\'xss\')">';
      const result = sanitizeInput(input);
      expect(result).toContain('&lt;img');
      expect(result).toContain('&quot;');
      expect(result).toContain('&#39;');
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
    });
  });

  describe('sanitizeObject', () => {
    it('should sanitize all string values in object', () => {
      const obj = {
        title: '<script>alert("xss")</script>',
        count: 5,
        active: true,
      };
      const result = sanitizeObject(obj);
      expect(result.title).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#47;script&gt;');
      expect(result.count).toBe(5);
      expect(result.active).toBe(true);
    });

    it('should sanitize strings in arrays', () => {
      const obj = {
        tags: ['<script>alert(1)</script>', 'normal-tag', '<b>bold</b>'],
      };
      const result = sanitizeObject(obj);
      expect(result.tags[0]).toBe('&lt;script&gt;alert(1)&lt;&#47;script&gt;');
      expect(result.tags[1]).toBe('normal-tag');
      expect(result.tags[2]).toBe('&lt;b&gt;bold&lt;&#47;b&gt;');
    });

    it('should recursively sanitize nested objects', () => {
      const obj = {
        user: {
          name: '<img src=x onerror=alert(1)>',
          bio: 'normal bio',
        },
      };
      const result = sanitizeObject(obj);
      expect(result.user.name).toContain('&lt;img');
      expect(result.user.bio).toBe('normal bio');
    });

    it('should handle null values', () => {
      const obj = {
        title: 'test',
        nullable: null,
      };
      const result = sanitizeObject(obj);
      expect(result.title).toBe('test');
      expect(result.nullable).toBeNull();
    });

    it('should handle numbers and other non-string types', () => {
      const obj = {
        count: 42,
        price: 19.99,
        active: false,
        data: { value: 100 },
      };
      const result = sanitizeObject(obj);
      expect(result.count).toBe(42);
      expect(result.price).toBe(19.99);
      expect(result.active).toBe(false);
      expect(result.data.value).toBe(100);
    });

    it('should handle empty object', () => {
      const obj = {};
      const result = sanitizeObject(obj);
      expect(result).toEqual({});
    });

    it('should handle arrays with non-string elements', () => {
      const obj = {
        mixed: ['<script>', 123, true, null],
      };
      const result = sanitizeObject(obj);
      expect(result.mixed[0]).toBe('&lt;script&gt;');
      expect(result.mixed[1]).toBe(123);
      expect(result.mixed[2]).toBe(true);
      expect(result.mixed[3]).toBeNull();
    });
  });

  describe('validateInputSafety', () => {
    it('should detect script tags', () => {
      const input = '<script>alert("xss")</script>';
      const result = validateInputSafety(input);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Potentially dangerous pattern detected');
    });

    it('should detect script tags with different casing', () => {
      const input = '<SCRIPT>alert("xss")</SCRIPT>';
      const result = validateInputSafety(input);
      expect(result.isValid).toBe(false);
    });

    it('should detect event handlers', () => {
      const input = '<img src=x onerror=alert(1)>';
      const result = validateInputSafety(input);
      expect(result.isValid).toBe(false);
    });

    it('should detect onclick event', () => {
      const input = '<div onclick="alert(1)">click</div>';
      const result = validateInputSafety(input);
      expect(result.isValid).toBe(false);
    });

    it('should detect javascript: protocol', () => {
      const input = '<a href="javascript:alert(1)">click</a>';
      const result = validateInputSafety(input);
      expect(result.isValid).toBe(false);
    });

    it('should detect data:text/html URLs', () => {
      const input = '<iframe src="data:text/html,<script>alert(1)</script>"></iframe>';
      const result = validateInputSafety(input);
      expect(result.isValid).toBe(false);
    });

    it('should detect expression() (IE legacy)', () => {
      const input = '<div style="width: expression(alert(1))">test</div>';
      const result = validateInputSafety(input);
      expect(result.isValid).toBe(false);
    });

    it('should detect vbscript: protocol', () => {
      const input = '<a href="vbscript:msgbox(1)">click</a>';
      const result = validateInputSafety(input);
      expect(result.isValid).toBe(false);
    });

    it('should detect dangerous file extensions', () => {
      const input = 'Download file.exe now';
      const result = validateInputSafety(input);
      expect(result.isValid).toBe(false);
    });

    it('should detect .bat files', () => {
      const input = 'Run script.bat';
      const result = validateInputSafety(input);
      expect(result.isValid).toBe(false);
    });

    it('should detect .sh files', () => {
      const input = 'Execute shell.sh';
      const result = validateInputSafety(input);
      expect(result.isValid).toBe(false);
    });

    it('should accept safe input', () => {
      const input = 'Hello, this is safe content!';
      const result = validateInputSafety(input);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept HTML-like content without dangerous patterns', () => {
      const input = '<p>This is a paragraph</p>';
      const result = validateInputSafety(input);
      expect(result.isValid).toBe(true);
    });

    it('should handle null input', () => {
      const result = validateInputSafety(null as unknown as string);
      expect(result.isValid).toBe(true);
    });

    it('should handle empty string', () => {
      const result = validateInputSafety('');
      expect(result.isValid).toBe(true);
    });

    it('should detect onload event', () => {
      const input = '<img src="x" onload="alert(1)">';
      const result = validateInputSafety(input);
      expect(result.isValid).toBe(false);
    });

    it('should detect onmouseover event', () => {
      const input = '<div onmouseover="alert(1)">hover</div>';
      const result = validateInputSafety(input);
      expect(result.isValid).toBe(false);
    });
  });

  describe('sanitizePostContent', () => {
    it('should sanitize title and body content', () => {
      const content = {
        title: '<script>alert("xss")</script>',
        body_content: '<img src=x onerror=alert(1)>',
      };
      const result = sanitizePostContent(content);
      expect(result.title).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#47;script&gt;');
      expect(result.body_content).toBe('&lt;img src=x onerror=alert(1)&gt;');
    });

    it('should sanitize excerpt when provided', () => {
      const content = {
        title: 'Safe title',
        body_content: 'Safe body',
        excerpt: '<b>excerpt</b>',
      };
      const result = sanitizePostContent(content);
      expect(result.excerpt).toBe('&lt;b&gt;excerpt&lt;&#47;b&gt;');
    });

    it('should handle missing excerpt', () => {
      const content = {
        title: 'Title',
        body_content: 'Body',
      };
      const result = sanitizePostContent(content);
      expect(result.excerpt).toBeUndefined();
    });

    it('should preserve non-HTML content', () => {
      const content = {
        title: 'Application crashes on startup',
        body_content: 'Every time I start the app, it crashes.',
      };
      const result = sanitizePostContent(content);
      expect(result.title).toBe('Application crashes on startup');
      expect(result.body_content).toBe('Every time I start the app, it crashes.');
    });
  });

  describe('sanitizeResponseContent', () => {
    it('should sanitize response content', () => {
      const content = '<script>alert("xss")</script>';
      const result = sanitizeResponseContent(content);
      expect(result).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#47;script&gt;');
    });

    it('should handle normal text', () => {
      const content = 'Thank you for your report.';
      const result = sanitizeResponseContent(content);
      expect(result).toBe('Thank you for your report.');
    });

    it('should escape quotes in response', () => {
      const content = 'Here\'s a "quoted" response';
      const result = sanitizeResponseContent(content);
      expect(result).toContain('&#39;s');
      expect(result).toContain('&quot;quoted&quot;');
    });
  });

  describe('sanitizeTemplateContent', () => {
    it('should sanitize template content while preserving placeholders', () => {
      const content = 'Hello {{name}}, <script>alert(1)</script>';
      const result = sanitizeTemplateContent(content);
      expect(result).toContain('Hello {{name}}');
      expect(result).toContain('&lt;script&gt;alert(1)&lt;&#47;script&gt;');
    });

    it('should handle template with multiple placeholders', () => {
      const content = 'Hi {{user}}, your ticket #{{id}} is <b>important</b>';
      const result = sanitizeTemplateContent(content);
      expect(result).toContain('Hi {{user}}');
      expect(result).toContain('ticket #{{id}}');
      expect(result).toContain('&lt;b&gt;important&lt;&#47;b&gt;');
    });

    it('should handle empty template', () => {
      const content = '';
      const result = sanitizeTemplateContent(content);
      expect(result).toBe('');
    });

    it('should escape dangerous patterns in template', () => {
      const content = '<img src=x onerror=alert(1)> {{name}}';
      const result = sanitizeTemplateContent(content);
      expect(result).toContain('&lt;img');
      expect(result).toContain('{{name}}');
    });
  });

  describe('Integration Tests', () => {
    it('should validate dangerous input before sanitization', () => {
      const attack = '<script>alert("xss")</script><img src=x onerror=alert(1)><a href="javascript:alert(1)">click</a>';

      // First validate - should detect dangerous patterns
      const preValidation = validateInputSafety(attack);
      expect(preValidation.isValid).toBe(false);

      // Then sanitize - escapes HTML characters
      const sanitized = sanitizeInput(attack);
      expect(sanitized).not.toContain('<script>');

      // The validateInputSafety checks for patterns in raw HTML
      // After sanitization, the tags are escaped but text content remains
      // So we validate BEFORE sanitization in real usage
    });

    it('should sanitize nested complex objects', () => {
      const obj = {
        post: {
          title: '<script>alert(1)</script>',
          author: {
            name: '<img src=x onerror=alert(1)>',
            bio: 'normal bio',
          },
          tags: ['<b>tag</b>', 'normal', '<script>'],
        },
      };

      const result = sanitizeObject(obj);
      expect(result.post.title).toContain('&lt;script&gt;');
      expect(result.post.author.name).toContain('&lt;img');
      expect(result.post.author.bio).toBe('normal bio');
      expect(result.post.tags[0]).toContain('&lt;b&gt;');
      expect(result.post.tags[1]).toBe('normal');
      expect(result.post.tags[2]).toContain('&lt;script&gt;');
    });

    it('should validate and sanitize post content together', () => {
      const content = {
        title: '<script>alert("xss")</script>',
        body_content: 'Normal content with <b>formatting</b>',
      };

      // First validate
      const validation = validateInputSafety(content.title);
      expect(validation.isValid).toBe(false);

      // Then sanitize
      const sanitized = sanitizePostContent(content);
      expect(sanitized.title).toContain('&lt;script&gt;');

      // Re-validate sanitized content
      const revalidation = validateInputSafety(sanitized.title);
      expect(revalidation.isValid).toBe(true);
    });
  });
});
