import { useState, useCallback } from 'react';

interface ConnectionStatus {
  isOnline: boolean;
  failureCount: number;
  lastError: string | null;
  recordSuccess: () => void;
  recordFailure: (error?: string) => void;
  reset: () => void;
}

const OFFLINE_THRESHOLD = 3; // Mark as offline after 3 consecutive failures

export function useConnectionStatus(): ConnectionStatus {
  const [failureCount, setFailureCount] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  const recordSuccess = useCallback(() => {
    setFailureCount(0);
    setLastError(null);
    setIsOnline(true);
  }, []);

  const recordFailure = useCallback((error?: string) => {
    setFailureCount((prev) => {
      const newCount = prev + 1;
      if (newCount >= OFFLINE_THRESHOLD) {
        setIsOnline(false);
      }
      return newCount;
    });
    setLastError(error || 'Connection failed');
  }, []);

  const reset = useCallback(() => {
    setFailureCount(0);
    setLastError(null);
    setIsOnline(true);
  }, []);

  return {
    isOnline,
    failureCount,
    lastError,
    recordSuccess,
    recordFailure,
    reset,
  };
}
