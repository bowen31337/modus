'use client';

import { useState, useEffect, useCallback } from 'react';
import { Toast } from './toast';
import { TOAST_EVENT, type ToastEventDetail } from '@/hooks/use-toast';

interface ToastState {
  id: string;
  title?: string;
  description?: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

/**
 * ToastContainer component that listens for toast events and renders toasts.
 * This should be rendered inside a ToastProvider (which is provided by the root layout).
 */
export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastState[]>([]);

  // Listen for toast events
  useEffect(() => {
    const handleToast = (event: CustomEvent<ToastEventDetail>) => {
      const toast = event.detail;
      setToasts((prev) => [...prev, toast]);

      // Auto-dismiss after duration
      if (toast.duration) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== toast.id));
        }, toast.duration);
      }
    };

    window.addEventListener(TOAST_EVENT, handleToast as EventListener);
    return () => {
      window.removeEventListener(TOAST_EVENT, handleToast as EventListener);
    };
  }, []);

  const handleDismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          title={toast.title}
          description={toast.description}
          type={toast.type}
          onDismiss={handleDismiss}
        />
      ))}
    </>
  );
}
