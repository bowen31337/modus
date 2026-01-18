'use client';

import { useCallback, useEffect, useState } from 'react';

interface CsrfTokenResponse {
  data: {
    token: string;
    headerName: string;
  };
}

/**
 * Hook to fetch and manage CSRF tokens for state-changing API requests.
 *
 * Usage:
 * ```ts
 * const { getCsrfToken } = useCsrf();
 *
 * const response = await fetch('/api/v1/categories', {
 *   method: 'POST',
 *   headers: {
 *     'Content-Type': 'application/json',
 *     'x-csrf-token': await getCsrfToken(),
 *   },
 *   body: JSON.stringify(data),
 * });
 * ```
 */
export function useCsrf() {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch CSRF token on mount
  useEffect(() => {
    fetchToken();
  }, []);

  const fetchToken = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/v1/auth/csrf');
      if (response.ok) {
        const data: CsrfTokenResponse = await response.json();
        setToken(data.data.token);
      }
    } catch (error) {
      console.error('Failed to fetch CSRF token:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getCsrfToken = useCallback(async (): Promise<string> => {
    // Return existing token if available
    if (token) {
      return token;
    }

    // Fetch new token if not available
    await fetchToken();

    // Return the token after fetching
    // Note: This is a simplified approach. In production, you might want to
    // implement a more robust solution with retries or error handling.
    return token || '';
  }, [token, fetchToken]);

  return {
    getCsrfToken,
    token,
    isLoading,
  };
}
