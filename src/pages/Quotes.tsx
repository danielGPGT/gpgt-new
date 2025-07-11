import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Mail, 
  Download, 
  Calendar, 
  Users, 
  User,
  DollarSign, 
  MapPin,
  Loader2,
  AlertCircle,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  Trash2,
  Copy,
  Archive,
  MoreHorizontal,
  Edit,
  Send,
  RefreshCw,
  CheckSquare,
  Square
} from 'lucide-react';
import { QuoteService } from '@/lib/quoteService';
import { downloadQuotePDF } from '@/lib/pdfService';
import { Quote } from '@/types';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { hasTeamFeature } from '@/lib/teamUtils';
import { supabase } from '@/lib/supabase';

export function Quotes() {
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalQuotes, setTotalQuotes] = useState(0);
  const [selectedQuotes, setSelectedQuotes] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [quoteToDelete, setQuoteToDelete] = useState<Quote | null>(null);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [quoteToDuplicate, setQuoteToDuplicate] = useState<Quote | null>(null);
  const [duplicateNotes, setDuplicateNotes] = useState('');
  const [duplicateLoading, setDuplicateLoading] = useState(false);
  const [viewScope, setViewScope] = useState<'team' | 'user'>('team');
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    sent: 0,
    accepted: 0,
    declined: 0,
    expired: 0,
    totalValue: 0
  });
  const [hasTeamAccess, setHasTeamAccess] = useState(false);

  const itemsPerPage = 20;

  useEffect(() => {
    loadQuotes();
    loadStats();
  }, [currentPage, statusFilter, viewScope]);

  useEffect(() => {
    checkTeamAccess();
  }, []);

  // Force user view if team access is lost
  useEffect(() => {
    if (!hasTeamAccess && viewScope === 'team') {
      setViewScope('user');
    }
  }, [hasTeamAccess, viewScope]);

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      if (searchTerm) {
        performSearch();
      } else {
        loadQuotes();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, viewScope]);

  const loadQuotes = async () => {
    try {
      setLoading(true);
      const offset = (currentPage - 1) * itemsPerPage;
      
      let result;
      if (viewScope === 'user') {
        result = await QuoteService.getUserQuotes(statusFilter === 'all' ? undefined : statusFilter, itemsPerPage, offset);
      } else {
        result = await QuoteService.getTeamQuotes(statusFilter === 'all' ? undefined : statusFilter, itemsPerPage, offset);
      }
      
      setQuotes(result.quotes);
      setTotalQuotes(result.total);
      setSelectedQuotes(new Set()); // Clear selections when loading new data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quotes');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const quoteStats = await QuoteService.getQuoteStats();
      setStats(quoteStats);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const performSearch = async () => {
    try {
      setLoading(true);
      const result = await QuoteService.searchQuotes(searchTerm, statusFilter === 'all' ? undefined : statusFilter, itemsPerPage, 0, viewScope);
      setQuotes(result.quotes);
      setTotalQuotes(result.total);
      setSelectedQuotes(new Set()); // Clear selections when searching
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search quotes');
    } finally {
      setLoading(false);
    }
  };

  const checkTeamAccess = async () => {
    const access = await hasTeamFeature('team_quotes');
    setHasTeamAccess(access);
    
    // If user doesn't have team access, force them to "My Quotes" view
    if (!access && viewScope === 'team') {
      setViewScope('user');
    }
  };

  // CRUD Operations
  const handleDeleteQuote = async (quote: Quote) => {
    setQuoteToDelete(quote);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteQuote = async () => {
    if (!quoteToDelete) return;
    
    try {
      setBulkActionLoading(true);
      await QuoteService.deleteQuote(quoteToDelete.id);
      toast.success('Quote deleted successfully');
      await loadQuotes(); // Reload the list
      await loadStats(); // Reload stats
    } catch (err) {
      console.error('Error deleting quote:', err);
      toast.error('Failed to delete quote');
    } finally {
      setBulkActionLoading(false);
      setDeleteDialogOpen(false);
      setQuoteToDelete(null);
    }
  };

  const handleDuplicateQuote = async (quote: Quote) => {
    setQuoteToDuplicate(quote);
    setDuplicateDialogOpen(true);
  };

  const confirmDuplicateQuote = async () => {
    if (!quoteToDuplicate) return;
    
    try {
      setDuplicateLoading(true);
      const newQuoteId = await QuoteService.createQuoteRevision(quoteToDuplicate.id, duplicateNotes);
      toast.success('Quote duplicated successfully');
      navigate(`/quotes/${newQuoteId}`); // Navigate to the new quote
    } catch (err) {
      console.error('Error duplicating quote:', err);
      toast.error('Failed to duplicate quote');
    } finally {
      setDuplicateLoading(false);
      setDuplicateDialogOpen(false);
      setQuoteToDuplicate(null);
      setDuplicateNotes('');
    }
  };

  const handleSendQuote = async (quote: Quote) => {
    try {
      setBulkActionLoading(true);
      await QuoteService.sendQuoteEmail(
        quote.id,
        quote.clientEmail || '',
        'quote_sent',
        `Your Quote ${quote.quoteNumber} - ${quote.eventName || 'Event Package'}`,
        `Dear ${quote.clientName},\n\nThank you for your interest in our event package. Please find your detailed quote attached.\n\nBest regards,\nYour Travel Team`
      );
      await QuoteService.updateQuoteStatus(quote.id, 'sent');
      toast.success('Quote sent successfully');
      await loadQuotes(); // Reload to update status
    } catch (err) {
      console.error('Error sending quote:', err);
      toast.error('Failed to send quote');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleDownloadPDF = async (quote: Quote) => {
    try {
      // Fetch transfer details from database
      const fetchTransferDetails = async () => {
        const components = [];
        
        if (quote.selectedComponents?.tickets) {
          components.push(...quote.selectedComponents.tickets);
        }
        if (quote.selectedComponents?.hotels) {
          components.push(...quote.selectedComponents.hotels);
        }
        if (quote.selectedComponents?.flights) {
          components.push(...quote.selectedComponents.flights);
        }
        if (quote.selectedComponents?.loungePass) {
          components.push(quote.selectedComponents.loungePass);
        }
        
        // Fetch circuit transfer details
        if (quote.selectedComponents?.circuitTransfers) {
          const circuitIds = quote.selectedComponents.circuitTransfers.map((t: any) => t.id);
          if (circuitIds.length > 0) {
            const { data: circuitData } = await supabase
              .from('circuit_transfers')
              .select('*')
              .in('id', circuitIds);
            
            const circuitTransfersWithDetails = quote.selectedComponents.circuitTransfers.map((transfer: any) => {
              const details = circuitData?.find((c: any) => c.id === transfer.id);
              return {
                ...transfer,
                component_type: 'circuit_transfer',
                transfer_type: details?.transfer_type || 'coach',
                days: details?.days || 1
              };
            });
            components.push(...circuitTransfersWithDetails);
          }
        }
        
        // Fetch airport transfer details
        if (quote.selectedComponents?.airportTransfers) {
          const airportIds = quote.selectedComponents.airportTransfers.map((t: any) => t.id);
          if (airportIds.length > 0) {
            const { data: airportData } = await supabase
              .from('airport_transfers')
              .select('*')
              .in('id', airportIds);
            
            const airportTransfersWithDetails = quote.selectedComponents.airportTransfers.map((transfer: any) => {
              const details = airportData?.find((a: any) => a.id === transfer.id);
              return {
                ...transfer,
                component_type: 'airport_transfer',
                transport_type: details?.transport_type || 'hotel_chauffeur'
              };
            });
            components.push(...airportTransfersWithDetails);
          }
        }
        
        return components.filter(component => component && typeof component === 'object');
      };

      // Convert Quote to QuoteData format
      const quoteData = {
        quote_number: quote.quoteNumber,
        created_at: quote.createdAt,
        status: quote.status,
        client_name: quote.clientName,
        client_email: quote.clientEmail,
        client_phone: quote.clientPhone,
        event_name: quote.eventName,
        event_location: quote.eventLocation,
        event_start_date: quote.eventStartDate,
        event_end_date: quote.eventEndDate,
        package_name: quote.packageName,
        tier_name: quote.tierName,
        travelers: [], // Convert travelers object to array if needed
        travelers_total: quote.travelersTotal,
        total_price: quote.totalPrice,
        currency: quote.currency,
        payment_deposit: quote.paymentDeposit,
        payment_second_payment: quote.paymentSecondPayment,
        payment_final_payment: quote.paymentFinalPayment,
        payment_deposit_date: quote.paymentDepositDate,
        payment_second_payment_date: quote.paymentSecondPaymentDate,
        payment_final_payment_date: quote.paymentFinalPaymentDate,
        team: quote.team,
        selected_components: await fetchTransferDetails()
      };
      
      await downloadQuotePDF(quoteData);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };

  const handleStatusUpdate = async (quoteId: string, newStatus: Quote['status']) => {
    try {
      setBulkActionLoading(true);
      await QuoteService.updateQuoteStatus(quoteId, newStatus);
      toast.success(`Quote status updated to ${newStatus}`);
      await loadQuotes(); // Reload to update status
    } catch (err) {
      console.error('Error updating quote status:', err);
      toast.error('Failed to update quote status');
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Bulk Operations
  const handleSelectAll = () => {
    if (selectedQuotes.size === quotes.length) {
      setSelectedQuotes(new Set());
    } else {
      setSelectedQuotes(new Set(quotes.map(q => q.id)));
    }
  };

  const handleSelectQuote = (quoteId: string) => {
    const newSelected = new Set(selectedQuotes);
    if (newSelected.has(quoteId)) {
      newSelected.delete(quoteId);
    } else {
      newSelected.add(quoteId);
    }
    setSelectedQuotes(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedQuotes.size === 0) return;
    
    try {
      setBulkActionLoading(true);
      const deletePromises = Array.from(selectedQuotes).map(quoteId => 
        QuoteService.deleteQuote(quoteId)
      );
      await Promise.all(deletePromises);
      toast.success(`${selectedQuotes.size} quotes deleted successfully`);
      setSelectedQuotes(new Set());
      await loadQuotes();
      await loadStats();
    } catch (err) {
      console.error('Error bulk deleting quotes:', err);
      toast.error('Failed to delete some quotes');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkSend = async () => {
    if (selectedQuotes.size === 0) return;
    
    try {
      setBulkActionLoading(true);
      const sendPromises = Array.from(selectedQuotes).map(async (quoteId) => {
        const quote = quotes.find(q => q.id === quoteId);
        if (!quote || quote.status === 'sent') return;
        
        await QuoteService.sendQuoteEmail(
          quoteId,
          quote.clientEmail || '',
          'quote_sent',
          `Your Quote ${quote.quoteNumber} - ${quote.eventName || 'Event Package'}`,
          `Dear ${quote.clientName},\n\nThank you for your interest in our event package. Please find your detailed quote attached.\n\nBest regards,\nYour Travel Team`
        );
        await QuoteService.updateQuoteStatus(quoteId, 'sent');
      });
      await Promise.all(sendPromises);
      toast.success(`${selectedQuotes.size} quotes sent successfully`);
      setSelectedQuotes(new Set());
      await loadQuotes();
    } catch (err) {
      console.error('Error bulk sending quotes:', err);
      toast.error('Failed to send some quotes');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkStatusUpdate = async (newStatus: Quote['status']) => {
    if (selectedQuotes.size === 0) return;
    
    try {
      setBulkActionLoading(true);
      const updatePromises = Array.from(selectedQuotes).map(quoteId => 
        QuoteService.updateQuoteStatus(quoteId, newStatus)
      );
      await Promise.all(updatePromises);
      toast.success(`${selectedQuotes.size} quotes updated to ${newStatus}`);
      setSelectedQuotes(new Set());
      await loadQuotes();
    } catch (err) {
      console.error('Error bulk updating quotes:', err);
      toast.error('Failed to update some quotes');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const getStatusColor = (status: Quote['status']) => {
    switch (status) {
      case 'draft': return 'secondary';
      case 'sent': return 'default';
      case 'accepted': return 'default';
      case 'declined': return 'destructive';
      case 'expired': return 'secondary';
      case 'confirmed': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: Quote['status']) => {
    switch (status) {
      case 'draft': return <FileText className="h-4 w-4" />;
      case 'sent': return <Mail className="h-4 w-4" />;
      case 'accepted': return <CheckCircle className="h-4 w-4" />;
      case 'declined': return <XCircle className="h-4 w-4" />;
      case 'expired': return <Clock className="h-4 w-4" />;
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const totalPages = Math.ceil(totalQuotes / itemsPerPage);

  return (
    <div className="mx-auto px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quotes</h1>
          <p className="text-muted-foreground">Manage and track all your quotes</p>
        </div>
        <Button onClick={() => navigate('/package-intake')} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create New Quote
        </Button>
      </div>

      {/* View Toggle */}
      <div className="flex items-center justify-start gap-4">
        <div className="flex border border-input rounded-xl overflow-hidden bg-background">
          <Button
            variant={viewScope === 'user' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewScope('user')}
            className="rounded-none border-0 px-6"
          >
            <User className="h-4 w-4 mr-2" />
            My Quotes
          </Button>
          {hasTeamAccess && (
            <Button
              variant={viewScope === 'team' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewScope('team')}
              className="rounded-none border-0 px-6"
            >
              <Users className="h-4 w-4 mr-2" />
              Team Quotes
            </Button>
          )}
        </div>
        {!hasTeamAccess && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>Team quotes access not available</span>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-b from-card/95 to-background/20 border border-border rounded-2xl shadow-sm pt-0 pb-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Total Quotes</span>
              <span className="flex items-center gap-1 text-xs font-semibold bg-muted px-2 py-0.5 rounded-full border border-border">
                <FileText className="w-4 h-4 text-muted-foreground" />
                All Time
              </span>
            </div>
            <div className="text-3xl font-bold text-foreground mb-4">{stats.total}</div>
            <div className="text-sm font-medium text-foreground flex items-center gap-1 mb-1">
              Managing all quote statuses
            </div>
            <div className="text-xs text-muted-foreground">Complete quote overview</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-b from-card/95 to-background/20 border border-border rounded-2xl shadow-sm pt-0 pb-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Draft Quotes</span>
              <span className="flex items-center gap-1 text-xs font-semibold bg-muted px-2 py-0.5 rounded-full border border-border">
                <FileText className="w-4 h-4 text-muted-foreground" />
                In Progress
              </span>
            </div>
            <div className="text-3xl font-bold text-foreground mb-4">{stats.draft}</div>
            <div className="text-sm font-medium text-foreground flex items-center gap-1 mb-1">
              Ready to be sent
            </div>
            <div className="text-xs text-muted-foreground">Awaiting client review</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-b from-card/95 to-background/20 border border-border rounded-2xl shadow-sm pt-0 pb-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Sent Quotes</span>
              <span className="flex items-center gap-1 text-xs font-semibold bg-muted px-2 py-0.5 rounded-full border border-border">
                <Mail className="w-4 h-4 text-muted-foreground" />
                Delivered
              </span>
            </div>
            <div className="text-3xl font-bold text-foreground mb-4">{stats.sent}</div>
            <div className="text-sm font-medium text-foreground flex items-center gap-1 mb-1">
              Awaiting client response
            </div>
            <div className="text-xs text-muted-foreground">Client decision pending</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-b from-card/95 to-background/20 border border-border rounded-2xl shadow-sm pt-0 pb-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Total Value</span>
              <span className="flex items-center gap-1 text-xs font-semibold bg-muted px-2 py-0.5 rounded-full border border-border">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                Revenue
              </span>
            </div>
            <div className="text-3xl font-bold text-foreground mb-4">£{stats.totalValue.toLocaleString()}</div>
            <div className="text-sm font-medium text-foreground flex items-center gap-1 mb-1">
              Combined quote value
            </div>
            <div className="text-xs text-muted-foreground">All quotes combined</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Bulk Actions */}
      <Card className="bg-gradient-to-b from-card/95 to-background/20 border border-border rounded-2xl shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search quotes by number, client, or event..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-input rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 px-4 py-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions */}
          {selectedQuotes.size > 0 && (
            <div className="p-4 bg-muted/40 rounded-xl border border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                    <CheckSquare className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-foreground">
                      {selectedQuotes.size} quote{selectedQuotes.size !== 1 ? 's' : ''} selected
                    </span>
                    <p className="text-xs text-muted-foreground">Choose an action below</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Select onValueChange={(value) => handleBulkStatusUpdate(value as Quote['status'])}>
                    <SelectTrigger className="w-44 px-3 py-2 rounded-lg border border-input bg-background">
                      <SelectValue placeholder="Update status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="declined">Declined</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleBulkSend}
                    disabled={bulkActionLoading}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg"
                  >
                    {bulkActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Send
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                    disabled={bulkActionLoading}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg"
                  >
                    {bulkActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quotes List */}
      {error && (
        <Alert variant="destructive" className="rounded-xl border border-destructive/20">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
            <p className="text-foreground font-medium">Loading quotes...</p>
            <p className="text-sm text-muted-foreground">Please wait while we fetch your data</p>
          </div>
        </div>
      ) : quotes.length === 0 ? (
        <Card className="bg-gradient-to-b from-card/95 to-background/20 border border-border rounded-2xl shadow-sm">
          <CardContent className="p-16 text-center">
            <div className="w-16 h-16 bg-muted rounded-xl flex items-center justify-center mx-auto mb-6">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-foreground">No quotes found</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search terms or filters to find what you\'re looking for'
                : 'Get started by creating your first quote to begin managing your proposals'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Button 
                onClick={() => navigate('/package-intake')}
                className="bg-primary hover:bg-primary/90 px-6 py-3 rounded-xl"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Quote
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Select All Header */}
          <div className="flex items-center gap-3 p-4 bg-muted/40 rounded-xl border border-border">
            <Checkbox
              checked={selectedQuotes.size === quotes.length && quotes.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm font-semibold text-foreground">Select All Quotes</span>
            {selectedQuotes.size > 0 && (
              <span className="text-sm text-muted-foreground">
                ({selectedQuotes.size} selected)
              </span>
            )}
          </div>

          {/* Quote Cards Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {quotes.map((quote) => (
              <Card 
                key={quote.id} 
                className="group hover:shadow-lg transition-all duration-300 overflow-hidden border border-border/50 bg-gradient-to-b from-card/95 to-background/20 rounded-xl shadow-sm"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedQuotes.has(quote.id)}
                        onCheckedChange={() => handleSelectQuote(quote.id)}
                      />
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:bg-primary/20 transition-colors">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-foreground">#{quote.quoteNumber}</span>
                      </div>
                    </div>
                    <Badge 
                      variant={getStatusColor(quote.status)}
                      className="text-xs px-2 py-0.5 rounded-full capitalize"
                    >
                      {getStatusIcon(quote.status)}
                      {quote.status}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Client</p>
                      <p className="font-medium text-foreground truncate">{quote.clientName || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Event</p>
                      <p className="font-medium text-foreground truncate">{quote.eventName || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Event Dates</p>
                    <p className="text-sm font-medium text-foreground">
                      {quote.eventStartDate && quote.eventEndDate 
                        ? `${format(new Date(quote.eventStartDate), 'MMM dd')} - ${format(new Date(quote.eventEndDate), 'MMM dd')}`
                        : 'Dates TBD'
                      }
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Total Value</p>
                    <p className="text-xl font-bold text-primary">
                      {quote.currency} {(quote.totalPrice || 0).toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
                    <span>{format(new Date(quote.createdAt), 'MMM dd')}</span>
                    <span>{format(new Date(quote.createdAt), 'HH:mm')}</span>
                  </div>
                  
                  <div className="flex gap-1 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => navigate(`/quotes/${quote.id}`)}
                      className="flex-1 rounded-lg h-8 text-xs"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate(`/quotes/${quote.id}/edit`)}
                      className="flex-1 rounded-lg h-8 text-xs"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    {quote.status === 'draft' && (
                      <Button 
                        variant="outline"
                        size="sm" 
                        onClick={() => handleSendQuote(quote)}
                        disabled={bulkActionLoading}
                        className="flex-1 rounded-lg h-8 text-xs"
                      >
                        {bulkActionLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Send className="h-3 w-3 mr-1" />}
                        Send
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDuplicateQuote(quote)}
                      disabled={bulkActionLoading}
                      className="flex-1 rounded-lg h-8 text-xs"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadPDF(quote)}
                      className="flex-1 rounded-lg h-8 text-xs"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      PDF
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteQuote(quote)}
                      disabled={bulkActionLoading}
                      className="rounded-lg h-8 w-8 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalQuotes)} of {totalQuotes} quotes
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
              </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Quote</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete quote <strong>{quoteToDelete?.quoteNumber}</strong>?</p>
            <p className="text-sm text-muted-foreground mt-2">
              This action cannot be undone. All quote data, including components and activity history, will be permanently deleted.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteQuote}
              disabled={bulkActionLoading}
            >
              {bulkActionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Delete Quote
                </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Duplicate Confirmation Dialog */}
      <Dialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicate Quote</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p>Create a copy of quote <strong>{quoteToDuplicate?.quoteNumber}</strong>?</p>
            <div>
              <Label htmlFor="duplicate-notes">Revision Notes (Optional)</Label>
              <Textarea
                id="duplicate-notes"
                placeholder="Enter notes about this revision..."
                value={duplicateNotes}
                onChange={(e) => setDuplicateNotes(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDuplicateDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmDuplicateQuote}
              disabled={duplicateLoading}
            >
              {duplicateLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              Duplicate Quote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 