'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface UseAiSuggestionProps {
  postContent: string;
  postTitle: string;
  authorName?: string;
}

interface AiSuggestionState {
  isStreaming: boolean;
  ghostText: string;
  suggestion: string;
}

/**
 * Hook for managing AI-powered response suggestions with RAG
 * Simulates streaming AI responses with ghost text preview
 */
export function useAiSuggestion({ postContent, postTitle, authorName }: UseAiSuggestionProps) {
  const [state, setState] = useState<AiSuggestionState>({
    isStreaming: false,
    ghostText: '',
    suggestion: '',
  });

  // Use a ref to store the current state for synchronous access
  const stateRef = useRef<AiSuggestionState>(state);
  const streamingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Keep ref in sync with state
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  /**
   * Generates a contextual AI suggestion based on post content
   * Uses simple template-based logic to simulate RAG-powered suggestions
   */
  const generateSuggestion = useCallback(async (): Promise<string> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Generate contextual suggestions based on post attributes
    const templates: string[] = [];

    // Sentiment-based suggestions
    if (
      postContent.toLowerCase().includes('frustrating') ||
      postContent.toLowerCase().includes('angry')
    ) {
      templates.push(
        `Hi ${authorName || 'there'},

I understand your frustration with ${postTitle || 'this issue'}. I'm sorry you're experiencing this problem. I'd like to help resolve this for you.

Could you please provide more details about when this started happening? This will help me investigate the root cause and find the best solution for you.

Thank you for your patience.

Best regards`
      );
    }

    // Question-based suggestions
    if (postContent.includes('?')) {
      templates.push(
        `Hi ${authorName || 'there'},

Thank you for reaching out about ${postTitle || 'your question'}. That's a great question!

${postContent.length > 100 ? "I can see you've provided detailed context, which is really helpful." : "To give you the most accurate answer, could you provide a bit more detail about what you're trying to achieve?"}

Let me look into this and get back to you with a comprehensive answer.

Best regards`
      );
    }

    // Feature request suggestions
    if (
      postTitle.toLowerCase().includes('feature') ||
      postTitle.toLowerCase().includes('request')
    ) {
      templates.push(
        `Hi ${authorName || 'there'},

Thank you for your feature request regarding ${postTitle || 'this topic'}! We really appreciate feedback from our community members.

I've logged your request and shared it with our product team. While I can't promise a specific timeline, we do review all feature requests and consider them for our roadmap.

Is there anything specific about this feature that would be most valuable to your workflow? Understanding your use case helps us prioritize effectively.

Best regards`
      );
    }

    // Bug report suggestions
    if (postTitle.toLowerCase().includes('bug') || postContent.toLowerCase().includes('error')) {
      templates.push(
        `Hi ${authorName || 'there'},

Thank you for reporting this issue with ${postTitle || 'your experience'}. I'm sorry you're encountering this problem.

I'd like to help troubleshoot this. Could you please share:
1. Steps to reproduce the issue
2. Expected vs actual behavior
3. Any error messages you're seeing

This information will help me identify the cause and find a solution quickly.

Best regards`
      );
    }

    // Default suggestion
    if (templates.length === 0) {
      templates.push(
        `Hi ${authorName || 'there'},

Thank you for your post about ${postTitle || 'this topic'}.

I've reviewed your message and I'm here to help. Could you provide a bit more context about what you're trying to achieve? This will help me give you the most helpful response.

Looking forward to assisting you!

Best regards`
      );
    }

    // Return a random template to add variety
    return templates[Math.floor(Math.random() * templates.length)] as string;
  }, [postContent, postTitle, authorName]);

  /**
   * Starts streaming an AI suggestion with ghost text effect
   */
  const startStreaming = useCallback(async () => {
    // Check if already streaming using the current state reference
    if (streamingIntervalRef.current) {
      return;
    }

    // Set streaming state immediately - use functional update to get latest state
    setState((prev) => {
      // If already streaming, don't start again
      if (prev.isStreaming) {
        return prev;
      }
      return { ...prev, isStreaming: true, ghostText: '', suggestion: '' };
    });

    // Get the full suggestion
    const fullSuggestion = await generateSuggestion();

    // Stream the suggestion character by character to simulate AI generation
    let currentText = '';
    let index = 0;

    streamingIntervalRef.current = setInterval(() => {
      // Check if streaming was cancelled (interval cleared)
      if (streamingIntervalRef.current === null) {
        return;
      }

      if (index < fullSuggestion.length) {
        currentText += fullSuggestion[index];
        // Check again in case streaming was cancelled during the async update
        if (streamingIntervalRef.current === null) {
          return;
        }
        setState((prev) => ({
          ...prev,
          ghostText: currentText,
        }));
        index++;
      } else {
        // Streaming complete - keep ghost text visible for user to review
        if (streamingIntervalRef.current) {
          clearInterval(streamingIntervalRef.current);
          streamingIntervalRef.current = null;
        }
        setState((prev) => ({
          ...prev,
          isStreaming: false,
          suggestion: currentText,
          // Keep ghostText visible so user can see and accept the suggestion
        }));
      }
    }, 20); // 20ms per character = ~50 chars/second
  }, [generateSuggestion]);

  /**
   * Accepts the current AI suggestion
   * Uses stateRef to get the current state synchronously
   */
  const acceptSuggestion = useCallback(() => {
    // Clear the streaming interval to prevent ghost text from being overwritten
    if (streamingIntervalRef.current) {
      clearInterval(streamingIntervalRef.current);
      streamingIntervalRef.current = null;
    }

    // Get the current state from the ref (synchronous access)
    const currentState = stateRef.current;
    const acceptedText = currentState.suggestion || currentState.ghostText;

    if (acceptedText) {
      // Clear the state
      setState({
        isStreaming: false,
        ghostText: '',
        suggestion: '',
      });
    }

    return acceptedText || null;
  }, []);

  /**
   * Dismisses the current AI suggestion
   */
  const dismissSuggestion = useCallback(() => {
    if (streamingIntervalRef.current) {
      clearInterval(streamingIntervalRef.current);
      streamingIntervalRef.current = null;
    }

    setState({
      isStreaming: false,
      ghostText: '',
      suggestion: '',
    });
  }, []);

  /**
   * Cleans up the interval on unmount
   */
  const cancelStreaming = useCallback(() => {
    if (streamingIntervalRef.current) {
      clearInterval(streamingIntervalRef.current);
      streamingIntervalRef.current = null;
    }
    setState((prev) => ({
      ...prev,
      isStreaming: false,
    }));
  }, []);

  return {
    isStreaming: state.isStreaming,
    ghostText: state.ghostText,
    hasSuggestion: !!state.suggestion,
    startStreaming,
    acceptSuggestion,
    dismissSuggestion,
    cancelStreaming,
  };
}
