import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  Users, 
  Mail, 
  Phone, 
  Building, 
  Calendar,
  MapPin,
  Tag,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  TrendingUp,
  UserPlus,
  DollarSign,
  Briefcase,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { CRMService } from '@/lib/crmService';
import type { Client, ClientStats, ClientFilters } from '@/types/crm';
import { ClientsTable } from '@/components/crm/ClientsTable';
import { supabase } from '@/lib/supabase';

export default function CRM() {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [stats, setStats] = useState<ClientStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('updatedAt');
  const [teamId, setTeamId] = useState<string | null>(null);

  useEffect(() => {
    loadClients();
    loadStats();
    loadTeamId();
  }, []);

  useEffect(() => {
    filterAndSortClients();
  }, [clients, searchTerm, statusFilter, sourceFilter, sortBy]);

  const loadClients = async () => {
    try {
      setIsLoading(true);
      const clientsData = await CRMService.getClients();
      setClients(clientsData);
    } catch (error) {
      console.error('Failed to load clients:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await CRMService.getClientStats();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadTeamId = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: teamMember } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();
      setTeamId(teamMember?.team_id || null);
    } catch (error) {
      console.error('Failed to load team ID:', error);
    }
  };

  const filterAndSortClients = () => {
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
      switch (sortBy) {
        case 'name':
          return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
        case 'email':
          return (a.email || '').localeCompare(b.email || '');
        case 'company':
          return (a.company || '').localeCompare(b.company || '');
        case 'status':
          return a.status.localeCompare(b.status);
        case 'lastContact':
          return new Date(b.lastContactAt || 0).getTime() - new Date(a.lastContactAt || 0).getTime();
        case 'createdAt':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'updatedAt':
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });

    setFilteredClients(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'prospect':
        return 'bg-blue-100 text-blue-800';
      case 'vip':
        return 'bg-purple-100 text-purple-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  const handleDeleteClient = async (clientId: string) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      try {
        await CRMService.deleteClient(clientId);
        await loadClients();
        await loadStats();
      } catch (error) {
        console.error('Failed to delete client:', error);
      }
    }
  };

  const handleBulkUpdateStatus = async (clientIds: string[], status: 'active' | 'inactive' | 'prospect' | 'vip') => {
    try {
      for (const clientId of clientIds) {
        await CRMService.updateClient({ id: clientId, status });
      }
      await loadClients();
      await loadStats();
    } catch (error) {
      console.error('Failed to update client status:', error);
      throw error;
    }
  };

  const handleBulkAddTags = async (clientIds: string[], tags: string[]) => {
    try {
      for (const clientId of clientIds) {
        const client = clients.find(c => c.id === clientId);
        if (client) {
          const existingTags = client.tags || [];
          const newTags = [...new Set([...existingTags, ...tags])];
          await CRMService.updateClient({ id: clientId, tags: newTags });
        }
      }
      await loadClients();
    } catch (error) {
      console.error('Failed to add tags:', error);
      throw error;
    }
  };

  const handleBulkRemoveTags = async (clientIds: string[], tags: string[]) => {
    try {
      for (const clientId of clientIds) {
        const client = clients.find(c => c.id === clientId);
        if (client) {
          const existingTags = client.tags || [];
          const newTags = existingTags.filter(tag => !tags.includes(tag));
          await CRMService.updateClient({ id: clientId, tags: newTags });
        }
      }
      await loadClients();
    } catch (error) {
      console.error('Failed to remove tags:', error);
      throw error;
    }
  };

  const handleImportClients = async (clientsToImport: Partial<Client>[]) => {
    try {
      for (const clientData of clientsToImport) {
        await CRMService.createClient(clientData as any);
      }
      await loadClients();
      await loadStats();
    } catch (error) {
      console.error('Failed to import clients:', error);
      throw error;
    }
  };

  return (
    <div className="mx-auto px-8 pt-0 pb-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col pt-4 lg:flex-row justify-between items-start lg:items-end gap-6">
        <div>
          <h1 className="text-2xl font-bold">Client Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage your client relationships and track interactions
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild className="rounded-xl">
            <Link to="/crm/new-client">
              <UserPlus className="h-4 w-4 mr-2" />
              Add New Client
            </Link>
          </Button>
        </div>
      </div>

      {/* Table-based Clients List - Full Width */}
      <ClientsTable
        clients={filteredClients}
        isLoading={isLoading}
        onRefresh={loadClients}
        onDeleteClient={handleDeleteClient}
        onBulkDelete={async (ids) => {
          for (const id of ids) {
            await CRMService.deleteClient(id);
          }
          await loadClients();
          await loadStats();
        }}
        onBulkUpdateStatus={handleBulkUpdateStatus}
        onBulkAddTags={handleBulkAddTags}
        onBulkRemoveTags={handleBulkRemoveTags}
        onImportClients={handleImportClients}
        teamId={teamId}
      />
    </div>
  );
} 