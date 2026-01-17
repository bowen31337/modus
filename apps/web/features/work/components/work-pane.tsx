import type { ModerationPost } from "@modus/logic";
import { MessageSquare, User, Clock, AlertCircle } from "lucide-react";

interface WorkPaneProps {
  selectedPost: ModerationPost | null;
}

export function WorkPane({ selectedPost }: WorkPaneProps) {
  if (!selectedPost) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-obsidian-900 text-obsidian-400">
        <div className="w-16 h-16 bg-obsidian-800 rounded-full flex items-center justify-center mb-4">
          <MessageSquare size={32} className="text-obsidian-500" />
        </div>
        <h3 className="text-lg font-medium text-obsidian-200 mb-2">No Post Selected</h3>
        <p className="text-sm text-obsidian-400">Select a post from the queue to begin moderation</p>
      </div>
    );
  }

  return (
    <main className="flex-1 flex flex-col bg-obsidian-900 overflow-hidden">
      <div className="border-b border-obsidian-700 p-4 bg-obsidian-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">
              {selectedPost.priority}
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-obsidian-700 text-obsidian-300 capitalize">
              {selectedPost.status}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-md transition-colors">
              Assign to Me
            </button>
            <button className="px-3 py-1.5 bg-obsidian-700 hover:bg-obsidian-600 text-obsidian-200 text-sm rounded-md transition-colors">
              Resolve
            </button>
          </div>
        </div>
        <h1 className="text-xl font-semibold text-obsidian-100">{selectedPost.title}</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <section className="bg-obsidian-800 rounded-lg border border-obsidian-700 p-4">
            <h2 className="text-sm font-semibold text-obsidian-300 mb-3 uppercase tracking-wide">
              Post Details
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-obsidian-400">
                <User size={14} />
                <span>Author: {selectedPost.author_user_id}</span>
                {selectedPost.author_post_count === 0 && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400">
                    First-time poster
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-obsidian-400">
                <Clock size={14} />
                <span>Posted: {new Date(selectedPost.created_at).toLocaleString()}</span>
              </div>
              {selectedPost.sentiment_label && (
                <div className="flex items-center gap-2 text-sm">
                  <AlertCircle size={14} />
                  <span className="capitalize">
                    Sentiment: {selectedPost.sentiment_label}
                    {selectedPost.sentiment_score !== null && selectedPost.sentiment_score !== undefined && ` (${(selectedPost.sentiment_score * 100).toFixed(0)}%)`}
                  </span>
                </div>
              )}
            </div>
          </section>

          <section className="bg-obsidian-800 rounded-lg border border-obsidian-700 p-4">
            <h2 className="text-sm font-semibold text-obsidian-300 mb-3 uppercase tracking-wide">
              Content
            </h2>
            <div className="prose prose-invert max-w-none">
              <p className="text-obsidian-200 leading-relaxed">{selectedPost.body_content}</p>
            </div>
          </section>

          <section className="bg-obsidian-800 rounded-lg border border-obsidian-700 p-4">
            <h2 className="text-sm font-semibold text-obsidian-300 mb-3 uppercase tracking-wide">
              Response
            </h2>
            <textarea
              className="w-full h-32 bg-obsidian-900 border border-obsidian-600 rounded-md p-3 text-obsidian-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Type your response here..."
            />
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 bg-obsidian-700 hover:bg-obsidian-600 text-obsidian-200 text-sm rounded-md transition-colors">
                  Use Template
                </button>
                <button className="px-3 py-1.5 bg-obsidian-700 hover:bg-obsidian-600 text-obsidian-200 text-sm rounded-md transition-colors">
                  AI Suggest
                </button>
              </div>
              <button className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm rounded-md transition-colors">
                Send Response
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

