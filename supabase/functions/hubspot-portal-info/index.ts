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
      throw new Error('No authorization header')
    }

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authError || !user) {
      throw new Error('Invalid authentication')
    }

    // Parse request body
    const { accessToken } = await req.json()

    if (!accessToken) {
      throw new Error('Missing required parameter: accessToken')
    }

    console.log('🔍 Getting HubSpot portal info for access token:', accessToken ? '***' : '(not set)')

    // Get HubSpot portal information
    const response = await fetch(`https://api.hubapi.com/oauth/v1/access-tokens/${accessToken}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    console.log('📡 HubSpot portal info response:', {
      status: response.status,
      statusText: response.statusText
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ HubSpot portal info error:', errorText)
      throw new Error(`Failed to get portal info: ${errorText}`)
    }

    const data = await response.json()
    console.log('✅ HubSpot portal info retrieved successfully')

    const portalInfo = {
      id: data.hub_id,
      name: data.hub_domain,
      domain: data.hub_domain,
      currency: data.currency || 'USD',
      timeZone: data.timeZone || 'UTC'
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: portalInfo
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('HubSpot portal info error:', error)
    
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