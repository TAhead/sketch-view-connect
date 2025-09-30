import { useState, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";

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
      const { data, error: functionError } = await supabase.functions.invoke('fetch-sample-count');
      
      if (functionError) {
        throw new Error(functionError.message || 'Failed to fetch sample count');
      }
      
      setSampleCount(data?.sampleCount ?? null);
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
