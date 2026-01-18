'use client';

import { InlineError } from '@/components/ui/error-state';
import { KeyboardShortcut } from '@/components/ui/keyboard-shortcut';
import { StatusBadge } from '@/components/ui/status-badge';
import type { PostCardProps } from '@/features/queue/components/post-card';
import { sanitizePostContent } from '@/lib/sanitize';
import { cn } from '@/lib/utils';
import { PresenceIndicator } from '@/components/presence-indicator';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@modus/ui';
import {
  AlertCircle,
  ArrowRightLeft,
  CheckCircle2,
  EyeOff,
  Loader2,
  MessageCircle,
  MessageSquare,
  Pencil,
  Trash2,
  User,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAiSuggestion } from '../hooks/use-ai-suggestion';
import { ReassignDialog } from './reassign-dialog';
import { ResponseSkeleton } from './response-skeleton';
import { RichTextEditor, type RichTextEditorRef } from './rich-text-editor';
import { TemplateSelector } from './template-selector';

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
  P1: 'bg-red-600',
  P2: 'bg-orange-500',
  P3: 'bg-yellow-500',
  P4: 'bg-blue-500',
  P5: 'bg-slate-500',
};

export function WorkPane({
  selectedPost,
  currentAgent,
  assignedPosts,
  onAssignToMe,
  onRelease,
  onResolve,
  onCloseDetail,
  onReassign,
}: WorkPaneProps) {
  const [responseContent, setResponseContent] = useState('');
  const [responses, setResponses] = useState<
    Array<{
      id: string;
      content: string;
      isInternalNote: boolean;
      agent: string;
      agentId: string;
      createdAt: string;
    }>
  >([]);
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [responseError, setResponseError] = useState<string | null>(null);
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const [editingResponseId, setEditingResponseId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editIsInternalNote, setEditIsInternalNote] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingResponseId, setDeletingResponseId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const editorRef = useRef<RichTextEditorRef>(null);
  const editEditorRef = useRef<RichTextEditorRef>(null);
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
        if (commandPalette?.contains(target)) {
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
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
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
            agentId: r.agent_id,
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
          agentId: result.data.agent_id,
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

  const handleEditResponse = (responseId: string) => {
    const response = responses.find((r) => r.id === responseId);
    if (!response) return;

    setEditingResponseId(responseId);
    setEditContent(response.content);
    setEditIsInternalNote(response.isInternalNote);
    // Focus the edit editor after state update
    setTimeout(() => {
      editEditorRef.current?.focus();
    }, 0);
  };

  const handleCancelEdit = () => {
    setEditingResponseId(null);
    setEditContent('');
    setEditIsInternalNote(false);
  };

  const handleSaveEdit = async () => {
    if (!editingResponseId || !selectedPost || !editContent.trim()) return;

    try {
      setSavingEdit(true);
      setResponseError(null);

      const response = await fetch(
        `/api/v1/posts/${selectedPost.id}/responses/${editingResponseId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: editContent,
            is_internal_note: editIsInternalNote,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        setResponses((prev) =>
          prev.map((r) =>
            r.id === editingResponseId
              ? {
                  ...r,
                  content: result.data.content,
                  isInternalNote: result.data.is_internal_note,
                  agentId: result.data.agent_id,
                }
              : r
          )
        );
        handleCancelEdit();
      } else {
        const errorText = await response.text();
        console.error('Failed to update response:', errorText);
        setResponseError('Failed to update response');
      }
    } catch (error) {
      console.error('Error updating response:', error);
      setResponseError('Failed to update response');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteResponse = async (responseId: string) => {
    if (!selectedPost) return;

    // Show confirmation dialog
    setDeleteConfirmOpen(true);
    setDeletingResponseId(responseId);
  };

  const handleConfirmDelete = async () => {
    if (!selectedPost || !deletingResponseId) return;

    try {
      setResponseError(null);

      const response = await fetch(
        `/api/v1/posts/${selectedPost.id}/responses/${deletingResponseId}`,
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        setResponses((prev) => prev.filter((r) => r.id !== deletingResponseId));
      } else {
        const errorText = await response.text();
        console.error('Failed to delete response:', errorText);
        setResponseError('Failed to delete response');
      }
    } catch (error) {
      console.error('Error deleting response:', error);
      setResponseError('Failed to delete response');
    } finally {
      setDeletingResponseId(null);
      setDeleteConfirmOpen(false);
    }
  };

  const handleCancelDelete = () => {
    setDeletingResponseId(null);
    setDeleteConfirmOpen(false);
  };

  const handleResponseEditContentChange = (content: string) => {
    setEditContent(content);
  };

  if (!selectedPost) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background text-muted-foreground">
        <div className="w-16 h-16 bg-background-secondary rounded-full flex items-center justify-center mb-4">
          <MessageSquare size={32} className="text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">No Post Selected</h3>
        <p className="text-sm text-muted-foreground">
          Select a post from the queue to begin moderation
        </p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <main className="flex-1 flex flex-col bg-background overflow-hidden" data-testid="work-pane">
        {/* Header */}
        <div className="border-b border-border p-4 bg-background-secondary">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  'font-mono text-sm px-2 py-0.5 rounded',
                  `${priorityColors[selectedPost.priority]}/40`,
                  'text-foreground'
                )}
              >
                {selectedPost.priority}
              </span>
              <StatusBadge status={selectedPost.status} size="sm" />
              {isAssignedToMe && (
                <span className="text-xs px-2 py-0.5 rounded bg-primary/30 text-foreground font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Assigned to you
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!isAssignedToMe ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={onAssignToMe}
                      data-testid="assign-to-me-button"
                      variant="default"
                      size="default"
                    >
                      Assign to Me
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Assign this post to yourself</TooltipContent>
                </Tooltip>
              ) : (
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => setIsReassignModalOpen(true)}
                        data-testid="reassign-button"
                        variant="outline"
                        size="default"
                      >
                        <ArrowRightLeft size={14} />
                        Reassign
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Reassign to another agent (Cmd+Shift+A)</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={onRelease}
                        data-testid="release-button"
                        variant="outline"
                        size="default"
                      >
                        Release
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Release this post back to the queue</TooltipContent>
                  </Tooltip>
                </>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={onResolve}
                    data-testid="resolve-button"
                    variant="outline"
                    size="default"
                  >
                    Resolve
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Resolve this post (Cmd+Enter when responding)</TooltipContent>
              </Tooltip>
            </div>
          </div>
          <h1
            className="text-xl font-semibold text-foreground"
            data-testid="post-title"
            dangerouslySetInnerHTML={{
              __html: sanitizePostContent(selectedPost.title, { allowHtml: false, escapeHtml: false }),
            }}
          />
          <div className="mt-2">
            <PresenceIndicator postId={selectedPost.id} currentAgentId={currentAgent.id} />
          </div>
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
                    <p
                      className="text-foreground-secondary leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: sanitizePostContent(selectedPost.excerpt, {
                          allowHtml: false,
                          escapeHtml: false,
                        }),
                      }}
                    />
                  </div>
                </section>

                {/* Response Editor */}
                <section className="bg-background-secondary rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                      Response
                    </h2>
                    <KeyboardShortcut keys={['R']} />
                  </div>
                  <div className="flex items-center gap-3 mb-3">
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
                      <Button
                        onClick={handleAiSuggest}
                        disabled={aiSuggestion.isStreaming}
                        variant="secondary"
                        size="default"
                        data-testid="ai-suggest-button"
                      >
                        {aiSuggestion.isStreaming ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>✨ AI Suggest</>
                        )}
                      </Button>
                    </div>
                    <Button
                      onClick={handleSendResponse}
                      disabled={!responseContent.trim() || submittingResponse}
                      variant="default"
                      size="default"
                      data-testid="send-response-button"
                    >
                      {submittingResponse ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          {isInternalNote ? 'Adding...' : 'Sending...'}
                        </>
                      ) : isInternalNote ? (
                        'Add Note'
                      ) : (
                        'Send Response'
                      )}
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Tip: Press{' '}
                    <kbd className="px-1 py-0.5 bg-background-tertiary rounded text-foreground">
                      Cmd+Enter
                    </kbd>{' '}
                    to {isInternalNote ? 'add note' : 'send response'} and resolve
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
                            .then((res) => {
                              if (res.ok) return res.json();
                              throw new Error('Failed to reload');
                            })
                            .then((result) => {
                              const transformed = result.data.map((r: any) => ({
                                id: r.id,
                                content: r.content,
                                isInternalNote: r.is_internal_note,
                                agent: currentAgent.name,
                                agentId: r.agent_id,
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
                  <section
                    className="bg-background-secondary rounded-lg border border-border p-4"
                    data-testid="activity-history"
                  >
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
                          {responses.map((response) => {
                            const isEditing = editingResponseId === response.id;
                            const isOwnResponse = response.agentId === currentAgent.id;
                            const isDeleting = deletingResponseId === response.id;

                            if (isEditing) {
                              return (
                                <div
                                  key={response.id}
                                  className={cn(
                                    'p-4 rounded-lg border transition-all',
                                    editIsInternalNote
                                      ? 'bg-amber-500/5 border-amber-500/20 border-l-4 border-l-amber-500/60'
                                      : 'bg-background-tertiary border-border'
                                  )}
                                  data-testid={`response-edit-${response.id}`}
                                >
                                  <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-medium text-foreground">
                                      Edit Response
                                    </h3>
                                    <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={editIsInternalNote}
                                        onChange={(e) => setEditIsInternalNote(e.target.checked)}
                                        className="w-4 h-4 rounded border-border bg-background-tertiary text-primary focus:ring-2 focus:ring-primary"
                                        data-testid="edit-internal-note-checkbox"
                                      />
                                      <span>Internal Note</span>
                                    </label>
                                  </div>
                                  <RichTextEditor
                                    ref={editEditorRef}
                                    value={editContent}
                                    onChange={handleResponseEditContentChange}
                                    placeholder="Edit your response..."
                                  />
                                  <div className="flex items-center justify-end gap-2 mt-3">
                                    <Button
                                      onClick={handleCancelEdit}
                                      variant="outline"
                                      size="sm"
                                      data-testid="cancel-edit-button"
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      onClick={handleSaveEdit}
                                      disabled={!editContent.trim() || savingEdit}
                                      variant="default"
                                      size="sm"
                                      data-testid="save-edit-button"
                                    >
                                      {savingEdit ? (
                                        <>
                                          <Loader2 size={14} className="animate-spin" />
                                          Saving...
                                        </>
                                      ) : (
                                        'Save Changes'
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              );
                            }

                            return (
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
                                    <div
                                      className={cn(
                                        'w-6 h-6 rounded-full flex items-center justify-center',
                                        response.isInternalNote ? 'bg-amber-500/20' : 'bg-primary/20'
                                      )}
                                    >
                                      {response.isInternalNote ? (
                                        <EyeOff size={12} className="text-amber-400" />
                                      ) : (
                                        <MessageCircle size={12} className="text-primary" />
                                      )}
                                    </div>
                                    <div className="flex flex-col">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-foreground">
                                          {response.agent}
                                        </span>
                                        {response.isInternalNote && (
                                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-medium border border-amber-500/30 flex items-center gap-1">
                                            <EyeOff size={10} />
                                            Internal
                                          </span>
                                        )}
                                        {isOwnResponse && (
                                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium border border-primary/30 flex items-center gap-1">
                                            You
                                          </span>
                                        )}
                                      </div>
                                      <span className="text-xs text-muted-foreground">
                                        {response.isInternalNote
                                          ? 'Private note - not visible to community'
                                          : 'Public response - visible to everyone'}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {isOwnResponse && (
                                      <>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              onClick={() => handleEditResponse(response.id)}
                                              variant="ghost"
                                              size="sm"
                                              data-testid={`edit-response-${response.id}`}
                                            >
                                              <Pencil size={14} />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>Edit this response</TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              onClick={() => handleDeleteResponse(response.id)}
                                              variant="ghost"
                                              size="sm"
                                              disabled={isDeleting}
                                              data-testid={`delete-response-${response.id}`}
                                            >
                                              {isDeleting ? (
                                                <Loader2 size={14} className="animate-spin" />
                                              ) : (
                                                <Trash2 size={14} className="text-red-400" />
                                              )}
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>Delete this response</TooltipContent>
                                        </Tooltip>
                                      </>
                                    )}
                                    <span className="text-xs text-muted-foreground ml-2">
                                      {new Date(response.createdAt).toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                                <div
                                  className={cn(
                                    'text-sm leading-relaxed whitespace-pre-wrap p-3 rounded-md',
                                    response.isInternalNote
                                      ? 'bg-amber-950/20 text-amber-100/90'
                                      : 'bg-background-secondary text-foreground-secondary'
                                  )}
                                  dangerouslySetInnerHTML={{
                                    __html: sanitizePostContent(response.content, {
                                      allowHtml: false,
                                      escapeHtml: false,
                                    }),
                                  }}
                                />
                              </div>
                            );
                          })}
                        </>
                      )}
                    </div>
                  </section>
                )}
              </div>
            </div>

            {/* User Context Sidebar */}
            <aside
              className="w-full lg:w-72 border-t lg:border-t-0 lg:border-l border-border bg-background-secondary overflow-y-auto"
              data-testid="user-context-sidebar"
            >
              {/* Sidebar Header */}
              <div className="sticky top-0 bg-background-secondary/95 backdrop-blur-sm border-b border-border p-4">
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                  User Context
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Author information and post metadata
                </p>
              </div>

              <div className="p-4 space-y-5">
                {/* Author Card - Primary Information */}
                <section className="space-y-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Author
                  </h3>
                  <div className="bg-background-tertiary rounded-lg p-4 border border-border/60 hover:border-border/80 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <User size={18} className="text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {selectedPost.author?.name || 'Unknown User'}
                        </p>
                        <p className="text-xs text-muted-foreground">Community Member</p>
                      </div>
                    </div>
                    {/* First-time poster indicator */}
                    {selectedPost.author?.postCount === 0 && (
                      <div className="mt-3 text-xs font-medium px-2.5 py-1.5 rounded bg-yellow-500/15 text-yellow-400 border border-yellow-500/20 inline-block">
                        ⚠ First-time poster
                      </div>
                    )}
                  </div>
                </section>

                {/* Sentiment & Category - Quick Scan */}
                <section className="space-y-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Analysis
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {/* Sentiment */}
                    {selectedPost.sentiment && (
                      <div className="bg-background-tertiary rounded-lg p-3 border border-border/60">
                        <div className="flex items-center gap-2">
                          {selectedPost.sentiment === 'negative' && (
                            <AlertCircle
                              size={14}
                              className="text-red-400"
                            />
                          )}
                          {selectedPost.sentiment === 'positive' && (
                            <CheckCircle2
                              size={14}
                              className="text-emerald-400"
                            />
                          )}
                          {selectedPost.sentiment === 'neutral' && (
                            <MessageSquare
                              size={14}
                              className="text-muted-foreground"
                            />
                          )}
                          <span
                            className={cn(
                              'text-sm font-medium',
                              selectedPost.sentiment === 'negative' && 'text-red-400',
                              selectedPost.sentiment === 'positive' && 'text-emerald-400',
                              selectedPost.sentiment === 'neutral' && 'text-muted-foreground'
                            )}
                          >
                            {selectedPost.sentiment.charAt(0).toUpperCase() +
                              selectedPost.sentiment.slice(1)}{' '}
                            Sentiment
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Category */}
                    {selectedPost.category && (
                      <div className="bg-background-tertiary rounded-lg p-3 border border-border/60">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: selectedPost.category.color }}
                          />
                          <span className="text-sm text-foreground">
                            {selectedPost.category.name}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {/* Assignment Status - Action Context */}
                <section className="space-y-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Assignment
                  </h3>
                  <div className="bg-background-tertiary rounded-lg p-3 border border-border/60">
                    {isAssignedToMe ? (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="w-2 h-2 rounded-full bg-primary" />
                        <span className="text-foreground font-medium">Assigned to you</span>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        Unassigned - click &quot;Assign to Me&quot; to claim
                      </div>
                    )}
                  </div>
                </section>

                {/* Post History - User Behavior */}
                <section className="space-y-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Post History
                  </h3>
                  <div className="bg-background-tertiary rounded-lg p-3 border border-border/60">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Posts</span>
                      <span className="text-sm font-semibold text-foreground">
                        {selectedPost.author?.postCount ?? 0}
                      </span>
                    </div>
                  </div>
                </section>

                {/* Metadata - Technical Details */}
                <section className="space-y-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Metadata
                  </h3>
                  <div className="bg-background-tertiary rounded-lg p-3 border border-border/60 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Post ID</span>
                      <span className="text-foreground font-mono text-xs">{selectedPost.id}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Created</span>
                      <span className="text-foreground">{selectedPost.createdAt}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Priority</span>
                      <span
                        className={cn(
                          'font-mono text-xs px-1.5 py-0.5 rounded',
                          selectedPost.priority === 'P1' && 'bg-red-500/20 text-red-400',
                          selectedPost.priority === 'P2' && 'bg-orange-500/20 text-orange-400',
                          selectedPost.priority === 'P3' && 'bg-yellow-500/20 text-yellow-400',
                          selectedPost.priority === 'P4' && 'bg-blue-500/20 text-blue-400',
                          selectedPost.priority === 'P5' && 'bg-gray-500/20 text-gray-400'
                        )}
                      >
                        {selectedPost.priority}
                      </span>
                    </div>
                  </div>
                </section>

                {/* Quick Stats */}
                <section className="space-y-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Quick Stats
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-background-tertiary rounded-lg p-3 border border-border/60 text-center">
                      <div className="text-lg font-bold text-foreground">
                        {selectedPost.author?.postCount ?? 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Posts</div>
                    </div>
                    <div className="bg-background-tertiary rounded-lg p-3 border border-border/60 text-center">
                      <div className="text-lg font-bold text-foreground">
                        {selectedPost.status === 'in_progress' ? 'Active' : 'Open'}
                      </div>
                      <div className="text-xs text-muted-foreground">Status</div>
                    </div>
                  </div>
                </section>
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

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent data-testid="delete-response-dialog">
            <DialogHeader>
              <DialogTitle>Delete Response</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this response? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={handleCancelDelete} data-testid="cancel-delete-button">
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                data-testid="confirm-delete-button"
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </TooltipProvider>
  );
}
