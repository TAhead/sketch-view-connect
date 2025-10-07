import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header - Supabase automatically verifies JWT
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    // Create Supabase client to get user info
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      },
    );

    // Get user from the verified JWT
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error("User not found");
    }

    console.log(`Authenticated request from user: ${user.id}`);

    // Parse request body
    const { endpoint, method = "GET", body } = await req.json();

    if (!endpoint) {
      throw new Error("Missing endpoint parameter");
    }

    // Get FastAPI URL and internal secret from environment
    const fastapiUrl = Deno.env.get("VITE_FASTAPI_URL")?.replace(/\/$/, "") || "";
    const internalSecret = Deno.env.get("FASTAPI_INTERNAL_SECRET");

    if (!fastapiUrl) {
      throw new Error("FASTAPI_URL not configured");
    }

    if (!internalSecret) {
      throw new Error("FASTAPI_INTERNAL_SECRET not configured");
    }

    console.log(`Proxying ${method} request to ${fastapiUrl}${endpoint} for user ${user.id}`);

    // Forward request to FastAPI with internal auth headers
    const fastapiResponse = await fetch(`${fastapiUrl}${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret": internalSecret,
        "X-User-Id": user.id,
        "bypass-tunnel-reminder": "true",
        "User-Agent": "Supabase-Edge-Function",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    // Log the response details
    console.log(`FastAPI response status: ${fastapiResponse.status}`);
    console.log(`FastAPI response headers:`, Object.fromEntries(fastapiResponse.headers.entries()));

    // Get the raw response text first
    const responseText = await fastapiResponse.text();
    console.log(`FastAPI raw response (first 500 chars): ${responseText.substring(0, 500)}`);

    // Try to parse as JSON
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      console.error(`Failed to parse JSON response:`, e);
      throw new Error(`FastAPI returned non-JSON response: ${responseText.substring(0, 200)}`);
    }

    // Return the FastAPI response
    return new Response(JSON.stringify(responseData), {
      status: fastapiResponse.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

    // Get response data
    const responseData = await fastapiResponse.json();

    // Return the FastAPI response
    return new Response(JSON.stringify(responseData), {
      status: fastapiResponse.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in fastapi-proxy:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
