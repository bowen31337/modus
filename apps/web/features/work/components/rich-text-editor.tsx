'use client';

import { useState, useRef } from 'react';
import { Bold, Italic, Link, List, ListOrdered } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export function RichTextEditor({ placeholder = 'Type your response here...', value = '', onChange, className }: RichTextEditorProps) {
  const [isBoldActive, setIsBoldActive] = useState(false);
  const [isItalicActive, setIsItalicActive] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertFormatting = (prefix: string, suffix: string = '', placeholder: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const textBefore = value.substring(0, start);
    const textAfter = value.substring(end);

    let newText: string;
    let newCursorPos: number;

    if (selectedText) {
      // Wrap selected text
      newText = textBefore + prefix + selectedText + suffix + textAfter;
      newCursorPos = start + prefix.length + selectedText.length + suffix.length;
    } else {
      // Insert at cursor with placeholder
      const insertText = placeholder || prefix;
      newText = textBefore + prefix + insertText + suffix + textAfter;
      newCursorPos = start + prefix.length + insertText.length;
    }

    onChange?.(newText);

    // Restore cursor position after state update
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleBold = () => {
    insertFormatting('**', '**', 'bold text');
    setIsBoldActive(true);
    setTimeout(() => setIsBoldActive(false), 200);
  };

  const handleItalic = () => {
    insertFormatting('*', '*', 'italic text');
    setIsItalicActive(true);
    setTimeout(() => setIsItalicActive(false), 200);
  };

  const handleLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      insertFormatting('[', `](${url})`, 'link text');
    }
  };

  const handleBulletedList = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const lines = value.substring(start, end).split('\n');
    const formatted = lines.map(line => line ? `- ${line}` : '- ').join('\n');

    const textBefore = value.substring(0, start);
    const textAfter = value.substring(end);
    const newText = textBefore + formatted + textAfter;

    onChange?.(newText);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(start, start + formatted.length);
      }
    }, 0);
  };

  const handleNumberedList = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const lines = value.substring(start, end).split('\n');
    const formatted = lines.map((line, i) => line ? `${i + 1}. ${line}` : `${i + 1}. `).join('\n');

    const textBefore = value.substring(0, start);
    const textAfter = value.substring(end);
    const newText = textBefore + formatted + textAfter;

    onChange?.(newText);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(start, start + formatted.length);
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Tab key handling for accessibility
    if (e.key === 'Tab') {
      e.preventDefault();
      insertFormatting('  ', '', '');
    }
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {/* Formatting Toolbar */}
      <div className="flex items-center gap-1 p-1 bg-background-tertiary rounded-md border border-border">
        <button
          type="button"
          onClick={handleBold}
          className={cn(
            'p-1.5 rounded hover:bg-background-secondary transition-colors',
            'text-foreground-secondary hover:text-foreground',
            isBoldActive && 'bg-background-secondary text-foreground'
          )}
          title="Bold (Ctrl+B)"
          data-testid="format-bold-button"
        >
          <Bold size={16} />
        </button>
        <button
          type="button"
          onClick={handleItalic}
          className={cn(
            'p-1.5 rounded hover:bg-background-secondary transition-colors',
            'text-foreground-secondary hover:text-foreground',
            isItalicActive && 'bg-background-secondary text-foreground'
          )}
          title="Italic (Ctrl+I)"
          data-testid="format-italic-button"
        >
          <Italic size={16} />
        </button>
        <div className="w-px h-6 bg-border mx-1" />
        <button
          type="button"
          onClick={handleLink}
          className="p-1.5 rounded hover:bg-background-secondary transition-colors text-foreground-secondary hover:text-foreground"
          title="Insert Link"
          data-testid="format-link-button"
        >
          <Link size={16} />
        </button>
        <div className="w-px h-6 bg-border mx-1" />
        <button
          type="button"
          onClick={handleBulletedList}
          className="p-1.5 rounded hover:bg-background-secondary transition-colors text-foreground-secondary hover:text-foreground"
          title="Bulleted List"
          data-testid="format-bulleted-list-button"
        >
          <List size={16} />
        </button>
        <button
          type="button"
          onClick={handleNumberedList}
          className="p-1.5 rounded hover:bg-background-secondary transition-colors text-foreground-secondary hover:text-foreground"
          title="Numbered List"
          data-testid="format-numbered-list-button"
        >
          <ListOrdered size={16} />
        </button>
      </div>

      {/* Text Area */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onKeyDown={handleKeyDown}
        className={cn(
          'w-full min-h-32 bg-background border border-border rounded-md p-3 text-foreground text-sm',
          'focus:outline-none focus:ring-2 focus:ring-primary resize-y',
          'font-mono leading-relaxed'
        )}
        placeholder={placeholder}
        data-testid="response-textarea"
      />

      {/* Help Text */}
      <div className="text-xs text-muted-foreground">
        <span className="font-medium">Tip:</span> Use the toolbar above for formatting, or use keyboard shortcuts (Ctrl+B for bold, Ctrl+I for italic)
      </div>
    </div>
  );
}
