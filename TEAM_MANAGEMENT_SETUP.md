# Team Management System Setup Guide

This guide will help you set up the complete team management system for Agency and Enterprise plans.

## 🗄️ Database Setup

### 1. Run the Migration

First, run the database migration to create the necessary tables and functions:

```bash
# Apply the migration to your Supabase database
supabase db push
```

Or manually run the SQL from `supabase/migrations/20241205000000_enhance_team_management.sql`

### 2. Verify Tables Created

The migration creates these tables:
- `team_members` - Stores team member information
- `team_invitations` - Manages pending invitations
- `teams` - Team organization (optional)

## 📧 Email Integration

### Option 1: Supabase Edge Functions (Recommended)

Create an edge function to send invitation emails:

```bash
# Create the edge function
supabase functions new send-team-invitation
```

**File: `supabase/functions/send-team-invitation/index.ts`**
```typescript
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
    const { invitation_id } = await req.json()
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get invitation details
    const { data: invitation, error } = await supabaseClient
      .from('team_invitations')
      .select(`
        *,
        subscriptions!inner(
          users!subscriptions_user_id_fkey(name, email, agency_name)
        )
      `)
      .eq('id', invitation_id)
      .single()

    if (error || !invitation) {
      throw new Error('Invitation not found')
    }

    // Send email using your preferred email service
    // Example with Resend:
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'noreply@yourdomain.com',
        to: invitation.email,
        subject: `You're invited to join ${invitation.subscriptions.users.agency_name || 'our team'} on AItinerary`,
        html: `
          <h2>Team Invitation</h2>
          <p>Hi there!</p>
          <p>${invitation.subscriptions.users.name} has invited you to join their team on AItinerary.</p>
          <p><strong>Your Role:</strong> ${invitation.role}</p>
          <p><strong>Team:</strong> ${invitation.subscriptions.users.agency_name || 'Travel Agency'}</p>
          <br>
          <a href="${Deno.env.get('FRONTEND_URL')}/team-invitation?token=${invitation.token}" 
             style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Accept Invitation
          </a>
          <br><br>
          <p>This invitation expires on ${new Date(invitation.expires_at).toLocaleDateString()}</p>
        `
      })
    })

    if (!emailResponse.ok) {
      throw new Error('Failed to send email')
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

### Option 2: Update TeamService to Send Emails

Update the `sendInvitationEmail` method in `src/lib/teamService.ts`:

```typescript
// Send invitation email
static async sendInvitationEmail(invitation: TeamInvitation) {
  try {
    // Call your email service or edge function
    const response = await fetch('/api/send-team-invitation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        invitation_id: invitation.id
      })
    });

    if (!response.ok) {
      throw new Error('Failed to send invitation email');
    }

    toast.success(`Invitation sent to ${invitation.email}`);
  } catch (error) {
    console.error('Error sending invitation email:', error);
    toast.error('Failed to send invitation email');
  }
}
```

## 🔧 Environment Variables

Add these to your `.env` file:

```env
# Email service (choose one)
RESEND_API_KEY=your_resend_api_key
SENDGRID_API_KEY=your_sendgrid_api_key

# Frontend URL for invitation links
FRONTEND_URL=http://localhost:3000
```

## 🚀 Usage Instructions

### For Team Owners (Agency/Enterprise Plans)

1. **Access Team Management**
   - Go to Settings → Team Management
   - Only available for Agency and Enterprise plans

2. **Invite Team Members**
   - Click "Invite Member"
   - Enter email address and select role (Admin/Member)
   - Click "Send Invitation"

3. **Manage Team Members**
   - View all team members and their roles
   - Change member roles (Admin ↔ Member)
   - Remove team members
   - Cancel pending invitations

### For Team Members

1. **Receive Invitation**
   - Check email for invitation link
   - Click the invitation link or visit `/team-invitation?token=...`

2. **Accept Invitation**
   - Review team and role information
   - Click "Accept Invitation"
   - Get redirected to dashboard with team access

3. **Team Access**
   - Access shared resources based on role
   - View team information in Settings

## 🔐 Role-Based Permissions

### Owner (Subscription Owner)
- Full access to all features
- Manage team members and invitations
- View team analytics
- Manage subscription and billing

### Admin
- Manage team members and invitations
- Access all team resources
- View team analytics
- Cannot manage subscription/billing

### Member
- Create and manage itineraries
- Access shared media library
- View team bookings and quotes
- Cannot manage team or view analytics

## 📱 Frontend Integration

### 1. Add Route

Add the team invitation route to your router:

```typescript
// In your router configuration
import TeamInvitation from '@/pages/TeamInvitation';

// Add this route
{
  path: '/team-invitation',
  element: <TeamInvitation />
}
```

### 2. Update Settings Page

The TeamManagement component is already integrated into the Settings page for Agency/Enterprise users.

### 3. Navigation Updates

Add team-related navigation items for team members:

```typescript
// Show team info in navigation for team members
const { data: teamMembership } = await supabase
  .from('team_members')
  .select('*')
  .eq('user_id', user.id)
  .eq('status', 'active')
  .single();

if (teamMembership) {
  // Show team indicator in navigation
}
```

## 🧪 Testing

### 1. Test Team Invitation Flow

1. Create an Agency/Enterprise subscription
2. Go to Settings → Team Management
3. Invite a team member
4. Check email for invitation link
5. Accept invitation with different account
6. Verify team access

### 2. Test Role Permissions

1. Create multiple team members with different roles
2. Test admin vs member permissions
3. Verify role changes work correctly

### 3. Test Edge Cases

1. Expired invitations
2. Duplicate invitations
3. Invalid tokens
4. Team member limits

## 🔧 Troubleshooting

### Common Issues

1. **Invitation emails not sending**
   - Check email service API keys
   - Verify edge function deployment
   - Check browser console for errors

2. **Database permission errors**
   - Ensure RLS policies are correct
   - Check service role key permissions
   - Verify table relationships

3. **Team members not appearing**
   - Check subscription plan type
   - Verify user authentication
   - Check team member status

### Debug Commands

```sql
-- Check team members
SELECT * FROM team_members WHERE subscription_id = 'your-subscription-id';

-- Check pending invitations
SELECT * FROM team_invitations WHERE status = 'pending';

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'team_members';
```

## 📈 Next Steps

### Advanced Features to Consider

1. **Team Analytics Dashboard**
   - Team usage statistics
   - Member activity tracking
   - Performance metrics

2. **Advanced Permissions**
   - Resource-level permissions
   - Custom role definitions
   - Permission inheritance

3. **Team Communication**
   - In-app messaging
   - Team announcements
   - Activity feeds

4. **Bulk Operations**
   - Bulk member invitations
   - Bulk role updates
   - Team data export

### Integration Ideas

1. **Slack/Teams Integration**
   - Automatic team notifications
   - Status updates
   - Activity sync

2. **SSO Integration**
   - Single sign-on for team members
   - Domain-based invitations
   - Enterprise authentication

3. **API Access**
   - Team management API
   - Webhook notifications
   - Third-party integrations

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review Supabase logs for errors
3. Verify all environment variables are set
4. Test with a fresh database if needed

For additional help, refer to:
- Supabase documentation
- Your email service provider docs
- React/TypeScript documentation 