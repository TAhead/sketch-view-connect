import { useState, useCallback } from 'react';
import { getErrorInfo } from '@/services/fastapi';

interface UseErrorInfoReturn {
  errorCode: number | string | null;
  errorMessage: string | null;
  isLoading: boolean;
  error: string | null;
  fetchErrorInfo: () => Promise<void>;
}

export function useErrorInfo(): UseErrorInfoReturn {
  const [errorCode, setErrorCode] = useState<number | string | null>(null);
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
        // Handle new format: ErrorCode(level=0, description='...')
        if (typeof data.error_code === 'string' && data.error_code.includes('ErrorCode(')) {
          const descMatch = data.error_code.match(/description=['"]([^'"]+)['"]/);
          if (descMatch && descMatch[1]) {
            setErrorCode(data.error_code);
            setErrorMessage(descMatch[1]);
          }
        } else {
          setErrorCode(data.error_code);
          setErrorMessage(data.error_message || null);
        }
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
