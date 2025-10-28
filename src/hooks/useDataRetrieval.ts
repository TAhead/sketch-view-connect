import { useState, useEffect } from "react";
import {
  getSampleCount,
  getRackSampleCount,
  getErrorInfo,
  getRackIds,
  getBackButtonState,
  getTreeState,
  getToolCalibrationState,
  getContainerCalibrationState,
} from "@/services/fastapi";

interface UseSmartDataRetrievalProps {
  treeState: boolean;
  isWorkflowActive: boolean;
}

interface DataState {
  sampleCount: number | null;
  rackSampleCount: number | null;
  errorInfo: { error_code: number; error_message: string } | null;
  rackIds: Record<string, number> | null;
  backButtonState: boolean | null;
  toolCalibrationState: boolean | null;
  containerCalibrationState: boolean | null;
}

export function useSmartDataRetrieval({ treeState, isWorkflowActive }: UseSmartDataRetrievalProps) {
  const [data, setData] = useState<DataState>({
    sampleCount: null,
    rackSampleCount: null,
    errorInfo: null,
    rackIds: null,
    backButtonState: null,
    toolCalibrationState: null,
    containerCalibrationState: null,
  });

  // Condition 1: If tree_state == true AND workflow == false: poll error_info (10s)
  useEffect(() => {
    if (!treeState || isWorkflowActive) return;

    const poll = async () => {
      const errorInfo = await getErrorInfo();
      setData((prev) => ({
        ...prev,
        errorInfo: errorInfo.data ?? null,
      }));
    };

    poll();
    const interval = setInterval(poll, 10000);
    return () => clearInterval(interval);
  }, [treeState, isWorkflowActive]);

  // Condition 2: If tree_state == true AND workflow == true: poll error_info, SampleCount, RackSampleCount, BackButtonState (10s)
  useEffect(() => {
    if (!treeState || !isWorkflowActive) return;

    const poll = async () => {
      const [errorInfo, sampleCount, rackSampleCount, backButtonState] = await Promise.all([
        getErrorInfo(),
        getSampleCount(),
        getRackSampleCount(),
        getBackButtonState(),
      ]);

      setData((prev) => ({
        ...prev,
        errorInfo: errorInfo.data ?? null,
        sampleCount: sampleCount.data?.sample_count ?? null,
        rackSampleCount: rackSampleCount.data?.sample_count_for_rack ?? null,
        backButtonState: backButtonState.data?.enabled ?? null,
      }));
    };

    poll();
    const interval = setInterval(poll, 10000);
    return () => clearInterval(interval);
  }, [treeState, isWorkflowActive]);

  // Condition 3: If tool_calibration_state == false AND tree_state == true AND workflow == true: poll toolCalibrationState (5s)
  useEffect(() => {
    if (data.toolCalibrationState !== true || !treeState || !isWorkflowActive) return;

    const poll = async () => {
      const toolCalibration = await getToolCalibrationState();
      setData((prev) => ({
        ...prev,
        toolCalibrationState: toolCalibration.data?.tool_calibrated ?? null,
      }));
    };

    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [data.toolCalibrationState, treeState, isWorkflowActive]);

  // Condition 4: If (SampleRackCount == 0 OR == 50) AND tool_calibration_state == true AND tree_state == true AND workflow == true: poll containerCalibrationState (5s)
  useEffect(() => {
    const shouldPoll =
      (data.rackSampleCount === 0 || data.rackSampleCount === 50) &&
      data.toolCalibrationState === true &&
      treeState &&
      isWorkflowActive;

    if (!shouldPoll) return;

    const poll = async () => {
      const containerCalibration = await getContainerCalibrationState();
      setData((prev) => ({
        ...prev,
        containerCalibrationState: containerCalibration.data?.container_calibrated ?? null,
      }));
    };

    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [data.rackSampleCount, data.toolCalibrationState, treeState, isWorkflowActive]);

  // Condition 5: If SampleCount == 0 AND tool_calibration_state == true AND tree_state == true AND workflow == true: poll rackInfo (5s)
  useEffect(() => {
    const shouldPoll = data.sampleCount === 0 && data.toolCalibrationState === true && treeState && isWorkflowActive;

    if (!shouldPoll) return;

    const poll = async () => {
      const rackInfo = await getRackIds();
      setData((prev) => ({
        ...prev,
        rackIds: rackInfo.data?.rack_ids ?? null,
      }));
    };

    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [data.sampleCount, data.toolCalibrationState, treeState, isWorkflowActive]);

  return data;
}
