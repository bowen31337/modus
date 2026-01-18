'use client';

import type { ToastType } from '@/components/ui/toast';
import { useCallback } from 'react';

// Toast action type
type ToastAction = {
  label: string;
  onClick: () => void;
};

// Toast options
interface ToastOptions {
  title?: string;
  description?: string;
  type?: ToastType;
  duration?: number;
  action?: ToastAction;
}

// This is a minimal toast hook that uses a custom event-based system
// since we're not using a full toast library
let toastIdCounter = 0;

// Event-based toast system
const TOAST_EVENT = 'modus-toast' as const;

interface ToastEventDetail {
  id: string;
  title?: string;
  description?: string;
  type: ToastType;
  duration?: number;
  action?: ToastAction;
}

export function useToast() {
  const toast = useCallback((options: ToastOptions) => {
    const id = `toast-${++toastIdCounter}-${Date.now()}`;
    const detail: ToastEventDetail = {
      id,
      title: options.title,
      description: options.description,
      type: options.type || 'info',
      duration: options.duration || 5000,
      action: options.action,
    };

    const event = new CustomEvent(TOAST_EVENT, { detail });
    window.dispatchEvent(event);

    return id;
  }, []);

  const success = useCallback(
    (title: string, description?: string) => {
      return toast({ title, description, type: 'success' });
    },
    [toast]
  );

  const error = useCallback(
    (title: string, description?: string) => {
      return toast({ title, description, type: 'error' });
    },
    [toast]
  );

  const info = useCallback(
    (title: string, description?: string) => {
      return toast({ title, description, type: 'info' });
    },
    [toast]
  );

  const warning = useCallback(
    (title: string, description?: string) => {
      return toast({ title, description, type: 'warning' });
    },
    [toast]
  );

  return {
    toast,
    success,
    error,
    info,
    warning,
  };
}

// Helper to listen for toast events
export function useToastListener(_onToast: (toast: ToastEventDetail) => void) {
  // This hook is used by the ToastContainer component
  // It listens for custom events and calls the provided callback
}

export { TOAST_EVENT };
export type { ToastEventDetail };
