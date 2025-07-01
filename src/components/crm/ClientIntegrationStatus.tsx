import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  RefreshCw,
  ExternalLink,
  Users,
  DollarSign,
  Settings
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';

interface ClientIntegrationStatusProps {
  clientId: string;
  teamId: string;
}

export const ClientIntegrationStatus: React.FC<ClientIntegrationStatusProps> = ({ clientId, teamId }) => {
  const [hubspotMapping, setHubspotMapping] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIntegrationMappings();
  }, [clientId, teamId]);

  const loadIntegrationMappings = async () => {
    try {
      setLoading(true);
      
      // Check if client is mapped to HubSpot
      const { data: hubspotData } = await supabase
        .from('hubspot_contact_mappings')
        .select('*')
        .eq('team_id', teamId)
        .eq('client_id', clientId)
        .single();

      setHubspotMapping(hubspotData);
    } catch (error) {
      console.error('Error loading integration mappings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="border border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Integration Status
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-center py-2">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary mx-auto"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isHubspotSynced = hubspotMapping && hubspotMapping.sync_status === 'synced';

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Integration Status
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {/* HubSpot Status */}
        <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg border border-border">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary/10 rounded-lg flex items-center justify-center">
              <Building2 className="h-3 w-3 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">HubSpot CRM</p>
              <p className="text-xs text-muted-foreground">
                {isHubspotSynced ? 'Contact synced' : 'Not synced'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {isHubspotSynced ? (
              <Badge variant="default" className="bg-green-100 text-green-800 border-green-200 text-xs h-5">
                <CheckCircle className="h-3 w-3 mr-1" />
                Synced
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground text-xs h-5">
                <Clock className="h-3 w-3 mr-1" />
                Not Synced
              </Badge>
            )}
          </div>
        </div>

        {/* Sync Info */}
        {isHubspotSynced && hubspotMapping && (
          <div className="p-2 bg-muted/20 rounded-lg border border-border">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Last synced:</span>
              <span className="font-medium">
                {hubspotMapping.last_synced_at 
                  ? new Date(hubspotMapping.last_synced_at).toLocaleDateString()
                  : 'Unknown'
                }
              </span>
            </div>
            <div className="flex items-center justify-between text-xs mt-1">
              <span className="text-muted-foreground">HubSpot ID:</span>
              <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">
                {hubspotMapping.hubspot_contact_id}
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-1">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 h-7 text-xs"
            asChild
          >
            <Link to="/integrations">
              <Settings className="h-3 w-3 mr-1" />
              Manage
            </Link>
          </Button>
          {!isHubspotSynced && (
            <Button 
              variant="outline" 
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                // Trigger a sync for this specific client
                // This would need to be implemented in the sync service
                console.log('Trigger sync for client:', clientId);
              }}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Sync
            </Button>
          )}
        </div>

        {/* Integration Benefits */}
        <div className="p-2 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-xs text-blue-900 mb-1">Integration Benefits</h4>
          <ul className="space-y-0.5 text-xs text-blue-800">
            <li className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              Automatic contact sync
            </li>
            <li className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              Deal tracking and management
            </li>
            <li className="flex items-center gap-1">
              <RefreshCw className="h-3 w-3" />
              Real-time data updates
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}; 