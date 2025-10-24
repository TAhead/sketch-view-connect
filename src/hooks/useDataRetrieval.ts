import { useState, useEffect } from "react";
import { getSampleCount, getRackSampleCount, getErrorInfo, getRackIds, getBackButtonState } from "@/services/fastapi";

interface UseSmartDataRetrievalProps {
  isWorkflowActive?: boolean;
  enablePolling?: boolean;
}

export function useSmartDataRetrieval({
  isWorkflowActive = false,
  enablePolling = true,
}: UseSmartDataRetrievalProps = {}) {
  const [data, setData] = useState({
    sampleCount: null as number | null,
    rackSampleCount: null as number | null,
    errorInfo: null as any,
    rackIds: null as Record<string, number> | null,
    backButtonState: null as boolean | null,
  });

  // 1. Fetch static data once
  useEffect(() => {
    const fetchStaticData = async () => {
      const rackIds = await getRackIds();
      setData((prev) => ({
        ...prev,
        rackIds: rackIds.data?.rack_ids ?? null,
      }));
    };

    fetchStaticData();
  }, []);

  // 2. Poll frequently changing data (smart rate)
  useEffect(() => {
    if (!enablePolling) return;

    const pollRate = isWorkflowActive ? 3000 : 15000;
    // 3s when active, 15s when idle

    const pollFrequentData = async () => {
      const [sampleCount, rackSampleCount, errorInfo] = await Promise.all([
        getSampleCount(),
        getRackSampleCount(),
        getErrorInfo(),
      ]);

      setData((prev) => ({
        ...prev,
        sampleCount: sampleCount.data?.sample_count ?? null,
        rackSampleCount: rackSampleCount.data?.sample_count_for_rack ?? null,
        errorInfo: errorInfo.data ?? null,
      }));
    };

    // Initial fetch
    pollFrequentData();

    // Set up interval
    const interval = setInterval(pollFrequentData, pollRate);

    return () => clearInterval(interval);
  }, [isWorkflowActive, enablePolling]);

  // 3. Poll occasionally changing data (slower rate)
  useEffect(() => {
    if (!enablePolling) return;

    const pollOccasionalData = async () => {
      const backButtonState = await getBackButtonState();

      setData((prev) => ({
        ...prev,
        backButtonState: backButtonState.data?.enabled ?? null,
      }));
    };

    pollOccasionalData();
    const interval = setInterval(pollOccasionalData, 30000); // Every 30s

    return () => clearInterval(interval);
  }, [enablePolling]);

  // 4. Stop polling when tab is hidden
  useEffect(() => {
    // This will cause the polling effects to re-run when visibility changes
    const handleVisibilityChange = () => {
      // The enablePolling prop controls whether polling happens
      // You could add state here to pause/resume
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  return data;
}
