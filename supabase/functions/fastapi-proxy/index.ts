const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

const FASTAPI_URL = Deno.env.get("FASTAPI_URL")?.replace(/\/$/, "") || "";
const INTERNAL_SECRET = Deno.env.get("FASTAPI_INTERNAL_SECRET") || "";

Deno.serve(async (req) => {
  // Fast CORS handling
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // Extract user ID from JWT
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    const userId = token ? JSON.parse(atob(token.split('.')[1])).sub : null;
    
    if (!userId) throw new Error("Unauthorized");

    // Parse request body to get endpoint and method
    const requestBody = await req.json();
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

    // Check if response is JSON
    const contentType = response.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      const responseText = await response.text();
      console.log(`FastAPI non-JSON response (first 200 chars): ${responseText.substring(0, 200)}`);
      
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