import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Users, Mail, Shield } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface InvitationData {
  id: string;
  email: string;
  role: string;
  teamName: string;
  invitedBy: string;
  expiresAt: string;
}

export default function TeamInvitation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (!token) {
      setError('No invitation token provided');
      setLoading(false);
      return;
    }

    validateInvitation();
  }, [token]);

  const validateInvitation = async () => {
    try {
      console.log('Validating invitation with token:', token);
      
      // Get invitation details directly from Supabase
      const { data: invitationData, error: invitationError } = await supabase
        .from('team_invitations')
        .select(`
          *,
          teams!team_invitations_team_id_fkey(name, agency_name)
        `)
        .eq('token', token)
        .eq('status', 'pending')
        .single();

      console.log('Invitation query result:', { invitationData, invitationError });

      if (invitationError || !invitationData) {
        console.error('Invitation not found or error:', invitationError);
        setError('Invalid or expired invitation');
        return;
      }

      // Check if invitation has expired
      if (new Date() > new Date(invitationData.expires_at)) {
        // Update invitation status to expired
        await supabase
          .from('team_invitations')
          .update({ status: 'expired' })
          .eq('id', invitationData.id);

        setError('Invitation has expired');
        return;
      }

      // Set invitation data
      setInvitation({
        id: invitationData.id,
        email: invitationData.email,
        role: invitationData.role,
        teamName: invitationData.teams?.agency_name || invitationData.teams?.name || 'Your Team',
        invitedBy: 'Team Admin', // We'll get this later if needed
        expiresAt: invitationData.expires_at
      });

      setFormData(prev => ({ ...prev, email: invitationData.email }));

    } catch (err) {
      console.error('Error validating invitation:', err);
      setError('Failed to validate invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!invitation) return;

    // Validate form
    if (!formData.name.trim()) {
      toast.error('Please enter your name');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.email.toLowerCase() !== invitation.email.toLowerCase()) {
      toast.error('Email must match the invitation');
      return;
    }

    setAccepting(true);

    try {
      // Get the team_id from the invitation first
      const { data: invitationData, error: invitationDataError } = await supabase
        .from('team_invitations')
        .select(`
          team_id, 
          role,
          teams!team_invitations_team_id_fkey(name, agency_name)
        `)
        .eq('id', invitation.id)
        .single();

      console.log('Invitation data for team assignment:', invitationData);

      if (invitationDataError || !invitationData?.team_id) {
        console.error('Invitation data error:', invitationDataError);
        setError('Invalid invitation: team not found');
        toast.error('Invalid invitation: team not found');
        return;
      }

      console.log('Adding user to team:', invitationData.team_id);

      // Create new user WITHOUT team_id in metadata (to prevent auto-team creation)
      const { data: newUser, error: createUserError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            agency_name: invitationData.teams?.agency_name || invitationData.teams?.name
            // Don't include team_id here to prevent auto-team creation
          }
        }
      });

      if (createUserError) {
        setError(`Failed to create user: ${createUserError.message}`);
        toast.error(`Failed to create user: ${createUserError.message}`);
        return;
      }

      if (!newUser.user?.id) {
        setError('Failed to create user account');
        toast.error('Failed to create user account');
        return;
      }

      // Add user to the EXISTING team (not create a new one)
      const teamMemberData = {
        team_id: invitationData.team_id, // Use the team from the invitation
        user_id: newUser.user.id,
        email: formData.email,
        name: formData.name,
        role: invitationData.role, // Use role from invitation
        status: 'active',
        joined_at: new Date().toISOString()
      };

      console.log('Creating team member with data:', teamMemberData);

      const { error: addMemberError } = await supabase
        .from('team_members')
        .insert(teamMemberData);

      if (addMemberError) {
        console.error('Error adding user to team:', addMemberError);
        setError(`Failed to add user to team: ${addMemberError.message}`);
        toast.error(`Failed to add user to team: ${addMemberError.message}`);
        return;
      }

      console.log('Successfully added user to team');

      // Update invitation status to accepted
      await supabase
        .from('team_invitations')
        .update({ 
          status: 'accepted',
          updated_at: new Date().toISOString()
        })
        .eq('id', invitation.id);

      console.log('Invitation marked as accepted');

      // Verify the user was added to the correct team
      const { data: verifyTeamMember, error: verifyError } = await supabase
        .from('team_members')
        .select('team_id, role')
        .eq('user_id', newUser.user.id)
        .eq('team_id', invitationData.team_id)
        .single();

      if (verifyError || !verifyTeamMember) {
        console.error('Verification failed:', verifyError);
        setError('Failed to verify team membership');
        toast.error('Failed to verify team membership');
        return;
      }

      console.log('Team membership verified:', verifyTeamMember);

      const teamDisplayName = invitationData.teams?.agency_name || invitationData.teams?.name || 'the team';
      toast.success(`Account created successfully! Welcome to ${teamDisplayName}!`);
      
      // Sign in the user
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (signInError) {
        console.error('Error signing in:', signInError);
        // Still redirect to dashboard, user can sign in manually
      }

      // Redirect to dashboard
      navigate('/dashboard');

    } catch (err) {
      console.error('Error accepting invitation:', err);
      setError('Failed to accept invitation');
      toast.error('Failed to accept invitation');
    } finally {
      setAccepting(false);
    }
  };

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'sales': return 'Sales Consultant';
      case 'operations': return 'Operations';
      case 'member': return 'Team Member';
      default: return role;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <Card className="w-full max-w-md">
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-lg">Validating invitation...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <Card className="w-full max-w-md">
          <CardContent className="p-8">
            <div className="text-center">
              <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Invalid Invitation</h2>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Button onClick={() => navigate('/login')} className="w-full">
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">You're Invited!</CardTitle>
          <CardDescription>
            Join <strong>{invitation.teamName}</strong>
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Invitation Details */}
          <div className="bg-muted/30 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Invited by</p>
                <p className="text-sm text-muted-foreground">{invitation.invitedBy}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Role</p>
                <p className="text-sm text-muted-foreground">{getRoleDisplay(invitation.role)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Expires</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(invitation.expiresAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Account Creation Form */}
          <form onSubmit={handleAcceptInvitation} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter your email"
                required
                disabled
              />
              <p className="text-xs text-muted-foreground">
                Email is locked to match the invitation
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Create a password"
                required
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Confirm your password"
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={accepting}
            >
              {accepting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Accept Invitation & Create Account'
              )}
            </Button>
          </form>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Button 
                variant="link" 
                className="p-0 h-auto text-sm"
                onClick={() => navigate('/login')}
              >
                Sign in here
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 