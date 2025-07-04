import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { token, action, userData } = await req.json()

    if (!token) {
      throw new Error('Token is required')
    }

    // Get invitation details
    const { data: invitation, error: invitationError } = await supabase
      .from('team_invitations')
      .select(`
        *,
        teams!team_invitations_team_id_fkey(name, owner_id),
        auth.users!team_invitations_invited_by_fkey(email, raw_user_meta_data)
      `)
      .eq('token', token)
      .eq('status', 'pending')
      .single()

    if (invitationError || !invitation) {
      throw new Error('Invalid or expired invitation')
    }

    // Check if invitation has expired
    if (new Date() > new Date(invitation.expires_at)) {
      // Update invitation status to expired
      await supabase
        .from('team_invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id)

      throw new Error('Invitation has expired')
    }

    if (action === 'validate') {
      // Just validate the token and return invitation details
      return new Response(
        JSON.stringify({
          success: true,
          invitation: {
            id: invitation.id,
            email: invitation.email,
            role: invitation.role,
            teamName: invitation.teams?.name,
            invitedBy: invitation.users?.raw_user_meta_data?.name || invitation.users?.email,
            expiresAt: invitation.expires_at
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'accept') {
      if (!userData || !userData.email || !userData.password || !userData.name) {
        throw new Error('User data is required')
      }

      // Check if email matches invitation
      if (userData.email.toLowerCase() !== invitation.email.toLowerCase()) {
        throw new Error('Email does not match invitation')
      }

      // Check if user already exists
      const { data: existingUser } = await supabase.auth.admin.getUserByEmail(userData.email)
      
      if (existingUser.user) {
        throw new Error('User already exists. Please sign in instead.')
      }

      // Create new user
      const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          name: userData.name,
          team_id: invitation.team_id
        }
      })

      if (createUserError) {
        throw new Error(`Failed to create user: ${createUserError.message}`)
      }

      // Add user to team
      const { error: addMemberError } = await supabase
        .from('team_members')
        .insert({
          team_id: invitation.team_id,
          user_id: newUser.user.id,
          email: userData.email,
          name: userData.name,
          role: invitation.role,
          status: 'active',
          invited_by: invitation.invited_by,
          joined_at: new Date().toISOString()
        })

      if (addMemberError) {
        // Clean up the created user if team member creation fails
        await supabase.auth.admin.deleteUser(newUser.user.id)
        throw new Error(`Failed to add user to team: ${addMemberError.message}`)
      }

      // Update invitation status to accepted
      await supabase
        .from('team_invitations')
        .update({ 
          status: 'accepted',
          updated_at: new Date().toISOString()
        })
        .eq('id', invitation.id)

      // Sign in the user and return session
      const { data: session, error: signInError } = await supabase.auth.admin.generateLink({
        type: 'signup',
        email: userData.email,
        password: userData.password
      })

      if (signInError) {
        throw new Error(`Failed to sign in user: ${signInError.message}`)
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Account created and added to team successfully',
          user: {
            id: newUser.user.id,
            email: newUser.user.email,
            name: userData.name
          },
          team: {
            id: invitation.team_id,
            name: invitation.teams?.name
          },
          session: session
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    throw new Error('Invalid action')

  } catch (error) {
    console.error('Error in team-invitation function:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
}) 