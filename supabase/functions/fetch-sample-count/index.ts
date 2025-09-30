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
    console.log("Fetching sample count from Unite Labs API");

    // Get credentials from environment
    const clientId = "unitelabs";
    const clientSecret = Deno.env.get('UNITELABS_CLIENT_SECRET');
    // TODO: Replace 'xxxx' with your actual realm name and API endpoint path
    const baseUrl = "https://api.unitelabs.io/xxxx";
    const authUrl = "https://auth.unitelabs.io/realms/xxxx/protocol/openid-connect/token";

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

    // Step 2: Fetch sample count from API
    console.log("Fetching sample count...");
    // TODO: Replace with your actual API endpoint path
    const apiResponse = await fetch(`${baseUrl}/sample-count`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error("API request failed:", errorText);
      throw new Error(`API request failed: ${apiResponse.status}`);
    }

    const data = await apiResponse.json();
    console.log("Sample count fetched successfully:", data);

    return new Response(
      JSON.stringify({ sampleCount: data.sampleCount || data.count || 0 }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in fetch-sample-count function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An error occurred',
        sampleCount: null 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
