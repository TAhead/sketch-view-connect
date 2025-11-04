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

    // Extract path from URL
    const url = new URL(req.url);
    const path = url.pathname.replace("/api", ""); // /api/data/workflow-state → /data/workflow-state

    // Direct proxy - just forward the request
    const response = await fetch(`${FASTAPI_URL}${path}${url.search}`, {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret": INTERNAL_SECRET,
        "X-User-Id": userId,
      },
      body: req.body,
    });

    // Stream response directly
    return new Response(response.body, {
      status: response.status,
      headers: { 
        ...corsHeaders, 
        "Content-Type": "application/json" 
      },
    });

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});