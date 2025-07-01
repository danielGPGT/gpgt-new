import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  RefreshCw, 
  Loader2,
  Search,
  Filter,
  Calendar,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';

export interface SyncLog {
  id: string;
  team_id: string;
  sync_type: string;
  status: 'completed' | 'failed' | 'partial' | 'started';
  started_at: string;
  completed_at?: string;
  records_processed: number;
  records_synced: number;
  records_failed: number;
  error_message?: string;
  details?: any;
  created_at: string;
}

interface SyncLogsProps {
  teamId: string;
  integrationId: string;
  refreshTrigger?: number;
}

export const SyncLogs: React.FC<SyncLogsProps> = ({ 
  teamId, 
  integrationId, 
  refreshTrigger = 0 
}) => {
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [syncTypeFilter, setSyncTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedLog, setSelectedLog] = useState<SyncLog | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [exporting, setExporting] = useState(false);

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    loadSyncLogs();
  }, [teamId, integrationId, refreshTrigger, currentPage, statusFilter, syncTypeFilter]);

  const loadSyncLogs = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('hubspot_sync_logs')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

      // Apply filters
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (syncTypeFilter !== 'all') {
        query = query.eq('sync_type', syncTypeFilter);
      }

      // Apply search
      if (searchTerm) {
        query = query.or(`sync_type.ilike.%${searchTerm}%,error_message.ilike.%${searchTerm}%`);
      }

      // Apply pagination
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error loading sync logs:', error);
        return;
      }

      setLogs(data || []);
      
      // Calculate total pages
      if (count !== null) {
        setTotalPages(Math.ceil(count / ITEMS_PER_PAGE));
      }
    } catch (error) {
      console.error('Error loading sync logs:', error);
    } finally {
      setLoading(false);
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

  const getDuration = (startedAt: string, completedAt?: string) => {
    const start = new Date(startedAt);
    const end = completedAt ? new Date(completedAt) : new Date();
    const diffMs = end.getTime() - start.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    
    if (diffMinutes < 1) {
      return `${diffSeconds}s`;
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ${diffSeconds % 60}s`;
    } else {
      const hours = Math.floor(diffMinutes / 60);
      return `${hours}h ${diffMinutes % 60}m`;
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      
      // Get all logs for export (without pagination)
      let query = supabase
        .from('hubspot_sync_logs')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (syncTypeFilter !== 'all') {
        query = query.eq('sync_type', syncTypeFilter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error exporting logs:', error);
        return;
      }

      // Convert to CSV
      const csvContent = convertToCSV(data || []);
      
      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sync-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting logs:', error);
    } finally {
      setExporting(false);
    }
  };

  const convertToCSV = (logs: SyncLog[]) => {
    const headers = [
      'ID',
      'Sync Type',
      'Status',
      'Started At',
      'Completed At',
      'Duration',
      'Records Processed',
      'Records Synced',
      'Records Failed',
      'Error Message'
    ];

    const rows = logs.map(log => [
      log.id,
      log.sync_type,
      log.status,
      formatDate(log.started_at),
      log.completed_at ? formatDate(log.completed_at) : '',
      getDuration(log.started_at, log.completed_at),
      log.records_processed,
      log.records_synced,
      log.records_failed,
      log.error_message || ''
    ]);

    return [headers, ...rows].map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n');
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadSyncLogs();
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setSyncTypeFilter('all');
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sync History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Sync History</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search sync logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="started">In Progress</SelectItem>
            </SelectContent>
          </Select>
          <Select value={syncTypeFilter} onValueChange={setSyncTypeFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Sync Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="contacts">Contacts</SelectItem>
              <SelectItem value="deals">Deals</SelectItem>
              <SelectItem value="companies">Companies</SelectItem>
              <SelectItem value="full">Full Sync</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearFilters}
          >
            <Filter className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>

        {/* Logs Table */}
        <div className="border rounded-lg">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 text-sm font-medium">Sync Type</th>
                  <th className="text-left p-3 text-sm font-medium">Status</th>
                  <th className="text-left p-3 text-sm font-medium">Started</th>
                  <th className="text-left p-3 text-sm font-medium">Duration</th>
                  <th className="text-left p-3 text-sm font-medium">Records</th>
                  <th className="text-left p-3 text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center p-8 text-muted-foreground">
                      No sync logs found
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="border-t hover:bg-muted/30">
                      <td className="p-3">
                        <div className="font-medium capitalize">
                          {log.sync_type.replace('_', ' ')}
                        </div>
                      </td>
                      <td className="p-3">
                        {getStatusBadge(log.status)}
                      </td>
                      <td className="p-3">
                        <div className="text-sm">
                          <div>{formatDate(log.started_at)}</div>
                          <div className="text-muted-foreground">
                            {getTimeAgo(log.started_at)}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">
                          {getDuration(log.started_at, log.completed_at)}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-green-600">{log.records_synced}</span>
                            <span className="text-muted-foreground">/</span>
                            <span>{log.records_processed}</span>
                            {log.records_failed > 0 && (
                              <>
                                <span className="text-muted-foreground">/</span>
                                <span className="text-red-600">{log.records_failed}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedLog(log)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Sync Details</DialogTitle>
                              <DialogDescription>
                                Detailed information about this sync operation
                              </DialogDescription>
                            </DialogHeader>
                            {selectedLog && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium">Sync Type</label>
                                    <p className="text-sm text-muted-foreground capitalize">
                                      {selectedLog.sync_type.replace('_', ' ')}
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Status</label>
                                    <div className="mt-1">
                                      {getStatusBadge(selectedLog.status)}
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Started At</label>
                                    <p className="text-sm text-muted-foreground">
                                      {formatDate(selectedLog.started_at)}
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Completed At</label>
                                    <p className="text-sm text-muted-foreground">
                                      {selectedLog.completed_at ? formatDate(selectedLog.completed_at) : 'In Progress'}
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Duration</label>
                                    <p className="text-sm text-muted-foreground">
                                      {getDuration(selectedLog.started_at, selectedLog.completed_at)}
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Records Processed</label>
                                    <p className="text-sm text-muted-foreground">
                                      {selectedLog.records_processed}
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Records Synced</label>
                                    <p className="text-sm text-green-600 font-medium">
                                      {selectedLog.records_synced}
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Records Failed</label>
                                    <p className="text-sm text-red-600 font-medium">
                                      {selectedLog.records_failed}
                                    </p>
                                  </div>
                                </div>
                                
                                {selectedLog.error_message && (
                                  <div>
                                    <label className="text-sm font-medium">Error Message</label>
                                    <div className="mt-1 p-3 bg-red-50 border border-red-200 rounded-md">
                                      <p className="text-sm text-red-800">
                                        {selectedLog.error_message}
                                      </p>
                                    </div>
                                  </div>
                                )}
                                
                                {selectedLog.details && (
                                  <div>
                                    <label className="text-sm font-medium">Additional Details</label>
                                    <div className="mt-1 p-3 bg-gray-50 border rounded-md">
                                      <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                                        {JSON.stringify(selectedLog.details, null, 2)}
                                      </pre>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 