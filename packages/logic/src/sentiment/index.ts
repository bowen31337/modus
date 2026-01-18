/**
 * Sentiment Analysis Utility
 *
 * Analyzes text sentiment using a hybrid approach:
 * 1. Keyword-based scoring (fast, deterministic)
 * 2. Can be extended with ML-based analysis
 */

export interface SentimentAnalysis {
  score: number; // -1 to 1 (negative to positive)
  label: 'negative' | 'neutral' | 'positive';
}

// Negative sentiment keywords with weights
const NEGATIVE_KEYWORDS: Record<string, number> = {
  // Strong negative
  hate: -0.8,
  terrible: -0.8,
  horrible: -0.8,
  awful: -0.8,
  disgusting: -0.8,
  disappointed: -0.7,
  frustrated: -0.7,
  angry: -0.7,
  furious: -0.8,
  annoyed: -0.6,
  irritated: -0.6,
  upset: -0.6,
  worst: -0.7,
  sucks: -0.7,
  broken: -0.6,
  fail: -0.6,
  failure: -0.6,
  problem: -0.4,
  issue: -0.3,
  bug: -0.4,
  error: -0.4,
  crash: -0.6,
  spam: -0.5,
  abuse: -0.7,
  harassment: -0.8,
  harassing: -0.8,
  unsafe: -0.7,
  scam: -0.8,
  fraud: -0.8,
  refund: -0.4,
  cancel: -0.3,
  cannot: -0.3,
  unable: -0.3,
  "doesn't work": -0.6,
  'not working': -0.6,
  urgent: -0.4,
  immediately: -0.3,
  threat: -0.8,
  lawsuit: -0.8,
  legal: -0.5,
  complaint: -0.5,
  unacceptable: -0.7,
  ridiculous: -0.6,
  pathetic: -0.7,
  shame: -0.6,
  embarrassing: -0.6,
  poor: -0.5,
  waste: -0.5,
  useless: -0.6,
  never: -0.3,
  impossible: -0.5,
};

// Positive sentiment keywords with weights
const POSITIVE_KEYWORDS: Record<string, number> = {
  // Strong positive
  love: 0.7,
  great: 0.7,
  awesome: 0.7,
  excellent: 0.7,
  amazing: 0.7,
  wonderful: 0.7,
  fantastic: 0.7,
  perfect: 0.7,
  best: 0.6,
  good: 0.5,
  nice: 0.4,
  happy: 0.6,
  pleased: 0.5,
  satisfied: 0.5,
  helpful: 0.5,
  thanks: 0.4,
  'thank you': 0.5,
  appreciate: 0.5,
  recommend: 0.5,
  beautiful: 0.6,
  enjoy: 0.5,
  easy: 0.4,
  intuitive: 0.5,
  fast: 0.4,
  quick: 0.4,
  improve: 0.3,
  better: 0.3,
  'feature request': 0.3,
  suggestion: 0.2,
  please: 0.1,
  hopefully: 0.2,
};

/**
 * Analyze sentiment of text
 */
export function analyzeSentiment(text: string): SentimentAnalysis {
  const lowerText = text.toLowerCase();

  let score = 0;
  let matchCount = 0;

  // Check for negative keywords
  for (const [keyword, weight] of Object.entries(NEGATIVE_KEYWORDS)) {
    if (lowerText.includes(keyword)) {
      score += weight;
      matchCount++;
    }
  }

  // Check for positive keywords
  for (const [keyword, weight] of Object.entries(POSITIVE_KEYWORDS)) {
    if (lowerText.includes(keyword)) {
      score += weight;
      matchCount++;
    }
  }

  // If no keywords found, treat as neutral
  if (matchCount === 0) {
    return { score: 0, label: 'neutral' };
  }

  // Normalize score to -1 to 1 range
  // Average the score by match count to prevent keyword stuffing
  const normalizedScore = Math.max(-1, Math.min(1, score));

  // Determine label
  let label: SentimentAnalysis['label'] = 'neutral';
  if (normalizedScore < -0.3) {
    label = 'negative';
  } else if (normalizedScore > 0.3) {
    label = 'positive';
  }

  return {
    score: normalizedScore,
    label,
  };
}

/**
 * Batch analyze sentiment for multiple texts
 */
export function analyzeSentimentBatch(texts: string[]): SentimentAnalysis[] {
  return texts.map((text) => analyzeSentiment(text));
}

/**
 * Get sentiment color for UI display
 */
export function getSentimentColor(label: SentimentAnalysis['label']): string {
  switch (label) {
    case 'negative':
      return '#ef4444'; // red-500
    case 'positive':
      return '#34d399'; // emerald-400
    case 'neutral':
      return '#94a3b8'; // slate-400
  }
}

/**
 * Get sentiment icon name
 */
export function getSentimentIcon(label: SentimentAnalysis['label']): string {
  switch (label) {
    case 'negative':
      return 'AlertCircle';
    case 'positive':
      return 'CheckCircle';
    case 'neutral':
      return 'MessageSquare';
  }
}
