import { useState, useEffect, useCallback } from "react";
import { useConnectionStatus } from "./useConnectionStatus";
import {
  getSampleCount,
  getRackSampleCount,
  getErrorInfo,
  getRackIds,
  getBackButtonState,
  getTreeState,
  getToolCalibrationState,
  getContainerCalibrationState,
  getWorkflowState,
  getSampleType,
} from "@/services/fastapi";

interface DataState {
  sampleCount: number | null;
  rackSampleCount: number | null;
  errorInfo: { error_code: number; error_message: string } | null;
  rackIds: {
    position_1?: string;
    position_2?: string;
    position_3?: string;
    position_4?: string;
  } | null;
  backButtonState: boolean | null;
  toolCalibrationState: boolean | null;
  containerCalibrationState: boolean | null;
  sampleType: "urine" | "eswab" | null;
  connectionError: string | null;
  isOffline: boolean;
  treeState: boolean | null;
  workflowState: boolean | null;
}

export function useSmartDataRetrieval() {
  const { isOnline, failureCount, recordSuccess, recordFailure, reset } = useConnectionStatus();
  
  const [data, setData] = useState<DataState>({
    sampleCount: null,
    rackSampleCount: null,
    errorInfo: null,
    rackIds: null,
    backButtonState: null,
    toolCalibrationState: null,
    containerCalibrationState: null,
    sampleType: null,
    connectionError: null,
    isOffline: false,
    treeState: null,
    workflowState: null,
  });

  // Calculate polling interval based on failure count (exponential backoff)
  const getPollingInterval = useCallback(() => {
    if (failureCount === 0) return 5000; // 5s - normal
    if (failureCount < 3) return 10000; // 10s - 1-2 failures
    if (failureCount < 5) return 30000; // 30s - 3-4 failures
    if (failureCount < 10) return 60000; // 60s - 5-9 failures
    return null; // Stop polling after 10 failures
  }, [failureCount]);

  // Helper to handle API responses
  const handleApiResponse = useCallback((response: any, field: keyof DataState, transform?: (data: any) => any) => {
    if (response.error) {
      if (response.isConnectionError) {
        recordFailure(response.error);
        setData(prev => ({
          ...prev,
          connectionError: response.error,
          isOffline: !isOnline,
        }));
      }
      return null;
    }
    recordSuccess();
    setData(prev => ({
      ...prev,
      connectionError: null,
      isOffline: false,
    }));
    return transform ? transform(response.data) : response.data;
  }, [isOnline, recordSuccess, recordFailure]);

  // Fetch all endpoints once on initial mount
  useEffect(() => {
    const fetchInitialState = async () => {
      const [
        sampleCountRes,
        rackSampleCountRes,
        errorInfoRes,
        rackIdsRes,
        backButtonRes,
        toolCalRes,
        containerCalRes,
        sampleTypeRes,
        treeStateRes,
        workflowStateRes,
      ] = await Promise.all([
        getSampleCount(),
        getRackSampleCount(),
        getErrorInfo(),
        getRackIds(),
        getBackButtonState(),
        getToolCalibrationState(),
        getContainerCalibrationState(),
        getSampleType(),
        getTreeState(),
        getWorkflowState(),
      ]);

      // Process responses with connection tracking
      const sampleCount = handleApiResponse(sampleCountRes, 'sampleCount', d => d?.sample_count ?? null);
      const rackSampleCount = handleApiResponse(rackSampleCountRes, 'rackSampleCount', d => d?.sample_count_for_rack ?? null);
      const errorInfo = handleApiResponse(errorInfoRes, 'errorInfo');
      const rackIds = handleApiResponse(rackIdsRes, 'rackIds', d => d?.rack_ids ?? null);
      const backButtonState = handleApiResponse(backButtonRes, 'backButtonState', d => d?.back_button_state ?? null);
      const toolCalibrationState = handleApiResponse(toolCalRes, 'toolCalibrationState', d => d?.tool_calibrated ?? null);
      const containerCalibrationState = handleApiResponse(containerCalRes, 'containerCalibrationState', d => d?.container_calibrated ?? null);
      const sampleType = handleApiResponse(sampleTypeRes, 'sampleType', d => d?.sample_type as "urine" | "eswab" ?? null);
      const treeState = handleApiResponse(treeStateRes, 'treeState', d => d?.tree_state ?? null);
      const workflowState = handleApiResponse(workflowStateRes, 'workflowState', d => d?.workflow_state ?? null);

      setData(prev => ({
        ...prev,
        sampleCount,
        rackSampleCount,
        errorInfo,
        rackIds,
        backButtonState,
        toolCalibrationState,
        containerCalibrationState,
        sampleType,
        treeState,
        workflowState,
      }));
    };

    fetchInitialState();
  }, [handleApiResponse]);

  // Poll tree_state and workflow_state every 2 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      const [treeStateRes, workflowStateRes] = await Promise.all([
        getTreeState(),
        getWorkflowState(),
      ]);

      const treeState = handleApiResponse(treeStateRes, 'treeState', d => d?.tree_state ?? null);
      const workflowState = handleApiResponse(workflowStateRes, 'workflowState', d => d?.workflow_state ?? null);

      setData(prev => ({
        ...prev,
        treeState,
        workflowState,
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, [handleApiResponse]);

  // Condition 1: If tree_state == true AND workflow == false: poll error_info (exponential backoff)
  useEffect(() => {
    if (!data.treeState || data.workflowState) return;
    
    const pollingInterval = getPollingInterval();
    if (!pollingInterval) return; // Stop polling after too many failures

    const interval = setInterval(async () => {
      if (!isOnline && failureCount >= 10) return; // Circuit breaker - stop polling

      const response = await getErrorInfo();
      const errorInfo = handleApiResponse(response, 'errorInfo');
      if (errorInfo !== null) {
        setData((prev) => ({ ...prev, errorInfo }));
      }
    }, pollingInterval);

    return () => clearInterval(interval);
  }, [data.treeState, data.workflowState, isOnline, failureCount, getPollingInterval, handleApiResponse]);

  // Condition 2: If tree_state == true AND workflow == true: poll error_info, SampleCount, RackSampleCount, BackButtonState (exponential backoff)
  useEffect(() => {
    if (!data.treeState || !data.workflowState) return;

    const pollingInterval = getPollingInterval();
    if (!pollingInterval) return;

    const interval = setInterval(async () => {
      if (!isOnline && failureCount >= 10) return;

      const [errorInfoRes, sampleCountRes, rackSampleCountRes, rackIdsRes, backButtonRes] = await Promise.all([
        getErrorInfo(),
        getSampleCount(),
        getRackSampleCount(),
        getRackIds(),
        getBackButtonState(),
      ]);

      const errorInfo = handleApiResponse(errorInfoRes, 'errorInfo');
      const sampleCount = handleApiResponse(sampleCountRes, 'sampleCount', d => d?.sample_count ?? null);
      const rackSampleCount = handleApiResponse(rackSampleCountRes, 'rackSampleCount', d => d?.sample_count_for_rack ?? null);
      const rackIds = handleApiResponse(rackIdsRes, 'rackIds', d => d?.rack_ids ?? null);
      const backButtonState = handleApiResponse(backButtonRes, 'backButtonState', d => d?.back_button_state ?? null);

      setData((prev) => ({
        ...prev,
        errorInfo,
        sampleCount,
        rackSampleCount,
        rackIds,
        backButtonState,
      }));
    }, pollingInterval);

    return () => clearInterval(interval);
  }, [data.treeState, data.workflowState, isOnline, failureCount, getPollingInterval, handleApiResponse]);

  // Condition 3: If tool_calibration_state == false: poll tool_calibration_state (exponential backoff)
  useEffect(() => {
    if (!data.treeState) return;
    if (data.toolCalibrationState !== false) return;

    const pollingInterval = getPollingInterval();
    if (!pollingInterval) return;

    const interval = setInterval(async () => {
      if (!isOnline && failureCount >= 10) return;

      const response = await getToolCalibrationState();
      const toolCalibrationState = handleApiResponse(response, 'toolCalibrationState', d => d?.tool_calibrated ?? null);
      if (toolCalibrationState !== null) {
        setData((prev) => ({ ...prev, toolCalibrationState }));
      }
    }, pollingInterval);

    return () => clearInterval(interval);
  }, [data.treeState, data.toolCalibrationState, isOnline, failureCount, getPollingInterval, handleApiResponse]);

  // Condition 4: If container_calibration_state == false: poll container_calibration_state (exponential backoff)
  useEffect(() => {
    if (!data.treeState) return;
    if (data.containerCalibrationState !== false) return;

    const pollingInterval = getPollingInterval();
    if (!pollingInterval) return;

    const interval = setInterval(async () => {
      if (!isOnline && failureCount >= 10) return;

      const response = await getContainerCalibrationState();
      const containerCalibrationState = handleApiResponse(response, 'containerCalibrationState', d => d?.container_calibrated ?? null);
      if (containerCalibrationState !== null) {
        setData((prev) => ({ ...prev, containerCalibrationState }));
      }
    }, pollingInterval);

    return () => clearInterval(interval);
  }, [data.treeState, data.containerCalibrationState, isOnline, failureCount, getPollingInterval, handleApiResponse]);

  // Condition 5: If sample_count_for_rack < sample_count: poll sample_count_for_rack (exponential backoff)
  useEffect(() => {
    if (!data.treeState) return;
    if (data.rackSampleCount === null || data.sampleCount === null) return;
    if (data.rackSampleCount >= data.sampleCount) return;

    const pollingInterval = getPollingInterval();
    if (!pollingInterval) return;

    const interval = setInterval(async () => {
      if (!isOnline && failureCount >= 10) return;

      const response = await getRackSampleCount();
      const rackSampleCount = handleApiResponse(response, 'rackSampleCount', d => d?.sample_count_for_rack ?? null);
      if (rackSampleCount !== null) {
        setData((prev) => ({ ...prev, rackSampleCount }));
      }
    }, pollingInterval);

    return () => clearInterval(interval);
  }, [data.treeState, data.rackSampleCount, data.sampleCount, isOnline, failureCount, getPollingInterval, handleApiResponse]);

  return data;
}
