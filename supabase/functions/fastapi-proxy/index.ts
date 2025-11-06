const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

const FASTAPI_URL = Deno.env.get("FASTAPI_URL")?.replace(/\/$/, "") || "";
const INTERNAL_SECRET = Deno.env.get("FASTAPI_INTERNAL_SECRET") || "";

console.log("fastapi-proxy v3: always-200 - loaded");

Deno.serve(async (req) => {
  // Fast CORS handling
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // Extract user ID from JWT with robust base64url decoding
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    let userId = null;
    
    if (token) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          // Convert base64url to base64 and decode
          let payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
          while (payload.length % 4) payload += '=';
          userId = JSON.parse(atob(payload)).sub;
        }
      } catch (e) {
        console.error("JWT decode error:", e);
      }
    }
    
    if (!userId) {
      console.log("Missing or invalid user authentication");
      return new Response(
        JSON.stringify({ 
          error: "Unauthorized",
          code: "UNAUTHORIZED",
          isConnectionError: true
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Guard against missing backend URL
    if (!FASTAPI_URL) {
      console.error("FASTAPI_URL not configured");
      return new Response(
        JSON.stringify({ 
          error: "Backend not configured",
          isConnectionError: true
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Parse request body safely
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (e) {
      console.error("Failed to parse request body:", e);
      return new Response(
        JSON.stringify({ 
          error: "Invalid request body",
          isConnectionError: true
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    const { endpoint, method = "GET", body: innerBody } = requestBody;

    console.log(`Proxying ${method} request to ${FASTAPI_URL}${endpoint} for user ${userId}`);

    // Direct proxy - forward the request to FastAPI
    const response = await fetch(`${FASTAPI_URL}${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret": INTERNAL_SECRET,
        "X-User-Id": userId,
      },
      body: innerBody ? JSON.stringify(innerBody) : undefined,
    });

    console.log(`FastAPI response status: ${response.status}`);
    console.log(`FastAPI response headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()))}`);

    // Check if response is JSON and successful
    const contentType = response.headers.get("content-type");
    if (!contentType?.includes("application/json") || !response.ok) {
      let responseText = "";
      try {
        responseText = await response.text();
        console.log(`FastAPI non-JSON/error response (first 200 chars): ${responseText.substring(0, 200)}`);
      } catch (e) {
        console.error("Failed to read response text:", e);
      }
      
      // Return 200 with error in body to prevent runtime crash
      return new Response(
        JSON.stringify({ 
          error: `Backend service unavailable - received non-JSON response (status ${response.status})`,
          isConnectionError: true,
          status: response.status,
          endpoint
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const responseData = await response.json();
    console.log(`FastAPI raw response (first 500 chars): ${JSON.stringify(responseData).substring(0, 500)}`);

    // Always return 200 to prevent runtime crashes, errors are in response body
    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { 
        ...corsHeaders, 
        "Content-Type": "application/json" 
      },
    });

  } catch (error) {
    console.error("Edge function error:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    const isConnectionError = errorMessage.includes("unavailable") || errorMessage.includes("fetch failed") || errorMessage.includes("NetworkError");
    
    // Always return 200 to prevent runtime crashes
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        isConnectionError: true,
        timestamp: Date.now()
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});