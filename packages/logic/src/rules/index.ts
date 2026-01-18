import type { ModerationPost, Priority, PriorityRule } from '../validation';

// ============================================================================
// Rule Condition Types
// ============================================================================

export const RuleConditionType = {
  FIRST_TIME_POSTER: 'first_time_poster',
  SENTIMENT_NEGATIVE: 'sentiment_negative',
  SLA_EXCEEDED: 'sla_exceeded',
  KEYWORD_MATCH: 'keyword_match',
  CATEGORY_MATCH: 'category_match',
} as const;

export type RuleConditionType = (typeof RuleConditionType)[keyof typeof RuleConditionType];

// ============================================================================
// Rule Action Types
// ============================================================================

export const RuleActionType = {
  SET_PRIORITY: 'set_priority',
  ESCALATE: 'escalate',
  AUTO_ASSIGN: 'auto_assign',
  TAG: 'tag',
} as const;

export type RuleActionType = (typeof RuleActionType)[keyof typeof RuleActionType];

// ============================================================================
// Rule Evaluation Context
// ============================================================================

export interface RuleEvaluationContext {
  post: ModerationPost;
  currentTime?: Date;
}

// ============================================================================
// Rule Evaluation Result
// ============================================================================

export interface RuleEvaluationResult {
  matched: boolean;
  rule: PriorityRule;
  appliedAction?: {
    type: string;
    value: string;
  };
}

// ============================================================================
// Rule Engine
// ============================================================================

export class RulesEngine {
  private rules: PriorityRule[];

  constructor(rules: PriorityRule[]) {
    // Sort rules by position
    this.rules = [...rules].sort((a, b) => a.position - b.position);
  }

  /**
   * Evaluate all rules against a post and return matched results
   */
  evaluate(context: RuleEvaluationContext): RuleEvaluationResult[] {
    const results: RuleEvaluationResult[] = [];

    for (const rule of this.rules) {
      if (!rule.is_active) continue;

      const matched = this.evaluateCondition(rule, context);
      if (matched) {
        results.push({
          matched: true,
          rule,
          appliedAction: {
            type: rule.action_type,
            value: rule.action_value,
          },
        });
      }
    }

    return results;
  }

  /**
   * Calculate the final priority based on rule evaluation
   */
  calculatePriority(context: RuleEvaluationContext): Priority {
    const results = this.evaluate(context);
    let priority: Priority = 'P3'; // Default priority

    for (const result of results) {
      if (result.appliedAction?.type === RuleActionType.SET_PRIORITY) {
        const newPriority = result.appliedAction.value as Priority;
        // Higher priority (lower number) wins
        if (this.comparePriority(newPriority, priority) < 0) {
          priority = newPriority;
        }
      } else if (result.appliedAction?.type === RuleActionType.ESCALATE) {
        priority = this.escalatePriority(priority);
      }
    }

    return priority;
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(rule: PriorityRule, context: RuleEvaluationContext): boolean {
    const { post, currentTime = new Date() } = context;

    switch (rule.condition_type) {
      case RuleConditionType.FIRST_TIME_POSTER: {
        const threshold = Number.parseInt(rule.condition_value, 10) || 2;
        return post.author_post_count < threshold;
      }

      case RuleConditionType.SENTIMENT_NEGATIVE: {
        const threshold = Number.parseFloat(rule.condition_value) || -0.3;
        return (post.sentiment_score ?? 0) < threshold;
      }

      case RuleConditionType.SLA_EXCEEDED: {
        const hoursThreshold = Number.parseFloat(rule.condition_value) || 2;
        const postCreated = new Date(post.created_at);
        const hoursSinceCreation =
          (currentTime.getTime() - postCreated.getTime()) / (1000 * 60 * 60);
        return post.status === 'open' && hoursSinceCreation > hoursThreshold;
      }

      case RuleConditionType.KEYWORD_MATCH: {
        const keywords = rule.condition_value.split(',').map((k) => k.trim().toLowerCase());
        const content = `${post.title} ${post.body_content}`.toLowerCase();
        return keywords.some((keyword) => content.includes(keyword));
      }

      case RuleConditionType.CATEGORY_MATCH: {
        return post.category_id === rule.condition_value;
      }

      default:
        return false;
    }
  }

  /**
   * Compare two priorities (-1 if a is higher priority, 1 if b is higher, 0 if equal)
   */
  private comparePriority(a: Priority, b: Priority): number {
    const order: Record<Priority, number> = { P1: 1, P2: 2, P3: 3, P4: 4, P5: 5 };
    return order[a] - order[b];
  }

  /**
   * Escalate priority by one level
   */
  private escalatePriority(current: Priority): Priority {
    const escalation: Record<Priority, Priority> = {
      P5: 'P4',
      P4: 'P3',
      P3: 'P2',
      P2: 'P1',
      P1: 'P1',
    };
    return escalation[current];
  }
}

/**
 * Test a set of rules against sample post data
 */
export function testRules(
  rules: PriorityRule[],
  samplePost: Partial<ModerationPost>
): RuleEvaluationResult[] {
  const engine = new RulesEngine(rules);

  const mockPost: ModerationPost = {
    id: 'test-post-id',
    title: 'Test Post',
    body_content: 'Test content',
    status: 'open',
    priority: 'P3',
    author_user_id: 'test-user-id',
    author_post_count: 0,
    created_at: new Date().toISOString(),
    ...samplePost,
  };

  return engine.evaluate({ post: mockPost });
}
