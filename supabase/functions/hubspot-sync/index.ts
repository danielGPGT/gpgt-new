import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Environment variables
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// HubSpot API base URL
const HUBSPOT_API_BASE = 'https://api.hubapi.com';
const HUBSPOT_TOKEN_URL = 'https://api.hubapi.com/oauth/v1/token';

// Use VITE_ prefix for HubSpot credentials
const HUBSPOT_CLIENT_ID = Deno.env.get('VITE_HUBSPOT_CLIENT_ID')!;
const HUBSPOT_CLIENT_SECRET = Deno.env.get('VITE_HUBSPOT_CLIENT_SECRET')!;

// Helper: Refresh HubSpot access token
async function refreshHubSpotToken(refresh_token: string, client_id: string, client_secret: string) {
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id,
    client_secret,
    refresh_token,
  });
  const res = await fetch(HUBSPOT_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  if (!res.ok) throw new Error('Failed to refresh HubSpot token');
  return await res.json();
}

// Helper: Fetch all contacts from HubSpot (pagination)
async function fetchAllContacts(token: string) {
  let after = undefined;
  let allContacts = [];
  while (true) {
    const url = new URL(`${HUBSPOT_API_BASE}/crm/v3/objects/contacts`);
    url.searchParams.set('limit', '100');
    url.searchParams.set('properties', 'firstname,lastname,email,phone,company');
    if (after) url.searchParams.set('after', after);
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch contacts from HubSpot');
    const data = await res.json();
    allContacts.push(...(data.results || []));
    if (!data.paging || !data.paging.next || !data.paging.next.after) break;
    after = data.paging.next.after;
  }
  return allContacts;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse input (expecting JSON with team_id)
    const { team_id } = await req.json();
    if (!team_id) {
      return new Response(
        JSON.stringify({ error: 'Missing team_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Extract user_id from Authorization header
    const authHeader = req.headers.get('Authorization');
    let userId = null;
    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      userId = user?.id;
    }
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Could not determine user_id from Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Look up HubSpot connection for the team
    const { data: connection, error: connError } = await supabase
      .from('hubspot_connections')
      .select('*')
      .eq('team_id', team_id)
      .eq('is_active', true)
      .single();
    if (connError || !connection) {
      return new Response(
        JSON.stringify({ error: 'No active HubSpot connection for this team.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let hubspotToken = connection.access_token;
    let tokenExpired = connection.token_expires_at && new Date(connection.token_expires_at) < new Date();
    // 2. Refresh token if needed
    if (tokenExpired && connection.refresh_token && HUBSPOT_CLIENT_ID && HUBSPOT_CLIENT_SECRET) {
      try {
        const tokenData = await refreshHubSpotToken(
          connection.refresh_token,
          HUBSPOT_CLIENT_ID,
          HUBSPOT_CLIENT_SECRET
        );
        hubspotToken = tokenData.access_token;
        // Update tokens in DB
        await supabase
          .from('hubspot_connections')
          .update({
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', connection.id);
      } catch (err) {
        await supabase.from('hubspot_sync_logs').insert({
          team_id,
          sync_type: 'contacts',
          status: 'failed',
          records_processed: 0,
          records_synced: 0,
          records_failed: 0,
          error_message: 'Token refresh failed: ' + err.message,
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        });
        return new Response(
          JSON.stringify({ error: 'Token refresh failed', details: err.message }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 3. Fetch all contacts from HubSpot
    let contacts;
    try {
      contacts = await fetchAllContacts(hubspotToken);
    } catch (err) {
      await supabase.from('hubspot_sync_logs').insert({
        team_id,
        sync_type: 'contacts',
        status: 'failed',
        records_processed: 0,
        records_synced: 0,
        records_failed: 0,
        error_message: 'HubSpot fetch failed: ' + err.message,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });
      return new Response(
        JSON.stringify({ error: 'Failed to fetch contacts from HubSpot', details: err.message }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Upsert contacts and mappings with detailed logging
    let processed = 0, created = 0, updated = 0, failed = 0;
    for (const contact of contacts) {
      processed++;
      const props = contact.properties || {};
      const email = props.email || null;
      const firstName = props.firstname || '';
      const lastName = props.lastname || '';
      const phone = props.phone || null;
      const company = props.company || null;
      const hubspotContactId = contact.id;
      
      try {
        // Try to find existing mapping first
        const { data: mapping } = await supabase
          .from('hubspot_contact_mappings')
          .select('client_id')
          .eq('hubspot_contact_id', hubspotContactId)
          .eq('team_id', team_id)
          .single();
        
        let clientId = mapping?.client_id;
        let upsertResult;
        
        if (clientId) {
          // Update existing client (found via mapping)
          upsertResult = await supabase
            .from('clients')
            .update({
              first_name: firstName,
              last_name: lastName,
              email,
              phone,
              company,
              updated_at: new Date().toISOString(),
            })
            .eq('id', clientId)
            .select()
            .single();
          console.log('Updated client via mapping:', clientId, upsertResult.error);
          updated++;
        } else {
          // No mapping found - check if client exists by email
          let existingClient = null;
          if (email) {
            const { data: emailClient } = await supabase
              .from('clients')
              .select('id')
              .eq('email', email)
              .eq('team_id', team_id)
              .single();
            existingClient = emailClient;
          }
          
          if (existingClient) {
            // Client exists by email - update it and create mapping
            clientId = existingClient.id;
            upsertResult = await supabase
              .from('clients')
              .update({
                first_name: firstName,
                last_name: lastName,
                email,
                phone,
                company,
                updated_at: new Date().toISOString(),
              })
              .eq('id', clientId)
              .select()
              .single();
            console.log('Updated existing client by email:', clientId, upsertResult.error);
            updated++;
          } else {
            // No existing client found - create new one
            upsertResult = await supabase
              .from('clients')
              .insert({
                user_id: userId,
                team_id,
                first_name: firstName,
                last_name: lastName,
                email,
                phone,
                company,
                status: 'active',
                source: 'hubspot',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .select()
              .single();
            clientId = upsertResult.data?.id;
            console.log('Created new client:', clientId, upsertResult.error);
            created++;
          }
        }
        
        if (upsertResult.error) {
          console.error('Upsert error for contact', hubspotContactId, upsertResult.error);
          failed++;
          continue;
        }
        
        // Upsert mapping
        await supabase
          .from('hubspot_contact_mappings')
          .upsert({
            team_id,
            client_id: clientId,
            hubspot_contact_id: hubspotContactId,
            last_synced_at: new Date().toISOString(),
            sync_status: 'synced',
            updated_at: new Date().toISOString(),
          }, { onConflict: 'team_id,hubspot_contact_id' });
      } catch (err) {
        console.error('Sync error for contact', hubspotContactId, err);
        failed++;
        continue;
      }
    }

    // 5. Log the sync
    await supabase.from('hubspot_sync_logs').insert({
      team_id,
      sync_type: 'contacts',
      status: failed > 0 ? (created + updated > 0 ? 'partial' : 'failed') : 'completed',
      records_processed: processed,
      records_synced: created + updated,
      records_failed: failed,
      error_message: failed > 0 ? `${failed} failed` : null,
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        message: 'Sync complete',
        processed,
        created,
        updated,
        failed
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    // Log unexpected error
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      await supabase.from('hubspot_sync_logs').insert({
        sync_type: 'contacts',
        status: 'failed',
        error_message: 'Unexpected error: ' + err.message,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });
    } catch {}
    return new Response(
      JSON.stringify({ error: 'Unexpected error', details: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}); 