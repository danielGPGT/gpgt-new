import { supabase } from './supabase';
import { toast } from 'sonner';

export interface TeamMember {
  id: string;
  team_id?: string;
  subscription_id?: string;
  user_id?: string;
  email: string;
  name?: string;
  phone?: string;
  role: 'owner' | 'admin' | 'member' | 'sales' | 'operations';
  status: 'active' | 'invited' | 'inactive';
  invited_at: string;
  joined_at?: string;
  invited_by?: string;
}

export interface TeamInvitation {
  id: string;
  team_id?: string;
  subscription_id?: string;
  email: string;
  role: 'owner' | 'admin' | 'member' | 'sales' | 'operations';
  invited_by: string;
  token: string;
  expires_at: string;
  status: 'pending' | 'accepted' | 'expired';
  created_at: string;
}

export interface EventConsultant {
  id: string;
  event_id: string;
  consultant_id: string;
  assigned_by: string;
  assigned_at: string;
  notes?: string;
  status: 'active' | 'inactive' | 'completed';
  created_at: string;
  updated_at: string;
  consultant?: TeamMember;
  team_member?: TeamMember; // Add this line to match the Supabase join
  event?: {
    id: string;
    name: string;
    location?: string;
    start_date?: string;
    end_date?: string;
  };
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
    role: 'admin' | 'member' | 'sales' | 'operations' = 'member'
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
  static async updateTeamMemberRole(teamMemberId: string, role: 'admin' | 'member' | 'sales' | 'operations') {
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

  // Consultant Management Methods

  // Get team consultants (sales team members)
  static async getTeamConsultants(teamId: string): Promise<TeamMember[]> {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', teamId)
      .eq('role', 'sales')
      .eq('status', 'active')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error getting team consultants:', error);
      throw error;
    }

    return data || [];
  }

  // Assign consultant to event
  static async assignConsultantToEvent(
    eventId: string,
    consultantId: string,
    notes?: string
  ): Promise<string> {
    const { data, error } = await supabase.rpc('assign_consultant_to_event', {
      p_event_id: eventId,
      p_consultant_id: consultantId,
      p_notes: notes
    });

    if (error) {
      console.error('Error assigning consultant to event:', error);
      throw error;
    }

    return data;
  }

  // Get events for a consultant
  static async getConsultantEvents(consultantId: string): Promise<any[]> {
    const { data, error } = await supabase.rpc('get_consultant_events', {
      p_consultant_id: consultantId
    });

    if (error) {
      console.error('Error getting consultant events:', error);
      throw error;
    }

    return data || [];
  }

  // Get event consultants
  static async getEventConsultants(eventId: string): Promise<EventConsultant[]> {
    const { data, error } = await supabase
      .from('event_consultants')
      .select(`
        *,
        team_member:consultant_id(*),
        event:events(id, name, location, start_date, end_date)
      `)
      .eq('event_id', eventId)
      .eq('status', 'active')
      .order('assigned_at', { ascending: false });

    if (error) {
      console.error('Error getting event consultants:', error);
      throw error;
    }

    return data || [];
  }

  // Remove consultant from event
  static async removeConsultantFromEvent(eventId: string, consultantId: string): Promise<boolean> {
    const { error } = await supabase
      .from('event_consultants')
      .update({ 
        status: 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('event_id', eventId)
      .eq('consultant_id', consultantId);

    if (error) {
      console.error('Error removing consultant from event:', error);
      throw error;
    }

    return true;
  }

  // Check if user is a consultant
  static async isConsultant(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('team_members')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'sales')
      .eq('status', 'active')
      .single();

    if (error) {
      console.error('Error checking if user is consultant:', error);
      return false;
    }

    return !!data;
  }

  // Get consultant's assigned events
  static async getMyConsultantEvents(): Promise<any[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: teamMember } = await supabase
      .from('team_members')
      .select('id')
      .eq('user_id', user.id)
      .eq('role', 'sales')
      .eq('status', 'active')
      .single();

    if (!teamMember) return [];

    return this.getConsultantEvents(teamMember.id);
  }
} 