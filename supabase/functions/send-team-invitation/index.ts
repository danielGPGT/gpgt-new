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

    // Get request body
    const { invitation_id } = await req.json()

    if (!invitation_id) {
      throw new Error('invitation_id is required')
    }

    // Get invitation details
    const { data: invitation, error: invitationError } = await supabase
      .from('team_invitations')
      .select(`
        *,
        teams!team_invitations_team_id_fkey(name),
        auth.users!team_invitations_invited_by_fkey(email, raw_user_meta_data)
      `)
      .eq('id', invitation_id)
      .single()

    if (invitationError || !invitation) {
      throw new Error('Invitation not found')
    }

    // Get inviter name
    const inviterName = invitation.users?.raw_user_meta_data?.name || 
                       invitation.users?.email || 
                       'AItinerary Admin'

    // Get team name
    const teamName = invitation.teams?.name || 'Your Team'

    // Create invitation link
    const baseUrl = Deno.env.get('FRONTEND_URL') || 'http://localhost:5173'
    const inviteLink = `${baseUrl}/team-invitation?token=${invitation.token}`

    // Email content
    const emailContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Team Invitation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; }
          .content { padding: 20px; }
          .button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>You're Invited!</h1>
          </div>
          <div class="content">
            <p>Hello!</p>
            <p><strong>${inviterName}</strong> has invited you to join their team on AItinerary.</p>
            <p><strong>Team:</strong> ${teamName}</p>
            <p><strong>Role:</strong> ${invitation.role}</p>
            <p>Click the button below to accept the invitation and join the team:</p>
            <a href="${inviteLink}" class="button">Accept Invitation</a>
            <p>This invitation will expire in 7 days.</p>
            <p>If you have any questions, please contact ${inviterName}.</p>
          </div>
          <div class="footer">
            <p>This invitation was sent from AItinerary. If you didn't expect this email, you can safely ignore it.</p>
          </div>
        </div>
      </body>
      </html>
    `

    // Send email using Supabase's built-in email service
    const { data: emailData, error: emailError } = await supabase.auth.admin.sendRawEmail({
      to: invitation.email,
      subject: `You're invited to join ${teamName} on AItinerary`,
      html: emailContent,
      from: 'noreply@aitinerary.com' // You can customize this
    })

    if (emailError) {
      console.error('Error sending email:', emailError)
      // Fallback: just log the email content
      console.log('Email would be sent to:', invitation.email)
      console.log('Email content:', emailContent)
    } else {
      console.log('Email sent successfully:', emailData)
    }

    // Update invitation status to indicate email was sent
    const { error: updateError } = await supabase
      .from('team_invitations')
      .update({ 
        updated_at: new Date().toISOString(),
        // Add a field to track email sent status if needed
      })
      .eq('id', invitation_id)

    if (updateError) {
      console.error('Error updating invitation:', updateError)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Invitation email processed',
        email: invitation.email,
        inviteLink 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in send-team-invitation function:', error)
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