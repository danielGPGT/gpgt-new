import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import { BookingService, Booking } from '@/lib/bookingService';
import { Calendar, MapPin, Users, DollarSign, Clock, Search, Filter, Download, Eye, Phone, Mail, CalendarDays, TrendingUp, ArrowUpRight, ArrowDownRight, CheckCircle, XCircle, AlertCircle, Edit, Trash2, MoreHorizontal, Plus, FileText, User, Building, CreditCard, Plane, Hotel, Car, Ticket, ArrowLeft, Copy, Printer, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { downloadBookingConfirmationPDF } from '@/lib/pdfService';

interface BookingWithDetails extends Booking {
  quote?: {
    client_name: string;
    event_name?: string;
    event_location?: string;
    package_name?: string;
    tier_name?: string;
    client_email?: string;
    client_phone?: string;
  };
  travelers?: Array<{
    id: string;
    first_name: string;
    last_name: string;
    traveler_type: string;
    email?: string;
    phone?: string;
    date_of_birth?: string;
    passport_number?: string;
    nationality?: string;
    dietary_restrictions?: string;
    accessibility_needs?: string;
    special_requests?: string;
  }>;
  payments?: Array<{
    id: string;
    payment_type: string;
    payment_number: number;
    amount: number;
    currency: string;
    due_date: string;
    paid: boolean;
    paid_at?: string;
    payment_reference?: string;
    payment_method?: string;
    notes?: string;
  }>;
  components?: Array<{
    id: string;
    component_type: string;
    component_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    component_data?: any;
  }>;
  flights?: Array<{
    id: string;
    booking_pnr?: string;
    ticketing_deadline?: string;
    flight_status?: string;
    flight_details: any;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  loungePasses?: Array<{
    id: string;
    booking_reference?: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
}

// Helper to enrich transfer components with transfer_type and days
async function enrichTransferComponents(components) {
  return await Promise.all(
    (components || []).map(async (c) => {
      // Get the transfer id from component_data.id, fallback to component_id/componentId/id
      const transferId =
        (c.component_data && c.component_data.id) ||
        c.component_id ||
        c.componentId ||
        c.id;

      if (
        (c.component_type === 'circuit_transfer' || c.componentType === 'circuit_transfer') &&
        transferId
      ) {
        const { data, error } = await supabase
          .from('circuit_transfers')
          .select('transfer_type, days')
          .eq('id', transferId)
          .single();
        console.log('ENRICH CIRCUIT:', { transferId, data, error });
        return { ...c, component_data: { ...data, ...c.component_data } };
      }
      if (
        (c.component_type === 'airport_transfer' || c.componentType === 'airport_transfer') &&
        transferId
      ) {
        const { data, error } = await supabase
          .from('airport_transfers')
          .select('transport_type')
          .eq('id', transferId)
          .single();
        console.log('ENRICH AIRPORT:', { transferId, data, error });
        return { ...c, component_data: { ...data, ...c.component_data } };
      }
      return c;
    })
  );
}

// Helper to fetch team info for a booking
async function getTeamForBooking(team_id: string) {
  if (!team_id) return null;
  const { data, error } = await supabase
    .from('teams')
    .select('id, name, logo_url, agency_name')
    .eq('id', team_id)
    .single();
  if (error) {
    console.error('Error fetching team:', error);
    return null;
  }
  return data;
}

export default function ViewBooking() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [booking, setBooking] = useState<BookingWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (bookingId) {
      loadBooking();
    }
  }, [bookingId]);

  const loadBooking = async () => {
    try {
      setIsLoading(true);
      
      // Fetch booking with all related data
      const { data: bookingData, error } = await supabase
        .from('bookings')
        .select(`
          *,
          quote:quotes!bookings_quote_id_fkey(
            client_name,
            event_name,
            event_location,
            package_name,
            tier_name,
            client_email,
            client_phone
          ),
          travelers:booking_travelers!booking_travelers_booking_id_fkey(
            id,
            first_name,
            last_name,
            traveler_type,
            email,
            phone,
            date_of_birth,
            passport_number,
            nationality,
            dietary_restrictions,
            accessibility_needs,
            special_requests
          ),
          payments:booking_payments!booking_payments_booking_id_fkey(
            id,
            payment_type,
            payment_number,
            amount,
            currency,
            due_date,
            paid,
            paid_at,
            payment_reference,
            payment_method,
            notes
          ),
          components:booking_components!booking_components_booking_id_fkey(
            id,
            component_type,
            component_name,
            quantity,
            unit_price,
            total_price,
            component_data
          ),
          flights:bookings_flights!bookings_flights_booking_id_fkey(
            id,
            booking_pnr,
            flight_status,
            flight_details,
            quantity,
            unit_price,
            total_price
          ),
          loungePasses:bookings_lounge_passes!bookings_lounge_passes_booking_id_fkey(
            id,
            booking_reference,
            quantity,
            unit_price,
            total_price
          )
        `)
        .eq('id', bookingId)
        .single();

      if (error) {
        throw new Error(`Failed to fetch booking: ${error.message}`);
      }

      setBooking(bookingData);
    } catch (error) {
      console.error('Failed to load booking:', error);
      toast.error('Failed to load booking details');
    } finally {
      setIsLoading(false);
    }
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

  const getPaymentTypeLabel = (paymentType: string) => {
    switch (paymentType) {
      case 'deposit': return 'Deposit';
      case 'second_payment': return 'Second Payment';
      case 'final_payment': return 'Final Payment';
      case 'additional': return 'Additional Payment';
      default: return paymentType;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  if (isLoading) {
    return (
      <div className="mx-auto px-8 py-8">
        <div className="text-center py-16">
          <div className="mx-auto w-16 h-16 bg-muted rounded-xl flex items-center justify-center mb-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
          <h3 className="text-lg font-semibold mb-3">Loading booking...</h3>
          <p className="text-muted-foreground">Please wait while we fetch the booking details</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="mx-auto px-8 py-8">
        <div className="text-center py-16">
          <div className="mx-auto w-16 h-16 bg-muted rounded-xl flex items-center justify-center mb-6">
            <XCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-3">Booking not found</h3>
          <p className="text-muted-foreground mb-6">The booking you're looking for doesn't exist or you don't have permission to view it.</p>
          <Button asChild>
            <Link to="/bookings">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Bookings
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const totalPaid = booking.payments?.reduce((sum, payment) => sum + (payment.paid ? payment.amount : 0), 0) || 0;
  const totalOutstanding = booking.total_price - totalPaid;

  return (
    <div className="mx-auto px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/bookings">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Booking Details</h1>
            <p className="text-muted-foreground">
              {booking.booking_reference} • {booking.quote?.event_name}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Copy className="h-4 w-4 mr-2" />
            Copy Reference
          </Button>
          <Button variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button asChild>
            <Link to={`/booking/${booking.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              const enrichedComponents = await enrichTransferComponents(booking.components || []);
              const team = await getTeamForBooking(booking.team_id);
              await downloadBookingConfirmationPDF({
                booking: { ...booking, team },
                components: enrichedComponents,
                payments: booking.payments || [],
                travelers: booking.travelers || [],
                team: team || {},
              });
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Download Confirmation PDF
          </Button>
        </div>
      </div>

      {/* Status and Price Card */}
      <Card className="bg-gradient-to-b from-card/95 to-background/20 border border-border rounded-2xl shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex items-center gap-4">
              <Badge variant={getStatusColor(booking.status)} className="text-sm px-3 py-1">
                {getStatusIcon(booking.status)}
                <span className="ml-2 capitalize">{booking.status.replace('_', ' ')}</span>
              </Badge>
              <div>
                <p className="text-sm text-muted-foreground">Booking Reference</p>
                <p className="font-mono font-medium">{booking.booking_reference}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total Price</p>
              <p className="text-3xl font-bold">{formatCurrency(booking.total_price, booking.currency)}</p>
              {totalOutstanding > 0 && (
                <p className="text-sm text-muted-foreground">
                  Outstanding: {formatCurrency(totalOutstanding, booking.currency)}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="travelers">Travelers</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="flights">Flights</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Client Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Client Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Client Name</p>
                  <p className="font-medium">{booking.quote?.client_name}</p>
                </div>
                {booking.quote?.client_email && (
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{booking.quote.client_email}</p>
                  </div>
                )}
                {booking.quote?.client_phone && (
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{booking.quote.client_phone}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Event Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Event Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Event</p>
                  <p className="font-medium">{booking.quote?.event_name}</p>
                </div>
                {booking.quote?.event_location && (
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium">{booking.quote.event_location}</p>
                  </div>
                )}
                {booking.quote?.package_name && (
                  <div>
                    <p className="text-sm text-muted-foreground">Package</p>
                    <p className="font-medium">{booking.quote.package_name}</p>
                  </div>
                )}
                {booking.quote?.tier_name && (
                  <div>
                    <p className="text-sm text-muted-foreground">Tier</p>
                    <p className="font-medium">{booking.quote.tier_name}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Booking Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Booking Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">{new Date(booking.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="font-medium">{new Date(booking.updated_at).toLocaleDateString()}</p>
                </div>
                {booking.travelers && (
                  <div>
                    <p className="text-sm text-muted-foreground">Travelers</p>
                    <p className="font-medium">{booking.travelers.length} people</p>
                  </div>
                )}
                {booking.components && (
                  <div>
                    <p className="text-sm text-muted-foreground">Components</p>
                    <p className="font-medium">{booking.components.length} items</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Price</p>
                  <p className="font-medium">{formatCurrency(booking.total_price, booking.currency)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Paid</p>
                  <p className="font-medium text-green-600">{formatCurrency(totalPaid, booking.currency)}</p>
                </div>
                {totalOutstanding > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground">Outstanding</p>
                    <p className="font-medium text-orange-600">{formatCurrency(totalOutstanding, booking.currency)}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Travelers Tab */}
        <TabsContent value="travelers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Travelers ({booking.travelers?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {booking.travelers && booking.travelers.length > 0 ? (
                <div className="space-y-4">
                  {booking.travelers.map((traveler, index) => (
                    <Card key={traveler.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {traveler.first_name} {traveler.last_name}
                            </p>
                            <p className="text-sm text-muted-foreground capitalize">
                              {traveler.traveler_type}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {traveler.traveler_type}
                        </Badge>
                      </div>
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {traveler.email && (
                          <div>
                            <p className="text-muted-foreground">Email</p>
                            <p>{traveler.email}</p>
                          </div>
                        )}
                        {traveler.phone && (
                          <div>
                            <p className="text-muted-foreground">Phone</p>
                            <p>{traveler.phone}</p>
                          </div>
                        )}
                        {traveler.date_of_birth && (
                          <div>
                            <p className="text-muted-foreground">Date of Birth</p>
                            <p>{traveler.date_of_birth}</p>
                          </div>
                        )}
                        {traveler.passport_number && (
                          <div>
                            <p className="text-muted-foreground">Passport Number</p>
                            <p>{traveler.passport_number}</p>
                          </div>
                        )}
                        {traveler.nationality && (
                          <div>
                            <p className="text-muted-foreground">Nationality</p>
                            <p>{traveler.nationality}</p>
                          </div>
                        )}
                        {traveler.dietary_restrictions && (
                          <div>
                            <p className="text-muted-foreground">Dietary Restrictions</p>
                            <p>{traveler.dietary_restrictions}</p>
                          </div>
                        )}
                        {traveler.accessibility_needs && (
                          <div>
                            <p className="text-muted-foreground">Accessibility Needs</p>
                            <p>{traveler.accessibility_needs}</p>
                          </div>
                        )}
                        {traveler.special_requests && (
                          <div>
                            <p className="text-muted-foreground">Special Requests</p>
                            <p>{traveler.special_requests}</p>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No travelers found for this booking.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Components Tab */}
        <TabsContent value="components" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5" />
                Components ({booking.components?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {booking.components && booking.components.length > 0 ? (
                <div className="space-y-4">
                  {booking.components.map((component) => (
                    <Card key={component.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getComponentIcon(component.component_type)}
                          <div>
                            <p className="font-medium">{component.component_name}</p>
                            <p className="text-sm text-muted-foreground capitalize">
                              {component.component_type.replace('_', ' ')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {formatCurrency(component.total_price, booking.currency)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {component.quantity} x {formatCurrency(component.unit_price, booking.currency)}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No components found for this booking.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Schedule ({booking.payments?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {booking.payments && booking.payments.length > 0 ? (
                <div className="space-y-4">
                  {booking.payments.map((payment) => (
                    <Card key={payment.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {getPaymentTypeLabel(payment.payment_type)} #{payment.payment_number}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Due: {new Date(payment.due_date).toLocaleDateString()}
                          </p>
                          {payment.payment_reference && (
                            <p className="text-sm text-muted-foreground">
                              Ref: {payment.payment_reference}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {formatCurrency(payment.amount, payment.currency)}
                          </p>
                          <Badge variant={payment.paid ? "default" : "secondary"}>
                            {payment.paid ? "Paid" : "Pending"}
                          </Badge>
                          {payment.paid && payment.paid_at && (
                            <p className="text-sm text-muted-foreground">
                              {new Date(payment.paid_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No payment schedule found for this booking.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Flights Tab */}
        <TabsContent value="flights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plane className="h-5 w-5" />
                Flights ({booking.flights?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {booking.flights && booking.flights.length > 0 ? (
                <div className="space-y-6">
                  {booking.flights.map((flight) => {
                    const flightDetails = flight.flight_details;
                    
                    return (
                      <Card key={flight.id} className="p-6 border border-border shadow-sm">
                        {/* Flight Header */}
                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-[var(--color-border)]">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--color-primary-600)] to-[var(--color-primary-700)] flex items-center justify-center">
                              <Plane className="h-5 w-5 text-white" />
                            </div>
                        <div>
                              <h3 className="font-semibold text-lg text-[var(--color-foreground)]">
                                {flightDetails?.origin || 'Unknown'} → {flightDetails?.destination || 'Unknown'}  → {flightDetails?.origin || 'Unknown'}
                              </h3>
                              <p className="text-sm text-[var(--color-muted-foreground)]">
                                {flightDetails?.departureDate && new Date(flightDetails.departureDate).toLocaleDateString()}
                                {flightDetails?.returnDate && (
                                  <span> - {new Date(flightDetails.returnDate).toLocaleDateString()}</span>
                                )}
                              </p>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <p className="font-bold text-xl text-[var(--color-primary)]">
                              {formatCurrency(flight.total_price, booking.currency)}
                            </p>
                            <p className="text-sm text-[var(--color-muted-foreground)]">
                              {flight.quantity} passenger{flight.quantity !== 1 ? 's' : ''} × {formatCurrency(flight.unit_price, booking.currency)}
                            </p>
                          </div>
                        </div>

                        {/* Booking Information */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                          {flight.booking_pnr && (
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="font-mono">
                              PNR: {flight.booking_pnr}
                              </Badge>
                            </div>
                          )}
                          {flight.ticketing_deadline && (
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="font-mono">
                              Ticketing Deadline: {flight.ticketing_deadline}
                              </Badge>
                            </div>
                          )}
                          {flight.flight_status && (
                            <div className="flex items-center gap-2">
                              <Badge variant={flight.flight_status === 'confirmed' ? 'default' : 'secondary'}>
                                {flight.flight_status.toUpperCase()}
                              </Badge>
                            </div>
                          )}
                          {flightDetails?.source && (
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                Source: {flightDetails.source}
                              </Badge>
                            </div>
                          )}
                        </div>

                        {/* Outbound Flight Details */}
                        <div className="mb-6">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-6 h-6 rounded-full bg-[var(--color-primary-100)] flex items-center justify-center">
                              <Plane className="h-3 w-3 text-[var(--color-primary-600)]" />
                            </div>
                            <h4 className="font-semibold text-base text-[var(--color-foreground)]">Outbound Flight</h4>
                          </div>
                          
                          {/* Multi-segment outbound flight display */}
                          {flightDetails?.outboundFlightSegments && flightDetails.outboundFlightSegments.length > 0 ? (
                            <div className="space-y-3 border border-[var(--color-border)] rounded-lg p-4 bg-[var(--color-muted)]/10">
                              {flightDetails.outboundFlightSegments.map((segment: any, segmentIndex: number) => (
                                <div key={segmentIndex} className="space-y-2">
                                  {/* Flight segment header */}
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-sm text-[var(--color-foreground)]">
                                        {segment.marketingAirlineName || segment.airline} {segment.flightNumber}
                                      </span>
                                      {segment.operatingAirlineName && segment.operatingAirlineName !== segment.marketingAirlineName && (
                                        <Badge variant="outline" className="text-xs">
                                          Operated by {segment.operatingAirlineName}
                                        </Badge>
                                      )}
                                    </div>
                                    <Badge variant="outline" className="text-xs">
                                      {segment.cabinName || segment.cabin || 'Economy'}
                                    </Badge>
                                  </div>
                                  
                                  {/* Route and times */}
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                    <div>
                                      <p className="font-medium text-[var(--color-foreground)]">{segment.departureAirportName} ({segment.departureAirportCode})</p>
                                      <p className="text-[var(--color-muted-foreground)]">
                                        {segment.departureDateTime && new Date(segment.departureDateTime).toLocaleString()}
                                      </p>
                                      {segment.departureTerminal && (
                                        <p className="text-xs text-[var(--color-muted-foreground)]">Terminal {segment.departureTerminal}</p>
                          )}
                        </div>
                                    
                                    {/* Centered airplane with line */}
                                    <div className="flex flex-col items-center justify-center h-full">
                                      <div className="flex items-center w-full">
                                        <div className="flex-1 border-t-2 border-[var(--color-muted-foreground)]"></div>
                                        <Plane className="mx-2 h-5 w-5 text-[var(--color-muted-foreground)]" />
                                        <div className="flex-1 border-t-2 border-[var(--color-muted-foreground)]"></div>
                                      </div>
                                      <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
                                        {segment.flightDuration || segment.duration}
                                      </p>
                                    </div>
                                    
                        <div className="text-right">
                                      <p className="font-medium text-[var(--color-foreground)]">{segment.arrivalAirportName} ({segment.arrivalAirportCode})</p>
                                      <p className="text-[var(--color-muted-foreground)]">
                                        {segment.arrivalDateTime && new Date(segment.arrivalDateTime).toLocaleString()}
                                      </p>
                                      {segment.arrivalTerminal && (
                                        <p className="text-xs text-[var(--color-muted-foreground)]">Terminal {segment.arrivalTerminal}</p>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Aircraft and baggage info */}
                                  <div className="flex flex-wrap gap-4 text-xs text-[var(--color-muted-foreground)]">
                                    {segment.aircraftType && (
                                      <span>Aircraft: {segment.aircraftType}</span>
                                    )}
                                    {segment.baggageAllowance && (
                                      <span>Baggage: {segment.baggageAllowance}</span>
                                    )}
                                    {segment.checkedBaggage && (
                                      <span>Checked: {segment.checkedBaggage.pieces || segment.checkedBaggage.weight}kg</span>
                                    )}
                                    {segment.carryOnBaggage && (
                                      <span>Carry-on: {segment.carryOnBaggage.pieces || segment.carryOnBaggage.weight}kg</span>
                                    )}
                                  </div>
                                  
                                  {/* Layover information */}

                                </div>
                              ))}
                            </div>
                          ) : (
                            /* Single segment display for database flights */
                            <div className="border border-[var(--color-border)] rounded-lg p-4 bg-[var(--color-muted)]/10">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-[var(--color-foreground)]">
                                    {flightDetails?.outboundFlightNumber || flightDetails?.flightNumber || 'Flight'}
                                  </span>
                                  {flightDetails?.airline && (
                                    <Badge variant="outline" className="text-xs">
                                      {flightDetails.airline}
                                    </Badge>
                                  )}
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {flightDetails?.cabin || 'Economy'}
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                  <p className="font-medium text-[var(--color-foreground)]">
                                    {flightDetails?.outboundDepartureAirportCode || flightDetails?.origin}
                                  </p>
                                  <p className="text-[var(--color-muted-foreground)]">
                                    {flightDetails?.outboundDepartureDatetime && new Date(flightDetails.outboundDepartureDatetime).toLocaleString()}
                          </p>
                        </div>
                                
                                <div className="flex items-center justify-center">
                                  <div className="text-center">
                                    <div className="w-16 h-8 border-t-2 border-[var(--color-muted-foreground)] relative">
                                      <Plane className="h-4 w-4 text-[var(--color-muted-foreground)] absolute -top-2 left-1/2 transform -translate-x-1/2" />
                      </div>
                                    <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
                                      {flightDetails?.outboundFlightDuration || flightDetails?.duration || 'Duration'}
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="text-right">
                                  <p className="font-medium text-[var(--color-foreground)]">
                                    {flightDetails?.outboundArrivalAirportCode || flightDetails?.destination}
                                  </p>
                                  <p className="text-[var(--color-muted-foreground)]">
                                    {flightDetails?.outboundArrivalDatetime && new Date(flightDetails.outboundArrivalDatetime).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                              
                              {flightDetails?.baggageAllowance && (
                                <div className="mt-3 text-xs text-[var(--color-muted-foreground)]">
                                  Baggage: {flightDetails.baggageAllowance}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Return Flight Details (if applicable) */}
                        {flightDetails?.returnDate && (flightDetails?.inboundFlightNumber || flightDetails?.returnFlightNumber || flightDetails?.returnFlightSegments) && (
                          <div className="border-t border-[var(--color-border)] pt-6">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-6 h-6 rounded-full bg-[var(--color-secondary-100)] flex items-center justify-center">
                                <Plane className="h-3 w-3 text-[var(--color-secondary-600)]" />
                              </div>
                              <h4 className="font-semibold text-base text-[var(--color-foreground)]">Return Flight</h4>
                            </div>
                            
                            {/* Multi-segment return flight display */}
                            {flightDetails?.returnFlightSegments && flightDetails.returnFlightSegments.length > 0 ? (
                              <div className="space-y-3 border border-[var(--color-border)] rounded-lg p-4 bg-[var(--color-muted)]/10">
                                {flightDetails.returnFlightSegments.map((segment: any, segmentIndex: number) => (
                                  <div key={segmentIndex} className="space-y-2">
                                    {/* Flight segment header */}
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-sm text-[var(--color-foreground)]">
                                          {segment.marketingAirlineName || segment.airline} {segment.flightNumber}
                                        </span>
                                        {segment.operatingAirlineName && segment.operatingAirlineName !== segment.marketingAirlineName && (
                                          <Badge variant="outline" className="text-xs">
                                            Operated by {segment.operatingAirlineName}
                                          </Badge>
                                        )}
                                      </div>
                                      <Badge variant="outline" className="text-xs">
                                        {segment.cabinName || segment.cabin || 'Economy'}
                                      </Badge>
                                    </div>
                                    
                                    {/* Route and times */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                      <div>
                                        <p className="font-medium text-[var(--color-foreground)]">{segment.departureAirportName} ({segment.departureAirportCode})</p>
                                        <p className="text-[var(--color-muted-foreground)]">
                                          {segment.departureDateTime && new Date(segment.departureDateTime).toLocaleString()}
                                        </p>
                                        {segment.departureTerminal && (
                                          <p className="text-xs text-[var(--color-muted-foreground)]">Terminal {segment.departureTerminal}</p>
                                        )}
                                      </div>
                                      
                                      {/* Centered airplane with line */}
                                      <div className="flex flex-col items-center justify-center h-full">
                                        <div className="flex items-center w-full">
                                          <div className="flex-1 border-t-2 border-[var(--color-muted-foreground)]"></div>
                                          <Plane className="mx-2 h-5 w-5 text-[var(--color-muted-foreground)]" />
                                          <div className="flex-1 border-t-2 border-[var(--color-muted-foreground)]"></div>
                                        </div>
                                        <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
                                          {segment.flightDuration || segment.duration}
                                        </p>
                                      </div>
                                      
                                      <div className="text-right">
                                        <p className="font-medium text-[var(--color-foreground)]">{segment.arrivalAirportName} ({segment.arrivalAirportCode})</p>
                                        <p className="text-[var(--color-muted-foreground)]">
                                          {segment.arrivalDateTime && new Date(segment.arrivalDateTime).toLocaleString()}
                                        </p>
                                        {segment.arrivalTerminal && (
                                          <p className="text-xs text-[var(--color-muted-foreground)]">Terminal {segment.arrivalTerminal}</p>
                                        )}
                                      </div>
                                    </div>
                                    
                                    {/* Aircraft and baggage info */}
                                    <div className="flex flex-wrap gap-4 text-xs text-[var(--color-muted-foreground)]">
                                      {segment.aircraftType && (
                                        <span>Aircraft: {segment.aircraftType}</span>
                                      )}
                                      {segment.baggageAllowance && (
                                        <span>Baggage: {segment.baggageAllowance}</span>
                                      )}
                                      {segment.checkedBaggage && (
                                        <span>Checked: {segment.checkedBaggage.pieces || segment.checkedBaggage.weight}kg</span>
                                      )}
                                      {segment.carryOnBaggage && (
                                        <span>Carry-on: {segment.carryOnBaggage.pieces || segment.carryOnBaggage.weight}kg</span>
                                      )}
                                    </div>
                                    

                                  </div>
                                ))}
                              </div>
                            ) : (
                              /* Single segment display for database return flights */
                              <div className="border border-[var(--color-border)] rounded-lg p-4 bg-[var(--color-muted)]/10">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-[var(--color-foreground)]">
                                      {flightDetails?.inboundFlightNumber || flightDetails?.returnFlightNumber || 'Return Flight'}
                                    </span>
                                    {flightDetails?.airline && (
                                      <Badge variant="outline" className="text-xs">
                                        {flightDetails.airline}
                                      </Badge>
                                    )}
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {flightDetails?.cabin || 'Economy'}
                                  </Badge>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <p className="font-medium text-[var(--color-foreground)]">
                                      {flightDetails?.inboundDepartureAirportCode || flightDetails?.destination}
                                    </p>
                                    <p className="text-[var(--color-muted-foreground)]">
                                      {flightDetails?.inboundDepartureDatetime && new Date(flightDetails.inboundDepartureDatetime).toLocaleString()}
                                    </p>
                                  </div>
                                  
                                  <div className="flex items-center justify-center">
                                    <div className="text-center">
                                      <div className="w-16 h-8 border-t-2 border-[var(--color-muted-foreground)] relative">
                                        <Plane className="h-4 w-4 text-[var(--color-muted-foreground)] absolute -top-2 left-1/2 transform -translate-x-1/2" />
                                      </div>
                                      <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
                                        {flightDetails?.inboundFlightDuration || flightDetails?.returnDuration || 'Duration'}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <div className="text-right">
                                    <p className="font-medium text-[var(--color-foreground)]">
                                      {flightDetails?.inboundArrivalAirportCode || flightDetails?.origin}
                                    </p>
                                    <p className="text-[var(--color-muted-foreground)]">
                                      {flightDetails?.inboundArrivalDatetime && new Date(flightDetails.inboundArrivalDatetime).toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                                
                                {flightDetails?.baggageAllowance && (
                                  <div className="mt-3 text-xs text-[var(--color-muted-foreground)]">
                                    Baggage: {flightDetails.baggageAllowance}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Additional Flight Information */}
                        {(flightDetails?.fareTypeName || flightDetails?.refundable !== undefined || flightDetails?.ticketingDeadline) && (
                          <div className="mt-6 pt-4 border-t border-[var(--color-border)]">
                            <h5 className="font-medium text-sm mb-3 text-[var(--color-foreground)]">Additional Information</h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              {flightDetails?.fareTypeName && (
                                <div>
                                  <p className="text-[var(--color-muted-foreground)]">Fare Type</p>
                                  <p className="font-medium text-[var(--color-foreground)]">{flightDetails.fareTypeName}</p>
                                </div>
                              )}
                              {flightDetails?.refundable !== undefined && (
                                <div>
                                  <p className="text-[var(--color-muted-foreground)]">Refundable</p>
                                  <Badge variant={flightDetails.refundable ? "default" : "secondary"}>
                                    {flightDetails.refundable ? "Yes" : "No"}
                                  </Badge>
                                </div>
                              )}
                              {flightDetails?.ticketingDeadline && (
                                <div>
                                  <p className="text-[var(--color-muted-foreground)]">Ticketing Deadline</p>
                                  <p className="font-medium text-[var(--color-foreground)]">
                                    {new Date(flightDetails.ticketingDeadline).toLocaleDateString()}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground">No flights found for this booking.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {booking.booking_notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Booking Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{booking.booking_notes}</p>
                </CardContent>
              </Card>
            )}
            
            {booking.internal_notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Internal Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{booking.internal_notes}</p>
                </CardContent>
              </Card>
            )}
            
            {booking.special_requests && (
              <Card>
                <CardHeader>
                  <CardTitle>Special Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{booking.special_requests}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 