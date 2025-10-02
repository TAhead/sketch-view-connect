import { useState, useCallback } from 'react';
import { getErrorInfo } from '@/services/fastapi';

interface UseErrorInfoReturn {
  errorCode: number | null;
  errorMessage: string | null;
  isLoading: boolean;
  error: string | null;
  fetchErrorInfo: () => Promise<void>;
}

export function useErrorInfo(): UseErrorInfoReturn {
  const [errorCode, setErrorCode] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchErrorInfo = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: apiError } = await getErrorInfo();
      
      if (apiError) {
        throw new Error(apiError);
      }
      
      if (data) {
        setErrorCode(data.error_code);
        setErrorMessage(data.error_message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching error info:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    errorCode,
    errorMessage,
    isLoading,
    error,
    fetchErrorInfo,
  };
}
