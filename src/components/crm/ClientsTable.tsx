import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Plus,
  Mail,
  Phone,
  Building,
  MapPin,
  Tag,
  Filter,
  Search,
  Download,
  Upload,
  RefreshCw,
  Check,
  X,
  ArrowUpDown,
  GripVertical,
  UserPlus,
  Calendar,
  DollarSign,
  Star,
  Users,
  Briefcase,
  FileText,
  Settings,
  Send,
  Copy,
  Archive,
  UserCheck,
  UserX,
  Crown,
  AlertCircle,
  Clock,
  History,
  Loader2,
  Building2,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import type { Client } from '@/types/crm';
import { BulkEmailDialog } from './BulkEmailDialog';
import { ClientTimeline } from './ClientTimeline';
import { HubSpotService } from '@/lib/hubspotService';
import { supabase } from '@/lib/supabase';
import { SiHubspot, SiSalesforce, SiZoho } from 'react-icons/si';

interface ClientsTableProps {
  clients: Client[];
  isLoading: boolean;
  onRefresh: () => void;
  onDeleteClient: (clientId: string) => void;
  onBulkDelete: (clientIds: string[]) => void;
  onBulkUpdateStatus?: (clientIds: string[], status: 'active' | 'inactive' | 'prospect' | 'vip') => Promise<void>;
  onBulkAddTags?: (clientIds: string[], tags: string[]) => Promise<void>;
  onBulkRemoveTags?: (clientIds: string[], tags: string[]) => Promise<void>;
  onImportClients?: (clients: Partial<Client>[]) => Promise<void>;
  teamId?: string | null;
}

type SortField = 'name' | 'email' | 'company' | 'status' | 'source' | 'lastContactAt' | 'createdAt' | 'updatedAt';
type SortDirection = 'asc' | 'desc';

interface Column {
  key: SortField;
  label: string;
  sortable: boolean;
  width?: string;
  render?: (client: Client) => React.ReactNode;
}

export function ClientsTable({ 
  clients, 
  isLoading, 
  onRefresh, 
  onDeleteClient, 
  onBulkDelete,
  onBulkUpdateStatus,
  onBulkAddTags,
  onBulkRemoveTags,
  onImportClients,
  teamId
}: ClientsTableProps) {
  const [selectedClients, setSelectedClients] = useState<Client[]>([]);
  const [sortField, setSortField] = useState<SortField>('updatedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [csvData, setCsvData] = useState('');
  const [importPreview, setImportPreview] = useState<Partial<Client>[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bulkEmailOpen, setBulkEmailOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [selectedClientForTimeline, setSelectedClientForTimeline] = useState<Client | null>(null);
  const navigate = useNavigate();
  const [integrationStatus, setIntegrationStatus] = useState<any>(null);
  const [integrationLoading, setIntegrationLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const columns: Column[] = [
    {
      key: 'name',
      label: 'Client',
      sortable: true,
      width: 'w-64',
      render: (client) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {getInitials(client.firstName, client.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium text-sm">
              {client.firstName} {client.lastName}
            </span>
            {client.company && (
              <span className="text-xs text-muted-foreground">{client.company}</span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Contact',
      sortable: true,
      width: 'w-48',
      render: (client) => (
        <div className="flex flex-col gap-1">
          {client.email && (
            <div className="flex items-center gap-1 text-sm">
              <Mail className="h-3 w-3 text-muted-foreground" />
              <span className="truncate">{client.email}</span>
            </div>
          )}
          {client.phone && (
            <div className="flex items-center gap-1 text-sm">
              <Phone className="h-3 w-3 text-muted-foreground" />
              <span>{client.phone}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      width: 'w-32',
      render: (client) => (
        <Badge className={`text-xs ${getStatusColor(client.status)}`}>
          {client.status}
        </Badge>
      ),
    },
    {
      key: 'source',
      label: 'Source',
      sortable: true,
      width: 'w-32',
      render: (client) => (
        <Badge variant="outline" className="text-xs capitalize">
          {client.source}
        </Badge>
      ),
    },
    {
      key: 'lastContactAt',
      label: 'Last Contact',
      sortable: true,
      width: 'w-40',
      render: (client) => (
        <div className="text-sm">
          {client.lastContactAt ? (
            <div className="flex flex-col">
              <span>{formatDate(client.lastContactAt)}</span>
              <span className="text-xs text-muted-foreground">
                {getTimeAgo(client.lastContactAt)}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground">Never</span>
          )}
        </div>
      ),
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      width: 'w-32',
      render: (client) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(client.createdAt)}
        </span>
      ),
    },
  ];

  const filteredAndSortedClients = useMemo(() => {
    let filtered = [...clients];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(client =>
        `${client.firstName} ${client.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(client => client.status === statusFilter);
    }

    // Apply source filter
    if (sourceFilter !== 'all') {
      filtered = filtered.filter(client => client.source === sourceFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'name':
          aValue = `${a.firstName} ${a.lastName}`;
          bValue = `${b.firstName} ${b.lastName}`;
          break;
        case 'email':
          aValue = a.email || '';
          bValue = b.email || '';
          break;
        case 'company':
          aValue = a.company || '';
          bValue = b.company || '';
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'source':
          aValue = a.source;
          bValue = b.source;
          break;
        case 'lastContactAt':
          aValue = new Date(a.lastContactAt || 0).getTime();
          bValue = new Date(b.lastContactAt || 0).getTime();
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'updatedAt':
        default:
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
          break;
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [clients, searchTerm, statusFilter, sourceFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedClients(filteredAndSortedClients);
    } else {
      setSelectedClients([]);
    }
  };

  const handleSelectClient = (client: Client, checked: boolean) => {
    if (checked) {
      setSelectedClients([client]);
    } else {
      setSelectedClients([]);
    }
  };

  const handleBulkDelete = () => {
    if (selectedClients.length === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedClients.length} selected client(s)?`)) {
      onBulkDelete(selectedClients.map(client => client.id));
      setSelectedClients([]);
      toast.success(`Deleted ${selectedClients.length} client(s)`);
    }
  };

  const handleBulkStatusUpdate = async (status: string) => {
    if (!onBulkUpdateStatus || selectedClients.length === 0) return;
    
    try {
      setBulkActionLoading(true);
      await onBulkUpdateStatus(selectedClients.map(client => client.id), status as 'active' | 'inactive' | 'prospect' | 'vip');
      toast.success(`Updated ${selectedClients.length} client(s) to ${status}`);
      setSelectedClients([]);
    } catch (error) {
      toast.error('Failed to update client status');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkAddTags = async (tags: string[]) => {
    if (!onBulkAddTags || selectedClients.length === 0) return;
    
    try {
      setBulkActionLoading(true);
      await onBulkAddTags(selectedClients.map(client => client.id), tags);
      toast.success(`Added tags to ${selectedClients.length} client(s)`);
      setSelectedClients([]);
    } catch (error) {
      toast.error('Failed to add tags');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const exportToCSV = () => {
    const dataToExport = selectedClients.length > 0 ? selectedClients : clients;
    
    const headers = [
      'First Name',
      'Last Name',
      'Email',
      'Phone',
      'Company',
      'Status',
      'Source',
      'Address Street',
      'Address City',
      'Address State',
      'Address Zip Code',
      'Address Country',
      'Tags',
      'Notes',
      'Created At',
      'Updated At',
      'Last Contact At'
    ];

    const csvContent = [
      headers.join(','),
      ...dataToExport.map(client => [
        `"${client.firstName}"`,
        `"${client.lastName}"`,
        `"${client.email || ''}"`,
        `"${client.phone || ''}"`,
        `"${client.company || ''}"`,
        `"${client.status}"`,
        `"${client.source}"`,
        `"${client.address?.street || ''}"`,
        `"${client.address?.city || ''}"`,
        `"${client.address?.state || ''}"`,
        `"${client.address?.zipCode || ''}"`,
        `"${client.address?.country || ''}"`,
        `"${client.tags?.join(';') || ''}"`,
        `"${client.notes || ''}"`,
        `"${client.createdAt}"`,
        `"${client.updatedAt}"`,
        `"${client.lastContactAt || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `clients_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Exported ${dataToExport.length} client(s) to CSV`);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const csvText = e.target?.result as string;
      setCsvData(csvText);
      parseCSVPreview(csvText);
    };
    reader.readAsText(file);
  };

  const parseCSVPreview = (csvText: string) => {
    const lines = csvText.split('\n');
    const headers = lines[0]?.split(',').map(h => h.replace(/"/g, '').trim()) || [];
    
    const preview = lines.slice(1, 6).map(line => {
      const values = line.split(',').map(v => v.replace(/"/g, '').trim());
      const client: Partial<Client> = {};
      
      headers.forEach((header, index) => {
        const value = values[index] || '';
        switch (header.toLowerCase()) {
          case 'first name':
            client.firstName = value;
            break;
          case 'last name':
            client.lastName = value;
            break;
          case 'email':
            client.email = value;
            break;
          case 'phone':
            client.phone = value;
            break;
          case 'company':
            client.company = value;
            break;
          case 'status':
            client.status = value as any;
            break;
          case 'source':
            client.source = value as any;
            break;
          case 'tags':
            client.tags = value ? value.split(';') : [];
            break;
          case 'notes':
            client.notes = value;
            break;
        }
      });
      
      return client;
    }).filter(client => client.firstName && client.lastName);
    
    setImportPreview(preview);
  };

  const handleImport = async () => {
    if (!onImportClients || !csvData) return;
    
    try {
      setBulkActionLoading(true);
      const lines = csvData.split('\n');
      const headers = lines[0]?.split(',').map(h => h.replace(/"/g, '').trim()) || [];
      
      const clientsToImport = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.replace(/"/g, '').trim());
        const client: Partial<Client> = {};
        
        headers.forEach((header, index) => {
          const value = values[index] || '';
          switch (header.toLowerCase()) {
            case 'first name':
              client.firstName = value;
              break;
            case 'last name':
              client.lastName = value;
              break;
            case 'email':
              client.email = value;
              break;
            case 'phone':
              client.phone = value;
              break;
            case 'company':
              client.company = value;
              break;
            case 'status':
              client.status = value as any;
              break;
            case 'source':
              client.source = value as any;
              break;
            case 'tags':
              client.tags = value ? value.split(';') : [];
              break;
            case 'notes':
              client.notes = value;
              break;
          }
        });
        
        return client;
      }).filter(client => client.firstName && client.lastName);
      
      await onImportClients(clientsToImport);
      toast.success(`Imported ${clientsToImport.length} client(s)`);
      setImportDialogOpen(false);
      setCsvData('');
      setImportPreview([]);
    } catch (error) {
      toast.error('Failed to import clients');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'prospect':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'vip':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return `${Math.floor(diffInHours / 168)}w ago`;
    }
  };

  const isAllSelected = filteredAndSortedClients.length > 0 && 
    selectedClients.length === filteredAndSortedClients.length;
  const isIndeterminate = selectedClients.length > 0 && selectedClients.length < filteredAndSortedClients.length;

  const handleViewTimeline = (client: Client) => {
    setSelectedClientForTimeline(client);
    setTimelineOpen(true);
  };

  const handleViewClient = (client: Client) => {
    // Navigate to client detail page
    navigate(`/crm/client/${client.id}`);
  };

  const handleEditClient = (client: Client) => {
    // Navigate to edit client page
    navigate(`/crm/client/${client.id}/edit`);
  };

  const handleDeleteClient = async (clientId: string) => {
    if (window.confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
      try {
        await onDeleteClient(clientId);
        toast.success('Client deleted successfully');
      } catch (error) {
        toast.error('Failed to delete client');
      }
    }
  };

  const handleBulkEmailSend = async (emailData: any) => {
    console.log('Sending bulk email to:', selectedClients.length, 'clients');
    console.log('Email data:', emailData);
    setBulkEmailOpen(false);
  };

  useEffect(() => {
    if (!teamId) return;
    const loadIntegrationStatus = async () => {
      setIntegrationLoading(true);
      try {
        const status = await HubSpotService.getIntegrationStatus(teamId);
        setIntegrationStatus(status);
      } catch (e) {
        setIntegrationStatus(null);
      } finally {
        setIntegrationLoading(false);
      }
    };
    loadIntegrationStatus();
  }, [teamId]);

  const handleSync = async () => {
    if (!teamId) return;
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
      try { data = await res.json(); } catch { data = { error: 'Non-JSON response', status: res.status }; }
      if (res.ok) {
        toast.success(`Sync complete! Created: ${data.created}, Updated: ${data.updated}, Failed: ${data.failed}`);
        // Refresh status
        const status = await HubSpotService.getIntegrationStatus(teamId);
        setIntegrationStatus(status);
      } else {
        toast.error(`Sync failed: ${data.error || data.details || 'Unknown error'}`);
      }
    } catch (error) {
      toast.error('Sync failed. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Bulk Email Dialog */}
      <BulkEmailDialog
        open={bulkEmailOpen}
        onOpenChange={setBulkEmailOpen}
        selectedClients={selectedClients}
        onSendEmails={handleBulkEmailSend}
      />
      
      <ClientTimeline
        client={selectedClientForTimeline}
        open={timelineOpen}
        onOpenChange={setTimelineOpen}
      />

      {/* Table Header with Actions */}
      <Card className="border border-border rounded-2xl shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              <CardTitle className="text-lg">Clients</CardTitle>
              <Badge variant="secondary" className="text-sm">
                {filteredAndSortedClients.length} of {clients.length}
              </Badge>
              {selectedClients.length > 0 && (
                <Badge variant="default" className="text-sm">
                  {selectedClients.length} selected
                </Badge>
              )}
              {/* Inline CRM Integration Status */}
              {teamId && (
                <div className="ml-2 flex items-center gap-2 px-3 py-1 rounded-lg bg-muted/40 border border-border min-h-[40px]">
                  {integrationLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : integrationStatus?.isConnected ? (
                    <>
                      {/* Show CRM logo for connected CRM */}
                      <span className="flex items-center gap-1">
                        <SiHubspot className="h-5 w-5 text-[#FF7A59]" title="HubSpot" />
                        <span className="text-xs text-muted-foreground font-medium">HubSpot</span>
                      </span>
                      <Badge variant="default" className="bg-green-100 text-success border-green-200 text-xs px-2 py-0.5 ml-1">Active</Badge>
                      <Button onClick={handleSync} disabled={syncing} size="icon" variant="ghost" className="h-7 w-7 ml-1">
                        {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                      </Button>
                      <Link to="/integrations" className="ml-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <>
                      {/* Row of faded CRM logos */}
                      <span className="flex items-center gap-1 opacity-60">
                        <SiHubspot className="h-5 w-5" title="HubSpot" />
                        <SiSalesforce className="h-5 w-5" title="Salesforce" />
                        <SiZoho className="h-5 w-5" title="Zoho" />
                      </span>
                      <Link to="/integrations" className="ml-1">
                        <Button size="sm" className="text-xs h-7">
                          Connect CRM
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {selectedClients.length > 0 && (
                <div className="flex items-center gap-2 mr-4 p-2 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">
                    {selectedClients.length} selected
                  </span>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" disabled={bulkActionLoading}>
                        <Settings className="h-4 w-4 mr-1" />
                        Actions
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>Bulk Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        <DropdownMenuItem onClick={() => handleBulkStatusUpdate('active')}>
                          <UserCheck className="h-4 w-4 mr-2" />
                          Mark as Active
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleBulkStatusUpdate('prospect')}>
                          <Users className="h-4 w-4 mr-2" />
                          Mark as Prospect
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleBulkStatusUpdate('vip')}>
                          <Crown className="h-4 w-4 mr-2" />
                          Mark as VIP
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleBulkStatusUpdate('inactive')}>
                          <UserX className="h-4 w-4 mr-2" />
                          Mark as Inactive
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setBulkEmailOpen(true)}>
                        <Mail className="h-4 w-4 mr-2" />
                        Send Email
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={exportToCSV}>
                        <Download className="h-4 w-4 mr-2" />
                        Export Selected
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Selected
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Selected Clients</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete {selectedClients.length} selected client(s)? 
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => {
                                onBulkDelete(selectedClients.map(client => client.id));
                                setSelectedClients([]);
                                toast.success(`Deleted ${selectedClients.length} client(s)`);
                              }}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete {selectedClients.length} Client(s)
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
              
              <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={exportToCSV}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export All to CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    // TODO: Implement Excel export
                    toast.info('Excel export coming soon');
                  }}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export to Excel
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-1" />
                    Import
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Import Clients from CSV</DialogTitle>
                    <DialogDescription>
                      Upload a CSV file with client data. The first row should contain headers.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="csv-file">CSV File</Label>
                      <Input
                        id="csv-file"
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        ref={fileInputRef}
                        className="mt-1"
                      />
                    </div>
                    
                    {csvData && (
                      <div>
                        <Label>Preview (first 5 rows)</Label>
                        <div className="mt-2 max-h-40 overflow-y-auto border rounded-md p-2 bg-muted/30">
                          <pre className="text-xs">{csvData.split('\n').slice(0, 6).join('\n')}</pre>
                        </div>
                      </div>
                    )}
                    
                    {importPreview.length > 0 && (
                      <div>
                        <Label>Parsed Data Preview</Label>
                        <div className="mt-2 space-y-2">
                          {importPreview.map((client, index) => (
                            <div key={index} className="p-2 border rounded-md bg-background">
                              <div className="font-medium">
                                {client.firstName} {client.lastName}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {client.email} • {client.company}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleImport} 
                      disabled={!csvData || bulkActionLoading}
                    >
                      {bulkActionLoading ? 'Importing...' : `Import ${importPreview.length} Clients`}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search clients by name, email, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rounded-xl"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant={showFilters ? "default" : "outline"}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-1" />
                Filters
              </Button>
              
              {(searchTerm || statusFilter !== 'all' || sourceFilter !== 'all') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setSourceFilter('all');
                  }}
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-xl">
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="rounded-lg">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="prospect">Prospect</SelectItem>
                    <SelectItem value="vip">VIP</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Source</label>
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger className="rounded-lg">
                    <SelectValue placeholder="All Sources" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="social_media">Social Media</SelectItem>
                    <SelectItem value="cold_call">Cold Call</SelectItem>
                    <SelectItem value="existing_client">Existing Client</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setSourceFilter('all');
                  }}
                  className="w-full"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear All Filters
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border py-0 border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted">
                <TableHead className="w-12">
                  <Checkbox
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el && 'indeterminate' in el) {
                        (el as HTMLInputElement).indeterminate = isIndeterminate;
                      }
                    }}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                {columns.map((column) => (
                  <TableHead key={column.key} className={column.width}>
                    {column.sortable ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort(column.key)}
                        className="h-auto p-0 font-medium hover:bg-transparent"
                      >
                        <div className="flex items-center gap-1">
                          {column.label}
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </Button>
                    ) : (
                      <span className="font-medium">{column.label}</span>
                    )}
                  </TableHead>
                ))}
                <TableHead className="w-12">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 2} className="h-32">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <span className="ml-2 text-muted-foreground">Loading clients...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredAndSortedClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 2} className="h-32">
                    <div className="text-center">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No clients found</h3>
                      <p className="text-muted-foreground mb-4">
                        {searchTerm || statusFilter !== 'all' || sourceFilter !== 'all'
                          ? 'Try adjusting your filters or search terms.'
                          : 'Get started by adding your first client.'
                        }
                      </p>
                      <Button asChild>
                        <Link to="/crm/new-client">
                          <UserPlus className="h-4 w-4 mr-2" />
                          Add Your First Client
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedClients.map((client) => (
                  <TableRow key={client.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <Checkbox
                        checked={selectedClients.some(c => c.id === client.id)}
                        onCheckedChange={(checked) => 
                          handleSelectClient(client, checked as boolean)
                        }
                      />
                    </TableCell>
                    {columns.map((column) => (
                      <TableCell key={column.key}>
                        {column.render ? column.render(client) : (
                          <span className="text-sm">
                            {client[column.key as keyof Client] as string}
                          </span>
                        )}
                      </TableCell>
                    ))}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewTimeline(client)}
                          className="h-8 w-8 p-0"
                        >
                          <History className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewClient(client)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditClient(client)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Client
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteClient(client.id)}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
} 