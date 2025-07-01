import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { 
  CreditCard, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Crown,
  Users,
  Globe,
  Loader2,
  Settings,
  TrendingUp,
  TrendingDown,
  Info,
  Building2,
  Sparkles,
  Shield,
  Zap,
  Star,
  Rocket,
  UserPlus,
  Mail,
  MoreHorizontal,
  X,
  Trash2,
  User
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useStripeSubscription } from '@/hooks/useStripeSubscription';
import { useAuth } from '@/lib/AuthProvider';
import { toast } from 'sonner';
import { TeamService, TeamMember, TeamInvitation } from '@/lib/teamService';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { StripeService } from '@/lib/stripeService';

export function SubscriptionManager() {
  const { user } = useAuth();
  const {
    subscription: subscriptionFromHook,
    loading: loadingFromHook,
    processing,
    createSubscription,
    updateSubscription,
    cancelSubscription,
    openBillingPortal,
    loadSubscription,
    getCurrentPlan,
    getPlanPrice,
    getPlanFeatures,
    isSubscriptionActive,
    isSubscriptionCanceled,
    getDaysUntilRenewal,
    getFormattedRenewalDate,
  } = useStripeSubscription();

  const [team, setTeam] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [teamRole, setTeamRole] = useState<string | null>(null);

  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showPlanChangeDialog, setShowPlanChangeDialog] = useState(false);
  const [planChangeType, setPlanChangeType] = useState<'upgrade' | 'downgrade'>('upgrade');
  const [targetPlan, setTargetPlan] = useState<'free' | 'pro' | 'agency' | 'enterprise'>('pro');

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [canManage, setCanManage] = useState(false);
  
  // Invitation form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
  const [inviting, setInviting] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);

  const isTeamPlan = subscription && ['agency', 'enterprise'].includes(subscription.plan_type);

  useEffect(() => {
    if (user) {
      loadTeamAndSubscription(user.id);
      fetchRole(user.id);
      fetchTeamData(user.id);
    }
  }, [user]);

  async function fetchRole(userId: string) {
    console.log('Fetching role for user:', userId);
    
    // First, let's check if the user exists in public.users
    const { data: publicUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
    
    console.log('Public user check:', { publicUser, userError });
    
    // Now check team_members with the correct user_id
    const { data: member, error } = await supabase
      .from('team_members')
      .select('role, team_id, user_id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();
    
    console.log('Team member fetch result:', { member, error });
    
    if (!member) {
      console.log('No team member found for user:', userId);
      // Let's also check if there are any team_members records for this user regardless of status
      const { data: allMembers } = await supabase
        .from('team_members')
        .select('role, team_id, user_id, status')
        .eq('user_id', userId);
      console.log('All team members for user:', allMembers);
    }
    
    setTeamRole(member?.role || null);
    console.log('Set teamRole to:', member?.role || null);
  }

  async function loadTeamAndSubscription(userId: string) {
    setLoading(true);
    
    // First, check if user is a team member
    const { data: memberTeams } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', userId)
      .eq('status', 'active');
    
    let teamData = null;
    
    if (memberTeams && memberTeams.length > 0) {
      // User is a team member, get their team
      const memberTeamIds = memberTeams.map(tm => tm.team_id);
      const { data: teamsAsMember } = await supabase
        .from('teams')
        .select('id, owner_id, name, subscription_id')
        .in('id', memberTeamIds);
      if (teamsAsMember && teamsAsMember.length > 0) {
        teamData = teamsAsMember[0];
      }
    } else {
      // Check if user owns any teams
      const { data: ownedTeams } = await supabase
        .from('teams')
        .select('id, owner_id, name, subscription_id')
        .eq('owner_id', userId);
      if (ownedTeams && ownedTeams.length > 0) {
        teamData = ownedTeams[0];
      }
    }
    
    if (!teamData) {
      setTeam(null);
      setSubscription(null);
      setLoading(false);
      return;
    }
    
    setTeam(teamData);
    
    // Only query if subscription_id is not null
    if (!teamData.subscription_id) {
      setSubscription(null);
      setLoading(false);
      return;
    }
    
    // Get the team's subscription
    const { data: sub, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', teamData.subscription_id)
      .single();
    setSubscription(sub || null);
    setLoading(false);
  }

  async function fetchTeamData(userId: string) {
    try {
      // Get the user's team first
      const { data: member } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();
      
      if (member?.team_id) {
        // Fetch team members
        const { data: members } = await supabase
          .from('team_members')
          .select(`
            id,
            user_id,
            email,
            name,
            role,
            status,
            joined_at,
            created_at,
            team_id
          `)
          .eq('team_id', member.team_id)
          .eq('status', 'active');
        
        // Map the data to match TeamMember interface
        const mappedMembers = (members || []).map(member => ({
          id: member.id,
          subscription_id: member.team_id, // Use team_id as subscription_id for now
          user_id: member.user_id,
          email: member.email,
          name: member.name,
          role: member.role,
          status: member.status,
          invited_at: member.created_at,
          joined_at: member.joined_at
        }));
        
        setTeamMembers(mappedMembers);
        
        // Fetch pending invitations
        const { data: pendingInvitations } = await supabase
          .from('team_invitations')
          .select('*')
          .eq('team_id', member.team_id)
          .eq('status', 'pending');
        
        setInvitations(pendingInvitations || []);
      }
    } catch (error) {
      console.error('Error fetching team data:', error);
    }
  }

  const handleCancelSubscription = async () => {
    const result = await cancelSubscription();
    if (result.success) {
      setShowCancelDialog(false);
    }
  };

  const handlePlanChange = async (newPlan: 'free' | 'pro' | 'agency' | 'enterprise') => {
    const currentPlan = getCurrentPlan();
    
    if (newPlan === currentPlan) {
      toast.info('You are already on this plan');
      return;
    }

    const planHierarchy = ['free', 'pro', 'agency', 'enterprise'];
    const isUpgrade = planHierarchy.indexOf(newPlan) > planHierarchy.indexOf(currentPlan);

    setPlanChangeType(isUpgrade ? 'upgrade' : 'downgrade');
    setTargetPlan(newPlan);
    setShowPlanChangeDialog(true);
  };

  const confirmPlanChange = async () => {
    if (!user?.email) {
      toast.error('User email not found');
      return;
    }

    try {
      const result = await updateSubscription(targetPlan);
      
      if (result.success) {
        setShowPlanChangeDialog(false);
        const isUpgrade = planChangeType === 'upgrade';
        toast.success(`Successfully ${isUpgrade ? 'upgraded' : 'downgraded'} to ${targetPlan} plan`);
        await loadSubscription();
      } else {
        toast.error(result.error || 'Failed to change plan');
      }
    } catch (error) {
      console.error('Error changing plan:', error);
      toast.error('Failed to change plan');
    }
  };

  const getLocalPlanFeatures = (plan: string) => {
    // Fallback to hardcoded features if Stripe data is not available
    switch (plan) {
      case 'free':
        return {
          price: '£0',
          features: [
            'Basic booking tools with markup',
            'AI itinerary generator',
            '5 itineraries per month',
            '10 PDF downloads per month',
            'Basic AI recommendations',
            'Standard templates',
            'Email support'
          ],
          limitations: [
            'No Media Library access',
            'No custom branding',
            'No API access',
            'No priority support',
            'No team collaboration'
          ]
        };
      case 'pro':
        return {
          price: '£39',
          features: [
            'All Free features',
            'PDF branding & customization',
            'Logo upload & management',
            'Custom portal branding',
            'Unlimited itineraries',
            'Unlimited PDF downloads',
            'Full Media Library access',
            'Advanced AI features',
            'Analytics dashboard (1 year)',
            'API access (1000 calls/month)',
            'Priority support',
            'Bulk operations'
          ],
          limitations: []
        };
      case 'agency':
        return {
          price: '£99 + £10/seat',
          features: [
            'All Pro features',
            'Multi-seat dashboard (up to 10 seats)',
            'Team collaboration tools',
            'Role-based permissions',
            'Shared media library',
            'Team analytics & reporting',
            'Bulk team operations',
            'Advanced team management',
            'Dedicated team support'
          ],
          limitations: [
            'Limited to 10 team members',
            'No custom integrations'
          ]
        };
      case 'enterprise':
        return {
          price: 'Custom',
          features: [
            'All Agency features',
            'Unlimited seats',
            'API access',
            'Premium support',
            'Custom integrations',
            'White-label solution',
            'Dedicated account manager',
            'Training & onboarding',
            'SLA guarantee',
            'Advanced security',
            'Custom AI training',
            '24/7 phone support'
          ],
          limitations: []
        };
      default:
        return { price: '', features: [], limitations: [] };
    }
  };

  const getPlanComparison = (currentPlan: string, targetPlan: string) => {
    const current = getLocalPlanFeatures(currentPlan);
    const target = getLocalPlanFeatures(targetPlan);
    
    const planHierarchy = ['free', 'pro', 'agency', 'enterprise'];
    if (planHierarchy.indexOf(targetPlan) > planHierarchy.indexOf(currentPlan)) {
      // Upgrade
      return {
        type: 'upgrade',
        gains: target.features.filter((f: string) => !current.features.includes(f)),
        losses: []
      };
    } else {
      // Downgrade
      return {
        type: 'downgrade',
        gains: [],
        losses: current.features.filter((f: string) => !target.features.includes(f))
      };
    }
  };

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'free':
        return <Users className="h-5 w-5" />;
      case 'pro':
        return <Crown className="h-5 w-5" />;
      case 'agency':
        return <Building2 className="h-5 w-5" />;
      case 'enterprise':
        return <Globe className="h-5 w-5" />;
      default:
        return <Users className="h-5 w-5" />;
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'free':
        return 'from-blue-500 to-cyan-500';
      case 'pro':
        return 'from-purple-500 to-pink-500';
      case 'agency':
        return 'from-green-500 to-emerald-500';
      case 'enterprise':
        return 'from-orange-500 to-red-500';
      default:
        return 'from-blue-500 to-cyan-500';
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 border border-primary/20">
            <CreditCard className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-2xl font-bold mb-2">Subscription Management</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Manage your subscription, billing, and plan features.
          </p>
        </div>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-12">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-lg">Loading subscription...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentPlan = getCurrentPlan();
  const daysUntilRenewal = getDaysUntilRenewal();
  const renewalDate = getFormattedRenewalDate();

  // Handler and badge color functions (team-centric)
  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team || !inviteEmail.trim() || !user) return;
    try {
      setInviting(true);
      await TeamService.inviteTeamMember(team.id, inviteEmail.trim(), inviteRole);
      // Refresh data
      await loadTeamAndSubscription(user.id);
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
    if (!confirm('Are you sure you want to remove this team member?') || !user) return;
    try {
      await TeamService.removeTeamMember(memberId);
      await loadTeamAndSubscription(user.id);
    } catch (error) {
      console.error('Error removing team member:', error);
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: 'admin' | 'member') => {
    if (!user) return;
    try {
      await TeamService.updateTeamMemberRole(memberId, newRole);
      await loadTeamAndSubscription(user.id);
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!confirm('Are you sure you want to cancel this invitation?') || !user) return;
    try {
      await TeamService.cancelInvitation(invitationId);
      await loadTeamAndSubscription(user.id);
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

  return (
    <div className="space-y-6">
      {/* Current Subscription Status */}
      <Card className="bg-gradient-to-b from-card/95 to-background/20 border border-border rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            Current Subscription
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getPlanColor(currentPlan)} flex items-center justify-center text-white shadow-lg`}>
                {getPlanIcon(currentPlan)}
              </div>
              <div>
                <div className="font-semibold text-lg capitalize">{currentPlan} Plan</div>
                <div className="text-sm text-muted-foreground">
                  {isSubscriptionActive() ? 'Active' : 'Inactive'}
                </div>
              </div>
            </div>
            <Badge 
              variant={isSubscriptionActive() ? 'default' : 'secondary'}
              className={`${isSubscriptionActive() ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'} px-3 py-1 rounded-full`}
            >
              {isSubscriptionActive() ? 'Active' : 'Inactive'}
            </Badge>
          </div>

          {isSubscriptionCanceled() && (
            <Alert className="border-yellow-200 bg-yellow-50/50 rounded-xl">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                Your subscription will be canceled at the end of the current billing period.
              </AlertDescription>
            </Alert>
          )}

          {renewalDate && (
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border border-border/50">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <div className="font-medium text-sm">
                  {isSubscriptionCanceled() ? 'Access until' : 'Next billing'} {renewalDate}
                </div>
                {daysUntilRenewal !== null && (
                  <div className="text-xs text-muted-foreground">
                    {daysUntilRenewal} days remaining
                  </div>
                )}
              </div>
            </div>
          )}

          {isSubscriptionActive() && (
            <Button 
              className="w-full bg-primary hover:bg-primary/90 rounded-xl" 
              onClick={openBillingPortal}
              disabled={processing}
            >
              {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
              <span className="ml-2">Manage Billing & Invoices</span>
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Plan Management */}
      {currentPlan !== 'free' as string && (teamRole === 'admin' || teamRole === 'owner') && (
        <Card className="bg-gradient-to-b from-card/95 to-background/20 border border-border rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings className="h-5 w-5 text-primary" />
              Plan Management
            </CardTitle>
            <CardDescription>
              Change your plan to better suit your business needs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Free Plan */}
              <div className={`p-6 rounded-xl border-2 transition-all duration-300 hover:shadow-lg ${
                currentPlan === 'free' 
                  ? 'border-blue-500 bg-blue-50/50 shadow-lg scale-105' 
                  : 'border-border bg-card/50 hover:border-blue-300'
              }`}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-white">
                    <Users className="h-4 w-4" />
                  </div>
                  <span className="font-semibold">Free</span>
                  {currentPlan === 'free' ? <CheckCircle className="h-4 w-4 text-blue-500" /> : null}
                </div>
                <div className="text-2xl font-bold mb-2">£0</div>
                <div className="text-sm text-muted-foreground mb-4">
                  Basic features for solo agents
                </div>
                {currentPlan !== 'free' ? (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full hover:bg-blue-50 rounded-xl"
                    onClick={() => handlePlanChange('free')}
                    disabled={processing}
                  >
                    {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingDown className="h-4 w-4" />}
                    Downgrade
                  </Button>
                ) : null}
              </div>

              {/* Pro Plan */}
              <div className={`p-6 rounded-xl border-2 transition-all duration-300 hover:shadow-lg ${
                currentPlan === 'pro' 
                  ? 'border-purple-500 bg-purple-50/50 shadow-lg scale-105' 
                  : 'border-border bg-card/50 hover:border-purple-300'
              }`}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white">
                    <Crown className="h-4 w-4" />
                  </div>
                  <span className="font-semibold">Pro</span>
                  {currentPlan === 'pro' ? <CheckCircle className="h-4 w-4 text-purple-500" /> : null}
                </div>
                <div className="text-2xl font-bold mb-2">£39</div>
                <div className="text-sm text-muted-foreground mb-4">
                  White-label features
                </div>
                {currentPlan !== 'pro' ? (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full hover:bg-purple-50 rounded-xl"
                    onClick={() => handlePlanChange('pro')}
                    disabled={processing}
                  >
                    {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : 
                      currentPlan === 'free' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    {currentPlan === 'free' ? 'Upgrade' : 'Downgrade'}
                  </Button>
                ) : null}
              </div>

              {/* Agency Plan */}
              <div className={`p-6 rounded-xl border-2 transition-all duration-300 hover:shadow-lg ${
                currentPlan === 'agency' 
                  ? 'border-green-500 bg-green-50/50 shadow-lg scale-105' 
                  : 'border-border bg-card/50 hover:border-green-300'
              }`}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center text-white">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <span className="font-semibold">Agency</span>
                  {currentPlan === 'agency' ? <CheckCircle className="h-4 w-4 text-green-500" /> : null}
                </div>
                <div className="text-2xl font-bold mb-2">£99+</div>
                <div className="text-sm text-muted-foreground mb-4">
                  Team collaboration
                </div>
                {currentPlan !== 'agency' ? (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full hover:bg-green-50 rounded-xl"
                    onClick={() => handlePlanChange('agency')}
                    disabled={processing}
                  >
                    {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4" />}
                    Upgrade
                  </Button>
                ) : null}
              </div>

              {/* Enterprise Plan */}
              <div className={`p-6 rounded-xl border-2 transition-all duration-300 hover:shadow-lg ${
                currentPlan === 'enterprise' 
                  ? 'border-orange-500 bg-orange-50/50 shadow-lg scale-105' 
                  : 'border-border bg-card/50 hover:border-orange-300'
              }`}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center text-white">
                    <Globe className="h-4 w-4" />
                  </div>
                  <span className="font-semibold">Enterprise</span>
                  {currentPlan === 'enterprise' ? <CheckCircle className="h-4 w-4 text-orange-500" /> : null}
                </div>
                <div className="text-2xl font-bold mb-2">Custom</div>
                <div className="text-sm text-muted-foreground mb-4">
                  Large organizations
                </div>
                {currentPlan !== 'enterprise' ? (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full hover:bg-orange-50 rounded-xl"
                    onClick={() => window.location.href = 'mailto:sales@luxetripbuilder.com?subject=Enterprise Plan Inquiry'}
                    disabled={processing}
                  >
                    Contact Sales
                  </Button>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Billing & Account */}
      {isSubscriptionActive() && (teamRole === 'admin' || teamRole === 'owner') && (
        <Card className="bg-gradient-to-b from-card/95 to-background/20 border border-border rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-primary" />
              Billing & Account
            </CardTitle>
            <CardDescription>
              Manage your billing information and account settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              variant="outline" 
              className="w-full justify-start h-12 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl"
              onClick={() => setShowCancelDialog(true)}
              disabled={processing}
            >
              <XCircle className="h-4 w-4 mr-3" />
              Cancel Subscription
            </Button>

            {isSubscriptionCanceled() && (
              <Button 
                variant="outline" 
                className="w-full justify-start h-12 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-xl"
                onClick={() => updateSubscription(currentPlan as 'free' | 'pro' | 'agency' | 'enterprise')}
                disabled={processing}
              >
                <CheckCircle className="h-4 w-4 mr-3" />
                Reactivate Subscription
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Show message for members who can't access billing/plan management */}
      {teamRole === 'member' && isSubscriptionActive() && (
        <Card className="bg-gradient-to-b from-card/95 to-background/20 border border-border rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Info className="h-5 w-5 text-primary" />
              Billing & Plan Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-2">
                Billing and plan management is restricted to team admins and owners.
              </p>
              <p className="text-sm text-muted-foreground">
                Contact your team admin if you need to make changes to your subscription or billing.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cancel Subscription Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Cancel Subscription
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Are you sure you want to cancel your subscription? You'll continue to have access until the end of your current billing period.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowCancelDialog(false)} className="rounded-xl">
                Keep Subscription
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleCancelSubscription}
                disabled={processing}
                className="rounded-xl"
              >
                {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Cancel Subscription'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Plan Change Confirmation Dialog */}
      <Dialog open={showPlanChangeDialog} onOpenChange={setShowPlanChangeDialog}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {planChangeType === 'upgrade' ? (
                <>
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Upgrade to {targetPlan.charAt(0).toUpperCase() + targetPlan.slice(1)}
                </>
              ) : (
                <>
                  <TrendingDown className="h-5 w-5 text-orange-600" />
                  Downgrade to {targetPlan.charAt(0).toUpperCase() + targetPlan.slice(1)}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {planChangeType === 'upgrade' ?
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">You'll gain access to:</span>
                  </div>
                  <ul className="space-y-2">
                    {getPlanComparison(getCurrentPlan(), targetPlan).gains.map((gain: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{gain}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-xl">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-800">You'll lose access to:</span>
                  </div>
                  <ul className="space-y-2">
                    {getPlanComparison(getCurrentPlan(), targetPlan).losses.map((loss: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <XCircle className="h-3 w-3 text-orange-600 mt-0.5 flex-shrink-0" />
                        <span>{loss}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-end mt-6">
            <Button variant="outline" onClick={() => setShowPlanChangeDialog(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button 
              onClick={confirmPlanChange}
              disabled={processing}
              className="bg-primary hover:bg-primary/90 rounded-xl"
            >
              {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : 
                planChangeType === 'upgrade' ? 'Upgrade Now' : 'Downgrade Now'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Team Management */}
      {isTeamPlan && (
        <Card className="bg-gradient-to-b from-card/95 to-background/20 border border-border rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-primary" />
              Team Management
            </CardTitle>
            <CardDescription>
              Manage your team members and invitations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Only show invite and management controls for admin/owner */}
            {(teamRole === 'admin' || teamRole === 'owner') && (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Team Management</h3>
                  </div>
                  <Button 
                    onClick={() => setShowInviteForm(!showInviteForm)}
                    size="sm"
                    className="rounded-xl"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite Member
                  </Button>
                </div>

                {/* Invitation Form */}
                {showInviteForm && (
                  <Card className="bg-muted/30 border border-border/50">
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
                              className="rounded-xl"
                            />
                          </div>
                          <div>
                            <Label htmlFor="invite-role">Role</Label>
                            <Select value={inviteRole} onValueChange={(value: 'admin' | 'member') => setInviteRole(value)}>
                              <SelectTrigger className="rounded-xl">
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
                          <Button type="submit" disabled={inviting} className="rounded-xl">
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
                            className="rounded-xl"
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                )}

                {/* Team Members - always visible */}
                <Card className="bg-muted/30 border border-border/50">
                  <CardHeader>
                    <CardTitle className="text-base">Team Members ({teamMembers.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {teamMembers.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-8 w-8 mx-auto mb-2" />
                        <p>No team members yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {teamMembers.map((member) => (
                          <div key={member.id} className="flex items-center justify-between p-3 border rounded-xl">
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
                              {/* Only admin/owner can see remove/update controls */}
                              {(teamRole === 'admin' || teamRole === 'owner') && member.role !== 'owner' && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="rounded-xl">
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

                {/* Pending Invitations - admin/owner only */}
                {(teamRole === 'admin' || teamRole === 'owner') && invitations.length > 0 && (
                  <Card className="bg-muted/30 border border-border/50">
                    <CardHeader>
                      <CardTitle className="text-base">Pending Invitations ({invitations.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {invitations.map((invitation) => (
                          <div key={invitation.id} className="flex items-center justify-between p-3 border rounded-xl">
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
                                className="rounded-xl"
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

                {/* Team Info - always visible */}
                <Card className="bg-muted/30 border border-border/50">
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
              </>
            )}

            {/* Show read-only team info for members */}
            {teamRole === 'member' && (
              <>
                <Card className="bg-muted/30 border border-border/50">
                  <CardHeader>
                    <CardTitle className="text-base">Team Members ({teamMembers.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {teamMembers.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-8 w-8 mx-auto mb-2" />
                        <p>No team members yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {teamMembers.map((member) => (
                          <div key={member.id} className="flex items-center justify-between p-3 border rounded-xl">
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
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-muted/30 border border-border/50">
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

                <div className="text-muted-foreground text-sm mt-2">
                  You have view-only access to team information. Contact your team admin if you need to invite or remove team members.
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 