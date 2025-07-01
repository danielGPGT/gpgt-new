import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Activity, 
  Users, 
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  Globe,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { HubSpotService } from '@/lib/hubspotService';
import { IntegrationCard, type IntegrationStatus } from '@/components/integrations/IntegrationCard';
import { SyncLogs } from '@/components/integrations/SyncLogs';
import { getIntegrationConfig } from '@/lib/integrations/config';

interface HubSpotIntegrationProps {
  teamId: string;
}

export const HubSpotIntegration: React.FC<HubSpotIntegrationProps> = ({ teamId }) => {
  const [integrationStatus, setIntegrationStatus] = useState<IntegrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [syncSettings, setSyncSettings] = useState<any>(null);

  const config = getIntegrationConfig('hubspot');

  useEffect(() => {
    loadIntegrationData();
  }, [teamId]);

  const loadIntegrationData = async () => {
    try {
      setLoading(true);
      
      // Load integration status
      const status = await HubSpotService.getIntegrationStatus(teamId);
      setIntegrationStatus(status);

      // Load sync settings
      const settings = await HubSpotService.getSyncSettings(teamId);
      setSyncSettings(settings);
    } catch (error) {
      console.error('Error loading integration data:', error);
      toast.error('Failed to load integration data');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      const authUrl = await HubSpotService.getAuthUrl(teamId);
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error getting auth URL:', error);
      toast.error('Failed to start OAuth flow');
      throw error;
    }
  };

  const handleDisconnect = async () => {
    try {
      await HubSpotService.disconnect(teamId);
      setIntegrationStatus(null);
      toast.success('HubSpot disconnected successfully');
    } catch (error) {
      console.error('Error disconnecting HubSpot:', error);
      toast.error('Failed to disconnect HubSpot');
      throw error;
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      
      // Get the current session/access token
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
        setRefreshTrigger(prev => prev + 1);
        await loadIntegrationData(); // Refresh status
      } else {
        toast.error(`Sync failed: ${data.error || data.details || 'Unknown error'}`);
        throw new Error(data.error || 'Sync failed');
      }
    } catch (error) {
      console.error('Error during sync:', error);
      toast.error('Sync failed. Please try again.');
      throw error;
    } finally {
      setSyncing(false);
    }
  };

  const handleSettings = () => {
    setShowSettings(true);
  };

  if (!config) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Integration configuration not found
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Integration Card */}
      <IntegrationCard
        config={config}
        status={integrationStatus}
        loading={loading}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        onSync={handleSync}
        onSettings={handleSettings}
        showSettings={true}
        syncing={syncing}
      />

      {/* Sync Logs */}
      {integrationStatus?.isConnected && (
        <SyncLogs
          teamId={teamId}
          integrationId="hubspot"
          refreshTrigger={refreshTrigger}
        />
      )}

      {/* Settings Dialog */}
      {showSettings && (
        <Card className="border-2 border-orange-200 bg-orange-50/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="h-5 w-5 text-orange-600" />
              HubSpot Sync Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Sync Action Button */}
              {integrationStatus?.isConnected && (
                <div className="p-4 bg-white/50 rounded-xl border">
                  <h4 className="font-semibold mb-3">Manual Sync</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Trigger an immediate sync of your HubSpot data.
                  </p>
                  <Button 
                    onClick={handleSync} 
                    disabled={syncing}
                    className="flex items-center gap-2"
                  >
                    {syncing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    {syncing ? 'Syncing...' : 'Sync Now'}
                  </Button>
                </div>
              )}
              
              <div className="p-4 bg-white/50 rounded-xl border">
                <h4 className="font-semibold mb-3">Sync Frequency</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Currently syncing manually. Auto-sync can be configured via webhooks or scheduled tasks.
                </p>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  <Clock className="h-3 w-3 mr-1" />
                  Manual Sync
                </Badge>
              </div>
              
              <div className="p-4 bg-white/50 rounded-xl border">
                <h4 className="font-semibold mb-3">Sync Types</h4>
                <div className="grid grid-cols-2 gap-3">
                  {config.syncTypes.map((type) => (
                    <div key={type} className="flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-200">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium capitalize">{type.replace('_', ' ')}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-white/50 rounded-xl border">
                <h4 className="font-semibold mb-3">Features</h4>
                <div className="grid grid-cols-1 gap-2">
                  {config.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                      <Zap className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowSettings(false)}
                  className="w-full bg-white/80"
                >
                  Close Settings
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 