import { useState, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";

interface UseSampleCountReturn {
  counterResult: any;
  isLoading: boolean;
  error: string | null;
  increaseCounter: () => Promise<void>;
}

export function useSampleCount(): UseSampleCountReturn {
  const [counterResult, setCounterResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const increaseCounter = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: functionError } = await supabase.functions.invoke('fetch-sample-count');
      
      if (functionError) {
        throw new Error(functionError.message || 'Failed to increase counter');
      }
      
      setCounterResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error increasing counter:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    counterResult,
    isLoading,
    error,
    increaseCounter,
  };
}
