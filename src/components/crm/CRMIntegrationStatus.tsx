import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  RefreshCw, 
  Loader2, 
  CheckCircle, 
  Settings,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { HubSpotService } from '@/lib/hubspotService';
import { Link } from 'react-router-dom';

interface CRMIntegrationStatusProps {
  teamId: string;
}

export const CRMIntegrationStatus: React.FC<CRMIntegrationStatusProps> = ({ teamId }) => {
  const [integrationStatus, setIntegrationStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadIntegrationStatus();
  }, [teamId]);

  const loadIntegrationStatus = async () => {
    try {
      setLoading(true);
      const status = await HubSpotService.getIntegrationStatus(teamId);
      setIntegrationStatus(status);
    } catch (error) {
      console.error('Error loading integration status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      
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
        await loadIntegrationStatus(); // Refresh status
      } else {
        toast.error(`Sync failed: ${data.error || data.details || 'Unknown error'}`);
        throw new Error(data.error || 'Sync failed');
      }
    } catch (error) {
      console.error('Error during sync:', error);
      toast.error('Sync failed. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  const handleConnectHubSpot = async () => {
    try {
      const state = Math.random().toString(36).substring(2, 15);
      localStorage.setItem('hubspot_oauth_state', state);
      localStorage.setItem('hubspot_team_id', teamId);
      const oauthUrl = HubSpotService.getOAuthUrl(teamId, state);
      window.location.href = oauthUrl;
    } catch (error) {
      console.error('Error getting auth URL:', error);
      toast.error('Failed to start OAuth flow');
    }
  };

  if (loading) {
    return (
      <Card className="py-0 bg-gradient-to-b from-card/95 to-background/20 border border-border rounded-2xl shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isConnected = integrationStatus?.isConnected;

  return (
    <Card className="py-0 bg-gradient-to-b from-card/95 to-background/20 border border-border rounded-2xl shadow-sm">
      <CardContent className="p-4">
        {isConnected ? (
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">HubSpot CRM</p>
                  <p className="text-xs text-muted-foreground">Connected</p>
                </div>
              </div>
              <Badge variant="default" className="bg-green-100 text-green-800 border-green-200 text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                Active
              </Badge>
            </div>

            {/* Action */}
            <div className="flex gap-2">
              <Button 
                onClick={handleSync} 
                disabled={syncing}
                size="sm"
                variant="outline"
                className="flex-1 h-8 text-xs"
              >
                {syncing ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
                {syncing ? 'Syncing' : 'Sync Now'}
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                asChild
                className="h-8 w-8 p-0"
              >
                <Link to="/integrations">
                  <Settings className="h-3 w-3" />
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          /* Not Connected State - Minimal */
          <div className="text-center py-2">
            <div className="w-8 h-8 bg-primary/10 rounded-lg mx-auto mb-2 flex items-center justify-center">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground mb-2">Connect HubSpot CRM</p>
            <Button 
              onClick={handleConnectHubSpot}
              size="sm"
              className="text-xs h-7"
            >
              Connect
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 