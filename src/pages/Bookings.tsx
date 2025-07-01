import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { Calendar, MapPin, Users, DollarSign, Clock, Search, Filter, Download, Eye, Phone, Mail, CalendarDays, TrendingUp, ArrowUpRight, ArrowDownRight, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Booking {
  id: string;
  quote_id: string;
  user_id: string;
  client_name: string;
  booking_data: any;
  total_cost: number;
  currency: string;
  status: string;
  supplier_ref: string | null;
  created_at: string;
  updated_at: string;
  quote?: {
    generated_itinerary: any;
    trip_details: any;
  };
}

export default function Bookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadBookings();
  }, []);

  useEffect(() => {
    filterAndSortBookings();
  }, [bookings, searchTerm, statusFilter, sortBy]);

  const loadBookings = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Fetch bookings with related quote data
      const { data: bookingsData, error } = await supabase
        .from('bookings')
        .select(`
          *,
          quote:quotes(
            generated_itinerary,
            trip_details
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch bookings: ${error.message}`);
      }

      setBookings(bookingsData || []);
    } catch (error) {
      console.error('Failed to load bookings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortBookings = () => {
    let filtered = [...bookings];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(booking => 
        booking.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.quote?.generated_itinerary?.destination?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.supplier_ref?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'createdAt':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'clientName':
          return (a.client_name || '').localeCompare(b.client_name || '');
        case 'destination':
          return (a.quote?.generated_itinerary?.destination || '').localeCompare(b.quote?.generated_itinerary?.destination || '');
        case 'totalCost':
          return b.total_cost - a.total_cost;
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

    setFilteredBookings(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      case 'completed':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <AlertCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
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
    const counts = { all: bookings.length, confirmed: 0, pending: 0, cancelled: 0, completed: 0 };
    bookings.forEach(booking => {
      counts[booking.status as keyof typeof counts]++;
    });
    return counts;
  };

  const statusCounts = getStatusCounts();

  const getTotalRevenue = () => {
    return bookings
      .filter(booking => booking.status === 'confirmed' || booking.status === 'completed')
      .reduce((total, booking) => total + booking.total_cost, 0);
  };

  // Calculate metrics for the stats cards
  const totalRevenue = getTotalRevenue();
  const conversionRate = bookings.length > 0 ? ((statusCounts.confirmed + statusCounts.completed) / bookings.length) * 100 : 0;
  
  const thisMonthBookings = bookings.filter(b => {
    const date = new Date(b.created_at);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="mx-auto px-8 py-0 space-y-8">
      {/* Header */}
      <div className="flex flex-col pt-4 lg:flex-row justify-between items-start lg:items-end gap-6">
        <div>
          <h1 className="text-2xl font-bold">Confirmed Bookings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your confirmed client bookings and track revenue
          </p>
        </div>
        <Button asChild className="rounded-xl px-6">
          <Link to="/quotes">
            View All Quotes
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-b from-card/95 to-background/20 border border-border rounded-2xl shadow-sm pt-0 pb-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Total Bookings</span>
              <span className="flex items-center gap-1 text-xs font-semibold bg-muted px-2 py-0.5 rounded-full border border-border">
                <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                +{thisMonthBookings}
              </span>
            </div>
            <div className="text-3xl font-bold text-foreground mb-4">{statusCounts.all}</div>
            <div className="text-sm font-medium text-foreground flex items-center gap-1 mb-1">
              {thisMonthBookings} this month <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-xs text-muted-foreground">Total booking volume</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-b from-card/95 to-background/20 border border-border rounded-2xl shadow-sm pt-0 pb-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Confirmed</span>
              <span className="flex items-center gap-1 text-xs font-semibold bg-muted px-2 py-0.5 rounded-full border border-border">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Active
              </span>
            </div>
            <div className="text-3xl font-bold text-foreground mb-4">{statusCounts.confirmed}</div>
            <div className="text-sm font-medium text-foreground flex items-center gap-1 mb-1">
              Ready for travel <CheckCircle className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-xs text-muted-foreground">Confirmed bookings</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-b from-card/95 to-background/20 border border-border rounded-2xl shadow-sm pt-0 pb-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Completed</span>
              <span className="flex items-center gap-1 text-xs font-semibold bg-muted px-2 py-0.5 rounded-full border border-border">
                <TrendingUp className="w-4 h-4" />
                +{conversionRate.toFixed(1)}%
              </span>
            </div>
            <div className="text-3xl font-bold text-foreground mb-4">{statusCounts.completed}</div>
            <div className="text-sm font-medium text-foreground flex items-center gap-1 mb-1">
              Success rate <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-xs text-muted-foreground">Successfully completed</div>
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
              From confirmed bookings <TrendingUp className="w-4 h-4 text-muted-foreground" />
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
                  placeholder="Search bookings by client, destination, or ID..."
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
                <SelectItem value="confirmed">Confirmed ({statusCounts.confirmed})</SelectItem>
                <SelectItem value="completed">Completed ({statusCounts.completed})</SelectItem>
                <SelectItem value="pending">Pending ({statusCounts.pending})</SelectItem>
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
                <SelectItem value="totalCost">Total Cost</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              onClick={loadBookings} 
              disabled={isLoading}
              className="rounded-xl px-6"
            >
              {isLoading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bookings List */}
      <Card className="bg-background shadow-none p-0">
        <CardHeader className="p-0">
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            All Bookings ({filteredBookings.length} of {bookings.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-16">
              <div className="mx-auto w-16 h-16 bg-muted rounded-xl flex items-center justify-center mb-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
              <h3 className="text-lg font-semibold mb-3">Loading bookings...</h3>
              <p className="text-muted-foreground">Please wait while we fetch your booking data</p>
            </div>
          ) : filteredBookings.length > 0 ? (
            <div className="space-y-4">
              {filteredBookings.map((booking) => (
                <Card key={booking.id} className="pt-0 pb-0 group hover:shadow-lg transition-all duration-300 overflow-hidden border border-border/50 bg-gradient-to-r from-card/95 to-background/20">
                  <CardContent className="p-6">
                    {/* Header Row */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <CalendarDays className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">
                            {booking.quote?.generated_itinerary?.title || 'Untitled Booking'}
                          </h3>
                          <p className="text-sm text-muted-foreground">#{booking.id.slice(0, 8)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={getStatusColor(booking.status)} className="mb-2">
                          {getStatusIcon(booking.status)}
                          <span className="ml-1 capitalize">{booking.status}</span>
                        </Badge>
                        <p className="text-2xl font-bold">
                          {formatCurrency(booking.total_cost, booking.currency)}
                        </p>
                      </div>
                    </div>

                    {/* Info Row */}
                    <div className="inline-grid grid-cols-1 md:grid-cols-3 gap-8 mb-4">
                      <div className="flex items-start gap-3">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Client</p>
                          <p className="font-medium">{booking.client_name || 'Not specified'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Destination</p>
                          <p className="font-medium">{booking.quote?.generated_itinerary?.destination || 'Not specified'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Created</p>
                          <p className="font-medium">{getTimeAgo(booking.created_at)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row */}
                    <div className="flex items-center justify-between pt-4 border-t border-border/50">
                      <div className="flex items-center gap-4">
                        {booking.supplier_ref && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Ref:</span>
                            <span className="font-medium">{booking.supplier_ref}</span>
                          </div>
                        )}
                        <div className="text-sm text-muted-foreground">
                          {new Date(booking.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild className="rounded-lg">
                          <Link to={`/booking/${booking.id}`}>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-lg">
                          <Download className="h-4 w-4 mr-1" />
                          Export
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-lg">
                          <Phone className="h-4 w-4 mr-1" />
                          Contact
                        </Button>
                        {booking.status === 'confirmed' && (
                          <Button size="sm" className="rounded-lg">
                            Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="mx-auto w-16 h-16 bg-muted rounded-xl flex items-center justify-center mb-6">
                <CalendarDays className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-3">
                {bookings.length === 0 ? 'No bookings yet' : 'No bookings match your filters'}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {bookings.length === 0 
                  ? 'Confirm some quotes to see your bookings here'
                  : 'Try adjusting your search or filter criteria'
                }
              </p>
              {bookings.length === 0 && (
                <Button asChild className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 px-6 py-3 rounded-xl">
                  <Link to="/quotes">
                    View Quotes to Confirm
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