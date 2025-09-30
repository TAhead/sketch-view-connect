import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Increasing counter via Unite Labs API");

    // Get credentials from environment
    const clientId = "unitelabs";
    const clientSecret = Deno.env.get('UNITELABS_CLIENT_SECRET');
    const baseUrl = "https://api.unitelabs.io/4d3b8696-852b-48a0-a735-55422f327d24";
    const authUrl = "https://auth.unitelabs.io/realms/4d3b8696-852b-48a0-a735-55422f327d24/protocol/openid-connect/token";

    // Allow overriding service name via request body for debugging
    let serviceName = "BuddyV0";
    try {
      const body = await req.json();
      if (body && typeof body.serviceName === "string" && body.serviceName.trim()) {
        serviceName = body.serviceName.trim();
      }
    } catch (_err) {
      // No JSON body provided or invalid JSON - proceed with default
    }

    if (!clientSecret) {
      throw new Error("UNITELABS_CLIENT_SECRET is not configured");
    }

    // Step 1: Authenticate and get access token
    console.log("Authenticating with Unite Labs...");
    const tokenResponse = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Authentication failed:", errorText);
      throw new Error(`Authentication failed: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    console.log("Successfully authenticated");

    // Step 2: Get the service/connector
    console.log(`Getting service: ${serviceName}...`);
    const serviceResponse = await fetch(`${baseUrl}/services/${serviceName}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!serviceResponse.ok) {
      const errorText = await serviceResponse.text();
      console.error("Failed to get service:", errorText);

      // Try listing available services to help debugging the correct name
      try {
        const listResp = await fetch(`${baseUrl}/services`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });
        const listText = await listResp.text();
        console.error("Available services:", listText);
        return new Response(
          JSON.stringify({ error: `Failed to get service: ${serviceName}`, details: errorText, availableServices: listText }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (listErr) {
        console.error("Failed to list services:", listErr);
      }

      throw new Error(`Failed to get service: ${serviceResponse.status}`);
    }

    // Step 3: Call increase_counter on the cobotta service
    console.log("Calling increase_counter...");
    const counterResponse = await fetch(`${baseUrl}/services/${serviceName}/cobotta_sila_server/increase_counter`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!counterResponse.ok) {
      const errorText = await counterResponse.text();
      console.error("Failed to increase counter:", errorText);
      throw new Error(`Failed to increase counter: ${counterResponse.status}`);
    }

    const result = await counterResponse.json();
    console.log("Counter increased successfully:", result);

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in fetch-sample-count function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An error occurred'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
