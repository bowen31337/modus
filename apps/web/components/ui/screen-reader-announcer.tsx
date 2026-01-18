'use client';

import { useEffect, useState } from 'react';

/**
 * A hidden component that announces messages to screen readers.
 * Uses aria-live regions to announce dynamic content changes.
 */
export function ScreenReaderAnnouncer() {
  return (
    <>
      {/* Polite announcements for non-urgent updates (e.g., real-time sync) */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        data-testid="screen-reader-polite"
      />
      {/* Assertive announcements for urgent updates (e.g., errors) */}
      <div
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
        data-testid="screen-reader-assertive"
      />
    </>
  );
}

// Event-based announcement system
const ANNOUNCE_EVENT = 'modus-announce' as const;

interface AnnounceEventDetail {
  message: string;
  priority?: 'polite' | 'assertive';
}

/**
 * Hook to announce messages to screen readers.
 * @returns A function to announce messages
 */
export function useAnnouncer() {
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const event = new CustomEvent<AnnounceEventDetail>(ANNOUNCE_EVENT, {
      detail: { message, priority },
    });
    window.dispatchEvent(event);
  };

  return { announce };
}

/**
 * Component that listens for announcement events and updates aria-live regions.
 * This should be rendered in the root layout alongside ScreenReaderAnnouncer.
 */
export function AnnouncerListener() {
  const [politeMessage, setPoliteMessage] = useState('');
  const [assertiveMessage, setAssertiveMessage] = useState('');

  useEffect(() => {
    const handleAnnounce = (event: CustomEvent<AnnounceEventDetail>) => {
      const { message, priority } = event.detail;
      if (priority === 'assertive') {
        // Use a timeout to ensure screen readers pick up the change
        setTimeout(() => setAssertiveMessage(''), 100);
        setAssertiveMessage(message);
      } else {
        setTimeout(() => setPoliteMessage(''), 100);
        setPoliteMessage(message);
      }
    };

    window.addEventListener(ANNOUNCE_EVENT, handleAnnounce as EventListener);
    return () => {
      window.removeEventListener(ANNOUNCE_EVENT, handleAnnounce as EventListener);
    };
  }, []);

  return (
    <>
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        data-testid="screen-reader-polite"
      >
        {politeMessage}
      </div>
      <div
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
        data-testid="screen-reader-assertive"
      >
        {assertiveMessage}
      </div>
    </>
  );
}

export { ANNOUNCE_EVENT };
export type { AnnounceEventDetail };
