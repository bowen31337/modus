'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, User, Clock, AlertCircle, CheckCircle2, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PostCardProps } from '@/features/queue/components/post-card';
import { RichTextEditor, type RichTextEditorRef } from './rich-text-editor';

interface WorkPaneProps {
  selectedPost: PostCardProps | null;
  currentAgent: { id: string; name: string };
  assignedPosts: Set<string>;
  onAssignToMe: () => void;
  onResolve: () => void;
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
};

const statusColors: Record<string, string> = {
  open: 'bg-background-tertiary text-foreground-secondary',
  in_progress: 'bg-primary/20 text-primary',
  resolved: 'bg-emerald-500/20 text-emerald-400',
};

export function WorkPane({ selectedPost, currentAgent, assignedPosts, onAssignToMe, onResolve }: WorkPaneProps) {
  const [responseContent, setResponseContent] = useState('');
  const [responses, setResponses] = useState<Array<{ id: string; content: string; isInternalNote: boolean; agent: string; createdAt: string }>>([]);
  const [isInternalNote, setIsInternalNote] = useState(false);
  const editorRef = useRef<RichTextEditorRef>(null);
  const isAssignedToMe = selectedPost ? assignedPosts.has(selectedPost.id) : false;

  // Keyboard shortcut: R key focuses the response editor
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if not typing in an input/textarea
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

      // Cmd+Enter posts response and resolves
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        if (selectedPost && responseContent.trim()) {
          e.preventDefault();
          handleSendResponse();
          onResolve();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPost, responseContent]);

  const handleSendResponse = () => {
    if (!responseContent.trim() || !selectedPost) return;

    const newResponse = {
      id: `response-${Date.now()}`,
      content: responseContent,
      isInternalNote,
      agent: currentAgent.name,
      createdAt: new Date().toISOString(),
    };

    setResponses([...responses, newResponse]);
    setResponseContent('');
    setIsInternalNote(false);
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
            <button
              onClick={onAssignToMe}
              className={cn(
                'px-3 py-1.5 text-white text-sm rounded-md transition-colors',
                isAssignedToMe ? 'bg-foreground/20 cursor-not-allowed' : 'bg-primary hover:bg-primary/90'
              )}
              disabled={isAssignedToMe}
              data-testid="assign-to-me-button"
            >
              {isAssignedToMe ? 'Assigned' : 'Assign to Me'}
            </button>
            <button
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
                />
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <button
                      className="px-3 py-1.5 bg-background-tertiary hover:bg-background-tertiary/80 text-foreground text-sm rounded-md transition-colors border border-border"
                      data-testid="use-template-button"
                    >
                      Use Template
                    </button>
                    <button
                      className="px-3 py-1.5 bg-background-tertiary hover:bg-background-tertiary/80 text-foreground text-sm rounded-md transition-colors border border-border"
                      data-testid="ai-suggest-button"
                    >
                      AI Suggest
                    </button>
                  </div>
                  <button
                    onClick={handleSendResponse}
                    disabled={!responseContent.trim()}
                    className={cn(
                      'px-4 py-1.5 text-white text-sm rounded-md transition-colors',
                      responseContent.trim()
                        ? 'bg-emerald-500 hover:bg-emerald-600'
                        : 'bg-emerald-500/50 cursor-not-allowed'
                    )}
                    data-testid="send-response-button"
                  >
                    {isInternalNote ? 'Add Note' : 'Send Response'}
                  </button>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Tip: Press <kbd className="px-1 py-0.5 bg-background-tertiary rounded text-foreground">Cmd+Enter</kbd> to {isInternalNote ? 'add note' : 'send response'} and resolve
                </div>
              </section>

              {/* Activity History */}
              {responses.length > 0 && (
                <section className="bg-background-secondary rounded-lg border border-border p-4">
                  <h2 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">
                    Activity History
                  </h2>
                  <div className="space-y-3">
                    {responses.map((response) => (
                      <div
                        key={response.id}
                        className={cn(
                          'p-3 rounded-md border',
                          response.isInternalNote
                            ? 'bg-yellow-500/10 border-yellow-500/30'
                            : 'bg-background-tertiary border-border'
                        )}
                        data-testid={`response-${response.id}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">{response.agent}</span>
                            {response.isInternalNote && (
                              <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400">
                                Internal Note
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(response.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-foreground-secondary whitespace-pre-wrap">{response.content}</p>
                      </div>
                    ))}
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
                      <AlertCircle size={16} className={sentimentColors.negative.split(' ')[0].replace('text-', 'text-')} />
                    )}
                    {selectedPost.sentiment === 'positive' && (
                      <CheckCircle2 size={16} className={sentimentColors.positive.split(' ')[0].replace('text-', 'text-')} />
                    )}
                    {selectedPost.sentiment === 'neutral' && (
                      <MessageSquare size={16} className={sentimentColors.neutral.split(' ')[0].replace('text-', 'text-')} />
                    )}
                    <span className={cn('text-sm font-medium', sentimentColors[selectedPost.sentiment].split(' ')[0])}>
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
    </main>
  );
}
