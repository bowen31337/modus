'use client';

import { KeyboardShortcut } from '@/components/ui/keyboard-shortcut';
import { cn } from '@/lib/utils';
import { Bold, Italic, Link, List, ListOrdered } from 'lucide-react';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';

interface RichTextEditorProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  ghostText?: string; // AI suggestion ghost text
  onAcceptGhostText?: () => void; // Callback when Tab is pressed to accept ghost text
  onDismissGhostText?: () => void; // Callback when ghost text should be dismissed
}

export interface RichTextEditorRef {
  focus: () => void;
}

export const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(
  (
    {
      placeholder = 'Type your response here...',
      value = '',
      onChange,
      className,
      ghostText,
      onAcceptGhostText,
      onDismissGhostText,
    },
    ref
  ) => {
    const [isBoldActive, setIsBoldActive] = useState(false);
    const [isItalicActive, setIsItalicActive] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Expose focus method to parent component
    useImperativeHandle(ref, () => ({
      focus: () => {
        textareaRef.current?.focus();
      },
    }));

    const insertFormatting = (prefix: string, suffix = '', placeholder = '') => {
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
      const formatted = lines.map((line) => (line ? `- ${line}` : '- ')).join('\n');

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
      const formatted = lines
        .map((line, i) => (line ? `${i + 1}. ${line}` : `${i + 1}. `))
        .join('\n');

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
      // Tab key handling - accept ghost text if present, otherwise insert spaces
      if (e.key === 'Tab') {
        e.preventDefault();

        // If ghost text is present, accept it
        if (ghostText && onAcceptGhostText) {
          onAcceptGhostText();
          return;
        }

        // Otherwise, insert spaces for indentation
        insertFormatting('  ', '', '');
      }

      // Escape key dismisses ghost text
      if (e.key === 'Escape' && ghostText && onDismissGhostText) {
        e.preventDefault();
        e.stopPropagation();
        onDismissGhostText();
      }

      // Any key press other than Tab dismisses ghost text (user starts typing)
      if (
        ghostText &&
        onDismissGhostText &&
        !e.ctrlKey &&
        !e.metaKey &&
        e.key.length === 1 &&
        !e.altKey
      ) {
        onDismissGhostText();
      }
    };

    return (
      <div className={cn('flex flex-col gap-3', className)}>
        {/* Formatting Toolbar - Minimal, borderless design */}
        <div className="flex items-center gap-0.5 px-1 py-0.5">
          <button
            type="button"
            onClick={handleBold}
            className={cn(
              'p-1.5 rounded-md transition-all duration-150',
              'text-foreground-secondary hover:text-foreground hover:bg-background-tertiary active:scale-95',
              isBoldActive && 'bg-background-tertiary text-foreground'
            )}
            title="Bold (Ctrl+B)"
            data-testid="format-bold-button"
          >
            <Bold size={15} />
          </button>
          <button
            type="button"
            onClick={handleItalic}
            className={cn(
              'p-1.5 rounded-md transition-all duration-150',
              'text-foreground-secondary hover:text-foreground hover:bg-background-tertiary active:scale-95',
              isItalicActive && 'bg-background-tertiary text-foreground'
            )}
            title="Italic (Ctrl+I)"
            data-testid="format-italic-button"
          >
            <Italic size={15} />
          </button>
          <div className="w-px h-5 bg-border mx-1.5" />
          <button
            type="button"
            onClick={handleLink}
            className="p-1.5 rounded-md transition-all duration-150 text-foreground-secondary hover:text-foreground hover:bg-background-tertiary active:scale-95"
            title="Insert Link"
            data-testid="format-link-button"
          >
            <Link size={15} />
          </button>
          <div className="w-px h-5 bg-border mx-1.5" />
          <button
            type="button"
            onClick={handleBulletedList}
            className="p-1.5 rounded-md transition-all duration-150 text-foreground-secondary hover:text-foreground hover:bg-background-tertiary active:scale-95"
            title="Bulleted List"
            data-testid="format-bulleted-list-button"
          >
            <List size={15} />
          </button>
          <button
            type="button"
            onClick={handleNumberedList}
            className="p-1.5 rounded-md transition-all duration-150 text-foreground-secondary hover:text-foreground hover:bg-background-tertiary active:scale-95"
            title="Numbered List"
            data-testid="format-numbered-list-button"
          >
            <ListOrdered size={15} />
          </button>
        </div>

        {/* Text Area with Ghost Text */}
        <div ref={containerRef} className="relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            onKeyDown={handleKeyDown}
            className={cn(
              'w-full min-h-32 bg-background-tertiary/50 border border-border/60 rounded-lg p-3 text-foreground text-sm',
              'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 resize-y',
              'font-sans leading-relaxed placeholder:text-muted-foreground/60',
              'transition-all duration-150',
              ghostText && 'border-primary/40 ring-1 ring-primary/20'
            )}
            placeholder={placeholder}
            data-testid="response-textarea"
          />

          {/* Ghost Text Overlay */}
          {ghostText && (
            <div
              className={cn(
                'absolute top-0 left-0 w-full h-full p-3 text-sm font-sans leading-relaxed pointer-events-none overflow-hidden',
                'text-muted-foreground/40 bg-transparent whitespace-pre-wrap break-words'
              )}
              data-testid="ghost-text-overlay"
              style={{
                marginTop: '0',
                marginLeft: '0',
                paddingTop: '0.75rem',
                paddingLeft: '0.75rem',
              }}
            >
              {value}
              <span className="text-primary/50 font-medium">{ghostText}</span>
            </div>
          )}
        </div>

        {/* Help Text */}
        <div className="text-xs text-muted-foreground flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="font-medium">Tips:</span>
            {ghostText ? (
              <>
                Press <KeyboardShortcut keys={['Tab']} variant="subtle" /> to accept,{' '}
                <KeyboardShortcut keys={['Esc']} variant="subtle" /> to dismiss
              </>
            ) : (
              <>
                <KeyboardShortcut keys={['Ctrl', 'B']} variant="subtle" /> Bold,{' '}
                <KeyboardShortcut keys={['Ctrl', 'I']} variant="subtle" /> Italic
              </>
            )}
          </span>
        </div>
      </div>
    );
  }
);

RichTextEditor.displayName = 'RichTextEditor';
