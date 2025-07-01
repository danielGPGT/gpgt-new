import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  RefreshCw, 
  Loader2,
  Settings,
  Unlink,
  ExternalLink,
  Users,
  DollarSign,
  Activity,
  TrendingUp,
  Zap
} from 'lucide-react';
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
import { toast } from 'sonner';
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
  SiAirtable
} from 'react-icons/si';
import { 
  FaMicrosoft
} from 'react-icons/fa';

export interface IntegrationStats {
  syncedContacts?: number;
  syncedDeals?: number;
  syncedLeads?: number;
  pendingSyncs?: number;
  lastSync?: string;
  totalRecords?: number;
}

export interface IntegrationStatus {
  isConnected: boolean;
  connection?: {
    accountName?: string;
    accountId?: string;
    lastSyncAt?: string;
  };
  lastSync?: {
    status: 'completed' | 'failed' | 'partial' | 'started';
    syncType: string;
    startedAt: string;
    completedAt?: string;
    recordsProcessed: number;
    recordsSynced: number;
    recordsFailed: number;
    errorMessage?: string;
  };
  stats: IntegrationStats;
}

export interface IntegrationConfig {
  id: string;
  name: string;
  description: string;
  logo: string;
  color: string;
  features: string[];
  syncTypes: string[];
}

interface IntegrationCardProps {
  config: IntegrationConfig;
  status: IntegrationStatus | null;
  loading?: boolean;
  onConnect: () => Promise<void>;
  onDisconnect: () => Promise<void>;
  onSync: () => Promise<void>;
  onSettings?: () => void;
  showSettings?: boolean;
  syncing?: boolean;
  children?: React.ReactNode;
}

const getIntegrationIcon = (integrationId: string) => {
  switch (integrationId) {
    case 'hubspot':
      return SiHubspot;
    case 'salesforce':
      return SiSalesforce;
    case 'pipedrive':
      return SiSalesforce; // Fallback to Salesforce icon
    case 'zoho':
      return SiZoho;
    case 'microsoft365':
      return FaMicrosoft;
    case 'googleworkspace':
      return SiGoogle;
    case 'slack':
      return SiSlack;
    case 'zoom':
      return SiZoom;
    case 'asana':
      return SiAsana;
    case 'trello':
      return SiTrello;
    case 'notion':
      return SiNotion;
    case 'airtable':
      return SiAirtable;
    default:
      return null;
  }
};

const getIntegrationColors = (integrationId: string) => {
  switch (integrationId) {
    case 'hubspot':
      return { bg: 'bg-orange-50', icon: 'text-orange-600', border: 'border-orange-200' };
    case 'salesforce':
      return { bg: 'bg-blue-50', icon: 'text-blue-600', border: 'border-blue-200' };
    case 'pipedrive':
      return { bg: 'bg-orange-50', icon: 'text-orange-600', border: 'border-orange-200' };
    case 'zoho':
      return { bg: 'bg-red-50', icon: 'text-red-600', border: 'border-red-200' };
    default:
      return { bg: 'bg-gray-50', icon: 'text-gray-600', border: 'border-gray-200' };
  }
};

export const IntegrationCard: React.FC<IntegrationCardProps> = ({
  config,
  status,
  loading = false,
  onConnect,
  onDisconnect,
  onSync,
  onSettings,
  showSettings = false,
  syncing = false,
  children
}) => {
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const IconComponent = getIntegrationIcon(config.id);
  const colors = getIntegrationColors(config.id);

  const handleManualSync = async () => {
    try {
      await onSync();
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Sync failed. Please try again.');
    }
  };

  const handleConnect = async () => {
    try {
      setConnecting(true);
      await onConnect();
    } catch (error) {
      console.error('Connection error:', error);
      toast.error('Failed to connect. Please try again.');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setDisconnecting(true);
      await onDisconnect();
      toast.success(`${config.name} disconnected successfully`);
    } catch (error) {
      console.error('Disconnect error:', error);
      toast.error('Failed to disconnect. Please try again.');
    } finally {
      setDisconnecting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
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

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  if (loading) {
    return (
      <Card className="border-2 border-dashed border-gray-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={`border-2 transition-all duration-200 ${
      status?.isConnected 
        ? `${colors.border} ${colors.bg}` 
        : 'border-gray-200 hover:border-gray-300'
    }`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${colors.bg} rounded-xl flex items-center justify-center`}>
              {IconComponent && <IconComponent className={`h-5 w-5 ${colors.icon}`} />}
            </div>
            <div>
              <CardTitle className="text-lg">{config.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{config.description}</p>
            </div>
          </div>
          
          {status?.isConnected && (
            <div className="flex items-center gap-2">
              {showSettings && onSettings && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSettings}
                  className="bg-white/80 backdrop-blur-sm"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualSync}
                disabled={syncing}
                className="bg-white/80 backdrop-blur-sm"
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
      </CardHeader>

      <CardContent className="space-y-6">
        {status?.isConnected ? (
          <>
            {/* Connection Status */}
            <div className="flex items-center justify-between p-4 bg-white/50 rounded-xl border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-green-900">Connected to {config.name}</p>
                  <p className="text-sm text-green-700">
                    {status.connection?.accountName || 'Account connected'}
                  </p>
                </div>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" disabled={disconnecting} className="bg-white/80">
                    {disconnecting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Unlink className="h-4 w-4 mr-2" />
                    )}
                    Disconnect
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Disconnect {config.name}</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to disconnect your {config.name} account? 
                      This will stop all data synchronization.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDisconnect}>
                      Disconnect
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            {/* Sync Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {status.stats.syncedContacts !== undefined && (
                <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-xl font-bold text-blue-900">{status.stats.syncedContacts}</div>
                  <p className="text-xs text-blue-700">Contacts</p>
                </div>
              )}
              {status.stats.syncedDeals !== undefined && (
                <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="text-xl font-bold text-green-900">{status.stats.syncedDeals}</div>
                  <p className="text-xs text-green-700">Deals</p>
                </div>
              )}
              {status.stats.syncedLeads !== undefined && (
                <div className="text-center p-4 bg-purple-50 rounded-xl border border-purple-200">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="text-xl font-bold text-purple-900">{status.stats.syncedLeads}</div>
                  <p className="text-xs text-purple-700">Leads</p>
                </div>
              )}
              {status.stats.totalRecords !== undefined && (
                <div className="text-center p-4 bg-orange-50 rounded-xl border border-orange-200">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Activity className="h-4 w-4 text-orange-600" />
                  </div>
                  <div className="text-xl font-bold text-orange-900">{status.stats.totalRecords}</div>
                  <p className="text-xs text-orange-700">Total</p>
                </div>
              )}
            </div>

            {/* Last Sync */}
            {status.lastSync && (
              <div className="p-4 bg-gray-50 rounded-xl border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusBadge(status.lastSync.status)}
                    <div>
                      <p className="font-medium capitalize">
                        {status.lastSync.syncType.replace('_', ' ')} Sync
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {getTimeAgo(status.lastSync.startedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {status.lastSync.recordsSynced} synced
                    </p>
                    {status.lastSync.recordsFailed > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {status.lastSync.recordsFailed} failed
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Custom Content */}
            {children}
          </>
        ) : (
          <div className="text-center py-12">
            <div className={`w-20 h-20 ${colors.bg} rounded-2xl mx-auto mb-6 flex items-center justify-center`}>
              {IconComponent && <IconComponent className={`h-10 w-10 ${colors.icon}`} />}
            </div>
            <h4 className="text-xl font-semibold mb-3">Connect to {config.name}</h4>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {config.description}
            </p>
            <div className="flex items-center justify-center gap-4 mb-6">
              {config.features.slice(0, 2).map((feature, index) => (
                <Badge key={index} variant="outline" className="bg-white/80">
                  <Zap className="h-3 w-3 mr-1" />
                  {feature}
                </Badge>
              ))}
            </div>
            <Button 
              onClick={handleConnect} 
              disabled={connecting}
              className="w-full max-w-xs bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {connecting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4 mr-2" />
              )}
              Connect {config.name} Account
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 