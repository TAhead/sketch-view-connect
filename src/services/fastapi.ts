import { supabase } from "@/integrations/supabase/client";

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
}

/**
 * Make authenticated request to FastAPI backend via Edge Function proxy
 */
async function fetchAPI<T>(
  endpoint: string,
  method: string = "GET",
  body?: any
): Promise<ApiResponse<T>> {
  try {
    const { data, error } = await supabase.functions.invoke('fastapi-proxy', {
      body: {
        endpoint,
        method,
        body,
      },
    });

    if (error) {
      return { error: error.message || "Request failed" };
    }

    return { data };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// ==================== Workflow Control ====================

export async function startWorkflow() {
  return fetchAPI("/workflow/start", "POST");
}

export async function cancelWorkflow() {
  return fetchAPI("/workflow/cancel", "POST");
}

export async function resumeWorkflow() {
  return fetchAPI("/workflow/resume", "POST");
}

export async function eswabWorkflow() {
  return fetchAPI("/workflow/eswab", "POST");
}

export async function urineWorkflow() {
  return fetchAPI("/workflow/urine", "POST");
}

// ==================== Robot Control ====================

export async function moveToHome() {
  return fetchAPI("/robot/home", "POST");
}

export async function openGripper() {
  return fetchAPI("/robot/gripper/open", "POST");
}

export async function closeGripper() {
  return fetchAPI("/robot/gripper/close", "POST");
}

export async function clearCollision() {
  return fetchAPI("/robot/clear-collision", "POST");
}

// ==================== Data Retrieval ====================

export async function getSampleCount() {
  return fetchAPI<{ sample_count: number }>("/data/sample-count");
}

export async function getRackSampleCount() {
  return fetchAPI<{ sample_count_for_rack: number }>("/data/sample-count-rack");
}

type RackInfoResponse = {
  rack_ids: Record<string, number>;
};

export async function getRackIds() {
  return fetchAPI<RackInfoResponse>("/data/rack-info");
}

export async function getSampleInfo() {
  return fetchAPI("/data/sample-info");
}

export async function getProcessedRacks() {
  return fetchAPI("/data/processed-racks");
}

export async function getErrorInfo() {
  return fetchAPI<{ error_code: number; error_message: string }>("/data/error-info");
}

export async function getBackButtonState() {
  return fetchAPI<{ enabled: boolean }>("/data/back-button-state");
}

export async function getToolCalibrationState() {
  return fetchAPI<{ tool_calibrated: boolean }>("/data/tool-calibration-state");
}

export async function getContainerCalibrationState() {
  return fetchAPI<{ container_calibrated: boolean }>("/data/back-button-state");
}

export asyn function getTreeState() {
  return fetchAPI<{ tree_state: boolean }>("/data/tree-state");
}

// ==================== System Control ====================

export async function shutdown() {
  return fetchAPI("/system/shutdown", "POST");
}

// ==================== Rack ID Management ====================

export async function inputRackIds(rackIds: string[]) {
  return fetchAPI("/racks/input-ids", "POST", { rack_ids: rackIds });
}
