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
  getWorkflowState,
} from "@/services/fastapi";

interface UseSmartDataRetrievalProps {
  treeState: boolean;
  workflowState: boolean;
}

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
}

export function useSmartDataRetrieval({ treeState, workflowState }: UseSmartDataRetrievalProps) {
  const [data, setData] = useState<DataState>({
    sampleCount: null,
    rackSampleCount: null,
    errorInfo: null,
    rackIds: null,
    backButtonState: null,
    toolCalibrationState: null,
    containerCalibrationState: null,
  });

  // Initial state fetch when workflow becomes active
  useEffect(() => {
    if (!treeState || !workflowState) return;

    const fetchInitialStates = async () => {
      const [toolCal, containerCal] = await Promise.all([getToolCalibrationState(), getContainerCalibrationState()]);

      setData((prev) => ({
        ...prev,
        toolCalibrationState: toolCal.data?.tool_calibrated ?? null,
        containerCalibrationState: containerCal.data?.container_calibrated ?? null,
      }));
    };

    fetchInitialStates();
  }, [treeState, workflowState]);

  // Condition 1: If tree_state == true AND workflow == false: poll error_info (10s)
  useEffect(() => {
    if (!treeState || workflowState) return;

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
  }, [treeState, workflowState]);

  // Condition 2: If tree_state == true AND workflow == true: poll error_info, SampleCount, RackSampleCount, BackButtonState (10s)
  useEffect(() => {
    if (!treeState || !workflowState) return;

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
        backButtonState: backButtonState.data?.back_button_state ?? null,
      }));
    };

    poll();
    const interval = setInterval(poll, 10000);
    return () => clearInterval(interval);
  }, [treeState, workflowState]);

  // Condition 3: If tool_calibration_state == false AND tree_state == true AND workflow == true: poll toolCalibrationState (5s)
  useEffect(() => {
    if (data.toolCalibrationState === true || !treeState || !workflowState) return;

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
  }, [data.toolCalibrationState, treeState, workflowState]);

  // Condition 4: If (SampleRackCount == 0 OR == 50) AND tool_calibration_state == true AND tree_state == true AND workflow == true: poll containerCalibrationState (5s)
  useEffect(() => {
    const shouldPoll =
      (data.rackSampleCount === null || data.rackSampleCount === 0 || data.rackSampleCount === 50) &&
      data.toolCalibrationState === true &&
      treeState &&
      workflowState;

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
  }, [data.rackSampleCount, data.toolCalibrationState, treeState, workflowState]);

  // Condition 5: If tool_calibration_state == true AND container_calibration_state == false AND tree_state == true AND workflow == true: poll rackInfo (5s) until data is received
  useEffect(() => {
    const shouldPoll =
      data.toolCalibrationState === true &&
      data.containerCalibrationState === false &&
      treeState &&
      workflowState &&
      data.rackIds === null;

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
  }, [data.toolCalibrationState, data.containerCalibrationState, treeState, workflowState, data.rackIds]);

  return data;
}
