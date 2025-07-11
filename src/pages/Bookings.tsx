import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { getCurrentUserTeamId } from '@/lib/teamUtils';
import { BookingService, Booking } from '@/lib/bookingService';
import { Calendar, MapPin, Users, DollarSign, Clock, Search, Filter, Download, Eye, Phone, Mail, CalendarDays, TrendingUp, ArrowUpRight, ArrowDownRight, CheckCircle, XCircle, AlertCircle, Edit, Trash2, MoreHorizontal, Plus, FileText, User, Building, CreditCard, Plane, Hotel, Car, Ticket } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

interface BookingWithDetails {
  id: string;
  booking_reference: string;
  quote_id: string;
  parent_quote_id?: string;
  quote_version?: number;
  event_id?: string;
  client_id?: string;
  consultant_id?: string;
  user_id: string;
  team_id: string;
  status: string;
  total_price: number;
  currency: string;
  payment_schedule_snapshot?: any;
  package_snapshot?: any;
  provisional_expires_at?: string;
  provisional_reason?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  lead_traveler_id?: string;
  booking_notes?: string;
  internal_notes?: string;
  special_requests?: string;
  quote?: {
    client_name: string;
    event_name?: string;
    event_location?: string;
    package_name?: string;
    tier_name?: string;
  };
  travelers?: Array<{
    first_name: string;
    last_name: string;
    traveler_type: string;
    email?: string;
    phone?: string;
  }>;
  payments?: Array<{
    payment_type: string;
    amount: number;
    due_date: string;
    paid: boolean;
    paid_at?: string;
  }>;
  components?: Array<{
    component_type: string;
    component_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
}

export default function Bookings() {
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<BookingWithDetails[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    status: '',
    bookingNotes: '',
    internalNotes: '',
    specialRequests: ''
  });
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');

  useEffect(() => {
    loadBookings();
  }, []);

  useEffect(() => {
    filterAndSortBookings();
  }, [bookings, searchTerm, statusFilter, sortBy]);

  const loadBookings = async () => {
    try {
      setIsLoading(true);
      const teamId = await getCurrentUserTeamId();
      if (!teamId) {
        throw new Error('User not part of a team');
      }

      // Fetch bookings with related data
      const { data: bookingsData, error } = await supabase
        .from('bookings')
        .select(`
          *,
          quote:quotes!bookings_quote_id_fkey(
            client_name,
            event_name,
            event_location,
            package_name,
            tier_name
          ),
          travelers:booking_travelers!booking_travelers_booking_id_fkey(
            first_name,
            last_name,
            traveler_type,
            email,
            phone
          ),
          payments:booking_payments!booking_payments_booking_id_fkey(
            payment_type,
            amount,
            due_date,
            paid,
            paid_at
          ),
          components:booking_components!booking_components_booking_id_fkey(
            component_type,
            component_name,
            quantity,
            unit_price,
            total_price
          )
        `)
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch bookings: ${error.message}`);
      }

      setBookings(bookingsData || []);
    } catch (error) {
      console.error('Failed to load bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortBookings = () => {
    let filtered = [...bookings];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(booking => 
        booking.quote?.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.quote?.event_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.quote?.event_location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.booking_reference?.toLowerCase().includes(searchTerm.toLowerCase())
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
          return (a.quote?.client_name || '').localeCompare(b.quote?.client_name || '');
        case 'eventName':
          return (a.quote?.event_name || '').localeCompare(b.quote?.event_name || '');
        case 'totalPrice':
          return b.total_price - a.total_price;
        case 'status':
          return a.status.localeCompare(b.status);
        case 'bookingReference':
          return (a.booking_reference || '').localeCompare(b.booking_reference || '');
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
      case 'provisional':
        return 'secondary';
      case 'pending_payment':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      case 'completed':
        return 'default';
      case 'refunded':
        return 'destructive';
      case 'draft':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'provisional': return <AlertCircle className="h-4 w-4" />;
      case 'pending_payment': return <Clock className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'refunded': return <XCircle className="h-4 w-4" />;
      case 'draft': return <FileText className="h-4 w-4" />;
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
    const counts = { 
      all: bookings.length, 
      draft: 0, 
      provisional: 0, 
      pending_payment: 0, 
      confirmed: 0, 
      cancelled: 0, 
      completed: 0, 
      refunded: 0 
    };
    bookings.forEach(booking => {
      counts[booking.status as keyof typeof counts]++;
    });
    return counts;
  };

  const statusCounts = getStatusCounts();

  const getTotalRevenue = () => {
    return bookings
      .filter(booking => booking.status === 'confirmed' || booking.status === 'completed')
      .reduce((total, booking) => total + booking.total_price, 0);
  };

  // Calculate metrics for the stats cards
  const totalRevenue = getTotalRevenue();
  const conversionRate = bookings.length > 0 ? ((statusCounts.confirmed + statusCounts.completed) / bookings.length) * 100 : 0;
  
  const thisMonthBookings = bookings.filter(b => {
    const date = new Date(b.created_at);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;

  const handleEditBooking = (booking: BookingWithDetails) => {
    setSelectedBooking(booking);
    setEditForm({
      status: booking.status,
      bookingNotes: booking.booking_notes || '',
      internalNotes: booking.internal_notes || '',
      specialRequests: booking.special_requests || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateBooking = async () => {
    if (!selectedBooking) return;

    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          status: editForm.status,
          booking_notes: editForm.bookingNotes,
          internal_notes: editForm.internalNotes,
          special_requests: editForm.specialRequests,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedBooking.id);

      if (error) throw error;

      toast.success('Booking updated successfully');
      setIsEditDialogOpen(false);
      loadBookings();
    } catch (error) {
      console.error('Failed to update booking:', error);
      toast.error('Failed to update booking');
    }
  };

  const handleDeleteBooking = async () => {
    if (!selectedBooking) return;

    try {
      await BookingService.deleteBooking(selectedBooking.id);

      toast.success('Booking deleted successfully and inventory released');
      setIsDeleteDialogOpen(false);
      loadBookings();
    } catch (error) {
      console.error('Failed to delete booking:', error);
      toast.error('Failed to delete booking');
    }
  };

  const handleStatusChange = async () => {
    if (!selectedBooking || !newStatus) return;

    try {
      await BookingService.updateBookingStatus(selectedBooking.id, newStatus as any, statusNotes);
      toast.success('Booking status updated successfully');
      setIsStatusDialogOpen(false);
      loadBookings();
    } catch (error) {
      console.error('Failed to update booking status:', error);
      toast.error('Failed to update booking status');
    }
  };

  const getComponentIcon = (componentType: string) => {
    switch (componentType) {
      case 'ticket': return <Ticket className="h-4 w-4" />;
      case 'hotel_room': return <Hotel className="h-4 w-4" />;
      case 'flight': return <Plane className="h-4 w-4" />;
      case 'circuit_transfer': return <Car className="h-4 w-4" />;
      case 'airport_transfer': return <Car className="h-4 w-4" />;
      case 'lounge_pass': return <Building className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="mx-auto px-8 py-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col pt-4 lg:flex-row justify-between items-start lg:items-end gap-6">
        <div>
          <h1 className="text-2xl font-bold">Bookings Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage all your client bookings and track revenue
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild className="rounded-xl px-6">
            <Link to="/quotes">
              View Quotes
            </Link>
          </Button>
          <Button asChild className="rounded-xl px-6">
            <Link to="/create-booking">
              <Plus className="h-4 w-4 mr-2" />
              New Booking
            </Link>
          </Button>
        </div>
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
                  placeholder="Search bookings by client, event, or reference..."
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
                <SelectItem value="provisional">Provisional ({statusCounts.provisional})</SelectItem>
                <SelectItem value="pending_payment">Pending Payment ({statusCounts.pending_payment})</SelectItem>
                <SelectItem value="confirmed">Confirmed ({statusCounts.confirmed})</SelectItem>
                <SelectItem value="completed">Completed ({statusCounts.completed})</SelectItem>
                <SelectItem value="cancelled">Cancelled ({statusCounts.cancelled})</SelectItem>
                <SelectItem value="refunded">Refunded ({statusCounts.refunded})</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full lg:w-48 rounded-xl">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Date Created</SelectItem>
                <SelectItem value="clientName">Client Name</SelectItem>
                <SelectItem value="eventName">Event Name</SelectItem>
                <SelectItem value="totalPrice">Total Price</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="bookingReference">Booking Reference</SelectItem>
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
                            {booking.quote?.event_name || 'Untitled Booking'}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {booking.booking_reference} • #{booking.id.slice(0, 8)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={getStatusColor(booking.status)} className="mb-2">
                          {getStatusIcon(booking.status)}
                          <span className="ml-1 capitalize">{booking.status.replace('_', ' ')}</span>
                        </Badge>
                        <p className="text-2xl font-bold">
                          {formatCurrency(booking.total_price, booking.currency)}
                        </p>
                      </div>
                    </div>

                    {/* Info Row */}
                    <div className="inline-grid grid-cols-1 md:grid-cols-3 gap-8 mb-4">
                      <div className="flex items-start gap-3">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Client</p>
                          <p className="font-medium">{booking.quote?.client_name || 'Not specified'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Event</p>
                          <p className="font-medium">{booking.quote?.event_name || 'Not specified'}</p>
                          {booking.quote?.event_location && (
                            <p className="text-sm text-muted-foreground">{booking.quote.event_location}</p>
                          )}
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

                    {/* Components Row */}
                    {booking.components && booking.components.length > 0 && (
                      <div className="mb-4 p-3 bg-muted/30 rounded-lg">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Components</p>
                        <div className="flex flex-wrap gap-2">
                          {booking.components.map((component, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {getComponentIcon(component.component_type)}
                              <span className="ml-1">{component.component_name}</span>
                              <span className="ml-1 text-muted-foreground">x{component.quantity}</span>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Bottom Row */}
                    <div className="flex items-center justify-between pt-4 border-t border-border/50">
                      <div className="flex items-center gap-4">
                        <div className="text-sm text-muted-foreground">
                          {new Date(booking.created_at).toLocaleDateString()}
                        </div>
                        {booking.travelers && booking.travelers.length > 0 && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="h-4 w-4" />
                            <span>{booking.travelers.length} travelers</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild className="rounded-lg">
                          <Link to={`/booking/${booking.id}`}>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Link>
                        </Button>
                        
                        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="rounded-lg"
                              onClick={() => handleEditBooking(booking)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle>Edit Booking</DialogTitle>
                              <DialogDescription>
                                Update booking details and notes
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="status" className="text-right">Status</Label>
                                <Select value={editForm.status} onValueChange={(value) => setEditForm({...editForm, status: value})}>
                                  <SelectTrigger className="col-span-3">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="provisional">Provisional</SelectItem>
                                    <SelectItem value="pending_payment">Pending Payment</SelectItem>
                                    <SelectItem value="confirmed">Confirmed</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                    <SelectItem value="refunded">Refunded</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="bookingNotes" className="text-right">Booking Notes</Label>
                                <Textarea
                                  id="bookingNotes"
                                  value={editForm.bookingNotes}
                                  onChange={(e) => setEditForm({...editForm, bookingNotes: e.target.value})}
                                  className="col-span-3"
                                  placeholder="Notes for the client..."
                                />
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="internalNotes" className="text-right">Internal Notes</Label>
                                <Textarea
                                  id="internalNotes"
                                  value={editForm.internalNotes}
                                  onChange={(e) => setEditForm({...editForm, internalNotes: e.target.value})}
                                  className="col-span-3"
                                  placeholder="Internal notes..."
                                />
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="specialRequests" className="text-right">Special Requests</Label>
                                <Textarea
                                  id="specialRequests"
                                  value={editForm.specialRequests}
                                  onChange={(e) => setEditForm({...editForm, specialRequests: e.target.value})}
                                  className="col-span-3"
                                  placeholder="Special requests..."
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button onClick={handleUpdateBooking}>Update Booking</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="rounded-lg text-destructive hover:text-destructive"
                              onClick={() => {
                                setSelectedBooking(booking);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Booking</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this booking? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleDeleteBooking} className="bg-destructive text-destructive-foreground">
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                        <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="rounded-lg"
                              onClick={() => {
                                setSelectedBooking(booking);
                                setNewStatus('');
                                setStatusNotes('');
                                setIsStatusDialogOpen(true);
                              }}
                            >
                              <MoreHorizontal className="h-4 w-4 mr-1" />
                              Status
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle>Update Booking Status</DialogTitle>
                              <DialogDescription>
                                Change the booking status and add notes
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="newStatus" className="text-right">New Status</Label>
                                <Select value={newStatus} onValueChange={setNewStatus}>
                                  <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="provisional">Provisional</SelectItem>
                                    <SelectItem value="pending_payment">Pending Payment</SelectItem>
                                    <SelectItem value="confirmed">Confirmed</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                    <SelectItem value="refunded">Refunded</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="statusNotes" className="text-right">Notes</Label>
                                <Textarea
                                  id="statusNotes"
                                  value={statusNotes}
                                  onChange={(e) => setStatusNotes(e.target.value)}
                                  className="col-span-3"
                                  placeholder="Reason for status change..."
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button onClick={handleStatusChange} disabled={!newStatus}>
                                Update Status
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
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
                  ? 'Create bookings from quotes to see them here'
                  : 'Try adjusting your search or filter criteria'
                }
              </p>
              {bookings.length === 0 && (
                <div className="flex gap-2 justify-center">
                  <Button asChild className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 px-6 py-3 rounded-xl">
                    <Link to="/quotes">
                      View Quotes
                    </Link>
                  </Button>
                  <Button asChild className="px-6 py-3 rounded-xl">
                    <Link to="/create-booking">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Booking
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 