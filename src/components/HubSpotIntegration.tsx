import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Building2, 
  Link, 
  Unlink, 
  Settings, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Clock,
  Users,
  DollarSign,
  Activity,
  ExternalLink,
  Loader2,
  Info
} from 'lucide-react';
import { HubSpotService } from '@/lib/hubspotService';
import { TeamService } from '@/lib/teamService';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { 
  HubSpotIntegrationStatus, 
  HubSpotSyncSettings,
  HubSpotSyncLog 
} from '@/types/hubspot';

export const HubSpotIntegration = () => {
  const [integrationStatus, setIntegrationStatus] = useState<HubSpotIntegrationStatus | null>(null);
  const [syncSettings, setSyncSettings] = useState<HubSpotSyncSettings | null>(null);
  const [syncLogs, setSyncLogs] = useState<HubSpotSyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);

  useEffect(() => {
    loadIntegrationData();
  }, []);

  const loadIntegrationData = async () => {
    try {
      setLoading(true);
      
      // Get current user's team
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const teamMember = await TeamService.getCurrentUserTeam();
      let currentTeamId = null;

      if (!teamMember?.team_id) {
        // Check if user owns a team
        const { data: ownedTeam } = await supabase
          .from('teams')
          .select('id')
          .eq('owner_id', user.id)
          .single();
        
        if (ownedTeam) {
          currentTeamId = ownedTeam.id;
          setTeamId(ownedTeam.id);
        }
      } else {
        currentTeamId = teamMember.team_id;
        setTeamId(teamMember.team_id);
      }

      // Load HubSpot integration status if we have a team ID
      if (currentTeamId) {
        const status = await HubSpotService.getIntegrationStatus(currentTeamId);
        setIntegrationStatus(status);
        setSyncSettings(status.syncSettings || null);
      }
    } catch (error) {
      console.error('Error loading HubSpot integration data:', error);
      toast.error('Failed to load integration data');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectHubSpot = async () => {
    if (!teamId) {
      toast.error('No team found');
      return;
    }

    try {
      setConnecting(true);
      
      // Generate state for OAuth security
      const state = Math.random().toString(36).substring(2, 15);
      
      // Store state in localStorage for verification
      localStorage.setItem('hubspot_oauth_state', state);
      localStorage.setItem('hubspot_team_id', teamId);
      
      // Get OAuth URL and redirect
      const oauthUrl = HubSpotService.getOAuthUrl(teamId, state);
      window.location.href = oauthUrl;
    } catch (error) {
      console.error('Error initiating HubSpot connection:', error);
      toast.error('Failed to connect to HubSpot');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnectHubSpot = async () => {
    if (!integrationStatus?.connection) return;

    try {
      await HubSpotService.deleteConnection(integrationStatus.connection.id);
      toast.success('HubSpot disconnected successfully');
      await loadIntegrationData();
    } catch (error) {
      console.error('Error disconnecting HubSpot:', error);
      toast.error('Failed to disconnect HubSpot');
    }
  };

  const handleManualSync = async () => {
    if (!teamId) return;

    try {
      setSyncing(true);
      // Get the current session/access token
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      const functionUrl =
        import.meta.env.VITE_SUPABASE_FUNCTIONS_URL?.replace(/\/$/, '') + '/hubspot-sync' || '/functions/v1/hubspot-sync';
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
      } else {
        toast.error(`Sync failed: ${data.error || data.details || 'Unknown error'}`);
      }
      // Optionally reload integration data to update stats/logs
      await loadIntegrationData();
    } catch (error) {
      console.error('Error starting manual sync:', error);
      toast.error('Failed to start sync');
    } finally {
      setSyncing(false);
    }
  };

  const handleUpdateSyncSettings = async (updates: Partial<HubSpotSyncSettings>) => {
    if (!teamId || !syncSettings) return;

    try {
      const updatedSettings = await HubSpotService.updateSyncSettings(teamId, updates);
      setSyncSettings(updatedSettings);
      toast.success('Sync settings updated successfully');
    } catch (error) {
      console.error('Error updating sync settings:', error);
      toast.error('Failed to update sync settings');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      case 'partial':
        return <Badge variant="secondary"><AlertTriangle className="h-3 w-3 mr-1" />Partial</Badge>;
      case 'started':
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />In Progress</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 168)}w ago`;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Building2 className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">HubSpot Integration</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">HubSpot Integration</h3>
        </div>
        
        {integrationStatus?.isConnected && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettingsDialog(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualSync}
              disabled={syncing}
            >
              {syncing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Sync Now
            </Button>
          </div>
        )}
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Connection Status</CardTitle>
        </CardHeader>
        <CardContent>
          {integrationStatus?.isConnected ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">Connected to HubSpot</p>
                    <p className="text-sm text-muted-foreground">
                      {integrationStatus.connection?.hubspotAccountName}
                    </p>
                  </div>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Unlink className="h-4 w-4 mr-2" />
                      Disconnect
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Disconnect HubSpot</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to disconnect your HubSpot account? 
                        This will stop all data synchronization.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDisconnectHubSpot}>
                        Disconnect
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              {/* Sync Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="text-2xl font-bold">{integrationStatus.stats.syncedContacts}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Synced Contacts</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="text-2xl font-bold">{integrationStatus.stats.syncedDeals}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Synced Deals</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Activity className="h-4 w-4 text-orange-600" />
                    <span className="text-2xl font-bold">{integrationStatus.stats.pendingSyncs}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Pending Syncs</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-purple-600" />
                    <span className="text-sm">
                      {integrationStatus.lastSync ? getTimeAgo(integrationStatus.lastSync.startedAt) : 'Never'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">Last Sync</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h4 className="text-lg font-medium mb-2">Connect to HubSpot</h4>
              <p className="text-muted-foreground mb-4">
                Sync your clients and deals with HubSpot to keep your CRM data up to date.
              </p>
              <Button onClick={handleConnectHubSpot} disabled={connecting}>
                {connecting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Link className="h-4 w-4 mr-2" />
                )}
                Connect HubSpot Account
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sync Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>HubSpot Sync Settings</DialogTitle>
            <DialogDescription>
              Configure how your data syncs between AItinerary and HubSpot.
            </DialogDescription>
          </DialogHeader>
          
          {syncSettings && (
            <div className="space-y-6">
              <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="mapping">Field Mapping</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
                </TabsList>
                
                <TabsContent value="general" className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Sync Contacts</Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically sync client data with HubSpot contacts
                        </p>
                      </div>
                      <Switch
                        checked={syncSettings.syncContacts}
                        onCheckedChange={(checked) => 
                          handleUpdateSyncSettings({ syncContacts: checked })
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Sync Deals</Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically sync quotes with HubSpot deals
                        </p>
                      </div>
                      <Switch
                        checked={syncSettings.syncDeals}
                        onCheckedChange={(checked) => 
                          handleUpdateSyncSettings({ syncDeals: checked })
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Auto-create Contacts</Label>
                        <p className="text-sm text-muted-foreground">
                          Create HubSpot contacts for new clients automatically
                        </p>
                      </div>
                      <Switch
                        checked={syncSettings.autoCreateContacts}
                        onCheckedChange={(checked) => 
                          handleUpdateSyncSettings({ autoCreateContacts: checked })
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Auto-create Deals</Label>
                        <p className="text-sm text-muted-foreground">
                          Create HubSpot deals for new quotes automatically
                        </p>
                      </div>
                      <Switch
                        checked={syncSettings.autoCreateDeals}
                        onCheckedChange={(checked) => 
                          handleUpdateSyncSettings({ autoCreateDeals: checked })
                        }
                      />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="mapping" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <Label>Sync Direction</Label>
                      <Select
                        value={syncSettings.syncDirection}
                        onValueChange={(value: any) => 
                          handleUpdateSyncSettings({ syncDirection: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="to_hubspot">To HubSpot Only</SelectItem>
                          <SelectItem value="from_hubspot">From HubSpot Only</SelectItem>
                          <SelectItem value="bidirectional">Bidirectional</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Info className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">Field Mapping</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Field mapping configuration will be available in the next update.
                        For now, standard field mappings are used automatically.
                      </p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="advanced" className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Sync Interactions</Label>
                        <p className="text-sm text-muted-foreground">
                          Sync client interactions and notes
                        </p>
                      </div>
                      <Switch
                        checked={syncSettings.syncInteractions}
                        onCheckedChange={(checked) => 
                          handleUpdateSyncSettings({ syncInteractions: checked })
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Sync Travel History</Label>
                        <p className="text-sm text-muted-foreground">
                          Sync client travel history and bookings
                        </p>
                      </div>
                      <Switch
                        checked={syncSettings.syncTravelHistory}
                        onCheckedChange={(checked) => 
                          handleUpdateSyncSettings({ syncTravelHistory: checked })
                        }
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setShowSettingsDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sync Logs */}
      {integrationStatus?.isConnected && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Sync Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {integrationStatus.lastSync ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusBadge(integrationStatus.lastSync.status)}
                    <div>
                      <p className="font-medium capitalize">
                        {integrationStatus.lastSync.syncType.replace('_', ' ')} Sync
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(integrationStatus.lastSync.startedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {integrationStatus.lastSync.recordsSynced} synced
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {integrationStatus.lastSync.recordsFailed} failed
                    </p>
                  </div>
                </div>
                
                <div className="text-center">
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Full Sync History
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2" />
                <p>No sync activity yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 