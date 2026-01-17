import type { ModerationPost, Response } from '../validation';

// ============================================================================
// Types
// ============================================================================

export interface SuggestContext {
  post: ModerationPost;
  similarResponses?: Response[];
  templates?: string[];
}

export interface SentimentResult {
  score: number; // -1 (negative) to 1 (positive)
  label: 'negative' | 'neutral' | 'positive';
  confidence: number;
}

export interface SuggestionResult {
  content: string;
  tokens_used?: number;
  model?: string;
}

// ============================================================================
// Prompt Builders
// ============================================================================

/**
 * Build a prompt for AI response suggestion
 */
export function buildSuggestionPrompt(context: SuggestContext): string {
  const { post, similarResponses = [], templates = [] } = context;

  let prompt = `You are a helpful community moderator assistant. Generate a professional, empathetic response to the following community post.

## Post Details
Title: ${post.title}
Content: ${post.body_content}
Priority: ${post.priority}
`;

  if (post.sentiment_label) {
    prompt += `Sentiment: ${post.sentiment_label}\n`;
  }

  if (post.author_post_count <= 1) {
    prompt += `Note: This appears to be a first-time poster. Be extra welcoming.\n`;
  }

  if (similarResponses.length > 0) {
    prompt += `
## Similar Past Responses (for reference)
${similarResponses.slice(0, 3).map((r, i) => `${i + 1}. ${r.content.substring(0, 200)}...`).join('\n')}
`;
  }

  if (templates.length > 0) {
    prompt += `
## Available Templates (for inspiration)
${templates.slice(0, 3).join('\n')}
`;
  }

  prompt += `
## Guidelines
- Be professional yet friendly
- Address the user's concern directly
- Provide actionable next steps if applicable
- Keep the response concise but complete
- If the sentiment is negative, acknowledge their frustration

Generate a response:`;

  return prompt;
}

/**
 * Build a prompt for sentiment analysis
 */
export function buildSentimentPrompt(text: string): string {
  return `Analyze the sentiment of the following text and respond with ONLY a JSON object.

Text: "${text}"

Respond with exactly this format (no markdown, just raw JSON):
{"score": <number between -1 and 1>, "label": "<negative|neutral|positive>", "confidence": <number between 0 and 1>}

Where:
- score: -1 is most negative, 0 is neutral, 1 is most positive
- label: "negative" if score < -0.3, "positive" if score > 0.3, otherwise "neutral"
- confidence: how confident you are in the assessment (0 to 1)`;
}

// ============================================================================
// Result Parsers
// ============================================================================

/**
 * Parse sentiment analysis result from AI response
 */
export function parseSentimentResult(response: string): SentimentResult {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    const score = typeof parsed.score === 'number' ? Math.max(-1, Math.min(1, parsed.score)) : 0;

    let label: SentimentResult['label'] = 'neutral';
    if (score < -0.3) label = 'negative';
    else if (score > 0.3) label = 'positive';

    return {
      score,
      label: parsed.label || label,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.8,
    };
  } catch {
    // Default to neutral if parsing fails
    return {
      score: 0,
      label: 'neutral',
      confidence: 0.5,
    };
  }
}

// ============================================================================
// Embedding Helpers
// ============================================================================

/**
 * Prepare text for embedding generation
 */
export function prepareTextForEmbedding(post: ModerationPost): string {
  return `${post.title}\n\n${post.body_content}`.trim();
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += (a[i] ?? 0) * (b[i] ?? 0);
    normA += (a[i] ?? 0) ** 2;
    normB += (b[i] ?? 0) ** 2;
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}
