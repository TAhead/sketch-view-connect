import { useState } from "react";
import {
  getSampleCount,
  getRackSampleCount,
  getRackIds,
  getSampleInfo,
  getErrorInfo,
  getBackButtonState,
  getToolCalibrationState,
  getContainerCalibrationState,
} from "@/services/fastapi";
import { useToast } from "@/hooks/use-toast";

interface UseDataRetrievalReturn {
  isLoading: boolean;
  fetchSampleCount: () => Promise<number | null>;
  fetchRackSampleCount: () => Promise<number | null>;
  fetchRackIds: () => Promise<Record<string, number> | null>;
  fetchSampleInfo: () => Promise<any | null>;
  fetchProcessedRacks: () => Promise<any | null>;
  fetchErrorInfo: () => Promise<{ error_code: number; error_message: string } | null>;
  fetchBackButtonState: () => Promise<boolean | null>;
  fetchToolCalibrationState: () => Promise<boolean | null>;
  fetchContainerCalibrationState: () => Promise<boolean | null>;
  fetchTreeState: () => Promise<boolean | null>;
}

export function useDataRetrieval(): UseDataRetrievalReturn {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchSampleCount = async () => {
    setIsLoading(true);
    try {
      const response = await getSampleCount();

      if (response.error) {
        toast({
          title: "Error",
          description: response.error,
          variant: "destructive",
        });
        return null;
      }

      return response.data?.sample_count ?? null;
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to fetch sample count",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRackSampleCount = async () => {
    setIsLoading(true);
    try {
      const response = await getRackSampleCount();

      if (response.error) {
        toast({
          title: "Error",
          description: response.error,
          variant: "destructive",
        });
        return null;
      }

      return response.data?.sample_count_for_rack ?? null;
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to fetch rack sample count",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRackIds = async () => {
    setIsLoading(true);
    try {
      const response = await getRackIds();

      if (response.error) {
        toast({
          title: "Error",
          description: response.error,
          variant: "destructive",
        });
        return null;
      }

      return response.data?.rack_ids ?? null;
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to fetch rack IDs",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSampleInfo = async () => {
    setIsLoading(true);
    try {
      const response = await getSampleInfo();

      if (response.error) {
        toast({
          title: "Error",
          description: response.error,
          variant: "destructive",
        });
        return null;
      }

      return response.data ?? null;
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to fetch sample info",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchErrorInfo = async () => {
    setIsLoading(true);
    try {
      const response = await getErrorInfo();

      if (response.error) {
        toast({
          title: "Error",
          description: response.error,
          variant: "destructive",
        });
        return null;
      }

      return response.data ?? null;
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to fetch error info",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBackButtonState = async () => {
    setIsLoading(true);
    try {
      const response = await getBackButtonState();

      if (response.error) {
        toast({
          title: "Error",
          description: response.error,
          variant: "destructive",
        });
        return null;
      }

      return response.data?.enabled ?? null;
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to fetch back button state",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchToolCalibrationState = async () => {
    setIsLoading(true);
    try {
      const response = await getToolCalibrationState();

      if (response.error) {
        toast({
          title: "Error",
          description: response.error,
          variant: "destructive",
        });
        return null;
      }

      return response.data?.enabled ?? null;
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to fetch tool calibration state",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchContainerCalibrationState = async () => {
    setIsLoading(true);
    try {
      const response = await getContainerCalibrationState();

      if (response.error) {
        toast({
          title: "Error",
          description: response.error,
          variant: "destructive",
        });
        return null;
      }

      return response.data?.enabled ?? null;
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to fetch container calibration state",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    fetchSampleCount,
    fetchRackSampleCount,
    fetchRackIds,
    fetchSampleInfo,
    fetchProcessedRacks,
    fetchErrorInfo,
    fetchBackButtonState,
    fetchToolCalibrationState,
    fetchContainerCalibrationState,
  };
}
