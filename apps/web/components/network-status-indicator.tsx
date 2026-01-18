'use client';

import { cn } from '@/lib/utils';
import { AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';

export type NetworkStatus = 'online' | 'offline' | 'reconnecting';

interface NetworkStatusIndicatorProps {
  showLabel?: boolean;
  className?: string;
}

/**
 * NetworkStatusIndicator - Displays the current network connection status
 *
 * Features:
 * - Detects online/offline status using navigator.onLine
 * - Shows reconnecting state when connection is restored
 * - Displays toast notification when connection changes
 * - Respects prefers-reduced-motion for animations
 */
export function NetworkStatusIndicator({
  showLabel = true,
  className,
}: NetworkStatusIndicatorProps) {
  const [status, setStatus] = useState<NetworkStatus>('online');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const handleOnline = () => {
      // Show "reconnecting" briefly before going back to online
      setStatus('reconnecting');
      setToastMessage('Reconnecting to network...');
      setShowToast(true);

      // After a brief delay, confirm we're back online
      setTimeout(() => {
        setStatus('online');
        setToastMessage('Connection restored');
        setShowToast(true);

        // Hide toast after 3 seconds
        setTimeout(() => setShowToast(false), 3000);
      }, 1000);
    };

    const handleOffline = () => {
      setStatus('offline');
      setToastMessage('You are offline. Some features may be limited.');
      setShowToast(true);
    };

    // Check initial state
    if (typeof window !== 'undefined') {
      if (!navigator.onLine) {
        setStatus('offline');
        setToastMessage('You are offline. Some features may be limited.');
        setShowToast(true);
      }
    }

    // Listen for network status changes
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isMounted]);

  if (!isMounted) {
    return null;
  }

  const statusConfig = {
    online: {
      icon: <Wifi size={16} />,
      label: 'Online',
      bgColor: 'bg-emerald-500',
      textColor: 'text-emerald-400',
      borderColor: 'border-emerald-500/30',
    },
    offline: {
      icon: <WifiOff size={16} />,
      label: 'Offline',
      bgColor: 'bg-red-500',
      textColor: 'text-red-400',
      borderColor: 'border-red-500/30',
    },
    reconnecting: {
      icon: <AlertCircle size={16} />,
      label: 'Reconnecting',
      bgColor: 'bg-yellow-500',
      textColor: 'text-yellow-400',
      borderColor: 'border-yellow-500/30',
    },
  };

  const config = statusConfig[status];

  return (
    <>
      {/* Status Indicator */}
      <div
        className={cn(
          'flex items-center gap-2 px-2 py-1 rounded-md border',
          config.bgColor,
          config.borderColor,
          className
        )}
        data-testid="network-status-indicator"
        data-network-status={status}
      >
        {config.icon}
        {showLabel && (
          <span className={cn('text-xs font-medium', config.textColor)}>{config.label}</span>
        )}
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div
          className={cn(
            'fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg border',
            status === 'offline'
              ? 'bg-red-600 border-red-400 text-white'
              : status === 'reconnecting'
                ? 'bg-yellow-600 border-yellow-400 text-white'
                : 'bg-emerald-600 border-emerald-400 text-white'
          )}
          role="alert"
          aria-live="polite"
          data-testid="network-toast"
        >
          {status === 'offline' && <WifiOff size={18} />}
          {status === 'reconnecting' && <AlertCircle size={18} />}
          {status === 'online' && <Wifi size={18} />}
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}
    </>
  );
}
