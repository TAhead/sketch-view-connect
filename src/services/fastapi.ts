import { supabase } from "@/integrations/supabase/client";

const FASTAPI_URL = import.meta.env.VITE_FASTAPI_URL || "http://localhost:8000";

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
}

/**
 * Get the current Supabase auth token
 */
async function getAuthToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

/**
 * Make authenticated request to FastAPI backend
 */
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      return { error: "Not authenticated" };
    }

    const response = await fetch(`${FASTAPI_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { 
        error: errorData.detail || `Request failed: ${response.status}` 
      };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    return { 
      error: error instanceof Error ? error.message : "Network error occurred" 
    };
  }
}

// ==================== Workflow Control ====================

export async function startWorkflow() {
  return fetchAPI("/workflow/start", { method: "POST" });
}

export async function cancelWorkflow() {
  return fetchAPI("/workflow/cancel", { method: "POST" });
}

export async function resumeWorkflow() {
  return fetchAPI("/workflow/resume", { method: "POST" });
}

// ==================== Robot Control ====================

export async function moveToHome() {
  return fetchAPI("/robot/home", { method: "POST" });
}

export async function openGripper() {
  return fetchAPI("/robot/gripper/open", { method: "POST" });
}

export async function closeGripper() {
  return fetchAPI("/robot/gripper/close", { method: "POST" });
}

export async function clearCollision() {
  return fetchAPI("/robot/clear-collision", { method: "POST" });
}

// ==================== Data Retrieval ====================

export async function getSampleCount() {
  return fetchAPI<{ sample_count: number }>("/data/sample-count");
}

export async function getRackInfo() {
  return fetchAPI<{ current_empty_rack_position: string; rack_id: string; rows: number; columns: number }>("/data/rack-info");
}

export async function getSampleInfo() {
  return fetchAPI("/data/sample-info");
}

export async function getRackIds() {
  return fetchAPI<{ rack_ids: string[] }>("/data/rack-ids");
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

// ==================== System Control ====================

export async function shutdown() {
  return fetchAPI("/system/shutdown", { method: "POST" });
}

// ==================== Rack ID Management ====================

export async function inputRackIds(rackIds: string[]) {
  return fetchAPI("/racks/input-ids", {
    method: "POST",
    body: JSON.stringify({ rack_ids: rackIds }),
  });
}
