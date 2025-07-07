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
import { Quote } from '@/types';
import { toast } from 'sonner';
import { format } from 'date-fns';

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
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    sent: 0,
    accepted: 0,
    declined: 0,
    expired: 0,
    totalValue: 0
  });

  const itemsPerPage = 20;

  useEffect(() => {
    loadQuotes();
    loadStats();
  }, [currentPage, statusFilter]);

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
  }, [searchTerm]);

  const loadQuotes = async () => {
    try {
      setLoading(true);
      const offset = (currentPage - 1) * itemsPerPage;
      const result = await QuoteService.getTeamQuotes(statusFilter === 'all' ? undefined : statusFilter, itemsPerPage, offset);
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
      const result = await QuoteService.searchQuotes(searchTerm, statusFilter === 'all' ? undefined : statusFilter);
      setQuotes(result.quotes);
      setTotalQuotes(result.total);
      setSelectedQuotes(new Set()); // Clear selections when searching
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search quotes');
    } finally {
      setLoading(false);
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
      case 'draft': return 'bg-gray-500';
      case 'sent': return 'bg-blue-500';
      case 'accepted': return 'bg-green-500';
      case 'declined': return 'bg-red-500';
      case 'expired': return 'bg-orange-500';
      case 'confirmed': return 'bg-purple-500';
      case 'cancelled': return 'bg-red-600';
      default: return 'bg-gray-500';
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

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-500">{stats.draft}</div>
              <div className="text-sm text-muted-foreground">Draft</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">{stats.sent}</div>
              <div className="text-sm text-muted-foreground">Sent</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">{stats.accepted}</div>
              <div className="text-sm text-muted-foreground">Accepted</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">{stats.declined}</div>
              <div className="text-sm text-muted-foreground">Declined</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">{stats.expired}</div>
              <div className="text-sm text-muted-foreground">Expired</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                £{stats.totalValue.toLocaleString()}
            </div>
              <div className="text-sm text-muted-foreground">Total Value</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Bulk Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search quotes by number, client, or event..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
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
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {selectedQuotes.size} quote{selectedQuotes.size !== 1 ? 's' : ''} selected
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Select onValueChange={(value) => handleBulkStatusUpdate(value as Quote['status'])}>
                    <SelectTrigger className="w-40">
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
                    className="flex items-center gap-2"
                  >
                    {bulkActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Send
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                    disabled={bulkActionLoading}
                    className="flex items-center gap-2"
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
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p>Loading quotes...</p>
          </div>
        </div>
      ) : quotes.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No quotes found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first quote'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Button onClick={() => navigate('/package-intake')}>
                Create Your First Quote
            </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Select All Header */}
          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
            <Checkbox
              checked={selectedQuotes.size === quotes.length && quotes.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm font-medium">Select All</span>
            {selectedQuotes.size > 0 && (
              <span className="text-sm text-muted-foreground">
                ({selectedQuotes.size} selected)
              </span>
            )}
          </div>

          {quotes.map((quote) => (
            <Card key={quote.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <Checkbox
                      checked={selectedQuotes.has(quote.id)}
                      onCheckedChange={() => handleSelectQuote(quote.id)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{quote.quoteNumber}</h3>
                        <Badge className={`${getStatusColor(quote.status)} text-white flex items-center gap-1`}>
                          {getStatusIcon(quote.status)}
                          {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{quote.clientName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{quote.eventName || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {quote.eventStartDate && quote.eventEndDate 
                              ? `${format(new Date(quote.eventStartDate), 'MMM dd')} - ${format(new Date(quote.eventEndDate), 'MMM dd, yyyy')}`
                              : 'Dates TBD'
                            }
                          </span>
                    </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">
                            {quote.currency} {(quote.totalPrice || 0).toLocaleString()}
                          </span>
                    </div>
                    </div>
                    </div>
                    </div>
                    
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/quotes/${quote.id}`)}
                      className="flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      View
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                      onClick={() => navigate(`/quotes/${quote.id}/edit`)}
                      className="flex items-center gap-2"
                      >
                      <Edit className="h-4 w-4" />
                      Edit
                      </Button>
                    {quote.status === 'draft' && (
                      <Button 
                        variant="outline"
                        size="sm" 
                        onClick={() => handleSendQuote(quote)}
                        disabled={bulkActionLoading}
                        className="flex items-center gap-2"
                      >
                        {bulkActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        Send
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDuplicateQuote(quote)}
                      disabled={bulkActionLoading}
                      className="flex items-center gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      Duplicate
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      PDF
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteQuote(quote)}
                      disabled={bulkActionLoading}
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
                  </CardContent>
                </Card>
              ))}
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