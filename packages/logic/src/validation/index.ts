import { z } from 'zod';
import {
  sanitizeInput,
  sanitizePostContent,
  sanitizeResponseContent,
  sanitizeTemplateContent,
} from '../security';

// ============================================================================
// Enums and Constants
// ============================================================================

export const Priority = {
  P1: 'P1',
  P2: 'P2',
  P3: 'P3',
  P4: 'P4',
  P5: 'P5',
} as const;

export type Priority = (typeof Priority)[keyof typeof Priority];

export const PostStatus = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
} as const;

export type PostStatus = (typeof PostStatus)[keyof typeof PostStatus];

export const AgentStatus = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  BUSY: 'busy',
} as const;

export type AgentStatus = (typeof AgentStatus)[keyof typeof AgentStatus];

export const AgentRole = {
  AGENT: 'agent',
  SUPERVISOR: 'supervisor',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
} as const;

export type AgentRole = (typeof AgentRole)[keyof typeof AgentRole];

export const SentimentLabel = {
  NEGATIVE: 'negative',
  NEUTRAL: 'neutral',
  POSITIVE: 'positive',
} as const;

export type SentimentLabel = (typeof SentimentLabel)[keyof typeof SentimentLabel];

// ============================================================================
// Zod Schemas
// ============================================================================

// Category
export const categorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  icon: z.string().optional(),
  position: z.number().int().min(0),
  is_active: z.boolean(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export type Category = z.infer<typeof categorySchema>;

// Agent
export const agentSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  display_name: z.string().min(1).max(100),
  avatar_url: z.string().url().optional().nullable(),
  role: z.enum(['agent', 'supervisor', 'admin', 'moderator']),
  status: z.enum(['online', 'offline', 'busy']),
  last_active_at: z.string().datetime().optional(),
  created_at: z.string().datetime().optional(),
});

export type Agent = z.infer<typeof agentSchema>;

// Moderation Post
export const moderationPostSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(500),
  body_content: z.string(),
  excerpt: z.string().max(300).optional(),
  category_id: z.string().uuid().optional().nullable(),
  status: z.enum(['open', 'in_progress', 'resolved']),
  priority: z.enum(['P1', 'P2', 'P3', 'P4', 'P5']),
  sentiment_score: z.number().min(-1).max(1).optional().nullable(),
  sentiment_label: z.enum(['negative', 'neutral', 'positive']).optional().nullable(),
  author_user_id: z.string().uuid(),
  author_post_count: z.number().int().min(0),
  assigned_to_id: z.string().uuid().optional().nullable(),
  assigned_at: z.string().datetime().optional().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().optional(),
  resolved_at: z.string().datetime().optional().nullable(),
  // Vector embedding for semantic search/RAG (1536 dimensions for OpenAI text-embedding-3-small)
  embedding: z.array(z.number()).optional().nullable(),
});

export type ModerationPost = z.infer<typeof moderationPostSchema>;

// Response
export const responseSchema = z.object({
  id: z.string().uuid(),
  post_id: z.string().uuid(),
  agent_id: z.string().uuid(),
  content: z.string().min(1),
  is_internal_note: z.boolean().default(false),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().optional(),
});

export type Response = z.infer<typeof responseSchema>;

// Response Template
export const responseTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  content: z.string().min(1),
  placeholders: z.array(z.string()).default([]),
  category_id: z.string().uuid().optional().nullable(),
  usage_count: z.number().int().min(0).default(0),
  created_by: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().optional(),
});

export type ResponseTemplate = z.infer<typeof responseTemplateSchema>;

// Priority Rule
export const priorityRuleSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  condition_type: z.string(),
  condition_value: z.string(),
  action_type: z.string(),
  action_value: z.string(),
  position: z.number().int().min(0),
  is_active: z.boolean().default(true),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().optional(),
});

export type PriorityRule = z.infer<typeof priorityRuleSchema>;

// Audit Log
export const auditLogSchema = z.object({
  id: z.string().uuid(),
  agent_id: z.string().uuid(),
  post_id: z.string().uuid().optional().nullable(),
  action_type: z.string(),
  action_details: z.record(z.unknown()).optional(),
  previous_state: z.record(z.unknown()).optional().nullable(),
  new_state: z.record(z.unknown()).optional().nullable(),
  created_at: z.string().datetime(),
});

export type AuditLog = z.infer<typeof auditLogSchema>;

// ============================================================================
// API Input Schemas
// ============================================================================

export const createResponseInputSchema = z.object({
  content: z.string().min(1),
  is_internal_note: z.boolean().default(false),
});

export type CreateResponseInput = z.infer<typeof createResponseInputSchema>;

export const updateResponseInputSchema = z.object({
  content: z.string().min(1).optional(),
  is_internal_note: z.boolean().optional(),
});

export type UpdateResponseInput = z.infer<typeof updateResponseInputSchema>;

export const updatePostInputSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved']).optional(),
  priority: z.enum(['P1', 'P2', 'P3', 'P4', 'P5']).optional(),
});

export type UpdatePostInput = z.infer<typeof updatePostInputSchema>;

export const createTemplateInputSchema = z.object({
  name: z.string().min(1).max(100),
  content: z.string().min(1),
  placeholders: z.array(z.string()).optional(),
  category_id: z.string().uuid().optional().nullable(),
});

export type CreateTemplateInput = z.infer<typeof createTemplateInputSchema>;

export const createRuleInputSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  condition_type: z.string(),
  condition_value: z.string(),
  action_type: z.string(),
  action_value: z.string(),
  is_active: z.boolean().default(true),
});

export type CreateRuleInput = z.infer<typeof createRuleInputSchema>;

export const reorderRulesInputSchema = z.object({
  rule_ids: z.array(z.string().uuid()),
});

export type ReorderRulesInput = z.infer<typeof reorderRulesInputSchema>;

export const aiSuggestInputSchema = z.object({
  post_id: z.string().uuid(),
  context: z.string().optional(),
});

export type AISuggestInput = z.infer<typeof aiSuggestInputSchema>;

export const analyzeSentimentInputSchema = z.object({
  text: z.string().min(1),
});

export type AnalyzeSentimentInput = z.infer<typeof analyzeSentimentInputSchema>;

export const loginInputSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type LoginInput = z.infer<typeof loginInputSchema>;

export const sessionSchema = z.object({
  agent_id: z.string(),
  email: z.string().email(),
  display_name: z.string().min(1).max(100),
  role: z.enum(['agent', 'supervisor', 'admin', 'moderator']),
  status: z.enum(['online', 'offline', 'busy']),
  expires_at: z.string().datetime(),
});

export type Session = z.infer<typeof sessionSchema>;

// ============================================================================
// Query/Filter Schemas
// ============================================================================

export const postsQuerySchema = z.object({
  category_id: z.string().uuid().optional(),
  status: z.enum(['open', 'in_progress', 'resolved']).optional(),
  priority: z.array(z.enum(['P1', 'P2', 'P3', 'P4', 'P5'])).optional(),
  assigned_to_id: z.string().uuid().optional(),
  // Accept both date-only (YYYY-MM-DD) and datetime (ISO 8601) formats
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  search: z.string().optional(),
  sort_by: z.enum(['priority', 'date', 'status']).default('priority'),
  sort_order: z.enum(['asc', 'desc']).default('asc'),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export type PostsQuery = z.infer<typeof postsQuerySchema>;

// ============================================================================
// Sanitization Helpers
// ============================================================================

/**
 * Sanitizes a moderation post's content fields (title, body_content, excerpt).
 * This is called automatically when creating or updating posts.
 */
export function sanitizeModerationPost(post: {
  title: string;
  body_content: string;
  excerpt?: string;
}): {
  title: string;
  body_content: string;
  excerpt?: string;
} {
  return sanitizePostContent(post);
}

/**
 * Sanitizes response content before saving.
 */
export function sanitizeResponse(content: string): string {
  return sanitizeResponseContent(content);
}

/**
 * Sanitizes template content before saving.
 */
export function sanitizeTemplate(content: string): string {
  return sanitizeTemplateContent(content);
}

/**
 * Sanitizes a string value for safe rendering.
 */
export function sanitize(value: string): string {
  return sanitizeInput(value);
}
