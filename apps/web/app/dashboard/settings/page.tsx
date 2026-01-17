'use client';

import { useState } from 'react';
import { ArrowLeft, Plus, Search, Edit, Trash2, FileText } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { LeftRail } from '@/features/layout/components/left-rail';

export interface Template {
  id: string;
  name: string;
  content: string;
  placeholders: string[];
  category_id?: string | null;
  usage_count: number;
}

export default function SettingsPage() {
  const [templates, setTemplates] = useState<Template[]>([
    {
      id: '1',
      name: 'Welcome Message',
      content: 'Hi {{authorName}},\n\nThank you for reaching out about "{{title}}". We appreciate you taking the time to share your thoughts with our community.\n\nBest regards,\n{{agentName}}',
      placeholders: ['authorName', 'title', 'agentName'],
      usage_count: 15,
    },
    {
      id: '2',
      name: 'Issue Resolution',
      content: 'Hello {{authorName}},\n\nI\'ve looked into your issue with "{{title}}" and I\'m happy to report that it has been resolved. Please let me know if you have any further questions.\n\nThank you,\n{{agentName}}',
      placeholders: ['authorName', 'title', 'agentName'],
      usage_count: 8,
    },
    {
      id: '3',
      name: 'Request for More Information',
      content: 'Hi {{authorName}},\n\nThank you for your post about "{{title}}". To help us assist you better, could you please provide more details about:\n\n- Specific error messages\n- Steps to reproduce the issue\n- Any relevant screenshots\n\nWe look forward to hearing from you!\n\nBest,\n{{agentName}}',
      placeholders: ['authorName', 'title', 'agentName'],
      usage_count: 12,
    },
    {
      id: '4',
      name: 'Policy Reminder',
      content: 'Hello {{authorName}},\n\nI wanted to gently remind you about our community guidelines regarding "{{title}}". Please ensure your future posts align with our policies to maintain a positive environment for all members.\n\nThank you for your understanding,\n{{agentName}}',
      placeholders: ['authorName', 'title', 'agentName'],
      usage_count: 5,
    },
    {
      id: '5',
      name: 'Escalation Notice',
      content: 'Hi {{authorName}},\n\nRegarding your concern about "{{title}}", I\'ve escalated this to our specialized team for further review. They will reach out to you within 24-48 hours with a detailed response.\n\nThank you for your patience,\n{{agentName}}',
      placeholders: ['authorName', 'title', 'agentName'],
      usage_count: 3,
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    content: '',
  });

  // Filter templates based on search
  const filteredTemplates = templates.filter(
    (template) =>
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateTemplate = () => {
    if (!formData.name.trim() || !formData.content.trim()) return;

    // Extract placeholders from content
    const placeholderRegex = /\{\{(\w+)\}\}/g;
    const placeholders = Array.from(formData.content.matchAll(placeholderRegex)).map(
      (match) => match[1]
    );

    const newTemplate: Template = {
      id: Date.now().toString(),
      name: formData.name,
      content: formData.content,
      placeholders,
      usage_count: 0,
    };

    setTemplates([...templates, newTemplate]);
    setIsCreateModalOpen(false);
    setFormData({ name: '', content: '' });
  };

  const handleEditTemplate = () => {
    if (!selectedTemplate || !formData.name.trim() || !formData.content.trim()) return;

    // Extract placeholders from content
    const placeholderRegex = /\{\{(\w+)\}\}/g;
    const placeholders = Array.from(formData.content.matchAll(placeholderRegex)).map(
      (match) => match[1]
    );

    const updatedTemplates = templates.map((template) =>
      template.id === selectedTemplate.id
        ? { ...template, name: formData.name, content: formData.content, placeholders }
        : template
    );

    setTemplates(updatedTemplates);
    setIsEditModalOpen(false);
    setSelectedTemplate(null);
    setFormData({ name: '', content: '' });
  };

  const handleDeleteTemplate = () => {
    if (!selectedTemplate) return;

    const updatedTemplates = templates.filter((template) => template.id !== selectedTemplate.id);
    setTemplates(updatedTemplates);
    setIsDeleteModalOpen(false);
    setSelectedTemplate(null);
  };

  const openEditModal = (template: Template) => {
    setSelectedTemplate(template);
    setFormData({ name: template.name, content: template.content });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (template: Template) => {
    setSelectedTemplate(template);
    setIsDeleteModalOpen(true);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left Rail */}
      <LeftRail />

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-background overflow-hidden" data-testid="settings-page">
        {/* Header */}
        <div className="border-b border-border p-4 bg-background-secondary">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="p-2 hover:bg-background-tertiary rounded-md transition-colors"
                data-testid="back-to-dashboard"
              >
                <ArrowLeft size={20} className="text-foreground-secondary" />
              </Link>
              <h1 className="text-xl font-semibold text-foreground">Settings</h1>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm rounded-md transition-colors flex items-center gap-2"
              data-testid="create-template-button"
            >
              <Plus size={16} />
              Create Template
            </button>
          </div>

        {/* Search Bar */}
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            data-testid="template-search-input"
          />
        </div>
      </div>

      {/* Template List */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wide">
            Response Templates
          </h2>

          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText size={48} className="mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium">No templates found</p>
              <p className="text-sm">
                {searchTerm ? 'Try a different search term' : 'Create your first template to get started'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="bg-background-secondary rounded-lg border border-border p-4 hover:bg-background-secondary/80 transition-colors group"
                  data-testid={`template-card-${template.id}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-foreground mb-1">
                        {template.name}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{template.usage_count} uses</span>
                        {template.placeholders.length > 0 && (
                          <span>• {template.placeholders.length} placeholders</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditModal(template)}
                        className="p-1.5 hover:bg-background-tertiary rounded-md transition-colors"
                        data-testid={`edit-template-${template.id}`}
                        title="Edit template"
                      >
                        <Edit size={16} className="text-foreground-secondary" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(template)}
                        className="p-1.5 hover:bg-red-500/10 rounded-md transition-colors"
                        data-testid={`delete-template-${template.id}`}
                        title="Delete template"
                      >
                        <Trash2 size={16} className="text-red-400" />
                      </button>
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="bg-background-tertiary rounded-md p-3 border border-border">
                    <p className="text-sm text-foreground-secondary whitespace-pre-wrap line-clamp-3">
                      {template.content}
                    </p>
                  </div>

                  {/* Placeholders */}
                  {template.placeholders.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {template.placeholders.map((placeholder) => (
                        <span
                          key={placeholder}
                          className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-md font-mono"
                        >
                          {'{{'}{placeholder}{'}}'}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Template Modal */}
      {isCreateModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          data-testid="create-template-modal"
        >
          <div className="bg-background-secondary rounded-lg border border-border shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Create Template</h2>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="template-name"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    Template Name
                  </label>
                  <input
                    id="template-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Welcome Message"
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    data-testid="create-template-name-input"
                  />
                </div>

                <div>
                  <label
                    htmlFor="template-content"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    Template Content
                  </label>
                  <textarea
                    id="template-content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Hi {{authorName}},&#10;&#10;Thank you for your post about {{title}}...&#10;&#10;Best regards,&#10;{{agentName}}"
                    rows={10}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                    data-testid="create-template-content-input"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Use <code className="bg-background-tertiary px-1 py-0.5 rounded">{'{{placeholder}}'}</code> syntax for dynamic values. Available placeholders:{' '}
                    <code className="bg-background-tertiary px-1 py-0.5 rounded">{'{{authorName}}'}</code>,{' '}
                    <code className="bg-background-tertiary px-1 py-0.5 rounded">{'{{title}}'}</code>,{' '}
                    <code className="bg-background-tertiary px-1 py-0.5 rounded">{'{{category}}'}</code>,{' '}
                    <code className="bg-background-tertiary px-1 py-0.5 rounded">{'{{agentName}}'}</code>
                  </p>
                </div>

                {/* Preview detected placeholders */}
                {formData.content && (
                  <div className="bg-background-tertiary rounded-md p-3 border border-border">
                    <p className="text-xs font-medium text-foreground mb-2">Detected Placeholders:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {Array.from(formData.content.matchAll(/\{\{(\w+)\}\}/g)).length > 0 ? (
                        Array.from(formData.content.matchAll(/\{\{(\w+)\}\}/g)).map((match, index) => (
                          <span
                            key={index}
                            className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-md font-mono"
                          >
                            {match[0]}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">No placeholders detected</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setFormData({ name: '', content: '' });
                  }}
                  className="px-4 py-2 bg-background-tertiary hover:bg-background-tertiary/80 text-foreground text-sm rounded-md transition-colors border border-border"
                  data-testid="cancel-create-template"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTemplate}
                  disabled={!formData.name.trim() || !formData.content.trim()}
                  className={cn(
                    'px-4 py-2 text-white text-sm rounded-md transition-colors',
                    formData.name.trim() && formData.content.trim()
                      ? 'bg-primary hover:bg-primary/90'
                      : 'bg-primary/50 cursor-not-allowed'
                  )}
                  data-testid="save-create-template"
                >
                  Create Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Template Modal */}
      {isEditModalOpen && selectedTemplate && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          data-testid="edit-template-modal"
        >
          <div className="bg-background-secondary rounded-lg border border-border shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Edit Template</h2>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="edit-template-name"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    Template Name
                  </label>
                  <input
                    id="edit-template-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Welcome Message"
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    data-testid="edit-template-name-input"
                  />
                </div>

                <div>
                  <label
                    htmlFor="edit-template-content"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    Template Content
                  </label>
                  <textarea
                    id="edit-template-content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Hi {{authorName}},&#10;&#10;Thank you for your post about {{title}}...&#10;&#10;Best regards,&#10;{{agentName}}"
                    rows={10}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                    data-testid="edit-template-content-input"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Use <code className="bg-background-tertiary px-1 py-0.5 rounded">{'{{placeholder}}'}</code> syntax for dynamic values. Available placeholders:{' '}
                    <code className="bg-background-tertiary px-1 py-0.5 rounded">{'{{authorName}}'}</code>,{' '}
                    <code className="bg-background-tertiary px-1 py-0.5 rounded">{'{{title}}'}</code>,{' '}
                    <code className="bg-background-tertiary px-1 py-0.5 rounded">{'{{category}}'}</code>,{' '}
                    <code className="bg-background-tertiary px-1 py-0.5 rounded">{'{{agentName}}'}</code>
                  </p>
                </div>

                {/* Preview detected placeholders */}
                {formData.content && (
                  <div className="bg-background-tertiary rounded-md p-3 border border-border">
                    <p className="text-xs font-medium text-foreground mb-2">Detected Placeholders:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {Array.from(formData.content.matchAll(/\{\{(\w+)\}\}/g)).length > 0 ? (
                        Array.from(formData.content.matchAll(/\{\{(\w+)\}\}/g)).map((match, index) => (
                          <span
                            key={index}
                            className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-md font-mono"
                          >
                            {match[0]}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">No placeholders detected</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedTemplate(null);
                    setFormData({ name: '', content: '' });
                  }}
                  className="px-4 py-2 bg-background-tertiary hover:bg-background-tertiary/80 text-foreground text-sm rounded-md transition-colors border border-border"
                  data-testid="cancel-edit-template"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditTemplate}
                  disabled={!formData.name.trim() || !formData.content.trim()}
                  className={cn(
                    'px-4 py-2 text-white text-sm rounded-md transition-colors',
                    formData.name.trim() && formData.content.trim()
                      ? 'bg-primary hover:bg-primary/90'
                      : 'bg-primary/50 cursor-not-allowed'
                  )}
                  data-testid="save-edit-template"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedTemplate && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          data-testid="delete-template-modal"
        >
          <div className="bg-background-secondary rounded-lg border border-border shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-2">Delete Template</h2>
              <p className="text-sm text-foreground-secondary mb-4">
                Are you sure you want to delete the template <strong>{selectedTemplate.name}</strong>
                ? This action cannot be undone.
              </p>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setSelectedTemplate(null);
                  }}
                  className="px-4 py-2 bg-background-tertiary hover:bg-background-tertiary/80 text-foreground text-sm rounded-md transition-colors border border-border"
                  data-testid="cancel-delete-template"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteTemplate}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-md transition-colors"
                  data-testid="confirm-delete-template"
                >
                  Delete Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
