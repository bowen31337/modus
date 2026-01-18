/**
 * In-Memory Data Store
 *
 * This is a temporary in-memory data store for development and testing.
 * In production, this will be replaced with Supabase database queries.
 */

import type { ModerationPost, PriorityRule, Response, ResponseTemplate } from '@modus/logic';
import {
  RulesEngine,
  generatePostEmbedding,
  sanitizeModerationPost,
  sanitizeResponse,
  sanitizeTemplate,
} from '@modus/logic';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// Types
// ============================================================================

export interface PostWithRelations extends ModerationPost {
  category?: {
    id: string;
    name: string;
    color: string;
  };
  assigned_agent?: {
    id: string;
    display_name: string;
  } | null;
  responses?: Response[];
}

export interface CreatePostInput {
  title: string;
  body_content: string;
  excerpt?: string;
  category_id?: string | null;
  status: 'open' | 'in_progress' | 'resolved';
  priority: 'P1' | 'P2' | 'P3' | 'P4' | 'P5';
  sentiment_score?: number | null;
  sentiment_label?: 'negative' | 'neutral' | 'positive' | null;
  author_user_id: string;
  author_post_count: number;
  assigned_to_id?: string | null;
  embedding?: number[] | null;
}

export interface UpdatePostInput {
  status?: 'open' | 'in_progress' | 'resolved';
  priority?: 'P1' | 'P2' | 'P3' | 'P4' | 'P5';
}

export interface CreateRuleInput {
  name: string;
  description?: string;
  condition_type: string;
  condition_value: string;
  action_type: string;
  action_value: string;
  is_active?: boolean;
}

export interface UpdateRuleInput {
  name?: string;
  description?: string;
  condition_type?: string;
  condition_value?: string;
  action_type?: string;
  action_value?: string;
  is_active?: boolean;
}

export interface TestRuleInput {
  title: string;
  body_content: string;
  author_post_count: number;
  sentiment_score?: number;
  category_id?: string;
  created_at?: string;
}

export interface TestRuleResult {
  matched_rules: Array<{
    rule_id: string;
    rule_name: string;
    action_type: string;
    action_value: string;
  }>;
  calculated_priority: string;
}

// ============================================================================
// Initial Mock Data
// ============================================================================

// ============================================================================
// Initial Mock Rules
// ============================================================================

const mockRules: PriorityRule[] = [
  {
    id: 'rule-1',
    name: 'First Time Poster Escalation',
    description: 'Escalate posts from first-time posters to P2 priority',
    condition_type: 'first_time_poster',
    condition_value: '2',
    action_type: 'set_priority',
    action_value: 'P2',
    position: 1,
    is_active: true,
    created_at: '2025-01-17T18:00:00Z',
    updated_at: '2025-01-17T18:00:00Z',
  },
  {
    id: 'rule-2',
    name: 'Negative Sentiment Escalation',
    description: 'Escalate posts with negative sentiment to higher priority',
    condition_type: 'sentiment_negative',
    condition_value: '-0.3',
    action_type: 'escalate',
    action_value: '1',
    position: 2,
    is_active: true,
    created_at: '2025-01-17T18:00:00Z',
    updated_at: '2025-01-17T18:00:00Z',
  },
  {
    id: 'rule-3',
    name: 'SLA Exceeded Escalation',
    description: 'Escalate posts that have been open for more than 2 hours',
    condition_type: 'sla_exceeded',
    condition_value: '2',
    action_type: 'escalate',
    action_value: '1',
    position: 3,
    is_active: true,
    created_at: '2025-01-17T18:00:00Z',
    updated_at: '2025-01-17T18:00:00Z',
  },
  {
    id: 'rule-4',
    name: 'Keyword Match: Urgent',
    description: 'Escalate posts containing urgent keywords',
    condition_type: 'keyword_match',
    condition_value: 'urgent,urgently,asap,immediately',
    action_type: 'set_priority',
    action_value: 'P1',
    position: 4,
    is_active: true,
    created_at: '2025-01-17T18:00:00Z',
    updated_at: '2025-01-17T18:00:00Z',
  },
  {
    id: 'rule-5',
    name: 'Bug Report Category',
    description: 'Set P2 priority for bug reports',
    condition_type: 'category_match',
    condition_value: '33333333-3333-3333-3333-333333333333',
    action_type: 'set_priority',
    action_value: 'P2',
    position: 5,
    is_active: true,
    created_at: '2025-01-17T18:00:00Z',
    updated_at: '2025-01-17T18:00:00Z',
  },
];

// Category UUIDs (matching the ones used in queue-pane.tsx)
const CATEGORY_UUIDS = {
  'Account Issues': '11111111-1111-1111-1111-111111111111',
  'Feature Request': '22222222-2222-2222-2222-222222222222',
  'Bug Reports': '33333333-3333-3333-3333-333333333333',
  'Help & Support': '44444444-4444-4444-4444-444444444444',
  'Policy & Guidelines': '55555555-5555-5555-5555-555555555555',
} as const;

const mockPosts: PostWithRelations[] = [
  {
    id: '1',
    title: 'Unable to access my account after password reset',
    body_content:
      "I reset my password yesterday but still can't log in. The system keeps saying my credentials are invalid. I've tried clearing my cache, using incognito mode, and even a different browser, but nothing works. I need to access my account urgently for work purposes. Please help me resolve this issue as soon as possible.",
    excerpt:
      "I reset my password yesterday but still can't log in. The system keeps saying my credentials are invalid...",
    category_id: CATEGORY_UUIDS['Account Issues'],
    status: 'open',
    priority: 'P2',
    sentiment_score: -0.3,
    sentiment_label: 'negative',
    author_user_id: 'user-1',
    author_post_count: 1,
    assigned_to_id: null,
    assigned_at: null,
    created_at: '2025-01-18T10:30:00Z',
    updated_at: '2025-01-18T10:30:00Z',
    resolved_at: null,
    category: {
      id: CATEGORY_UUIDS['Account Issues'] as string,
      name: 'Account Issues',
      color: '#eab308',
    },
    assigned_agent: null,
    responses: [],
    embedding: generatePostEmbedding({
      title: 'Unable to access my account after password reset',
      body_content:
        "I reset my password yesterday but still can't log in. The system keeps saying my credentials are invalid. I've tried clearing my cache, using incognito mode, and even a different browser, but nothing works. I need to access my account urgently for work purposes. Please help me resolve this issue as soon as possible.",
    }),
  },
  {
    id: '2',
    title: 'Feature request: Dark mode for mobile app',
    body_content:
      'Would love to see a dark mode option in the mobile application. My eyes get tired using the app at night, and the bright white background is really uncomfortable. Many other apps have this feature now, and it would be great if you could implement it. Maybe you could also add an automatic option that switches based on system settings.',
    excerpt:
      'Would love to see a dark mode option in the mobile application. My eyes get tired using the app at night...',
    category_id: CATEGORY_UUIDS['Feature Request'],
    status: 'open',
    priority: 'P3',
    sentiment_score: 0.2,
    sentiment_label: 'positive',
    author_user_id: 'user-2',
    author_post_count: 5,
    assigned_to_id: null,
    assigned_at: null,
    created_at: '2025-01-17T14:15:00Z',
    updated_at: '2025-01-17T14:15:00Z',
    resolved_at: null,
    category: {
      id: CATEGORY_UUIDS['Feature Request'] as string,
      name: 'Feature Request',
      color: '#8b5cf6',
    },
    assigned_agent: null,
    responses: [],
    embedding: generatePostEmbedding({
      title: 'Feature request: Dark mode for mobile app',
      body_content:
        'Would love to see a dark mode option in the mobile application. My eyes get tired using the app at night, and the bright white background is really uncomfortable. Many other apps have this feature now, and it would be great if you could implement it. Maybe you could also add an automatic option that switches based on system settings.',
    }),
  },
  {
    id: '3',
    title: 'Bug: Images not loading in posts',
    body_content:
      "Since the last update, images in community posts are not loading. Just shows a broken image icon where the images should be. This is happening on both desktop and mobile versions. I've tried on different internet connections and the issue persists. It's really frustrating because images are a big part of the community experience.",
    excerpt:
      'Since the last update, images in community posts are not loading. Just shows a broken image icon...',
    category_id: CATEGORY_UUIDS['Bug Reports'],
    status: 'in_progress',
    priority: 'P1',
    sentiment_score: -0.6,
    sentiment_label: 'negative',
    author_user_id: 'user-3',
    author_post_count: 12,
    assigned_to_id: 'agent-1',
    assigned_at: '2025-01-17T15:00:00Z',
    created_at: '2025-01-17T13:45:00Z',
    updated_at: '2025-01-17T15:00:00Z',
    resolved_at: null,
    category: {
      id: CATEGORY_UUIDS['Bug Reports'] as string,
      name: 'Bug Reports',
      color: '#ef4444',
    },
    assigned_agent: {
      id: 'agent-1',
      display_name: 'Agent A',
    },
    responses: [],
    embedding: generatePostEmbedding({
      title: 'Bug: Images not loading in posts',
      body_content:
        "Since the last update, images in community posts are not loading. Just shows a broken image icon where the images should be. This is happening on both desktop and mobile versions. I've tried on different internet connections and the issue persists. It's really frustrating because images are a big part of the community experience.",
    }),
  },
  {
    id: '4',
    title: 'How do I change my email notification settings?',
    body_content:
      "I've been looking everywhere but can't find where to change my email notification preferences. I want to receive daily digest emails instead of instant notifications for every post. Can someone point me to the right setting? Thanks in advance!",
    excerpt:
      "I've been looking everywhere but can't find where to change my email notification preferences...",
    category_id: CATEGORY_UUIDS['Help & Support'],
    status: 'open',
    priority: 'P4',
    sentiment_score: 0.1,
    sentiment_label: 'neutral',
    author_user_id: 'user-4',
    author_post_count: 3,
    assigned_to_id: null,
    assigned_at: null,
    created_at: '2025-01-17T11:20:00Z',
    updated_at: '2025-01-17T11:20:00Z',
    resolved_at: null,
    category: {
      id: CATEGORY_UUIDS['Help & Support'] as string,
      name: 'Help & Support',
      color: '#3b82f6',
    },
    assigned_agent: null,
    responses: [],
    embedding: generatePostEmbedding({
      title: 'How do I change my email notification settings?',
      body_content:
        "I've been looking everywhere but can't find where to change my email notification preferences. I want to receive daily digest emails instead of instant notifications for every post. Can someone point me to the right setting? Thanks in advance!",
    }),
  },
  {
    id: '5',
    title: 'Community guidelines clarification needed',
    body_content:
      "I'm a bit confused about the community guidelines regarding self-promotion. I've seen some posts promoting products get removed while others stay up. What exactly is the policy? I want to make sure I don't accidentally break the rules when sharing my own projects. A clearer explanation would be really helpful for everyone.",
    excerpt: "I'm a bit confused about the community guidelines regarding self-promotion...",
    category_id: CATEGORY_UUIDS['Policy & Guidelines'],
    status: 'resolved',
    priority: 'P3',
    sentiment_score: 0.0,
    sentiment_label: 'neutral',
    author_user_id: 'user-5',
    author_post_count: 8,
    assigned_to_id: 'agent-2',
    assigned_at: '2025-01-16T10:00:00Z',
    created_at: '2025-01-16T09:30:00Z',
    updated_at: '2025-01-16T14:00:00Z',
    resolved_at: '2025-01-16T14:00:00Z',
    category: {
      id: CATEGORY_UUIDS['Policy & Guidelines'] as string,
      name: 'Policy & Guidelines',
      color: '#06b6d4',
    },
    assigned_agent: {
      id: 'agent-2',
      display_name: 'Agent B',
    },
    responses: [],
    embedding: generatePostEmbedding({
      title: 'Community guidelines clarification needed',
      body_content:
        "I'm a bit confused about the community guidelines regarding self-promotion. I've seen some posts promoting products get removed while others stay up. What exactly is the policy? I want to make sure I don't accidentally break the rules when sharing my own projects. A clearer explanation would be really helpful for everyone.",
    }),
  },
];

// ============================================================================
// Data Store Class
// ============================================================================

// ============================================================================
// Agent Types
// ============================================================================

export interface Agent {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url?: string | null;
  role: 'agent' | 'supervisor' | 'admin' | 'moderator';
  status: 'online' | 'offline' | 'busy';
  last_active_at: string;
  created_at: string;
}

// ============================================================================
// Initial Mock Agents
// ============================================================================

const mockAgents: Agent[] = [
  {
    id: 'agent-1',
    user_id: 'user-agent-1',
    display_name: 'Agent A',
    avatar_url: null,
    role: 'agent',
    status: 'online',
    last_active_at: new Date().toISOString(),
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'agent-2',
    user_id: 'user-agent-2',
    display_name: 'Agent B',
    avatar_url: null,
    role: 'supervisor',
    status: 'online',
    last_active_at: new Date().toISOString(),
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'agent-3',
    user_id: 'user-agent-3',
    display_name: 'Agent C',
    avatar_url: null,
    role: 'agent',
    status: 'offline',
    last_active_at: '2025-01-17T10:00:00Z',
    created_at: '2025-01-01T00:00:00Z',
  },
];

// ============================================================================
// Initial Mock Templates
// ============================================================================

const mockTemplates: ResponseTemplate[] = [
  {
    id: 'template-1',
    name: 'Bug Acknowledgment',
    content:
      "Hi {{authorName}}, thank you for reporting this issue. I've escalated this to our engineering team and they're investigating it now. We'll keep you updated on the progress.",
    placeholders: ['authorName'],
    category_id: '33333333-3333-3333-3333-333333333333',
    usage_count: 15,
    created_by: 'agent-1',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-15T00:00:00Z',
  },
  {
    id: 'template-2',
    name: 'Feature Request Response',
    content:
      "Hi {{authorName}}, thanks for your suggestion! We appreciate feedback like yours. I've added this to our feature request backlog for the team to consider.",
    placeholders: ['authorName'],
    category_id: '22222222-2222-2222-2222-222222222222',
    usage_count: 8,
    created_by: 'agent-2',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-10T00:00:00Z',
  },
  {
    id: 'template-3',
    name: 'General Welcome',
    content:
      "Welcome to the community, {{authorName}}! If you have any questions or need assistance, feel free to reach out. We're glad to have you here!",
    placeholders: ['authorName'],
    category_id: null,
    usage_count: 42,
    created_by: 'agent-1',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-12T00:00:00Z',
  },
  {
    id: 'template-4',
    name: 'Escalation Notice',
    content:
      'Hi {{authorName}}, your concern has been escalated to our senior team. Someone will review this shortly and get back to you with a resolution.',
    placeholders: ['authorName'],
    category_id: null,
    usage_count: 5,
    created_by: 'agent-2',
    created_at: '2025-01-05T00:00:00Z',
    updated_at: '2025-01-14T00:00:00Z',
  },
];

// ============================================================================
// Data Store Class
// ============================================================================

class DataStore {
  private posts: Map<string, PostWithRelations> = new Map();
  private responses: Map<string, Response> = new Map();
  private rules: Map<string, PriorityRule> = new Map();
  private agents: Map<string, Agent> = new Map();
  private templates: Map<string, ResponseTemplate> = new Map();

  constructor() {
    // Initialize with mock data
    mockPosts.forEach((post) => {
      this.posts.set(post.id, { ...post });
    });
    mockRules.forEach((rule) => {
      this.rules.set(rule.id, { ...rule });
    });
    mockAgents.forEach((agent) => {
      this.agents.set(agent.id, { ...agent });
    });
    mockTemplates.forEach((template) => {
      this.templates.set(template.id, { ...template });
    });
  }

  // ============================================================================
  // Posts CRUD Operations
  // ============================================================================

  getAllPosts(): PostWithRelations[] {
    return Array.from(this.posts.values());
  }

  getPostById(id: string): PostWithRelations | null {
    return this.posts.get(id) || null;
  }

  createPost(input: CreatePostInput): PostWithRelations {
    const now = new Date().toISOString();

    // Sanitize content to prevent XSS attacks
    const sanitized = sanitizeModerationPost({
      title: input.title,
      body_content: input.body_content,
      excerpt: input.excerpt,
    });

    const post: PostWithRelations = {
      id: uuidv4(),
      title: sanitized.title,
      body_content: sanitized.body_content,
      excerpt: sanitized.excerpt,
      category_id: input.category_id,
      status: input.status,
      priority: input.priority,
      sentiment_score: input.sentiment_score,
      sentiment_label: input.sentiment_label,
      author_user_id: input.author_user_id,
      author_post_count: input.author_post_count,
      assigned_to_id: input.assigned_to_id || null,
      assigned_at: input.assigned_to_id ? now : null,
      created_at: now,
      updated_at: now,
      resolved_at: null,
      category: this.getCategoryById(input.category_id),
      assigned_agent: input.assigned_to_id ? this.getAgentById(input.assigned_to_id) : null,
      responses: [],
      // Generate embedding if not provided
      embedding: input.embedding ?? generatePostEmbedding(input),
    };

    this.posts.set(post.id, post);
    return post;
  }

  updatePost(id: string, input: UpdatePostInput): PostWithRelations | null {
    const post = this.posts.get(id);
    if (!post) return null;

    const now = new Date().toISOString();
    const updated: PostWithRelations = {
      ...post,
      ...input,
      updated_at: now,
      // If status is being changed to resolved, set resolved_at
      resolved_at: input.status === 'resolved' ? now : post.resolved_at,
    };

    this.posts.set(id, updated);
    return updated;
  }

  deletePost(id: string): boolean {
    return this.posts.delete(id);
  }

  // ============================================================================
  // Assignment Operations
  // ============================================================================

  assignPost(postId: string, agentId: string): PostWithRelations | null {
    const post = this.posts.get(postId);
    if (!post) return null;

    const now = new Date().toISOString();
    const updated: PostWithRelations = {
      ...post,
      assigned_to_id: agentId,
      assigned_at: now,
      updated_at: now,
      assigned_agent: this.getAgentById(agentId),
    };

    this.posts.set(postId, updated);
    return updated;
  }

  releasePost(postId: string): PostWithRelations | null {
    const post = this.posts.get(postId);
    if (!post) return null;

    const now = new Date().toISOString();
    const updated: PostWithRelations = {
      ...post,
      assigned_to_id: null,
      assigned_at: null,
      updated_at: now,
      assigned_agent: null,
    };

    this.posts.set(postId, updated);
    return updated;
  }

  // ============================================================================
  // Response Operations
  // ============================================================================

  getAllResponses(): Response[] {
    return Array.from(this.responses.values());
  }

  getResponsesByPostId(postId: string): Response[] {
    return Array.from(this.responses.values()).filter((r) => r.post_id === postId);
  }

  createResponse(input: {
    post_id: string;
    agent_id: string;
    content: string;
    is_internal_note: boolean;
  }): Response {
    const now = new Date().toISOString();

    // Sanitize content to prevent XSS attacks
    const sanitizedContent = sanitizeResponse(input.content);

    const response: Response = {
      id: uuidv4(),
      post_id: input.post_id,
      agent_id: input.agent_id,
      content: sanitizedContent,
      is_internal_note: input.is_internal_note,
      created_at: now,
      updated_at: now,
    };

    this.responses.set(response.id, response);
    return response;
  }

  // ============================================================================
  // Rules CRUD Operations
  // ============================================================================

  getAllRules(): PriorityRule[] {
    return Array.from(this.rules.values()).sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  }

  getRuleById(id: string): PriorityRule | null {
    return this.rules.get(id) || null;
  }

  createRule(input: CreateRuleInput): PriorityRule {
    const now = new Date().toISOString();
    const allRules = this.getAllRules();
    const newPosition =
      allRules.length > 0 ? Math.max(...allRules.map((r) => r.position ?? 0)) + 1 : 1;

    const rule: PriorityRule = {
      id: uuidv4(),
      name: input.name,
      description: input.description || '',
      condition_type: input.condition_type,
      condition_value: input.condition_value,
      action_type: input.action_type,
      action_value: input.action_value,
      position: newPosition,
      is_active: input.is_active !== false,
      created_at: now,
      updated_at: now,
    };

    this.rules.set(rule.id, rule);
    return rule;
  }

  updateRule(id: string, input: UpdateRuleInput): PriorityRule | null {
    const rule = this.rules.get(id);
    if (!rule) return null;

    const now = new Date().toISOString();
    const updated: PriorityRule = {
      ...rule,
      ...input,
      updated_at: now,
    };

    this.rules.set(id, updated);
    return updated;
  }

  deleteRule(id: string): boolean {
    return this.rules.delete(id);
  }

  reorderRules(ruleIds: string[]): PriorityRule[] {
    // Update position for each rule based on the order in the array
    const now = new Date().toISOString();
    ruleIds.forEach((ruleId, index) => {
      const rule = this.rules.get(ruleId);
      if (rule) {
        const updated: PriorityRule = {
          ...rule,
          position: index + 1,
          updated_at: now,
        };
        this.rules.set(ruleId, updated);
      }
    });
    return this.getAllRules();
  }

  testRule(input: TestRuleInput, ruleId?: string): TestRuleResult {
    // Create a temporary post for testing
    const testPost: ModerationPost = {
      id: 'test-post',
      title: input.title,
      body_content: input.body_content,
      category_id: input.category_id,
      status: 'open',
      priority: 'P4', // Start with default priority
      sentiment_score: input.sentiment_score ?? 0,
      sentiment_label:
        input.sentiment_score !== undefined
          ? input.sentiment_score < -0.2
            ? 'negative'
            : input.sentiment_score > 0.2
              ? 'positive'
              : 'neutral'
          : null,
      author_user_id: 'test-user',
      author_post_count: input.author_post_count,
      assigned_to_id: null,
      assigned_at: null,
      created_at: input.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      resolved_at: null,
    };

    // Get rules to test (either specific rule or all active rules)
    const rulesToTest = ruleId
      ? [this.getRuleById(ruleId)].filter((r): r is PriorityRule => r !== null)
      : this.getAllRules().filter((r) => r.is_active);

    // Use RulesEngine to evaluate rules
    const rulesEngine = new RulesEngine(rulesToTest);
    const evaluationResults = rulesEngine.evaluate({ post: testPost });
    const calculatedPriority = rulesEngine.calculatePriority({ post: testPost });

    return {
      matched_rules: evaluationResults.map((r) => ({
        rule_id: r.rule.id,
        rule_name: r.rule.name,
        action_type: r.appliedAction?.type ?? '',
        action_value: r.appliedAction?.value ?? '',
      })),
      calculated_priority: calculatedPriority,
    };
  }

  // ============================================================================
  // Agents CRUD Operations
  // ============================================================================

  getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  getAgent(id: string): Agent | null {
    return this.agents.get(id) || null;
  }

  updateAgentStatus(id: string, status: 'online' | 'offline' | 'busy'): Agent | null {
    const agent = this.agents.get(id);
    if (!agent) return null;

    const now = new Date().toISOString();
    const updated: Agent = {
      ...agent,
      status,
      last_active_at: now,
    };

    this.agents.set(id, updated);
    return updated;
  }

  // ============================================================================
  // Templates CRUD Operations
  // ============================================================================

  getAllTemplates(): ResponseTemplate[] {
    return Array.from(this.templates.values());
  }

  getTemplate(id: string): ResponseTemplate | null {
    return this.templates.get(id) || null;
  }

  createTemplate(input: {
    name: string;
    content: string;
    placeholders?: string[];
    category_id?: string | null;
    created_by: string;
  }): ResponseTemplate {
    const now = new Date().toISOString();

    // Sanitize content to prevent XSS attacks
    const sanitizedContent = sanitizeTemplate(input.content);

    const template: ResponseTemplate = {
      id: uuidv4(),
      name: input.name,
      content: sanitizedContent,
      placeholders: input.placeholders || [],
      category_id: input.category_id || null,
      usage_count: 0,
      created_by: input.created_by,
      created_at: now,
      updated_at: now,
    };

    this.templates.set(template.id, template);
    return template;
  }

  updateTemplate(
    id: string,
    input: {
      name?: string;
      content?: string;
      placeholders?: string[];
      category_id?: string | null;
    }
  ): ResponseTemplate | null {
    const template = this.templates.get(id);
    if (!template) return null;

    const now = new Date().toISOString();

    // Sanitize content if provided
    const sanitizedContent = input.content ? sanitizeTemplate(input.content) : template.content;

    const updated: ResponseTemplate = {
      ...template,
      ...input,
      content: sanitizedContent,
      updated_at: now,
    };

    this.templates.set(id, updated);
    return updated;
  }

  deleteTemplate(id: string): boolean {
    return this.templates.delete(id);
  }

  incrementTemplateUsage(id: string): ResponseTemplate | null {
    const template = this.templates.get(id);
    if (!template) return null;

    const updated: ResponseTemplate = {
      ...template,
      usage_count: template.usage_count + 1,
    };

    this.templates.set(id, updated);
    return updated;
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private getCategoryById(
    categoryId: string | null | undefined
  ): { id: string; name: string; color: string } | undefined {
    if (!categoryId) return undefined;

    const categories: Record<string, { id: string; name: string; color: string }> = {
      '11111111-1111-1111-1111-111111111111': {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Account Issues',
        color: '#eab308',
      },
      '22222222-2222-2222-2222-222222222222': {
        id: '22222222-2222-2222-2222-222222222222',
        name: 'Feature Request',
        color: '#8b5cf6',
      },
      '33333333-3333-3333-3333-333333333333': {
        id: '33333333-3333-3333-3333-333333333333',
        name: 'Bug Reports',
        color: '#ef4444',
      },
      '44444444-4444-4444-4444-444444444444': {
        id: '44444444-4444-4444-4444-444444444444',
        name: 'Help & Support',
        color: '#3b82f6',
      },
      '55555555-5555-5555-5555-555555555555': {
        id: '55555555-5555-5555-5555-555555555555',
        name: 'Policy & Guidelines',
        color: '#06b6d4',
      },
    };

    return categories[categoryId];
  }

  private getAgentById(agentId: string): { id: string; display_name: string } | null {
    const agent = this.agents.get(agentId);
    if (!agent) return null;

    return {
      id: agent.id,
      display_name: agent.display_name,
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const dataStore = new DataStore();
