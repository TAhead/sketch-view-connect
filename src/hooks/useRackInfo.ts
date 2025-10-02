import { useState, useCallback } from 'react';
import { getRackInfo } from '@/services/fastapi';

interface UseRackInfoReturn {
  rackPosition: string | null;
  rackId: string | null;
  isLoading: boolean;
  error: string | null;
  fetchRackInfo: () => Promise<void>;
}

export function useRackInfo(): UseRackInfoReturn {
  const [rackPosition, setRackPosition] = useState<string | null>(null);
  const [rackId, setRackId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRackInfo = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: apiError } = await getRackInfo();
      
      if (apiError) {
        throw new Error(apiError);
      }
      
      if (data) {
        setRackPosition(data.current_empty_rack_position);
        setRackId(data.rack_id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching rack info:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    rackPosition,
    rackId,
    isLoading,
    error,
    fetchRackInfo,
  };
}
