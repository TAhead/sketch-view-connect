import { useState, useEffect, useCallback } from "react";
import { useConnectionStatus } from "./useConnectionStatus";
import {
  getSampleCount,
  getRackSampleCount,
  getErrorInfo,
  getRackIds,
  getAllRackInfo,
  getBackButtonState,
  getTreeState,
  getToolCalibrationState,
  getContainerCalibrationState,
  getWorkflowState,
  getSampleType,
  getSampleInfo,
} from "@/services/fastapi";

interface DataState {
  sampleCount: number | null;
  rackSampleCount: number | null;
  sampleInfo: {
    rack_id: string;
    sample_position: number;
    sample_id: string;
  } | null;
  errorInfo: { error_code: number | string; error_message: string; description?: string } | null;
  rackIds: {
    position_1?: string;
    position_2?: string;
    position_3?: string;
    position_4?: string;
  } | null;
  allRackInfo: Record<string, { rack_id: string; last_sample_position: number }> | null;
  backButtonState: boolean | null;
  toolCalibrationState: boolean | null;
  containerCalibrationState: boolean | null;
  sampleType: "urine" | "eswab" | null;
  connectionError: string | null;
  isOffline: boolean;
  treeState: boolean | null;
  workflowState: boolean | null;
}

// Helper to parse Python dictionary string to JavaScript object
const parsePythonDict = (pythonDictString: string): Record<string, string> | null => {
  if (!pythonDictString || typeof pythonDictString !== 'string') return null;
  
  try {
    // Replace single quotes with double quotes for JSON parsing
    const jsonString = pythonDictString.replace(/'/g, '"');
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Failed to parse rack_ids:', error);
    return null;
  }
};

// Type guard helpers to ensure API responses are valid primitives
const ensureNumber = (value: any): number | null => {
  if (typeof value === 'number' && !isNaN(value)) return value;
  if (typeof value === 'object' && value !== null) {
    console.warn('Received object instead of number:', value);
    return null;
  }
  return null;
};

const ensureString = (value: any): string | null => {
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null) {
    console.warn('Received object instead of string:', value);
    return null;
  }
  return null;
};

const ensureBoolean = (value: any): boolean | null => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'object' && value !== null) {
    console.warn('Received object instead of boolean:', value);
    return null;
  }
  return null;
};

// Sanitize error info to ensure it contains valid primitives
const sanitizeErrorInfo = (data: any): { error_code: number | string; error_message: string; description?: string } | null => {
  if (!data) return null;
  
  // Handle new format: ErrorCode(level=0, description='...')
  if (typeof data.error_code === 'string' && data.error_code.includes('ErrorCode(')) {
    // Extract description using regex
    const descMatch = data.error_code.match(/description=['"]([^'"]+)['"]/);
    if (descMatch && descMatch[1]) {
      const description = descMatch[1];
      return { 
        error_code: data.error_code, 
        error_message: description,
        description 
      };
    }
  }
  
  // Handle old format: numeric error_code and error_message
  const errorCode = ensureNumber(data.error_code);
  const errorMessage = ensureString(data.error_message);
  
  // If either field is invalid, return null (no error to display)
  if (errorCode === null || errorMessage === null) {
    console.warn('Invalid error info structure, ignoring:', data);
    return null;
  }
  
  return { error_code: errorCode, error_message: errorMessage };
};

// Sanitize sample info to ensure it contains valid primitives
const sanitizeSampleInfo = (data: any): { rack_id: string; sample_position: number; sample_id: string } | null => {
  if (!data) return null;
  
  // If data is a string (Python dict format), parse it first
  let parsedData = data;
  if (typeof data === 'string') {
    parsedData = parsePythonDict(data);
    if (!parsedData) return null;
  }
  
  const rackId = ensureString(parsedData.rack_id);
  const samplePosition = ensureNumber(parsedData.sample_position);
  const sampleId = ensureString(parsedData.sample_id);
  
  // If any field is invalid, return null
  if (rackId === null || samplePosition === null || sampleId === null) {
    console.warn('Invalid sample info structure, ignoring:', parsedData);
    return null;
  }
  
  return { rack_id: rackId, sample_position: samplePosition, sample_id: sampleId };
};

export function useSmartDataRetrieval() {
  const { isOnline, failureCount, recordSuccess, recordFailure, reset } = useConnectionStatus();
  
  const [data, setData] = useState<DataState>({
    sampleCount: null,
    rackSampleCount: null,
    sampleInfo: null,
    errorInfo: null,
    rackIds: null,
    allRackInfo: null,
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
    // Special handling for treeState - use it as backend health indicator
    if (field === 'treeState') {
      const treeStateValue = response.data?.tree_state;
      const isValidBoolean = typeof treeStateValue === 'boolean';
      
      if (!isValidBoolean) {
        // Backend is offline - tree_state should always be boolean
        recordFailure('Backend offline - tree_state is not boolean');
        setData(prev => ({
          ...prev,
          connectionError: 'Backend offline',
          isOffline: true,
        }));
        return null;
      } else {
        // Backend is healthy
        recordSuccess();
        setData(prev => ({
          ...prev,
          connectionError: null,
          isOffline: false,
        }));
      }
    }
    
    // Handle other fields
    if (response.error) {
      if (response.isConnectionError) {
        recordFailure(response.error);
        setData(prev => ({
          ...prev,
          connectionError: response.error,
        }));
      }
      return null;
    }
    
    recordSuccess();
    return transform ? transform(response.data) : response.data;
  }, [recordSuccess, recordFailure]);

  // Fetch all endpoints once on initial mount
  useEffect(() => {
    const fetchInitialState = async () => {
      try {
        const [
          sampleCountRes,
          rackSampleCountRes,
          sampleInfoRes,
          errorInfoRes,
          rackIdsRes,
          allRackInfoRes,
          backButtonRes,
          toolCalRes,
          containerCalRes,
          sampleTypeRes,
          treeStateRes,
          workflowStateRes,
        ] = await Promise.all([
          getSampleCount(),
          getRackSampleCount(),
          getSampleInfo(),
          getErrorInfo(),
          getRackIds(),
          getAllRackInfo(),
          getBackButtonState(),
          getToolCalibrationState(),
          getContainerCalibrationState(),
          getSampleType(),
          getTreeState(),
          getWorkflowState(),
        ]);

        // Process responses with connection tracking
        const sampleCount = handleApiResponse(sampleCountRes, 'sampleCount', d => d?.sample_count ?? null);
        const rackSampleCount = handleApiResponse(rackSampleCountRes, 'rackSampleCount', d => ensureNumber(d?.sample_count_for_rack));
        const sampleInfo = handleApiResponse(sampleInfoRes, 'sampleInfo', d => sanitizeSampleInfo(d));
        const errorInfo = handleApiResponse(errorInfoRes, 'errorInfo', d => sanitizeErrorInfo(d));
        const rackIds = handleApiResponse(rackIdsRes, 'rackIds', d => {
          const rackIdsString = d?.rack_ids;
          return typeof rackIdsString === 'string' 
            ? parsePythonDict(rackIdsString) 
            : rackIdsString ?? null;
        });
        const allRackInfo = handleApiResponse(allRackInfoRes, 'allRackInfo', d => d?.racks ?? null);
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
          sampleInfo,
          errorInfo,
          rackIds,
          allRackInfo,
          backButtonState,
          toolCalibrationState,
          containerCalibrationState,
          sampleType,
          treeState,
          workflowState,
        }));
      } catch (error) {
        console.error('Error fetching initial state:', error);
        setData(prev => ({
          ...prev,
          isOffline: true,
          connectionError: 'Failed to connect to backend',
        }));
      }
    };

    fetchInitialState();
  }, [handleApiResponse]);

  // Poll tree_state and workflow_state every 2 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
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
      } catch (error) {
        console.error('Error polling tree/workflow state:', error);
      }
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

      try {
        const response = await getErrorInfo();
        const errorInfo = handleApiResponse(response, 'errorInfo', d => sanitizeErrorInfo(d));
        if (errorInfo !== null) {
          setData((prev) => ({ ...prev, errorInfo }));
        }
      } catch (error) {
        console.error('Error polling error info (condition 1):', error);
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

      try {
        const [errorInfoRes, sampleCountRes, sampleInfoRes, rackSampleCountRes, rackIdsRes, backButtonRes] = await Promise.all([
          getErrorInfo(),
          getSampleCount(),
          getSampleInfo(),
          getRackSampleCount(),
          getRackIds(),
          getBackButtonState(),
        ]);

        const errorInfo = handleApiResponse(errorInfoRes, 'errorInfo', d => sanitizeErrorInfo(d));
        const sampleCount = handleApiResponse(sampleCountRes, 'sampleCount', d => d?.sample_count ?? null);
        const sampleInfo = handleApiResponse(sampleInfoRes, 'sampleInfo', d => sanitizeSampleInfo(d));
        const rackSampleCount = handleApiResponse(rackSampleCountRes, 'rackSampleCount', d => ensureNumber(d?.sample_count_for_rack));
        const rackIds = handleApiResponse(rackIdsRes, 'rackIds', d => {
          const rackIdsString = d?.rack_ids;
          return typeof rackIdsString === 'string' 
            ? parsePythonDict(rackIdsString) 
            : rackIdsString ?? null;
        });
        const backButtonState = handleApiResponse(backButtonRes, 'backButtonState', d => d?.back_button_state ?? null);

        setData((prev) => ({
          ...prev,
          errorInfo,
          sampleCount,
          sampleInfo,
          rackSampleCount,
          rackIds,
          backButtonState,
        }));
      } catch (error) {
        console.error('Error polling data (condition 2):', error);
      }
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

      try {
        const response = await getToolCalibrationState();
        const toolCalibrationState = handleApiResponse(response, 'toolCalibrationState', d => d?.tool_calibrated ?? null);
        if (toolCalibrationState !== null) {
          setData((prev) => ({ ...prev, toolCalibrationState }));
        }
      } catch (error) {
        console.error('Error polling tool calibration (condition 3):', error);
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

      try {
        const response = await getContainerCalibrationState();
        const containerCalibrationState = handleApiResponse(response, 'containerCalibrationState', d => d?.container_calibrated ?? null);
        if (containerCalibrationState !== null) {
          setData((prev) => ({ ...prev, containerCalibrationState }));
        }
      } catch (error) {
        console.error('Error polling container calibration (condition 4):', error);
      }
    }, pollingInterval);

    return () => clearInterval(interval);
  }, [data.treeState, data.containerCalibrationState, isOnline, failureCount, getPollingInterval, handleApiResponse]);


  return data;
}
