'use client';

import { cn } from '@modus/ui';
import { useEffect, useRef, useState } from 'react';

interface ResizablePanelGroupProps {
  children: React.ReactNode;
  className?: string;
  direction?: 'horizontal' | 'vertical';
  style?: React.CSSProperties;
}

interface ResizablePanelProps {
  children: React.ReactNode;
  className?: string;
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
  size?: number; // External size control
  style?: React.CSSProperties;
}

interface ResizableHandleProps {
  className?: string;
  direction?: 'horizontal' | 'vertical';
  onDrag: (delta: number) => void;
  panelId?: string;
}

export function ResizablePanelGroup({
  children,
  className,
  direction = 'horizontal',
  style,
}: ResizablePanelGroupProps) {
  return (
    <div
      className={cn('flex h-full w-full', direction === 'vertical' && 'flex-col', className)}
      style={style}
    >
      {children}
    </div>
  );
}

export function ResizablePanel({
  children,
  className,
  defaultSize = 50,
  size: externalSize,
  style,
}: ResizablePanelProps) {
  const [internalSize] = useState(defaultSize);
  const size = externalSize !== undefined ? externalSize : internalSize;
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (panelRef.current) {
      panelRef.current.style.flex = `0 0 ${size}%`;
    }
  }, [size]);

  return (
    <div
      ref={panelRef}
      className={cn('overflow-hidden', className)}
      style={style}
      data-panel-size={size}
    >
      {children}
    </div>
  );
}

export function ResizableHandle({
  className,
  direction = 'horizontal',
  onDrag,
}: ResizableHandleProps) {
  const handleRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const startPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handle = handleRef.current;
    if (!handle) return;

    const onMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      startPos.current = { x: e.clientX, y: e.clientY };
      document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';
    };

    handle.addEventListener('mousedown', onMouseDown);

    return () => {
      handle.removeEventListener('mousedown', onMouseDown);
    };
  }, [direction]);

  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startPos.current.x;
      const deltaY = e.clientY - startPos.current.y;

      if (direction === 'horizontal') {
        onDrag(deltaX);
      } else {
        onDrag(deltaY);
      }

      // Update start position to keep delta relative to previous position
      // This prevents jumping when the resize handle moves quickly
      startPos.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging, direction, onDrag]);

  return (
    <div
      ref={handleRef}
      className={cn(
        'relative flex-shrink-0 bg-border hover:bg-primary/50 transition-colors',
        'before:absolute before:inset-0 before:z-10',
        direction === 'horizontal' ? 'w-1 cursor-col-resize' : 'h-1 cursor-row-resize',
        isDragging && 'bg-primary',
        className
      )}
      aria-label="Drag to resize"
      role="separator"
      tabIndex={0}
    />
  );
}
