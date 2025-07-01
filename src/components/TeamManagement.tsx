import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Users, 
  UserPlus, 
  Mail, 
  MoreHorizontal, 
  X, 
  Trash2, 
  Shield, 
  User, 
  Loader2 
} from 'lucide-react';
import { TeamService, TeamMember, TeamInvitation } from '@/lib/teamService';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export const TeamManagement = () => {
  const [subscription, setSubscription] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [canManage, setCanManage] = useState(false);
  
  // Invitation form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
  const [inviting, setInviting] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);

  useEffect(() => {
    loadTeamData();
  }, []);

  const loadTeamData = async () => {
    try {
      setLoading(true);
      
      // Get user's subscription
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userSubscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!userSubscription) return;

      setSubscription(userSubscription);

      // Check if user can manage team
      const canManageTeam = await TeamService.canManageTeam(userSubscription.id);
      setCanManage(canManageTeam);

      if (canManageTeam) {
        // Load team members and invitations
        const [members, pendingInvitations] = await Promise.all([
          TeamService.getTeamMembers(userSubscription.id),
          TeamService.getPendingInvitations(userSubscription.id)
        ]);

        setTeamMembers(members || []);
        setInvitations(pendingInvitations || []);
      } else {
        // User is a team member, show their team info
        const teamMembership = await TeamService.getCurrentUserTeam();
        if (teamMembership) {
          setTeamMembers([teamMembership]);
        }
      }
    } catch (error) {
      console.error('Error loading team data:', error);
      toast.error('Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscription || !inviteEmail.trim()) return;

    try {
      setInviting(true);
      await TeamService.inviteTeamMember(subscription.id, inviteEmail.trim(), inviteRole);
      
      // Refresh data
      await loadTeamData();
      
      // Reset form
      setInviteEmail('');
      setInviteRole('member');
      setShowInviteForm(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return;

    try {
      await TeamService.removeTeamMember(memberId);
      await loadTeamData();
    } catch (error) {
      console.error('Error removing team member:', error);
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: 'admin' | 'member') => {
    try {
      await TeamService.updateTeamMemberRole(memberId, newRole);
      await loadTeamData();
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!confirm('Are you sure you want to cancel this invitation?')) return;

    try {
      await TeamService.cancelInvitation(invitationId);
      await loadTeamData();
    } catch (error) {
      console.error('Error canceling invitation:', error);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'admin': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'member': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'invited': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'inactive': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Team Management</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!subscription || (subscription.plan_type !== 'agency' && subscription.plan_type !== 'enterprise')) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Team Management</h3>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h4 className="text-lg font-medium mb-2">Team Management Not Available</h4>
              <p className="text-muted-foreground mb-4">
                Team management is only available for Agency and Enterprise plans.
              </p>
              <Button asChild>
                <a href="/pricing">Upgrade Your Plan</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Team Management</h3>
        </div>
        {canManage && (
          <Button 
            onClick={() => setShowInviteForm(!showInviteForm)}
            size="sm"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Member
          </Button>
        )}
      </div>

      {/* Invitation Form */}
      {showInviteForm && canManage && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invite Team Member</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInviteMember} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="invite-email">Email Address</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@agency.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="invite-role">Role</Label>
                  <Select value={inviteRole} onValueChange={(value: 'admin' | 'member') => setInviteRole(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={inviting}>
                  {inviting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Sending Invitation...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Send Invitation
                    </>
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowInviteForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Team Members ({teamMembers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {teamMembers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2" />
              <p>No team members yet</p>
              {canManage && (
                <Button 
                  onClick={() => setShowInviteForm(true)}
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                >
                  Invite Your First Member
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {member.name?.charAt(0) || member.email.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{member.name || 'Unknown'}</div>
                      <div className="text-sm text-muted-foreground">{member.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getRoleBadgeColor(member.role)}>
                      {member.role}
                    </Badge>
                    <Badge variant="outline" className={getStatusBadgeColor(member.status)}>
                      {member.status}
                    </Badge>
                    {canManage && member.role !== 'owner' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {member.role === 'member' && (
                            <DropdownMenuItem onClick={() => handleUpdateRole(member.id, 'admin')}>
                              <Shield className="h-4 w-4 mr-2" />
                              Make Admin
                            </DropdownMenuItem>
                          )}
                          {member.role === 'admin' && (
                            <DropdownMenuItem onClick={() => handleUpdateRole(member.id, 'member')}>
                              <User className="h-4 w-4 mr-2" />
                              Make Member
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleRemoveMember(member.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove Member
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {canManage && invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pending Invitations ({invitations.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{invitation.email}</div>
                      <div className="text-sm text-muted-foreground">
                        Invited {new Date(invitation.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getRoleBadgeColor(invitation.role)}>
                      {invitation.role}
                    </Badge>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleCancelInvitation(invitation.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Team Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Plan Type</Label>
              <p className="text-sm text-muted-foreground capitalize">{subscription.plan_type}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Max Team Members</Label>
              <p className="text-sm text-muted-foreground">
                {subscription.plan_type === 'agency' ? '10' : 'Unlimited'}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Current Members</Label>
              <p className="text-sm text-muted-foreground">{teamMembers.length}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Pending Invitations</Label>
              <p className="text-sm text-muted-foreground">{invitations.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 