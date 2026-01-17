'use client';

import { useState, useEffect, useRef } from 'react';
import { FileText, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Template {
  id: string;
  name: string;
  content: string;
  placeholders: string[];
  category_id?: string | null;
  usage_count: number;
}

interface TemplateSelectorProps {
  onSelect: (content: string) => void;
  postContext?: {
    title?: string;
    authorName?: string;
    category?: string;
  };
}

// Mock template data - in production, this would come from an API
const MOCK_TEMPLATES: Template[] = [
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
];

export function TemplateSelector({ onSelect, postContext = {} }: TemplateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>(MOCK_TEMPLATES);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter templates based on search
  useEffect(() => {
    const filtered = MOCK_TEMPLATES.filter(
      (template) =>
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.content.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredTemplates(filtered);
  }, [searchTerm]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Replace placeholders with actual values
  const processTemplate = (template: Template): string => {
    let content = template.content;
    const agentName = 'Agent'; // In production, this would come from auth context

    // Replace placeholders
    const replacements: Record<string, string> = {
      '{{authorName}}': postContext.authorName || 'User',
      '{{title}}': postContext.title || 'your post',
      '{{category}}': postContext.category || 'this category',
      '{{agentName}}': agentName,
    };

    for (const [placeholder, value] of Object.entries(replacements)) {
      content = content.replaceAll(placeholder, value);
    }

    return content;
  };

  const handleTemplateSelect = (template: Template) => {
    const processedContent = processTemplate(template);
    onSelect(processedContent);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'px-3 py-1.5 bg-background-tertiary hover:bg-background-tertiary/80 text-foreground text-sm rounded-md transition-colors border border-border',
          'flex items-center gap-2'
        )}
        data-testid="template-trigger-button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <FileText size={14} />
        Templates
        <ChevronDown size={12} className={cn('transition-transform', isOpen && 'rotate-180')} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute bottom-full mb-2 left-0 w-96 bg-background-secondary border border-border rounded-lg shadow-lg z-50 overflow-hidden"
          role="listbox"
          data-testid="template-dropdown"
        >
          {/* Search Input */}
          <div className="p-2 border-b border-border bg-background-tertiary">
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              data-testid="template-search-input"
              autoFocus
            />
          </div>

          {/* Template List */}
          <div className="max-h-80 overflow-y-auto" data-testid="template-list">
            {filteredTemplates.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No templates found
              </div>
            ) : (
              filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className={cn(
                    'p-3 border-b border-border last:border-0 cursor-pointer hover:bg-background-tertiary transition-colors',
                    'group'
                  )}
                  role="option"
                  data-testid={`template-option-${template.id}`}
                  aria-selected="false"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm text-foreground">{template.name}</span>
                    <span className="text-xs text-muted-foreground">{template.usage_count} uses</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {template.content.substring(0, 100)}...
                  </p>
                  {template.placeholders.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {template.placeholders.map((placeholder) => (
                        <span
                          key={placeholder}
                          className="text-[10px] px-1.5 py-0.5 bg-primary/20 text-primary rounded"
                        >
                          {placeholder}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2 bg-background-tertiary border-t border-border text-xs text-muted-foreground text-center">
            Select a template to insert into your response
          </div>
        </div>
      )}
    </div>
  );
}
