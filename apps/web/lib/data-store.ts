/**
 * In-Memory Data Store
 *
 * This is a temporary in-memory data store for development and testing.
 * In production, this will be replaced with Supabase database queries.
 */

import { v4 as uuidv4 } from 'uuid';
import type { ModerationPost, Response, PriorityRule } from '@modus/logic';
import { RulesEngine } from '@modus/logic/rules';

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
    condition_value: 'cat-3',
    action_type: 'set_priority',
    action_value: 'P2',
    position: 5,
    is_active: true,
    created_at: '2025-01-17T18:00:00Z',
    updated_at: '2025-01-17T18:00:00Z',
  },
];

const mockPosts: PostWithRelations[] = [
  {
    id: '1',
    title: 'Unable to access my account after password reset',
    body_content: 'I reset my password yesterday but still can\'t log in. The system keeps saying my credentials are invalid. I\'ve tried clearing my cache, using incognito mode, and even a different browser, but nothing works. I need to access my account urgently for work purposes. Please help me resolve this issue as soon as possible.',
    excerpt: 'I reset my password yesterday but still can\'t log in. The system keeps saying my credentials are invalid...',
    category_id: 'cat-1',
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
      id: 'cat-1',
      name: 'Account Issues',
      color: '#eab308',
    },
    assigned_agent: null,
    responses: [],
  },
  {
    id: '2',
    title: 'Feature request: Dark mode for mobile app',
    body_content: 'Would love to see a dark mode option in the mobile application. My eyes get tired using the app at night, and the bright white background is really uncomfortable. Many other apps have this feature now, and it would be great if you could implement it. Maybe you could also add an automatic option that switches based on system settings.',
    excerpt: 'Would love to see a dark mode option in the mobile application. My eyes get tired using the app at night...',
    category_id: 'cat-2',
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
      id: 'cat-2',
      name: 'Feature Request',
      color: '#8b5cf6',
    },
    assigned_agent: null,
    responses: [],
  },
  {
    id: '3',
    title: 'Bug: Images not loading in posts',
    body_content: 'Since the last update, images in community posts are not loading. Just shows a broken image icon where the images should be. This is happening on both desktop and mobile versions. I\'ve tried on different internet connections and the issue persists. It\'s really frustrating because images are a big part of the community experience.',
    excerpt: 'Since the last update, images in community posts are not loading. Just shows a broken image icon...',
    category_id: 'cat-3',
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
      id: 'cat-3',
      name: 'Bug Reports',
      color: '#ef4444',
    },
    assigned_agent: {
      id: 'agent-1',
      display_name: 'Agent A',
    },
    responses: [],
  },
  {
    id: '4',
    title: 'How do I change my email notification settings?',
    body_content: 'I\'ve been looking everywhere but can\'t find where to change my email notification preferences. I want to receive daily digest emails instead of instant notifications for every post. Can someone point me to the right setting? Thanks in advance!',
    excerpt: 'I\'ve been looking everywhere but can\'t find where to change my email notification preferences...',
    category_id: 'cat-4',
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
      id: 'cat-4',
      name: 'Help & Support',
      color: '#3b82f6',
    },
    assigned_agent: null,
    responses: [],
  },
  {
    id: '5',
    title: 'Community guidelines clarification needed',
    body_content: 'I\'m a bit confused about the community guidelines regarding self-promotion. I\'ve seen some posts promoting products get removed while others stay up. What exactly is the policy? I want to make sure I don\'t accidentally break the rules when sharing my own projects. A clearer explanation would be really helpful for everyone.',
    excerpt: 'I\'m a bit confused about the community guidelines regarding self-promotion...',
    category_id: 'cat-5',
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
      id: 'cat-5',
      name: 'Policy & Guidelines',
      color: '#06b6d4',
    },
    assigned_agent: {
      id: 'agent-2',
      display_name: 'Agent B',
    },
    responses: [],
  },
];

// ============================================================================
// Data Store Class
// ============================================================================

class DataStore {
  private posts: Map<string, PostWithRelations> = new Map();
  private responses: Map<string, Response> = new Map();
  private rules: Map<string, PriorityRule> = new Map();

  constructor() {
    // Initialize with mock data
    mockPosts.forEach(post => {
      this.posts.set(post.id, { ...post });
    });
    mockRules.forEach(rule => {
      this.rules.set(rule.id, { ...rule });
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
    const post: PostWithRelations = {
      id: uuidv4(),
      title: input.title,
      body_content: input.body_content,
      excerpt: input.excerpt,
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
    return Array.from(this.responses.values()).filter(r => r.post_id === postId);
  }

  createResponse(input: {
    post_id: string;
    agent_id: string;
    content: string;
    is_internal_note: boolean;
  }): Response {
    const now = new Date().toISOString();
    const response: Response = {
      id: uuidv4(),
      post_id: input.post_id,
      agent_id: input.agent_id,
      content: input.content,
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
    const newPosition = allRules.length > 0 ? Math.max(...allRules.map(r => r.position ?? 0)) + 1 : 1;

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
      sentiment_label: input.sentiment_score !== undefined
        ? (input.sentiment_score < -0.2 ? 'negative' : input.sentiment_score > 0.2 ? 'positive' : 'neutral')
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
      : this.getAllRules().filter(r => r.is_active);

    // Use RulesEngine to evaluate rules
    const rulesEngine = new RulesEngine(rulesToTest);
    const evaluationResults = rulesEngine.evaluate({ post: testPost });
    const calculatedPriority = rulesEngine.calculatePriority({ post: testPost });

    return {
      matched_rules: evaluationResults.map(r => ({
        rule_id: r.rule.id,
        rule_name: r.rule.name,
        action_type: r.appliedAction?.type ?? '',
        action_value: r.appliedAction?.value ?? '',
      })),
      calculated_priority: calculatedPriority,
    };
  }


  // ============================================================================
  // Helper Methods
  // ============================================================================

  private getCategoryById(categoryId: string | null | undefined): { id: string; name: string; color: string } | undefined {
    if (!categoryId) return undefined;

    const categories: Record<string, { id: string; name: string; color: string }> = {
      'cat-1': { id: 'cat-1', name: 'Account Issues', color: '#eab308' },
      'cat-2': { id: 'cat-2', name: 'Feature Request', color: '#8b5cf6' },
      'cat-3': { id: 'cat-3', name: 'Bug Reports', color: '#ef4444' },
      'cat-4': { id: 'cat-4', name: 'Help & Support', color: '#3b82f6' },
      'cat-5': { id: 'cat-5', name: 'Policy & Guidelines', color: '#06b6d4' },
    };

    return categories[categoryId];
  }

  private getAgentById(agentId: string): { id: string; display_name: string } | null {
    const agents: Record<string, { id: string; display_name: string }> = {
      'agent-1': { id: 'agent-1', display_name: 'Agent A' },
      'agent-2': { id: 'agent-2', display_name: 'Agent B' },
      'agent-3': { id: 'agent-3', display_name: 'Agent C' },
    };

    return agents[agentId] || null;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const dataStore = new DataStore();
