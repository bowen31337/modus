import type { SentimentResult } from '@modus/logic';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// ============================================================================
// Schema
// ============================================================================

const sentimentInputSchema = z.object({
  text: z.string().min(1, 'Text is required').max(10000, 'Text is too long (max 10000 characters)'),
});

type SentimentInput = z.infer<typeof sentimentInputSchema>;

// ============================================================================
// POST /api/v1/ai/analyze-sentiment
// ============================================================================

/**
 * Analyze sentiment of text using AI
 *
 * Request Body:
 * - text: Text to analyze (1-10000 characters)
 *
 * Response:
 * - data.score: Sentiment score (-1 to 1, where -1 is most negative, 1 is most positive)
 * - data.label: Sentiment label ('negative', 'neutral', or 'positive')
 * - data.confidence: Confidence score (0 to 1)
 * - message: Success message
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedInput = sentimentInputSchema.parse(body) as SentimentInput;

    // TODO: Integrate with actual AI provider (OpenAI, Anthropic, etc.)
    // For now, use rule-based sentiment analysis as a mock
    // In production, you would do:
    // const prompt = buildSentimentPrompt(validatedInput.text);
    // const aiResult = await openai.chat.completions.create(...);
    // const sentimentResult = parseSentimentResult(aiResult);
    const sentimentResult = analyzeSentimentMock(validatedInput.text);

    return NextResponse.json(
      {
        data: sentimentResult,
        message: 'Sentiment analysis completed successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in POST /api/v1/ai/analyze-sentiment:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid request body', details: error }, { status: 400 });
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// Mock Sentiment Analysis (remove in production when using real AI)
// ============================================================================

/**
 * Rule-based sentiment analysis as a mock implementation
 * In production, this would call an actual AI model
 */
function analyzeSentimentMock(text: string): SentimentResult {
  const lowerText = text.toLowerCase();

  // Negative indicators
  const negativeWords = [
    'terrible',
    'horrible',
    'awful',
    'hate',
    'worst',
    'bad',
    'poor',
    'broken',
    'frustrated',
    'annoyed',
    'angry',
    'upset',
    'disappointed',
    'useless',
    'waste',
    'ridiculous',
    'pathetic',
    'disgusting',
    'unacceptable',
    'fail',
    'failure',
    'error',
    'bug',
    'issue',
    'problem',
    'not working',
    "doesn't work",
    "won't work",
    "can't access",
    'unable to',
  ];

  // Positive indicators
  const positiveWords = [
    'great',
    'awesome',
    'excellent',
    'amazing',
    'wonderful',
    'fantastic',
    'love',
    'best',
    'good',
    'helpful',
    'thanks',
    'thank you',
    'appreciate',
    'perfect',
    'works great',
    'working',
    'fixed',
    'resolved',
    'helped',
    'happy',
    'pleased',
    'satisfied',
    'enjoy',
    'excited',
    'glad',
  ];

  // Intensifiers
  const intensifiers = ['very', 'really', 'extremely', 'absolutely', 'completely', 'totally'];

  let score = 0;
  let negativeCount = 0;
  let positiveCount = 0;

  // Check for negative words
  for (const word of negativeWords) {
    if (lowerText.includes(word)) {
      negativeCount++;
      score -= 1;

      // Check for intensifiers before the negative word
      for (const intensifier of intensifiers) {
        if (lowerText.includes(`${intensifier} ${word}`)) {
          score -= 0.5; // Extra penalty for intensified negative
        }
      }
    }
  }

  // Check for positive words
  for (const word of positiveWords) {
    if (lowerText.includes(word)) {
      positiveCount++;
      score += 1;

      // Check for intensifiers before the positive word
      for (const intensifier of intensifiers) {
        if (lowerText.includes(`${intensifier} ${word}`)) {
          score += 0.5; // Extra boost for intensified positive
        }
      }
    }
  }

  // Check for all caps (indicates strong emotion)
  const allCapsWords = text.match(/\b[A-Z]{2,}\b/g);
  if (allCapsWords && allCapsWords.length > 0) {
    // Amplify existing sentiment if there are all-caps words
    if (score !== 0) {
      score *= 1.2;
    }
  }

  // Check for exclamation marks (indicates strong emotion)
  const exclamationCount = (text.match(/!/g) || []).length;
  if (exclamationCount > 0) {
    // Amplify existing sentiment
    if (score !== 0) {
      score *= 1 + exclamationCount * 0.1;
    }
  }

  // Normalize score to [-1, 1] range
  const maxScore = Math.max(negativeCount, positiveCount, 1);
  score = Math.max(-1, Math.min(1, score / maxScore));

  // Determine label
  let label: SentimentResult['label'] = 'neutral';
  if (score < -0.3) {
    label = 'negative';
  } else if (score > 0.3) {
    label = 'positive';
  }

  // Calculate confidence based on how many indicators we found
  const totalIndicators = negativeCount + positiveCount;
  const confidence = Math.min(1, 0.5 + totalIndicators * 0.1);

  return {
    score: Math.round(score * 100) / 100, // Round to 2 decimal places
    label,
    confidence: Math.round(confidence * 100) / 100,
  };
}
