import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    // Initialize Supabase client to verify JWT
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    // Verify the JWT and get user
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser()

    if (authError || !user) {
      throw new Error('Invalid authentication token')
    }

    // Parse request body
    const { endpoint, method = 'GET', body } = await req.json()

    if (!endpoint) {
      throw new Error('Missing endpoint parameter')
    }

    // Get FastAPI URL and internal secret from environment
    const fastapiUrl = Deno.env.get('VITE_FASTAPI_URL')?.replace(/\/$/, '') || ''
    const internalSecret = Deno.env.get('FASTAPI_INTERNAL_SECRET')

    if (!fastapiUrl) {
      throw new Error('FASTAPI_URL not configured')
    }

    if (!internalSecret) {
      throw new Error('FASTAPI_INTERNAL_SECRET not configured')
    }

    console.log(`Proxying ${method} request to ${fastapiUrl}${endpoint} for user ${user.id}`)

    // Forward request to FastAPI with internal auth headers
    const fastapiResponse = await fetch(`${fastapiUrl}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Secret': internalSecret,
        'X-User-Id': user.id,
        'ngrok-skip-browser-warning': 'true',
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    // Get response data
    const responseData = await fastapiResponse.json()

    // Return the FastAPI response
    return new Response(JSON.stringify(responseData), {
      status: fastapiResponse.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in fastapi-proxy:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return new Response(
      JSON.stringify({
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
