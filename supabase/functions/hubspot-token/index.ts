import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing authorization header'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      )
    }

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authError || !user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid authentication'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      )
    }
    
    // Parse request body
    const { code, redirectUri } = await req.json()

    if (!code || !redirectUri) {
      throw new Error('Missing required parameters: code and redirectUri')
    }

    console.log('🔍 Token exchange request:', {
      hasCode: !!code,
      codeLength: code ? code.length : 0,
      redirectUri,
      userId: user.id
    })

    // HubSpot OAuth configuration
    const clientId = Deno.env.get('VITE_HUBSPOT_CLIENT_ID')
    const clientSecret = Deno.env.get('VITE_HUBSPOT_CLIENT_SECRET')

    if (!clientId || !clientSecret) {
      throw new Error('HubSpot credentials not configured')
    }

    // Use the correct HubSpot API endpoint
    const hubspotTokenUrl = 'https://api.hubapi.com/oauth/v1/token'
    
    // Prepare the request body
    const requestBody = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code: code
    })

    // Exchange authorization code for access token
    const tokenResponse = await fetch(hubspotTokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: requestBody
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('❌ HubSpot API error response:', errorText)
      throw new Error(`HubSpot token exchange failed: ${errorText}`)
    }

    const tokenData = await tokenResponse.json()
    console.log('✅ HubSpot token exchange successful for user:', user.id)

    return new Response(
      JSON.stringify({
        success: true,
        data: tokenData
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
}) 