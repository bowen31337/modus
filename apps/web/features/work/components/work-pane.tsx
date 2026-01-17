'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, User, Clock, AlertCircle, CheckCircle2, Hash, Loader2, EyeOff, MessageCircle, ArrowRightLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PostCardProps } from '@/features/queue/components/post-card';
import { RichTextEditor, type RichTextEditorRef } from './rich-text-editor';
import { TemplateSelector } from './template-selector';
import { useAiSuggestion } from '../hooks/use-ai-suggestion';
import { ReassignDialog } from './reassign-dialog';
import { InlineError } from '@/components/ui/error-state';
import { ResponseSkeleton } from './response-skeleton';

interface WorkPaneProps {
  selectedPost: PostCardProps | null;
  currentAgent: { id: string; name: string };
  assignedPosts: Set<string>;
  onAssignToMe: () => void;
  onRelease: () => void;
  onResolve: () => void;
  onCloseDetail: () => void;
  onReassign?: (postId: string, toAgentId: string) => void;
}

const priorityColors: Record<string, string> = {
  P1: 'bg-red-500',
  P2: 'bg-orange-500',
  P3: 'bg-yellow-500',
  P4: 'bg-blue-500',
  P5: 'bg-gray-500',
};

const sentimentColors: Record<string, string> = {
  negative: 'text-red-400 bg-red-500/10',
  neutral: 'text-foreground-muted bg-background-tertiary',
  positive: 'text-emerald-400 bg-emerald-500/10',
} as const;

const statusColors: Record<string, string> = {
  open: 'bg-background-tertiary text-foreground-secondary',
  in_progress: 'bg-primary/20 text-primary',
  resolved: 'bg-emerald-500/20 text-emerald-400',
};

export function WorkPane({ selectedPost, currentAgent, assignedPosts, onAssignToMe, onRelease, onResolve, onCloseDetail, onReassign }: WorkPaneProps) {
  const [responseContent, setResponseContent] = useState('');
  const [responses, setResponses] = useState<Array<{ id: string; content: string; isInternalNote: boolean; agent: string; createdAt: string }>>([]);
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [responseError, setResponseError] = useState<string | null>(null);
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const editorRef = useRef<RichTextEditorRef>(null);
  const isAssignedToMe = selectedPost ? assignedPosts.has(selectedPost.id) : false;

  // Mock agents for reassignment
  const mockAgents = [
    { id: '550e8400-e29b-41d4-a716-446655440001', name: 'Agent A', status: 'online' as const },
    { id: '550e8400-e29b-41d4-a716-446655440002', name: 'Agent B', status: 'online' as const },
    { id: '550e8400-e29b-41d4-a716-446655440003', name: 'Agent C', status: 'busy' as const },
    { id: '550e8400-e29b-41d4-a716-446655440004', name: 'Agent D', status: 'offline' as const },
  ];

  // AI Suggestion hook
  const aiSuggestion = useAiSuggestion({
    postContent: selectedPost?.excerpt || '',
    postTitle: selectedPost?.title || '',
    authorName: selectedPost?.author?.name,
  });

  // Ref to store cancelStreaming function for cleanup without triggering re-renders
  const cancelStreamingRef = useRef(aiSuggestion.cancelStreaming);

  // Update ref when the function changes
  useEffect(() => {
    cancelStreamingRef.current = aiSuggestion.cancelStreaming;
  }, [aiSuggestion.cancelStreaming]);

  // Keyboard shortcut: R key focuses the response editor, Escape closes detail view, Cmd+Shift+A opens reassign
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+Enter posts response and resolves (works even when typing in textarea)
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        if (selectedPost && responseContent.trim()) {
          e.preventDefault();
          handleSendResponse();
          onResolve();
        }
        return;
      }

      // Cmd+Shift+A opens reassign modal
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'a' || e.key === 'A')) {
        if (selectedPost) {
          e.preventDefault();
          setIsReassignModalOpen(true);
        }
        return;
      }

      // Escape key closes detail view and returns to queue
      // Note: RichTextEditor handles Escape for dismissing ghost text when ghost text is present
      // The RichTextEditor will call stopPropagation() to prevent this handler from running
      if (e.key === 'Escape') {
        // Close reassign modal if open
        if (isReassignModalOpen) {
          e.preventDefault();
          setIsReassignModalOpen(false);
          return;
        }
        // Don't intercept Escape if the command palette is open
        // Check if the event target is inside the command palette
        const target = e.target as Node;
        const commandPalette = document.querySelector('[data-testid="command-palette"]');
        if (commandPalette && commandPalette.contains(target)) {
          // Let the command palette handle the Escape key
          return;
        }
        // Only close detail view if not typing in textarea (RichTextEditor handles Escape there)
        if (selectedPost && !(e.target instanceof HTMLTextAreaElement)) {
          e.preventDefault();
          onCloseDetail();
        }
        return;
      }

      // Only trigger R key if not typing in an input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // R key focuses editor (when a post is selected)
      if (e.key === 'r' || e.key === 'R') {
        if (selectedPost) {
          e.preventDefault();
          editorRef.current?.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedPost, responseContent, onRelease, onCloseDetail, isReassignModalOpen]);

  // Cleanup AI streaming on unmount
  useEffect(() => {
    return () => {
      cancelStreamingRef.current();
    };
  }, []);

  // Load responses when post is selected
  useEffect(() => {
    if (!selectedPost) {
      setResponses([]);
      setResponseError(null);
      return;
    }

    const loadResponses = async () => {
      try {
        setLoadingResponses(true);
        setResponseError(null);
        const response = await fetch(`/api/v1/posts/${selectedPost.id}/responses`);
        if (response.ok) {
          const result = await response.json();
          const transformedResponses = result.data.map((r: any) => ({
            id: r.id,
            content: r.content,
            isInternalNote: r.is_internal_note,
            agent: currentAgent.name, // In production, this would come from the agent_id
            createdAt: r.created_at,
          }));
          setResponses(transformedResponses);
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      } catch (error) {
        console.error('Error loading responses:', error);
        setResponseError('Failed to load responses');
      } finally {
        setLoadingResponses(false);
      }
    };

    loadResponses();
  }, [selectedPost?.id, currentAgent.name]);

  const handleSendResponse = async () => {
    if (!responseContent.trim() || !selectedPost) return;

    try {
      setSubmittingResponse(true);
      setResponseError(null);
      const response = await fetch(`/api/v1/posts/${selectedPost.id}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: responseContent,
          is_internal_note: isInternalNote,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const newResponse = {
          id: result.data.id,
          content: result.data.content,
          isInternalNote: result.data.is_internal_note,
          agent: currentAgent.name,
          createdAt: result.data.created_at,
        };

        setResponses([...responses, newResponse]);
        setResponseContent('');
        setIsInternalNote(false);
      } else {
        const errorText = await response.text();
        console.error('Failed to submit response:', errorText);
        setResponseError('Failed to send response');
      }
    } catch (error) {
      console.error('Error submitting response:', error);
      setResponseError('Failed to send response');
    } finally {
      setSubmittingResponse(false);
    }
  };

  const handleTemplateSelect = (content: string) => {
    setResponseContent(content);
    // Dismiss AI suggestion when template is selected
    aiSuggestion.dismissSuggestion();
  };

  const handleAcceptGhostText = () => {
    const acceptedText = aiSuggestion.acceptSuggestion();
    if (acceptedText) {
      setResponseContent(acceptedText);
      // Focus editor after accepting
      setTimeout(() => {
        editorRef.current?.focus();
      }, 0);
    }
  };

  const handleDismissGhostText = () => {
    aiSuggestion.dismissSuggestion();
  };

  const handleAiSuggest = () => {
    aiSuggestion.startStreaming();
  };

  const handleReassign = (toAgentId: string) => {
    if (selectedPost && onReassign) {
      onReassign(selectedPost.id, toAgentId);
    }
  };

  if (!selectedPost) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background text-muted-foreground">
        <div className="w-16 h-16 bg-background-secondary rounded-full flex items-center justify-center mb-4">
          <MessageSquare size={32} className="text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">No Post Selected</h3>
        <p className="text-sm text-muted-foreground">Select a post from the queue to begin moderation</p>
      </div>
    );
  }

  return (
    <main className="flex-1 flex flex-col bg-background overflow-hidden" data-testid="work-pane">
      {/* Header */}
      <div className="border-b border-border p-4 bg-background-secondary">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                'font-mono text-sm px-2 py-0.5 rounded',
                priorityColors[selectedPost.priority] + '/20',
                'text-foreground'
              )}
            >
              {selectedPost.priority}
            </span>
            <span
              className={cn(
                'text-xs px-2 py-0.5 rounded font-medium capitalize',
                statusColors[selectedPost.status]
              )}
            >
              {selectedPost.status === 'open' ? 'Open' : selectedPost.status === 'in_progress' ? 'In Progress' : 'Resolved'}
            </span>
            {isAssignedToMe && (
              <span className="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Assigned to you
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isAssignedToMe ? (
              <button
                type="button"
                onClick={onAssignToMe}
                className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-white text-sm rounded-md transition-colors"
                data-testid="assign-to-me-button"
              >
                Assign to Me
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setIsReassignModalOpen(true)}
                  className="px-3 py-1.5 bg-background-tertiary hover:bg-background-tertiary/80 text-foreground text-sm rounded-md transition-colors border border-border flex items-center gap-2"
                  data-testid="reassign-button"
                  title="Reassign to another agent (Cmd+Shift+A)"
                >
                  <ArrowRightLeft size={14} />
                  Reassign
                </button>
                <button
                  type="button"
                  onClick={onRelease}
                  className="px-3 py-1.5 bg-background-tertiary hover:bg-background-tertiary/80 text-foreground text-sm rounded-md transition-colors border border-border"
                  data-testid="release-button"
                >
                  Release
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onResolve}
              className="px-3 py-1.5 bg-background-tertiary hover:bg-background-tertiary/80 text-foreground text-sm rounded-md transition-colors border border-border"
              data-testid="resolve-button"
            >
              Resolve
            </button>
          </div>
        </div>
        <h1 className="text-xl font-semibold text-foreground" data-testid="post-title">
          {selectedPost.title}
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col lg:flex-row">
          {/* Main Content */}
          <div className="flex-1 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Post Content */}
              <section
                className="bg-background-secondary rounded-lg border border-border p-4"
                data-testid="post-content-section"
              >
                <h2 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">
                  Content
                </h2>
                <div className="prose prose-invert max-w-none">
                  <p className="text-foreground-secondary leading-relaxed">
                    {selectedPost.excerpt}
                  </p>
                </div>
              </section>

              {/* Response Editor */}
              <section className="bg-background-secondary rounded-lg border border-border p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                    Response
                  </h2>
                  <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isInternalNote}
                      onChange={(e) => setIsInternalNote(e.target.checked)}
                      className="w-4 h-4 rounded border-border bg-background-tertiary text-primary focus:ring-2 focus:ring-primary"
                      data-testid="internal-note-checkbox"
                    />
                    <span>Internal Note</span>
                  </label>
                </div>
                <RichTextEditor
                  ref={editorRef}
                  value={responseContent}
                  onChange={setResponseContent}
                  placeholder="Type your response here... (Press R to focus)"
                  ghostText={aiSuggestion.ghostText}
                  onAcceptGhostText={handleAcceptGhostText}
                  onDismissGhostText={handleDismissGhostText}
                />
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <TemplateSelector
                      onSelect={handleTemplateSelect}
                      postContext={{
                        title: selectedPost.title,
                        authorName: selectedPost.author?.name,
                        category: selectedPost.category?.name,
                      }}
                    />
                    <button
                      onClick={handleAiSuggest}
                      disabled={aiSuggestion.isStreaming}
                      className={cn(
                        'px-3 py-1.5 text-foreground text-sm rounded-md transition-colors border flex items-center gap-2',
                        aiSuggestion.isStreaming
                          ? 'bg-primary/20 cursor-wait'
                          : 'bg-background-tertiary hover:bg-background-tertiary/80 border-border'
                      )}
                      data-testid="ai-suggest-button"
                    >
                      {aiSuggestion.isStreaming ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          ✨ AI Suggest
                        </>
                      )}
                    </button>
                  </div>
                  <button
                    onClick={handleSendResponse}
                    disabled={!responseContent.trim() || submittingResponse}
                    className={cn(
                      'px-4 py-1.5 text-white text-sm rounded-md transition-colors flex items-center gap-2',
                      responseContent.trim() && !submittingResponse
                        ? 'bg-emerald-500 hover:bg-emerald-600'
                        : 'bg-emerald-500/50 cursor-not-allowed'
                    )}
                    data-testid="send-response-button"
                  >
                    {submittingResponse ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        {isInternalNote ? 'Adding...' : 'Sending...'}
                      </>
                    ) : (
                      isInternalNote ? 'Add Note' : 'Send Response'
                    )}
                  </button>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Tip: Press <kbd className="px-1 py-0.5 bg-background-tertiary rounded text-foreground">Cmd+Enter</kbd> to {isInternalNote ? 'add note' : 'send response'} and resolve
                </div>
              </section>

              {/* Activity History */}
              {responseError && (
                <div className="mb-4">
                  <InlineError
                    message={responseError}
                    onRetry={() => {
                      if (selectedPost) {
                        // Reload responses
                        fetch(`/api/v1/posts/${selectedPost.id}/responses`)
                          .then(res => {
                            if (res.ok) return res.json();
                            throw new Error('Failed to reload');
                          })
                          .then(result => {
                            const transformed = result.data.map((r: any) => ({
                              id: r.id,
                              content: r.content,
                              isInternalNote: r.is_internal_note,
                              agent: currentAgent.name,
                              createdAt: r.created_at,
                            }));
                            setResponses(transformed);
                            setResponseError(null);
                          })
                          .catch(() => setResponseError('Failed to reload responses'));
                      }
                    }}
                  />
                </div>
              )}
              {(responses.length > 0 || loadingResponses) && (
                <section className="bg-background-secondary rounded-lg border border-border p-4">
                  <h2 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">
                    Activity History
                  </h2>
                  <div className="space-y-3">
                    {loadingResponses ? (
                      <>
                        {/* Show 2 skeleton loaders while loading */}
                        <ResponseSkeleton />
                        <ResponseSkeleton />
                      </>
                    ) : (
                      <>
                        {responses.map((response) => (
                          <div
                            key={response.id}
                            className={cn(
                              'p-4 rounded-lg border transition-all',
                              response.isInternalNote
                                ? 'bg-amber-500/5 border-amber-500/20 border-l-4 border-l-amber-500/60'
                                : 'bg-background-tertiary border-border hover:border-border/80'
                            )}
                            data-testid={`response-${response.id}`}
                          >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              'w-6 h-6 rounded-full flex items-center justify-center',
                              response.isInternalNote ? 'bg-amber-500/20' : 'bg-primary/20'
                            )}>
                              {response.isInternalNote ? (
                                <EyeOff size={12} className="text-amber-400" />
                              ) : (
                                <MessageCircle size={12} className="text-primary" />
                              )}
                            </div>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-foreground">{response.agent}</span>
                                {response.isInternalNote && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-medium border border-amber-500/30 flex items-center gap-1">
                                    <EyeOff size={10} />
                                    Internal
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {response.isInternalNote ? 'Private note - not visible to community' : 'Public response - visible to everyone'}
                              </span>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(response.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <div className={cn(
                          'text-sm leading-relaxed whitespace-pre-wrap p-3 rounded-md',
                          response.isInternalNote
                            ? 'bg-amber-950/20 text-amber-100/90'
                            : 'bg-background-secondary text-foreground-secondary'
                        )}>
                          {response.content}
                        </div>
                      </div>
                    ))}
                    </>
                  )}
                  </div>
                </section>
              )}
            </div>
          </div>

          {/* User Context Sidebar */}
          <aside
            className="w-full lg:w-72 p-6 border-t lg:border-t-0 lg:border-l border-border bg-background-secondary"
            data-testid="user-context-sidebar"
          >
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                User Context
              </h2>

              {/* Author Info */}
              <div className="bg-background-tertiary rounded-lg p-3 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                    <User size={16} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {selectedPost.author?.name || 'Unknown User'}
                    </p>
                    <p className="text-xs text-muted-foreground">Author</p>
                  </div>
                </div>
              </div>

              {/* Sentiment */}
              {selectedPost.sentiment && (
                <div className="bg-background-tertiary rounded-lg p-3 border border-border">
                  <div className="flex items-center gap-2">
                    {selectedPost.sentiment === 'negative' && (
                      <AlertCircle size={16} className={(sentimentColors.negative?.split(' ')?.[0] || '').replace('text-', 'text-')} />
                    )}
                    {selectedPost.sentiment === 'positive' && (
                      <CheckCircle2 size={16} className={(sentimentColors.positive?.split(' ')?.[0] || '').replace('text-', 'text-')} />
                    )}
                    {selectedPost.sentiment === 'neutral' && (
                      <MessageSquare size={16} className={(sentimentColors.neutral?.split(' ')?.[0] || '').replace('text-', 'text-')} />
                    )}
                    <span className={cn('text-sm font-medium', sentimentColors[selectedPost.sentiment]?.split(' ')?.[0])}>
                      {selectedPost.sentiment.charAt(0).toUpperCase() + selectedPost.sentiment.slice(1)} Sentiment
                    </span>
                  </div>
                </div>
              )}

              {/* Post History */}
              <div className="bg-background-tertiary rounded-lg p-3 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Post History</span>
                  <span className="text-sm font-medium text-foreground">
                    {selectedPost.author?.postCount ?? 0} posts
                  </span>
                </div>
                {selectedPost.author?.postCount === 0 && (
                  <div className="text-xs text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded">
                    First-time poster
                  </div>
                )}
              </div>

              {/* Metadata */}
              <div className="bg-background-tertiary rounded-lg p-3 border border-border space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Hash size={14} />
                  <span>Post ID: {selectedPost.id}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock size={14} />
                  <span>Created: {selectedPost.createdAt}</span>
                </div>
                {selectedPost.category && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: selectedPost.category.color }}
                    />
                    <span>{selectedPost.category.name}</span>
                  </div>
                )}
              </div>

              {/* Assignment Status */}
              <div className="bg-background-tertiary rounded-lg p-3 border border-border">
                <h3 className="text-sm font-medium text-foreground mb-2">Assignment</h3>
                <div className="text-sm text-muted-foreground">
                  {isAssignedToMe ? (
                    <span className="text-primary">Assigned to you</span>
                  ) : (
                    <span>Unassigned - click &quot;Assign to Me&quot; to claim</span>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Reassign Dialog */}
      <ReassignDialog
        isOpen={isReassignModalOpen}
        onClose={() => setIsReassignModalOpen(false)}
        onReassign={handleReassign}
        currentAgentId={currentAgent.id}
        agents={mockAgents}
        postTitle={selectedPost.title}
      />
    </main>
  );
}
