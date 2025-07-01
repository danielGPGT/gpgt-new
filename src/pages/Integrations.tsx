import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Settings, 
  Plus, 
  Building2, 
  Users, 
  Activity,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Zap,
  Shield,
  Clock,
  TrendingUp,
  Globe,
  Sparkles,
  Crown,
  ExternalLink,
  RefreshCw,
  Loader2,
  DollarSign,
  MessageSquare,
  FileText,
  CreditCard,
  MapPin,
  Phone,
  Mail,
  Plane,
  Hotel,
  Car
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { HubSpotIntegration } from '@/components/integrations/HubSpotIntegration';
import { useTier } from '@/hooks/useTier';
import { 
  SiHubspot, 
  SiSalesforce, 
  SiZoho,
  SiGoogle,
  SiSlack,
  SiZoom,
  SiAsana,
  SiTrello,
  SiNotion,
  SiAirtable,
  SiStripe,
  SiPaypal,
  SiTwilio,
  SiSendgrid,
  SiMailchimp,
  SiIntercom,
  SiZendesk,
  SiWhatsapp,
  SiTelegram,
  SiDiscord
} from 'react-icons/si';
import { 
  FaMicrosoft,
  FaGoogle,
  FaApple,
  FaFacebook,
  FaInstagram,
  FaTwitter,
  FaLinkedin,
  FaYoutube,
  FaTiktok,
  FaRegSmile
} from 'react-icons/fa';
import { FiSearch, FiUsers, FiGlobe, FiMessageCircle, FiCreditCard, FiTrendingUp, FiGrid, FiInfo, FiLink, FiXCircle } from 'react-icons/fi';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { HubSpotService } from '@/lib/hubspotService';
import { Link } from 'react-router-dom';

const floatingIcons = [
  { icon: SiHubspot, className: 'bg-white shadow-lg', style: { left: 0, top: 0 } },
  { icon: SiStripe, className: 'bg-[#635bff] text-white', style: { left: 80, top: 20 } },
  { icon: SiGoogle, className: 'bg-[#34a853] text-white', style: { left: 160, top: 0 } },
  { icon: SiSlack, className: 'bg-white shadow-lg', style: { left: 40, top: 90 } },
  { icon: SiGoogle, className: 'bg-white shadow-lg', style: { left: 140, top: 100 } },
  { icon: SiNotion, className: 'bg-black text-white', style: { left: 200, top: 70 } },
  { icon: SiAirtable, className: 'bg-white shadow-lg', style: { left: 220, top: 140 } },
  { icon: SiIntercom, className: 'bg-[#5865f2] text-white', style: { left: 100, top: 160 } },
  { icon: SiMailchimp, className: 'bg-white shadow-lg', style: { left: 0, top: 160 } },
  { icon: SiPaypal, className: 'bg-[#003087] text-white', style: { left: 180, top: 180 } },
  { icon: SiSalesforce, className: 'bg-white shadow-lg', style: { left: 60, top: 200 } },
  { icon: FaRegSmile, className: 'bg-[#00e676] text-white', style: { left: 140, top: 220 } },
];

const categories = [
  { id: 'all', name: 'All', icon: FiGrid },
  { id: 'crm', name: 'CRM', icon: FiUsers },
  { id: 'travel', name: 'Travel', icon: FiGlobe },
  { id: 'communication', name: 'Communication', icon: FiMessageCircle },
  { id: 'payments', name: 'Payments', icon: FiCreditCard },
  { id: 'marketing', name: 'Marketing', icon: FiTrendingUp },
  { id: 'productivity', name: 'Productivity', icon: SiNotion },
];

const integrations = [
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'Sync contacts, deals, and companies from HubSpot CRM.',
    icon: SiHubspot,
    color: '#FF7A59',
    category: 'crm',
    comingSoon: false,
    getStatus: async (teamId: string) => HubSpotService.getIntegrationStatus(teamId),
    connect: async (teamId: string) => {
      // Start OAuth flow
      const state = Math.random().toString(36).substring(2, 15);
      localStorage.setItem('hubspot_oauth_state', state);
      localStorage.setItem('hubspot_team_id', teamId);
      const oauthUrl = HubSpotService.getOAuthUrl(teamId, state);
      window.location.href = oauthUrl;
    },
    disconnect: async (teamId: string) => {
      // Disconnect via service
      await HubSpotService.disconnect(teamId);
    },
    sync: async (teamId: string) => {
      // Trigger sync via service
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      
      const functionUrl = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL?.replace(/\/$/, '') + '/hubspot-sync' || '/functions/v1/hubspot-sync';
      
      const res = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ team_id: teamId }),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        data = { error: 'Non-JSON response', status: res.status };
      }

      if (res.ok) {
        toast.success(`Sync complete! Created: ${data.created}, Updated: ${data.updated}, Failed: ${data.failed}`);
        return data;
      } else {
        toast.error(`Sync failed: ${data.error || data.details || 'Unknown error'}`);
        throw new Error(data.error || 'Sync failed');
      }
    },
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'Connect with Salesforce CRM for lead and opportunity management.',
    icon: SiSalesforce,
    color: '#00A1E0',
    category: 'crm',
    comingSoon: true,
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'No-code payments, links & carts. Easy checkout for creators & businesses.',
    icon: SiStripe,
    color: '#635BFF',
    category: 'payments',
    comingSoon: true,
  },
  {
    id: 'paypal',
    name: 'PayPal',
    description: 'Accept PayPal payments for travel bookings.',
    icon: SiPaypal,
    color: '#003087',
    category: 'payments',
    comingSoon: true,
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Send notifications and updates to your Slack channels.',
    icon: SiSlack,
    color: '#611f69',
    category: 'communication',
    comingSoon: true,
  },
  {
    id: 'google',
    name: 'Google',
    description: 'Integrate with Google services for productivity and analytics.',
    icon: SiGoogle,
    color: '#4285F4',
    category: 'productivity',
    comingSoon: true,
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Sync travel itineraries and client information with Notion.',
    icon: SiNotion,
    color: '#000000',
    category: 'productivity',
    comingSoon: true,
  },
  {
    id: 'airtable',
    name: 'Airtable',
    description: 'Organize your travel data and workflows in Airtable.',
    icon: SiAirtable,
    color: '#18BFFF',
    category: 'productivity',
    comingSoon: true,
  },
  {
    id: 'intercom',
    name: 'Intercom',
    description: 'Chat with your customers and manage support tickets.',
    icon: SiIntercom,
    color: '#5865F2',
    category: 'communication',
    comingSoon: true,
  },
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    description: 'Send marketing emails and manage campaigns.',
    icon: SiMailchimp,
    color: '#FFE01B',
    category: 'marketing',
    comingSoon: true,
  },
];

export default function Integrations() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [teamId, setTeamId] = useState<string | null>(null);
  const [integrationStates, setIntegrationStates] = useState<Record<string, any>>({});
  const [dialogIntegration, setDialogIntegration] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loadingIntegration, setLoadingIntegration] = useState<string | null>(null);
  const [syncingIntegration, setSyncingIntegration] = useState<string | null>(null);
  const { currentPlan } = useTier();

  useEffect(() => {
    // Get the user's team ID
    const fetchTeamId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: teamMember } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();
      setTeamId(teamMember?.team_id || null);
    };
    fetchTeamId();
  }, []);

  useEffect(() => {
    if (!teamId) return;
    // For each integration with getStatus, fetch status
    integrations.forEach(async (integration) => {
      if (integration.getStatus) {
        const status = await integration.getStatus(teamId);
        setIntegrationStates((prev) => ({ ...prev, [integration.id]: status }));
      }
    });
  }, [teamId]);

  const handleConnect = async (integration: any) => {
    if (!teamId || !integration.connect) return;
    setLoadingIntegration(integration.id);
    try {
      await integration.connect(teamId);
    } finally {
      setLoadingIntegration(null);
    }
  };

  const handleDisconnect = async (integration: any) => {
    if (!teamId || !integration.disconnect) return;
    setLoadingIntegration(integration.id);
    try {
      await integration.disconnect(teamId);
      // Refresh status
      if (integration.getStatus) {
        const status = await integration.getStatus(teamId);
        setIntegrationStates((prev) => ({ ...prev, [integration.id]: status }));
      }
    } finally {
      setLoadingIntegration(null);
    }
  };

  const handleSync = async (integration: any) => {
    if (!teamId || !integration.sync) return;
    setSyncingIntegration(integration.id);
    try {
      await integration.sync(teamId);
      // Refresh status after sync
      if (integration.getStatus) {
        const status = await integration.getStatus(teamId);
        setIntegrationStates((prev) => ({ ...prev, [integration.id]: status }));
      }
    } finally {
      setSyncingIntegration(null);
    }
  };

  const filteredIntegrations = selectedCategory === 'all'
    ? integrations
    : integrations.filter(i => i.category === selectedCategory);

  const getTierRestrictions = () => {
    if (currentPlan === 'starter') {
      return {
        maxIntegrations: 3,
        currentIntegrations: 1,
        message: 'Upgrade to Pro to connect unlimited integrations'
      };
    }
    return {
      maxIntegrations: 50,
      currentIntegrations: integrations.length,
      message: null
    };
  };

  const restrictions = getTierRestrictions();

  if (loadingIntegration) {
    return (
      <div className="mx-auto px-8 pt-0 pb-8 space-y-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
            <p className="text-muted-foreground">Connecting to {loadingIntegration}...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!teamId) {
    return (
      <div className="mx-auto px-8 pt-0 pb-8 space-y-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="text-lg font-medium">No Team Found</h3>
            <p className="text-muted-foreground">
              You need to be part of a team to manage integrations.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto px-8 py-0 space-y-8">
      {/* Header */}
      <div className="flex flex-col pt-4 lg:flex-row justify-between items-start lg:items-end gap-6">
        <div>
          <h1 className="text-2xl font-bold">Integrations</h1>
          <p className="text-muted-foreground mt-2">
            Connect powerful tools to your workspace
          </p>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="flex flex-col md:flex-row gap-8 pb-16">
        {/* Sidebar - Categories */}
        <aside className="w-full md:w-64 mb-8 md:mb-0">
          <div className="sticky top-24">
            <h2 className="text-lg font-semibold mb-4">Categories</h2>
            <ul className="space-y-1">
              {categories.map(cat => (
                <li
                  key={cat.id}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors text-base ${selectedCategory === cat.id ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-primary/10'}`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  <cat.icon className="w-5 h-5" />
                  {cat.name}
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Main Content - Integrations List/Grid */}
        <main className="flex-1">
          <h2 className="text-2xl font-bold mb-6">{selectedCategory === 'all' ? 'All Integrations' : categories.find(c => c.id === selectedCategory)?.name + ' Integrations'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredIntegrations.map(integration => {
              const status = integrationStates[integration.id];
              const isConnected = status?.isConnected;
              return (
                <Card key={integration.id} className={`hover:shadow-md py-0 transition-shadow relative ${isConnected ? 'ring-2 ring-primary' : ''}`}>
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl bg-muted border">
                      <integration.icon className="w-8 h-8" style={{ color: integration.color }} />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold flex items-center gap-2">
                        {integration.name}
                        {isConnected && (
                          <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                            Active
                          </Badge>
                        )}
                        {integration.comingSoon && (
                          <Badge variant="outline" className="text-muted-foreground">
                            Coming Soon
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">{integration.description}</div>
                      <div className="flex gap-2 mt-2">
                        {!integration.comingSoon && !isConnected && integration.connect && (
                          <Button size="sm" variant="outline" onClick={() => handleConnect(integration)} disabled={loadingIntegration === integration.id}>
                            <FiLink className="w-4 h-4 mr-1" /> Connect
                          </Button>
                        )}
                        {!integration.comingSoon && isConnected && (
                          <>
                            {integration.sync && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleSync(integration)} 
                                disabled={syncingIntegration === integration.id}
                              >
                                {syncingIntegration === integration.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <RefreshCw className="w-4 h-4" />
                                )}
                                Sync Now
                              </Button>
                            )}
                            {integration.disconnect && (
                              <Button size="sm" variant="outline" onClick={() => handleDisconnect(integration)} disabled={loadingIntegration === integration.id}>
                                <FiXCircle className="w-4 h-4 mr-1" /> Disconnect
                              </Button>
                            )}
                          </>
                        )}
                        {isConnected && (
                          <Dialog open={dialogIntegration === integration.id && dialogOpen} onOpenChange={open => { setDialogOpen(open); if (!open) setDialogIntegration(null); }}>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={() => setDialogIntegration(integration.id)}>
                                <FiInfo className="w-5 h-5 text-muted-foreground hover:text-primary" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="integration-dialog-content w-full p-0 overflow-hidden shadow-2xl border border-border rounded-2xl">
                              <div className="flex flex-col md:flex-row">
                                {/* Left: Icon, name, tabs */}
                                <div className="md:w-2/3 w-full bg-background p-8 flex flex-col gap-8">
                                  <div className="flex items-center gap-5 mb-2">
                                    <div className="w-16 h-16 rounded-full bg-white shadow flex items-center justify-center border">
                                      <integration.icon className="w-10 h-10" style={{ color: integration.color }} />
                                    </div>
                                    <div>
                                      <div className="text-2xl font-bold leading-tight flex items-center gap-2">
                                        {integration.name}
                                        {isConnected && <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700 font-semibold">Active</span>}
                                      </div>
                                      <div className="text-base text-muted-foreground mt-1">{integration.description}</div>
                                    </div>
                                  </div>
                                  <Tabs defaultValue="description" className="w-full">
                                    <TabsList className="mb-4">
                                      <TabsTrigger value="description">Description</TabsTrigger>
                                      <TabsTrigger value="permissions">Permissions</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="description">
                                      <div className="space-y-6 text-sm">
                                        <div>
                                          <div className="uppercase text-xs tracking-wide font-semibold text-muted-foreground mb-1">What it does</div>
                                          <div className="font-medium">Sync your CRM contacts and deals with LuxeTripBuilder.</div>
                                        </div>
                                        <div>
                                          <div className="uppercase text-xs tracking-wide font-semibold text-muted-foreground mb-1">How it works</div>
                                          <div className="text-muted-foreground">Connect your HubSpot account to automatically sync contacts and deals with your LuxeTripBuilder CRM. All updates are kept in sync for a seamless workflow.</div>
                                        </div>
                                        <div>
                                          <a href="#" className="text-primary underline text-xs hover:underline">Learn more about using the {integration.name} App here.</a>
                                        </div>
                                      </div>
                                    </TabsContent>
                                    <TabsContent value="permissions">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div>
                                          <div className="uppercase text-xs tracking-wide font-semibold text-muted-foreground mb-2">App Capabilities</div>
                                          <ul className="space-y-2 text-sm">
                                            <li className="flex items-center gap-2"><FiUsers className="w-4 h-4 text-muted-foreground" /> Access workspace data</li>
                                            <li className="flex items-center gap-2"><Settings className="w-4 h-4 text-muted-foreground" /> Manage integration workflow</li>
                                          </ul>
                                        </div>
                                        <div>
                                          <div className="uppercase text-xs tracking-wide font-semibold text-muted-foreground mb-2">Permissions</div>
                                          <ul className="space-y-2 text-sm">
                                            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> Read and write assets</li>
                                            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> Read information about authorized users</li>
                                            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> Read and write data and submissions</li>
                                            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> Read and write site data and publishing</li>
                                            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> Read and write user accounts and access groups</li>
                                          </ul>
                                        </div>
                                      </div>
                                    </TabsContent>
                                  </Tabs>
                                </div>
                                {/* Divider */}
                                <div className="hidden md:block w-px bg-border mx-0" />
                                {/* Right: Features, security, pricing, support */}
                                <div className="md:w-1/3 w-full bg-muted/40 p-8 flex flex-col gap-8">
                                  <div>
                                    <div className="uppercase text-xs tracking-wide font-semibold text-muted-foreground mb-2">Features</div>
                                    <ul className="space-y-2 text-sm">
                                      <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> Sync your CRM contacts and deals with LuxeTripBuilder</li>
                                    </ul>
                                  </div>
                                  <div>
                                    <div className="uppercase text-xs tracking-wide font-semibold text-muted-foreground mb-2">Enhanced security</div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <Shield className="w-4 h-4" /> This App supports enhanced security and management features.
                                    </div>
                                  </div>
                                  <div>
                                    <div className="uppercase text-xs tracking-wide font-semibold text-muted-foreground mb-2">Approved by LuxeTripBuilder</div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <CheckCircle className="w-4 h-4 text-primary" /> This integration is reviewed for quality and security.
                                    </div>
                                  </div>
                                  <div>
                                    <div className="uppercase text-xs tracking-wide font-semibold text-muted-foreground mb-2">Pricing</div>
                                    <div className="text-sm text-muted-foreground">Free plan available</div>
                                  </div>
                                  <div>
                                    <div className="uppercase text-xs tracking-wide font-semibold text-muted-foreground mb-2">Support</div>
                                    <ul className="space-y-1 text-xs">
                                      <li><a href="#" className="text-primary underline hover:underline">Support site</a></li>
                                      <li><a href="#" className="text-primary underline hover:underline">Privacy policy</a></li>
                                      <li><a href="#" className="text-primary underline hover:underline">Terms</a></li>
                                    </ul>
                                  </div>
                                  
                                  {/* Action Buttons for Connected Integrations */}
                                  {isConnected && (
                                    <div className="space-y-3">
                                      <div className="uppercase text-xs tracking-wide font-semibold text-muted-foreground mb-2">Actions</div>
                                      {integration.sync && (
                                        <Button 
                                          onClick={() => handleSync(integration)} 
                                          disabled={syncingIntegration === integration.id}
                                          className="w-full flex items-center gap-2"
                                        >
                                          {syncingIntegration === integration.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                          ) : (
                                            <RefreshCw className="h-4 w-4" />
                                          )}
                                          Sync Now
                                        </Button>
                                      )}
                                      {integration.disconnect && (
                                        <Button 
                                          variant="outline" 
                                          onClick={() => handleDisconnect(integration)} 
                                          disabled={loadingIntegration === integration.id}
                                          className="w-full flex items-center gap-2"
                                        >
                                          <FiXCircle className="h-4 w-4" />
                                          Disconnect
                                        </Button>
                                      )}
                                    </div>
                                  )}
                                  
                                  <div className="flex-1 flex items-end justify-end">
                                    <Button asChild variant="outline" className="mt-4">
                                      <Link to="/settings?tab=integrations">Manage Integration</Link>
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
} 