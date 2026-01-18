import { dataStore } from '@/lib/data-store';
import { type SuggestContext, buildSuggestionPrompt } from '@modus/logic';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// ============================================================================
// Schema
// ============================================================================

const suggestInputSchema = z.object({
  post_id: z.string().min(1, 'Post ID is required'),
  use_rag: z.boolean().optional().default(true),
  max_similar: z.number().int().min(1).max(10).optional().default(3),
});

type SuggestInput = z.infer<typeof suggestInputSchema>;

// ============================================================================
// POST /api/v1/ai/suggest
// ============================================================================

/**
 * Generate AI-powered response suggestion for a moderation post
 *
 * Request Body:
 * - post_id: UUID of the post to generate suggestion for
 * - use_rag: Whether to use RAG (retrieve similar responses) (default: true)
 * - max_similar: Maximum number of similar responses to retrieve (default: 3)
 *
 * Response:
 * - data.suggestion: Generated response content
 * - data.context: Context used for generation (similar responses, templates)
 * - data.tokens_used: Number of tokens used (if available)
 * - message: Success message
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedInput = suggestInputSchema.parse(body) as SuggestInput;

    // Get the post
    const post = dataStore.getPostById(validatedInput.post_id);
    if (!post) {
      return NextResponse.json(
        {
          error: 'Post not found',
          details: `Post with ID ${validatedInput.post_id} does not exist`,
        },
        { status: 404 }
      );
    }

    // Build context for AI suggestion
    const context: SuggestContext = {
      post,
    };

    // Retrieve similar responses if RAG is enabled
    if (validatedInput.use_rag) {
      // Get all responses from data store
      const allResponses = dataStore.getAllResponses();

      // Simple similarity matching based on category and status
      // In production, this would use vector embeddings with cosine similarity
      const similarResponses = allResponses
        .filter((r) => {
          // Filter responses from posts in the same category
          const otherPost = dataStore.getPostById(r.post_id);
          return otherPost && otherPost.category_id === post.category_id;
        })
        .slice(0, validatedInput.max_similar);

      context.similarResponses = similarResponses;
    }

    // Build the prompt
    const prompt = buildSuggestionPrompt(context);

    // TODO: Integrate with actual AI provider (OpenAI, Anthropic, etc.)
    // For now, return a mock suggestion based on the prompt
    const mockSuggestion = generateMockSuggestion(post);

    // Simulate token usage (in production, this would come from the AI provider)
    const tokensUsed = prompt.length / 4; // Rough estimate: 1 token ≈ 4 characters

    return NextResponse.json(
      {
        data: {
          suggestion: mockSuggestion,
          context: {
            similarResponseCount: context.similarResponses?.length ?? 0,
            templateCount: context.templates?.length ?? 0,
          },
          tokens_used: Math.round(tokensUsed),
          model: 'mock-ai-model-v1', // In production: 'gpt-4', 'claude-3', etc.
        },
        message: 'AI suggestion generated successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in POST /api/v1/ai/suggest:', error);

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
// Mock Helpers (remove in production when using real AI)
// ============================================================================

function generateMockSuggestion(post: {
  title: string;
  body_content: string;
  priority: string;
  author_post_count: number;
}): string {
  const { title, priority, author_post_count } = post;

  // Generate contextual mock suggestions based on post priority
  const greetings =
    author_post_count <= 1
      ? ['Hi there! Welcome to our community!', 'Hello! Thanks for reaching out.', 'Hello!']
      : ['Hi!', 'Hello!', 'Hi there!'];

  const closings = [
    'Please let us know if you need any further assistance.',
    "We're here to help if you have any other questions.",
    'Feel free to reach out if you need anything else.',
  ];

  const greeting = greetings[Math.floor(Math.random() * greetings.length)];
  const closing = closings[Math.floor(Math.random() * closings.length)];

  let response = '';

  switch (priority) {
    case 'P1':
      response = `${greeting} I understand this is a critical issue that needs immediate attention. Thank you for bringing this to our notice.

Our team is looking into "${title}" as a top priority. We\'ll work to resolve this as quickly as possible.

${closing}

Best regards`;
      break;

    case 'P2':
      response = `${greeting} Thank you for reporting this issue. We understand the importance of resolving this for you.

We're investigating "${title}" and will provide an update soon. Your patience is appreciated.

${closing}

Best regards`;
      break;

    case 'P3':
      response = `${greeting} Thanks for your feedback regarding "${title}".

We've noted your input and will review it. If this requires further action, we'll follow up with you.

${closing}

Best regards`;
      break;

    case 'P4':
      response = `${greeting} Thank you for sharing your thoughts on "${title}".

We appreciate your feedback and will take it into consideration as we continue to improve our platform.

${closing}

Best regards`;
      break;

    case 'P5':
      response = `${greeting} Thanks for reaching out!

We've received your message about "${title}" and will review it when possible. We appreciate you taking the time to share this with us.

${closing}

Best regards`;
      break;

    default:
      response = `${greeting} Thank you for your message. We've received your post regarding "${title}" and will review it shortly.

${closing}

Best regards`;
  }

  return response;
}
