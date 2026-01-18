import { describe, it, expect } from 'vitest';
import {
  buildSuggestionPrompt,
  buildSentimentPrompt,
  parseSentimentResult,
  prepareTextForEmbedding,
  cosineSimilarity,
  generateEmbedding,
  generatePostEmbedding,
  type SuggestContext,
} from './index';
import type { ModerationPost } from '../validation';

describe('AI/RAG Module', () => {
  describe('buildSuggestionPrompt', () => {
    it('should build a prompt with post details', () => {
      const post: ModerationPost = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Application crashes on startup',
        body_content: 'Every time I try to start the application, it crashes.',
        category_id: '123e4567-e89b-12d3-a456-426614174001',
        status: 'open',
        priority: 'P1',
        sentiment_score: -0.6,
        sentiment_label: 'negative',
        author_user_id: '123e4567-e89b-12d3-a456-426614174002',
        author_post_count: 1,
        assigned_to_id: null,
        assigned_at: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        resolved_at: null,
      };

      const context: SuggestContext = { post };
      const prompt = buildSuggestionPrompt(context);

      expect(prompt).toContain('Application crashes on startup');
      expect(prompt).toContain('Every time I try to start');
      expect(prompt).toContain('Priority: P1');
      expect(prompt).toContain('Sentiment: negative');
      expect(prompt).toContain('first-time poster');
    });

    it('should include similar responses when provided', () => {
      const post: ModerationPost = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Test Post',
        body_content: 'Test content',
        category_id: '123e4567-e89b-12d3-a456-426614174001',
        status: 'open',
        priority: 'P3',
        author_user_id: '123e4567-e89b-12d3-a456-426614174002',
        author_post_count: 5,
        assigned_to_id: null,
        assigned_at: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        resolved_at: null,
      };

      const context: SuggestContext = {
        post,
        similarResponses: [
          {
            id: 'resp1',
            post_id: 'post1',
            agent_id: 'agent1',
            content: 'Thank you for your feedback!',
            is_internal_note: false,
            created_at: '2024-01-01T00:00:00Z',
          },
        ],
      };
      const prompt = buildSuggestionPrompt(context);

      expect(prompt).toContain('Similar Past Responses');
      expect(prompt).toContain('Thank you for your feedback!');
    });

    it('should include templates when provided', () => {
      const post: ModerationPost = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Test Post',
        body_content: 'Test content',
        category_id: '123e4567-e89b-12d3-a456-426614174001',
        status: 'open',
        priority: 'P3',
        author_user_id: '123e4567-e89b-12d3-a456-426614174002',
        author_post_count: 5,
        assigned_to_id: null,
        assigned_at: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        resolved_at: null,
      };

      const context: SuggestContext = {
        post,
        templates: ['Template 1: Hello {{name}}', 'Template 2: Thanks for reaching out'],
      };
      const prompt = buildSuggestionPrompt(context);

      expect(prompt).toContain('Available Templates');
      expect(prompt).toContain('Template 1');
    });

    it('should not include similar responses section when empty', () => {
      const post: ModerationPost = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Test Post',
        body_content: 'Test content',
        category_id: '123e4567-e89b-12d3-a456-426614174001',
        status: 'open',
        priority: 'P3',
        author_user_id: '123e4567-e89b-12d3-a456-426614174002',
        author_post_count: 5,
        assigned_to_id: null,
        assigned_at: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        resolved_at: null,
      };

      const context: SuggestContext = { post };
      const prompt = buildSuggestionPrompt(context);

      expect(prompt).not.toContain('Similar Past Responses');
      expect(prompt).not.toContain('Available Templates');
    });
  });

  describe('buildSentimentPrompt', () => {
    it('should build a sentiment analysis prompt', () => {
      const text = 'I am very frustrated with this product!';
      const prompt = buildSentimentPrompt(text);

      expect(prompt).toContain(text);
      expect(prompt).toContain('Analyze the sentiment');
      expect(prompt).toContain('JSON');
      expect(prompt).toContain('score');
      expect(prompt).toContain('label');
      expect(prompt).toContain('confidence');
    });
  });

  describe('parseSentimentResult', () => {
    it('should parse valid JSON sentiment response', () => {
      const response = '{"score": -0.8, "label": "negative", "confidence": 0.95}';
      const result = parseSentimentResult(response);

      expect(result.score).toBe(-0.8);
      expect(result.label).toBe('negative');
      expect(result.confidence).toBe(0.95);
    });

    it('should extract JSON from markdown response', () => {
      const response = 'Here is the result:\n```json\n{"score": 0.5, "label": "positive", "confidence": 0.8}\n```';
      const result = parseSentimentResult(response);

      expect(result.score).toBe(0.5);
      expect(result.label).toBe('positive');
    });

    it('should clamp score to valid range', () => {
      const response = '{"score": 2.0, "label": "positive", "confidence": 0.8}';
      const result = parseSentimentResult(response);

      expect(result.score).toBe(1); // Clamped to 1
    });

    it('should derive label from score when not provided', () => {
      const response = '{"score": -0.5, "confidence": 0.8}';
      const result = parseSentimentResult(response);

      expect(result.label).toBe('negative');
    });

    it('should return neutral default on parse failure', () => {
      const response = 'Invalid JSON';
      const result = parseSentimentResult(response);

      expect(result.score).toBe(0);
      expect(result.label).toBe('neutral');
      expect(result.confidence).toBe(0.5);
    });
  });

  describe('prepareTextForEmbedding', () => {
    it('should combine title and body content', () => {
      const post: ModerationPost = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'My Title',
        body_content: 'My Body Content',
        category_id: '123e4567-e89b-12d3-a456-426614174001',
        status: 'open',
        priority: 'P3',
        author_user_id: '123e4567-e89b-12d3-a456-426614174002',
        author_post_count: 1,
        assigned_to_id: null,
        assigned_at: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        resolved_at: null,
      };

      const text = prepareTextForEmbedding(post);
      expect(text).toBe('My Title\n\nMy Body Content');
    });
  });

  describe('cosineSimilarity', () => {
    it('should calculate perfect similarity for identical vectors', () => {
      const a = [1, 2, 3];
      const b = [1, 2, 3];
      const similarity = cosineSimilarity(a, b);

      expect(similarity).toBe(1);
    });

    it('should calculate 0 similarity for orthogonal vectors', () => {
      const a = [1, 0, 0];
      const b = [0, 1, 0];
      const similarity = cosineSimilarity(a, b);

      expect(similarity).toBe(0);
    });

    it('should calculate negative similarity for opposite vectors', () => {
      const a = [1, 1, 1];
      const b = [-1, -1, -1];
      const similarity = cosineSimilarity(a, b);

      expect(similarity).toBeCloseTo(-1);
    });

    it('should calculate partial similarity', () => {
      const a = [1, 2, 3];
      const b = [1, 2, 4];
      const similarity = cosineSimilarity(a, b);

      expect(similarity).toBeGreaterThan(0.9);
      expect(similarity).toBeLessThan(1);
    });

    it('should throw error for different length vectors', () => {
      const a = [1, 2, 3];
      const b = [1, 2];

      expect(() => cosineSimilarity(a, b)).toThrow('Vectors must have the same length');
    });

    it('should handle zero vectors', () => {
      const a = [0, 0, 0];
      const b = [0, 0, 0];
      const similarity = cosineSimilarity(a, b);

      expect(similarity).toBe(0);
    });
  });

  describe('generateEmbedding', () => {
    it('should generate embedding of correct dimensions', () => {
      const text = 'Hello world';
      const embedding = generateEmbedding(text);

      expect(embedding).toHaveLength(1536);
    });

    it('should generate deterministic embeddings', () => {
      const text = 'Hello world';
      const embedding1 = generateEmbedding(text);
      const embedding2 = generateEmbedding(text);

      expect(embedding1).toEqual(embedding2);
    });

    it('should generate different embeddings for different text', () => {
      const embedding1 = generateEmbedding('Hello world');
      const embedding2 = generateEmbedding('Goodbye world');

      expect(embedding1).not.toEqual(embedding2);
    });

    it('should generate embeddings with values in valid range', () => {
      const text = 'Test text';
      const embedding = generateEmbedding(text);

      for (const value of embedding) {
        expect(value).toBeGreaterThanOrEqual(-1);
        expect(value).toBeLessThanOrEqual(1);
      }
    });

    it('should accept custom dimensions', () => {
      const text = 'Hello world';
      const embedding = generateEmbedding(text, 384);

      expect(embedding).toHaveLength(384);
    });
  });

  describe('generatePostEmbedding', () => {
    it('should generate embedding from post', () => {
      const post = {
        title: 'Application crashes',
        body_content: 'The app crashes on startup',
      };

      const embedding = generatePostEmbedding(post);

      expect(embedding).toHaveLength(1536);
    });

    it('should generate deterministic embedding from post', () => {
      const post = {
        title: 'Application crashes',
        body_content: 'The app crashes on startup',
      };

      const embedding1 = generatePostEmbedding(post);
      const embedding2 = generatePostEmbedding(post);

      expect(embedding1).toEqual(embedding2);
    });
  });
});
