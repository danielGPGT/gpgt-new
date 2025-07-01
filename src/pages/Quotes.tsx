import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { QuoteResponse } from '@/lib/quoteService';
import { useQuoteService } from '@/hooks/useQuoteService';
import { Calendar, MapPin, Users, DollarSign, Clock, Search, Filter, Download, Eye, Edit, FileText, Trash2, Plus, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Quotes() {
  const [quotes, setQuotes] = useState<QuoteResponse[]>([]);
  const [filteredQuotes, setFilteredQuotes] = useState<QuoteResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const { getUserQuotes, isFetchingQuotes, confirmQuote, isConfirmingQuote, deleteQuote, isDeletingQuote } = useQuoteService();

  useEffect(() => {
    loadQuotes();
  }, []);

  useEffect(() => {
    filterAndSortQuotes();
  }, [quotes, searchTerm, statusFilter, sortBy]);

  const loadQuotes = async () => {
    try {
      const userQuotes = await getUserQuotes();
      setQuotes(userQuotes);
    } catch (error) {
      console.error('Failed to load quotes:', error);
    }
  };

  const handleConfirmQuote = async (quoteId: string) => {
    try {
      const bookingId = await confirmQuote(quoteId);
      if (bookingId) {
        // Refresh the quotes list to show updated status
        await loadQuotes();
      }
    } catch (error) {
      console.error('Failed to confirm quote:', error);
    }
  };

  const handleDeleteQuote = async (quoteId: string) => {
    try {
      const success = await deleteQuote(quoteId);
      if (success) {
        // Remove the quote from the local state
        setQuotes(prevQuotes => prevQuotes.filter(quote => quote.id !== quoteId));
      }
    } catch (error) {
      console.error('Failed to delete quote:', error);
    }
  };

  const filterAndSortQuotes = () => {
    let filtered = [...quotes];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(quote => 
        quote.generatedItinerary?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.destination?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.clientEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.clientPhone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(quote => quote.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'createdAt':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'clientName':
          return (a.clientName || '').localeCompare(b.clientName || '');
        case 'destination':
          return (a.destination || '').localeCompare(b.destination || '');
        case 'totalPrice':
          return b.totalPrice - a.totalPrice;
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

    setFilteredQuotes(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'secondary';
      case 'confirmed':
        return 'default';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <Clock className="h-4 w-4" />;
      case 'confirmed': return <TrendingUp className="h-4 w-4" />;
      case 'cancelled': return <TrendingDown className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'GBP',
    }).format(amount);
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return `${Math.floor(diffInDays / 365)} years ago`;
  };

  const getStatusCounts = () => {
    const counts = { all: quotes.length, draft: 0, confirmed: 0, cancelled: 0 };
    quotes.forEach(quote => {
      counts[quote.status as keyof typeof counts]++;
    });
    return counts;
  };

  const statusCounts = getStatusCounts();

  // Calculate metrics for the stats cards
  const totalRevenue = quotes
    .filter(q => q.status === 'confirmed')
    .reduce((sum, q) => sum + q.totalPrice, 0);
  
  const conversionRate = quotes.length > 0 ? (statusCounts.confirmed / quotes.length) * 100 : 0;
  
  const thisMonthQuotes = quotes.filter(q => {
    const date = new Date(q.createdAt);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="mx-auto px-8 py-0 space-y-8">
      {/* Header */}
      <div className="flex flex-col pt-4 lg:flex-row justify-between items-start lg:items-end gap-6">
        <div>
          <h1 className="text-2xl font-bold">Client Quotes</h1>
          <p className="text-muted-foreground mt-2">
            Manage all your client quotes and itineraries
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-b from-card/95 to-background/20 border border-border rounded-2xl shadow-sm pt-0 pb-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Total Quotes</span>
              <span className="flex items-center gap-1 text-xs font-semibold bg-muted px-2 py-0.5 rounded-full border border-border">
                <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                +{thisMonthQuotes}
              </span>
            </div>
            <div className="text-3xl font-bold text-foreground mb-4">{statusCounts.all}</div>
            <div className="text-sm font-medium text-foreground flex items-center gap-1 mb-1">
              {thisMonthQuotes} this month <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-xs text-muted-foreground">Total quote volume</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-b from-card/95 to-background/20 border border-border rounded-2xl shadow-sm pt-0 pb-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Draft Quotes</span>
              <span className="flex items-center gap-1 text-xs font-semibold bg-muted px-2 py-0.5 rounded-full border border-border">
                Pending
              </span>
            </div>
            <div className="text-3xl font-bold text-foreground mb-4">{statusCounts.draft}</div>
            <div className="text-sm font-medium text-foreground flex items-center gap-1 mb-1">
              Awaiting confirmation <Clock className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-xs text-muted-foreground">Ready for client review</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-b from-card/95 to-background/20 border border-border rounded-2xl shadow-sm pt-0 pb-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Confirmed</span>
              <span className="flex items-center gap-1 text-xs font-semibold bg-muted px-2 py-0.5 rounded-full border border-border">
                <TrendingUp className="w-4 h-4" />
                +{conversionRate.toFixed(1)}%
              </span>
            </div>
            <div className="text-3xl font-bold text-foreground mb-4">{statusCounts.confirmed}</div>
            <div className="text-sm font-medium text-foreground flex items-center gap-1 mb-1">
              Conversion rate <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-xs text-muted-foreground">Successfully converted</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-b from-card/95 to-background/20 border border-border rounded-2xl shadow-sm pt-0 pb-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Total Revenue</span>
              <span className="flex items-center gap-1 text-xs font-semibold bg-muted px-2 py-0.5 rounded-full border border-border">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                Active
              </span>
            </div>
            <div className="text-3xl font-bold text-foreground mb-4">{formatCurrency(totalRevenue, 'GBP')}</div>
            <div className="text-sm font-medium text-foreground flex items-center gap-1 mb-1">
              From confirmed quotes <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-xs text-muted-foreground">Revenue generated</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="bg-gradient-to-b from-card/95 to-background/20 border border-border rounded-2xl shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search quotes by client, destination, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 py-3 border border-input rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-48 rounded-xl">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses ({statusCounts.all})</SelectItem>
                <SelectItem value="draft">Draft ({statusCounts.draft})</SelectItem>
                <SelectItem value="confirmed">Confirmed ({statusCounts.confirmed})</SelectItem>
                <SelectItem value="cancelled">Cancelled ({statusCounts.cancelled})</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full lg:w-48 rounded-xl">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Date Created</SelectItem>
                <SelectItem value="clientName">Client Name</SelectItem>
                <SelectItem value="destination">Destination</SelectItem>
                <SelectItem value="totalPrice">Total Price</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              onClick={loadQuotes} 
              disabled={isFetchingQuotes}
              className="rounded-xl px-6"
            >
              {isFetchingQuotes ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quotes List */}
      <Card className="bg-background shadow-none p-0">
        <CardHeader className="p-0">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              All Quotes ({filteredQuotes.length} of {quotes.length})
            </CardTitle>
            <Button asChild className="rounded-xl px-6">
              <Link to="/new-proposal">
                <Plus className="h-4 w-4 mr-2" />
                Create New Quote
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredQuotes.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredQuotes.map((quote) => (
                <Card key={quote.id} className="group hover:shadow-lg transition-all duration-300 overflow-hidden border border-border/50 bg-card">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-[var(--primary)]" />
                        <span className="text-sm font-medium">Quote #{quote.id.slice(0, 8)}</span>
                      </div>
                      <Badge 
                        variant={getStatusColor(quote.status)}
                        className="text-xs"
                      >
                        {quote.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Client</p>
                      <p className="font-medium">{quote.clientName || quote.clientEmail || 'Not specified'}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground">Destination</p>
                      <p className="font-medium">{quote.destination || 'Not specified'}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground">Total Value</p>
                      <p className="text-xl font-bold text-[var(--primary)]">
                        {formatCurrency(quote.totalPrice, quote.currency)}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{new Date(quote.createdAt).toLocaleDateString()}</span>
                      <span>{getTimeAgo(quote.createdAt)}</span>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" asChild className="flex-1 rounded-lg">
                        <Link to={`/quote/${quote.id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild className="flex-1 rounded-lg">
                        <Link to={`/quote/${quote.id}/edit`}>
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Link>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteQuote(quote.id)}
                        className="text-destructive hover:text-destructive rounded-lg"
                        disabled={isDeletingQuote}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {quote.status === 'draft' && (
                      <Button 
                        size="sm" 
                        onClick={() => handleConfirmQuote(quote.id)}
                        disabled={isConfirmingQuote}
                        className="w-full rounded-lg"
                      >
                        {isConfirmingQuote ? 'Confirming...' : 'Confirm Quote'}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="mx-auto w-16 h-16 bg-muted rounded-xl flex items-center justify-center mb-6">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-3">
                {quotes.length === 0 ? 'No quotes yet' : 'No quotes match your filters'}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {quotes.length === 0 
                  ? 'Create your first client quote to get started'
                  : 'Try adjusting your search or filter criteria'
                }
              </p>
              {quotes.length === 0 && (
                <Button asChild className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 px-6 py-3 rounded-xl">
                  <Link to="/builder">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Quote
                  </Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 