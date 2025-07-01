import { supabase } from './supabase';
import { toast } from 'sonner';

export interface TeamMember {
  id: string;
  subscription_id: string;
  user_id?: string;
  email: string;
  name?: string;
  role: 'owner' | 'admin' | 'member';
  status: 'active' | 'invited' | 'inactive';
  invited_at: string;
  joined_at?: string;
  invited_by?: string;
}

export interface TeamInvitation {
  id: string;
  subscription_id: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  invited_by: string;
  token: string;
  expires_at: string;
  status: 'pending' | 'accepted' | 'expired';
  created_at: string;
}

export interface Team {
  id: string;
  subscription_id: string;
  name: string;
  owner_id: string;
  max_members: number;
  created_at: string;
}

export class TeamService {
  // Get current user's team membership
  static async getCurrentUserTeam() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: teamMember, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (error) {
      console.error('Error getting team membership:', error);
      return null;
    }

    return teamMember;
  }

  // Get team members for a subscription (owner only)
  static async getTeamMembers(subscriptionId: string) {
    const { data, error } = await supabase
      .from('team_members')
      .select(`
        *,
        users!team_members_user_id_fkey(name, email)
      `)
      .eq('subscription_id', subscriptionId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting team members:', error);
      throw error;
    }

    return data;
  }

  // Get pending invitations for a subscription
  static async getPendingInvitations(subscriptionId: string) {
    const { data, error } = await supabase
      .from('team_invitations')
      .select('*')
      .eq('subscription_id', subscriptionId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting invitations:', error);
      throw error;
    }

    return data;
  }

  // Invite a team member
  static async inviteTeamMember(
    subscriptionId: string,
    email: string,
    role: 'admin' | 'member' = 'member'
  ) {
    try {
      // Check if user is already a team member
      const { data: existingMember } = await supabase
        .from('team_members')
        .select('id')
        .eq('subscription_id', subscriptionId)
        .eq('email', email)
        .single();

      if (existingMember) {
        throw new Error('User is already a team member');
      }

      // Check if there's already a pending invitation
      const { data: existingInvitation } = await supabase
        .from('team_invitations')
        .select('id')
        .eq('subscription_id', subscriptionId)
        .eq('email', email)
        .eq('status', 'pending')
        .single();

      if (existingInvitation) {
        throw new Error('Invitation already sent to this email');
      }

      // Create invitation using the API endpoint (to get inviteLink)
      // Get current user info for inviterName
      const { data: { user } } = await supabase.auth.getUser();
      let inviterName = user?.user_metadata?.name || user?.email || 'AItinerary Admin';

      // Get team/agency name from subscription
      let teamName = 'Your Team';
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('agency_name')
        .eq('id', subscriptionId)
        .single();
      if (subscription?.agency_name) teamName = subscription.agency_name;

      // Call backend to create invitation and get inviteLink
      const response = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription_id: subscriptionId,
          email,
          role,
          invited_by: user?.id
        })
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to create invitation');
      }
      const invitation = result.invitation;
      const inviteLink = result.inviteLink;

      // Send invitation email
      await this.sendInvitationEmail({
        ...invitation,
        inviteLink,
        inviterName,
        teamName
      });

      return invitation;
    } catch (error: any) {
      console.error('Error inviting team member:', error);
      throw error;
    }
  }

  // Send invitation email using backend API
  static async sendInvitationEmail(invitation: any) {
    try {
      const { email, inviteLink, inviterName, teamName } = invitation;
      const response = await fetch('/api/send-team-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, inviteLink, inviterName, teamName })
      });
      if (!response.ok) {
        throw new Error('Failed to send invitation email');
      }
      toast.success(`Invitation sent to ${email}`);
    } catch (error: any) {
      console.error('Error sending invitation email:', error);
      toast.error('Failed to send invitation email');
    }
  }

  // Accept team invitation
  static async acceptInvitation(token: string) {
    try {
      const { data, error } = await supabase.rpc('accept_team_invitation', {
        p_token: token
      });

      if (error) {
        console.error('Error accepting invitation:', error);
        throw error;
      }

      if (data) {
        toast.success('Successfully joined the team!');
        return true;
      } else {
        toast.error('Invalid or expired invitation');
        return false;
      }
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      toast.error('Failed to accept invitation');
      return false;
    }
  }

  // Remove team member
  static async removeTeamMember(teamMemberId: string) {
    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', teamMemberId);

      if (error) {
        console.error('Error removing team member:', error);
        throw error;
      }

      toast.success('Team member removed successfully');
      return true;
    } catch (error: any) {
      console.error('Error removing team member:', error);
      toast.error('Failed to remove team member');
      return false;
    }
  }

  // Update team member role
  static async updateTeamMemberRole(teamMemberId: string, role: 'admin' | 'member') {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ role, updated_at: new Date().toISOString() })
        .eq('id', teamMemberId);

      if (error) {
        console.error('Error updating team member role:', error);
        throw error;
      }

      toast.success('Team member role updated successfully');
      return true;
    } catch (error: any) {
      console.error('Error updating team member role:', error);
      toast.error('Failed to update team member role');
      return false;
    }
  }

  // Cancel pending invitation
  static async cancelInvitation(invitationId: string) {
    try {
      const { error } = await supabase
        .from('team_invitations')
        .update({ 
          status: 'expired', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', invitationId);

      if (error) {
        console.error('Error canceling invitation:', error);
        throw error;
      }

      toast.success('Invitation canceled successfully');
      return true;
    } catch (error: any) {
      console.error('Error canceling invitation:', error);
      toast.error('Failed to cancel invitation');
      return false;
    }
  }

  // Get team subscription details
  static async getTeamSubscription(subscriptionId: string) {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single();

    if (error) {
      console.error('Error getting subscription:', error);
      throw error;
    }

    return data;
  }

  // Check if user can manage team
  static async canManageTeam(subscriptionId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('user_id, plan_type')
      .eq('id', subscriptionId)
      .single();

    if (!subscription) return false;

    // Owner can always manage
    if (subscription.user_id === user.id) return true;

    // Check if user is admin on this team
    const { data: teamMember } = await supabase
      .from('team_members')
      .select('role')
      .eq('subscription_id', subscriptionId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    return teamMember?.role === 'admin';
  }
} 