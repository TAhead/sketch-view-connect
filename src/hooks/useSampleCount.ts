import { useState, useCallback } from 'react';
import { getSampleCount } from '@/services/fastapi';

interface UseSampleCountReturn {
  sampleCount: number | null;
  isLoading: boolean;
  error: string | null;
  fetchSampleCount: () => Promise<void>;
}

export function useSampleCount(): UseSampleCountReturn {
  const [sampleCount, setSampleCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSampleCount = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: apiError } = await getSampleCount();
      
      if (apiError) {
        throw new Error(apiError);
      }
      
      if (data) {
        setSampleCount(data.sample_count);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching sample count:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    sampleCount,
    isLoading,
    error,
    fetchSampleCount,
  };
}
