import { describe, it, expect } from 'vitest';
import {
  categorySchema,
  agentSchema,
  presenceSchema,
  moderationPostSchema,
  responseSchema,
  responseTemplateSchema,
  priorityRuleSchema,
  Priority,
  PostStatus,
  AgentStatus,
  AgentRole,
  SentimentLabel,
  type Category,
  type Agent,
  type Presence,
  type ModerationPost,
  type Response,
  type ResponseTemplate,
  type PriorityRule,
} from './index';

describe('Validation Schemas', () => {
  describe('Category Schema', () => {
    it('should validate a valid category', () => {
      const validCategory = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Technical Support',
        slug: 'technical-support',
        description: 'Technical issues and troubleshooting',
        color: '#f97316',
        icon: 'Wrench',
        position: 0,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const result = categorySchema.safeParse(validCategory);
      expect(result.success).toBe(true);
      if (result.success) {
        const category: Category = result.data;
        expect(category.name).toBe('Technical Support');
        expect(category.color).toBe('#f97316');
      }
    });

    it('should reject category with invalid color format', () => {
      const invalidCategory = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test',
        slug: 'test',
        color: 'red', // Invalid color format
        position: 0,
        is_active: true,
      };

      const result = categorySchema.safeParse(invalidCategory);
      expect(result.success).toBe(false);
    });

    it('should reject category with empty name', () => {
      const invalidCategory = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: '', // Name too short
        slug: 'test',
        color: '#f97316',
        position: 0,
        is_active: true,
      };

      const result = categorySchema.safeParse(invalidCategory);
      expect(result.success).toBe(false);
    });

    it('should reject category with negative position', () => {
      const invalidCategory = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test',
        slug: 'test',
        color: '#f97316',
        position: -1, // Negative position
        is_active: true,
      };

      const result = categorySchema.safeParse(invalidCategory);
      expect(result.success).toBe(false);
    });
  });

  describe('Agent Schema', () => {
    it('should validate a valid agent', () => {
      const validAgent = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        user_id: '123e4567-e89b-12d3-a456-426614174001',
        display_name: 'John Doe',
        avatar_url: 'https://example.com/avatar.jpg',
        role: 'agent' as const,
        status: 'online' as const,
        last_active_at: '2024-01-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
      };

      const result = agentSchema.safeParse(validAgent);
      expect(result.success).toBe(true);
      if (result.success) {
        const agent: Agent = result.data;
        expect(agent.display_name).toBe('John Doe');
        expect(agent.role).toBe('agent');
        expect(agent.status).toBe('online');
      }
    });

    it('should accept agent with null avatar_url', () => {
      const agentWithNullAvatar = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        user_id: '123e4567-e89b-12d3-a456-426614174001',
        display_name: 'Jane Doe',
        avatar_url: null,
        role: 'supervisor' as const,
        status: 'offline' as const,
      };

      const result = agentSchema.safeParse(agentWithNullAvatar);
      expect(result.success).toBe(true);
    });

    it('should reject agent with invalid role', () => {
      const invalidAgent = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        user_id: '123e4567-e89b-12d3-a456-426614174001',
        display_name: 'Test Agent',
        role: 'invalid_role', // Invalid role
        status: 'online' as const,
      };

      const result = agentSchema.safeParse(invalidAgent);
      expect(result.success).toBe(false);
    });

    it('should reject agent with empty display name', () => {
      const invalidAgent = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        user_id: '123e4567-e89b-12d3-a456-426614174001',
        display_name: '', // Empty name
        role: 'admin' as const,
        status: 'busy' as const,
      };

      const result = agentSchema.safeParse(invalidAgent);
      expect(result.success).toBe(false);
    });
  });

  describe('Presence Schema', () => {
    it('should validate a valid presence', () => {
      const validPresence = {
        post_id: '123e4567-e89b-12d3-a456-426614174000',
        agent_id: '123e4567-e89b-12d3-a456-426614174001',
        agent_name: 'Alice Johnson',
        agent_status: 'online' as const,
        timestamp: '2024-01-01T00:00:00Z',
      };

      const result = presenceSchema.safeParse(validPresence);
      expect(result.success).toBe(true);
      if (result.success) {
        const presence: Presence = result.data;
        expect(presence.agent_name).toBe('Alice Johnson');
        expect(presence.agent_status).toBe('online');
      }
    });

    it('should reject presence with empty agent name', () => {
      const invalidPresence = {
        post_id: '123e4567-e89b-12d3-a456-426614174000',
        agent_id: '123e4567-e89b-12d3-a456-426614174001',
        agent_name: '', // Empty name
        agent_status: 'online' as const,
        timestamp: '2024-01-01T00:00:00Z',
      };

      const result = presenceSchema.safeParse(invalidPresence);
      expect(result.success).toBe(false);
    });

    it('should reject presence with invalid timestamp', () => {
      const invalidPresence = {
        post_id: '123e4567-e89b-12d3-a456-426614174000',
        agent_id: '123e4567-e89b-12d3-a456-426614174001',
        agent_name: 'Bob Smith',
        agent_status: 'busy' as const,
        timestamp: 'not-a-datetime', // Invalid timestamp
      };

      const result = presenceSchema.safeParse(invalidPresence);
      expect(result.success).toBe(false);
    });
  });

  describe('Moderation Post Schema', () => {
    it('should validate a valid moderation post', () => {
      const validPost = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Application crashes on startup',
        body_content: 'Every time I try to start the application, it crashes immediately.',
        excerpt: 'Every time I try to start...',
        category_id: '123e4567-e89b-12d3-a456-426614174001',
        status: 'open' as const,
        priority: 'P1' as const,
        sentiment_score: -0.6,
        sentiment_label: 'negative' as const,
        author_user_id: '123e4567-e89b-12d3-a456-426614174002',
        author_post_count: 0,
        assigned_to_id: null,
        assigned_at: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        resolved_at: null,
        embedding: [0.1, 0.2, 0.3],
      };

      const result = moderationPostSchema.safeParse(validPost);
      expect(result.success).toBe(true);
      if (result.success) {
        const post: ModerationPost = result.data;
        expect(post.title).toBe('Application crashes on startup');
        expect(post.priority).toBe('P1');
        expect(post.status).toBe('open');
      }
    });

    it('should accept post with null assignment fields', () => {
      const postWithNulls = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Test Post',
        body_content: 'Test content',
        category_id: '123e4567-e89b-12d3-a456-426614174001',
        status: 'in_progress' as const,
        priority: 'P2' as const,
        sentiment_score: 0.0,
        sentiment_label: 'neutral' as const,
        author_user_id: '123e4567-e89b-12d3-a456-426614174002',
        author_post_count: 5,
        assigned_to_id: null,
        assigned_at: null,
        resolved_at: null,
        created_at: '2024-01-01T00:00:00Z',
      };

      const result = moderationPostSchema.safeParse(postWithNulls);
      expect(result.success).toBe(true);
    });

    it('should reject post with invalid priority', () => {
      const invalidPost = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Test',
        body_content: 'Test',
        category_id: '123e4567-e89b-12d3-a456-426614174001',
        status: 'open' as const,
        priority: 'P6', // Invalid priority
        sentiment_score: 0.0,
        sentiment_label: 'neutral' as const,
        author_user_id: '123e4567-e89b-12d3-a456-426614174002',
        author_post_count: 1,
      };

      const result = moderationPostSchema.safeParse(invalidPost);
      expect(result.success).toBe(false);
    });

    it('should reject post with sentiment score out of range', () => {
      const invalidPost = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Test',
        body_content: 'Test',
        category_id: '123e4567-e89b-12d3-a456-426614174001',
        status: 'open' as const,
        priority: 'P3' as const,
        sentiment_score: 1.5, // Score must be between -1 and 1
        sentiment_label: 'neutral' as const,
        author_user_id: '123e4567-e89b-12d3-a456-426614174002',
        author_post_count: 1,
      };

      const result = moderationPostSchema.safeParse(invalidPost);
      expect(result.success).toBe(false);
    });
  });

  describe('Response Schema', () => {
    it('should validate a valid response', () => {
      const validResponse = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        post_id: '123e4567-e89b-12d3-a456-426614174001',
        agent_id: '123e4567-e89b-12d3-a456-426614174002',
        content: 'Thank you for your report. We are looking into this issue.',
        is_internal_note: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const result = responseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
      if (result.success) {
        const response: Response = result.data;
        expect(response.is_internal_note).toBe(false);
        expect(response.content).toContain('Thank you');
      }
    });

    it('should validate internal note response', () => {
      const internalNote = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        post_id: '123e4567-e89b-12d3-a456-426614174001',
        agent_id: '123e4567-e89b-12d3-a456-426614174002',
        content: 'Internal note: User seems frustrated, prioritize this.',
        is_internal_note: true,
        created_at: '2024-01-01T00:00:00Z',
      };

      const result = responseSchema.safeParse(internalNote);
      expect(result.success).toBe(true);
    });

    it('should reject response with empty content', () => {
      const invalidResponse = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        post_id: '123e4567-e89b-12d3-a456-426614174001',
        agent_id: '123e4567-e89b-12d3-a456-426614174002',
        content: '', // Empty content
        is_internal_note: false,
      };

      const result = responseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });
  });

  describe('Response Template Schema', () => {
    it('should validate a valid response template', () => {
      const validTemplate = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Bug Report Acknowledgment',
        content: 'Hi {{user_name}}, thank you for reporting this issue. Our team is investigating it.',
        placeholders: ['user_name'],
        category_id: '123e4567-e89b-12d3-a456-426614174001',
        usage_count: 15,
        created_by: '123e4567-e89b-12d3-a456-426614174002',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const result = responseTemplateSchema.safeParse(validTemplate);
      expect(result.success).toBe(true);
      if (result.success) {
        const template: ResponseTemplate = result.data;
        expect(template.name).toBe('Bug Report Acknowledgment');
        expect(template.placeholders).toContain('user_name');
        expect(template.usage_count).toBe(15);
      }
    });

    it('should accept template with empty placeholders array', () => {
      const templateWithoutPlaceholders = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Generic Response',
        content: 'Thank you for contacting us.',
        placeholders: [],
        category_id: null,
        usage_count: 0,
        created_by: '123e4567-e89b-12d3-a456-426614174001',
        created_at: '2024-01-01T00:00:00Z',
      };

      const result = responseTemplateSchema.safeParse(templateWithoutPlaceholders);
      expect(result.success).toBe(true);
    });

    it('should reject template with empty name', () => {
      const invalidTemplate = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: '', // Empty name
        content: 'Some content',
        placeholders: [],
        usage_count: 0,
        created_by: '123e4567-e89b-12d3-a456-426614174001',
      };

      const result = responseTemplateSchema.safeParse(invalidTemplate);
      expect(result.success).toBe(false);
    });

    it('should reject template with negative usage count', () => {
      const invalidTemplate = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Template',
        content: 'Test content',
        placeholders: [],
        usage_count: -1, // Negative count
        created_by: '123e4567-e89b-12d3-a456-426614174001',
      };

      const result = responseTemplateSchema.safeParse(invalidTemplate);
      expect(result.success).toBe(false);
    });
  });

  describe('Priority Rule Schema', () => {
    it('should validate a valid priority rule', () => {
      const validRule = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'First-Time Poster Rule',
        description: 'Automatically prioritize posts from first-time users',
        condition_type: 'first_time_poster' as const,
        condition_value: '2',
        action_type: 'set_priority' as const,
        action_value: 'P2',
        position: 0,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const result = priorityRuleSchema.safeParse(validRule);
      expect(result.success).toBe(true);
      if (result.success) {
        const rule: PriorityRule = result.data;
        expect(rule.name).toBe('First-Time Poster Rule');
        expect(rule.condition_type).toBe('first_time_poster');
        expect(rule.action_type).toBe('set_priority');
      }
    });

    it('should accept rule with empty action value', () => {
      const ruleWithEmptyAction = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Escalation Rule',
        description: 'Escalate posts matching certain criteria',
        condition_type: 'sla_exceeded' as const,
        condition_value: '4',
        action_type: 'escalate' as const,
        action_value: '',
        position: 1,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
      };

      const result = priorityRuleSchema.safeParse(ruleWithEmptyAction);
      expect(result.success).toBe(true);
    });

    it('should reject rule with negative position', () => {
      const invalidRule = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Rule',
        description: 'Test description',
        condition_type: 'sentiment_negative' as const,
        condition_value: '-0.3',
        action_type: 'set_priority' as const,
        action_value: 'P2',
        position: -1, // Negative position
        is_active: true,
      };

      const result = priorityRuleSchema.safeParse(invalidRule);
      expect(result.success).toBe(false);
    });

    it('should reject rule with empty name', () => {
      const invalidRule = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: '', // Empty name
        description: 'Test',
        condition_type: 'keyword_match' as const,
        condition_value: 'urgent',
        action_type: 'escalate' as const,
        action_value: '',
        position: 0,
        is_active: false,
      };

      const result = priorityRuleSchema.safeParse(invalidRule);
      expect(result.success).toBe(false);
    });
  });

  describe('Enum Constants', () => {
    it('should have correct Priority values', () => {
      expect(Priority.P1).toBe('P1');
      expect(Priority.P2).toBe('P2');
      expect(Priority.P3).toBe('P3');
      expect(Priority.P4).toBe('P4');
      expect(Priority.P5).toBe('P5');
    });

    it('should have correct PostStatus values', () => {
      expect(PostStatus.OPEN).toBe('open');
      expect(PostStatus.IN_PROGRESS).toBe('in_progress');
      expect(PostStatus.RESOLVED).toBe('resolved');
    });

    it('should have correct AgentStatus values', () => {
      expect(AgentStatus.ONLINE).toBe('online');
      expect(AgentStatus.OFFLINE).toBe('offline');
      expect(AgentStatus.BUSY).toBe('busy');
    });

    it('should have correct AgentRole values', () => {
      expect(AgentRole.AGENT).toBe('agent');
      expect(AgentRole.SUPERVISOR).toBe('supervisor');
      expect(AgentRole.ADMIN).toBe('admin');
      expect(AgentRole.MODERATOR).toBe('moderator');
    });

    it('should have correct SentimentLabel values', () => {
      expect(SentimentLabel.NEGATIVE).toBe('negative');
      expect(SentimentLabel.NEUTRAL).toBe('neutral');
      expect(SentimentLabel.POSITIVE).toBe('positive');
    });
  });
});
