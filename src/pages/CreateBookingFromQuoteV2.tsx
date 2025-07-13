import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Minus, ArrowLeft, Loader2, AlertCircle, CheckCircle, Users, CreditCard, Info } from 'lucide-react';
import { QuoteService } from '@/lib/quoteService';
import { BookingService, CreateBookingData } from '@/lib/bookingService';
import { toast } from 'sonner';
import { format, addDays } from 'date-fns';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';

// Schema for booking creation form (extend as needed)
const createBookingSchema = z.object({
  leadTraveler: z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Valid email is required'),
    phone: z.string().optional(),
    addressLine1: z.string().min(1, 'Address Line 1 is required'),
    addressLine2: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    state: z.string().optional(),
    postalCode: z.string().min(1, 'Postal Code is required'),
    country: z.string().min(1, 'Country is required'),
    // Add other fields as needed (DOB, passport, etc.)
  }),
  guestTravelers: z.array(z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
  })),
  depositPaid: z.boolean().default(true),
  depositReference: z.string().optional(),
  useOriginalPaymentSchedule: z.boolean().default(true),
  adjustedPayments: z.array(z.object({
    paymentType: z.enum(['deposit', 'second_payment', 'final_payment', 'additional']),
    amount: z.number().min(0, 'Amount must be positive'),
    dueDate: z.string().min(1, 'Due date is required'),
    notes: z.string().optional(),
  })),
  // Dynamic fields for flights and lounge passes
  flights: z.array(z.object({
    bookingRef: z.string().optional(),
    ticketingDeadline: z.string().optional(),
    flightStatus: z.enum([
      'Booked - Ticketed - Paid',
      'Booked - Ticketed - Not Paid',
      'Booked - Not Ticketed',
    ]),
    notes: z.string().optional(),
  })).optional(),
  loungePasses: z.preprocess(
    (val) => val ?? [],
    z.array(z.object({
      bookingRef: z.string().min(1, 'Booking reference is required'),
      notes: z.string().optional(),
    }))
  ).optional(),
  bookingNotes: z.string().optional(),
  internalNotes: z.string().optional(),
  specialRequests: z.string().optional(),
});

type CreateBookingFormData = z.infer<typeof createBookingSchema>;

export default function CreateBookingFromQuoteV2({ quote: propQuote }: { quote?: any }) {
  const { quoteId: paramQuoteId } = useParams();
  const navigate = useNavigate();
  const [quote, setQuote] = useState<any>(propQuote || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('travelers');
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);
  const [existingBooking, setExistingBooking] = useState<any>(null);

  const form = useForm({
    resolver: zodResolver(createBookingSchema),
    defaultValues: {
      leadTraveler: { firstName: '', lastName: '', email: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', postalCode: '', country: '' },
      guestTravelers: [],
      depositPaid: true,
      depositReference: '',
      useOriginalPaymentSchedule: true,
      adjustedPayments: [],
      flights: [],
      loungePasses: [],
      bookingNotes: '',
      internalNotes: '',
      specialRequests: '',
    },
  });

  // Load quote if not provided
  useEffect(() => {
    if (quote) { setLoading(false); return; }
    const load = async () => {
      try {
        setLoading(true);
        const q = await QuoteService.getQuoteById(paramQuoteId as string);
        setQuote(q);
        
        // Check if booking already exists for this quote
        try {
          const existing = await BookingService.getBookingByQuoteId(paramQuoteId as string);
          if (existing) {
            setExistingBooking(existing);
          }
        } catch (err) {
          console.log('No existing booking found for quote');
        }
      } catch (err) {
        setError('Failed to load quote');
      } finally {
        setLoading(false);
      }
    };
    if (paramQuoteId) load();
  }, [paramQuoteId, quote]);

  // Prefill form from quote
  useEffect(() => {
    if (!quote) return;
    
    const resetFormWithQuoteData = async () => {
      // Debug: Log quote structure
      console.log('🔍 Quote data structure:', {
        selectedComponents: quote.selectedComponents,
        isArray: Array.isArray(quote.selectedComponents),
        loungePasses: quote.selectedComponents?.lounge_passes,
        loungePass: quote.selectedComponents?.loungePass,
        flights: quote.selectedComponents?.flights,
        hasLoungePasses: quote.selectedComponents?.lounge_passes?.length > 0,
        hasLoungePass: quote.selectedComponents?.loungePass?.length > 0,
        hasFlights: quote.selectedComponents?.flights?.length > 0,
        arrayLoungePasses: Array.isArray(quote.selectedComponents) ? quote.selectedComponents.filter((c: any) => c.type === 'lounge_pass') : []
      });
      
      // Debug: Show all properties of selectedComponents object
      if (!Array.isArray(quote.selectedComponents) && quote.selectedComponents) {
        console.log('🔍 All properties in selectedComponents object:', Object.keys(quote.selectedComponents));
        console.log('🔍 Full selectedComponents object:', quote.selectedComponents);
        console.log('🔍 LoungePass property details:', {
          exists: !!quote.selectedComponents.loungePass,
          length: quote.selectedComponents.loungePass?.length,
          value: quote.selectedComponents.loungePass
        });
      }
      
      // Debug: Show all components and their types
      if (Array.isArray(quote.selectedComponents)) {
        console.log('🔍 All components in array:', quote.selectedComponents.map((c: any, i: number) => ({
          index: i,
          id: c.id,
          type: c.type,
          name: c.name,
          data: c.data
        })));
        
        // TEMPORARY TEST: Add a lounge pass component for testing
        if (!quote.selectedComponents.some((c: any) => c.type === 'lounge_pass')) {
          console.log('🔍 No lounge pass found, adding test lounge pass component');
          quote.selectedComponents.push({
            id: 'test-lounge-pass',
            type: 'lounge_pass',
            name: 'Test Lounge Pass',
            quantity: 1,
            unitPrice: 50,
            totalPrice: 50,
            description: 'Test lounge pass for development',
            data: {
              name: 'Test Lounge Pass',
              price: 50
            }
          });
        }
      }

      // Lead traveler
      const [firstName, ...lastNameParts] = (quote.clientName || quote.client_name || '').split(' ');
      // Guest travelers
      const guestCount = (quote.travelersAdults || quote.travelers_adults || 1) - 1;
      // Payments
      const adjustedPayments = [
        {
          paymentType: 'deposit' as 'deposit',
          amount: Number(quote.paymentDeposit || quote.payment_deposit) || 0,
          dueDate: format(new Date(), 'yyyy-MM-dd'), // Set deposit date to current date as default
          notes: 'Deposit payment',
        },
        {
          paymentType: 'second_payment' as 'second_payment',
          amount: Number(quote.paymentSecondPayment || quote.payment_second_payment) || 0,
          dueDate: quote.paymentSecondPaymentDate || quote.payment_second_payment_date || '',
          notes: 'Second payment',
        },
        {
          paymentType: 'final_payment' as 'final_payment',
          amount: Number(quote.paymentFinalPayment || quote.payment_final_payment) || 0,
          dueDate: quote.paymentFinalPaymentDate || quote.payment_final_payment_date || '',
          notes: 'Final payment',
        },
      ];
      // Flights
      let flights: any[] = [];
      if (quote.selectedComponents?.flights) {
        flights = quote.selectedComponents.flights.map((f: any) => ({
          bookingRef: '',
          ticketingDeadline: '',
          flightStatus: 'Booked - Not Ticketed',
          notes: '',
        }));
      }
      // Lounge Passes
      let loungePasses: any[] = [];
      if (quote.selectedComponents?.lounge_passes) {
        loungePasses = quote.selectedComponents.lounge_passes.map((l: any) => ({ bookingRef: '', notes: '' }));
      }

      // Fetch client address from database if client_id exists
      let clientAddress = {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
      };

      console.log('🔍 Starting address fetch...');
      console.log('🔍 Quote object keys:', Object.keys(quote));
      console.log('🔍 Quote client_id:', quote.client_id);
      console.log('🔍 Quote clientId:', quote.clientId);
      console.log('🔍 Full quote object:', quote);

      const clientId = quote.client_id || quote.clientId;
      console.log('🔍 Using clientId:', clientId);
      
      if (clientId) {
        try {
          console.log('🔍 Fetching client address from database...');
          const { data: clientData, error } = await supabase
            .from('clients')
            .select('address')
            .eq('id', clientId)
            .single();

          console.log('🔍 Database response:', { clientData, error });

          if (clientData?.address) {
            // The address field is JSONB, so we can access it directly
            const address = clientData.address;
            console.log('🔍 Raw address from database:', address);
            
            clientAddress = {
              street: address.street || address.street_address || '',
              city: address.city || '',
              state: address.state || address.state_province || '',
              zipCode: address.zipCode || address.postal_code || address.zip_code || '',
              country: address.country || '',
            };
            console.log('📍 Fetched client address from database:', clientAddress);
          } else {
            console.log('🔍 No address found in client data');
          }
        } catch (error) {
          console.error('❌ Error fetching client address:', error);
        }
      } else {
        console.log('🔍 No client_id found in quote');
      }

      console.log('🔍 Final clientAddress before form reset:', clientAddress);

      // Now reset the form with the fetched address data
      const formData = {
        leadTraveler: {
          firstName: firstName || '',
          lastName: lastNameParts.join(' ') || '',
          email: quote.clientEmail || quote.client_email || '',
          phone: quote.clientPhone || quote.client_phone || '',
          addressLine1: clientAddress.street || '',
          addressLine2: '',
          city: clientAddress.city || '',
          state: clientAddress.state || '',
          postalCode: clientAddress.zipCode || '',
          country: clientAddress.country || '',
        },
        guestTravelers: Array.from({ length: Math.max(guestCount, 0) }).map(() => ({ firstName: '', lastName: '' })),
        depositPaid: true,
        depositReference: '',
        useOriginalPaymentSchedule: true,
        adjustedPayments,
        flights,
        loungePasses,
        bookingNotes: '',
        internalNotes: '',
        specialRequests: '',
      };

      console.log('🔍 Form data being reset:', formData);
      console.log('🔍 Lead traveler address fields:', {
        addressLine1: formData.leadTraveler.addressLine1,
        city: formData.leadTraveler.city,
        state: formData.leadTraveler.state,
        postalCode: formData.leadTraveler.postalCode,
        country: formData.leadTraveler.country,
      });

      form.reset(formData);
    };

    // Call the async function to reset form with fetched data
    resetFormWithQuoteData();
  }, [quote]);

  // Handle form submission to create booking
  const handleSubmit = async (data: CreateBookingFormData) => {
    console.log('🚀 Form submission started', { data, quote });
    
    // Debug: Log the flights data specifically
    console.log('🔍 DEBUG: Form flights data:', {
      flights: data.flights,
      flightsLength: data.flights?.length,
      quoteFlights: quote?.selectedComponents?.flights,
      quoteFlightsLength: quote?.selectedComponents?.flights?.length,
      selectedComponents: quote?.selectedComponents,
      isArray: Array.isArray(quote?.selectedComponents)
    });
    
    // Debug: Log each flight in detail
    if (data.flights && data.flights.length > 0) {
      console.log('🔍 DEBUG: Individual flight form data:');
      data.flights.forEach((flight, index) => {
        console.log(`  Flight ${index}:`, {
          bookingRef: flight.bookingRef,
          ticketingDeadline: flight.ticketingDeadline,
          flightStatus: flight.flightStatus,
          notes: flight.notes
        });
      });
    }
    
    if (!quote) {
      toast.error('Quote data not available');
      return;
    }

    // Validate quote status
    const validStatuses = ['sent', 'accepted', 'confirmed'];
    if (!validStatuses.includes(quote.status)) {
      toast.error(`Cannot create booking from quote with status: ${quote.status}. Quote must be sent, accepted, or confirmed.`);
      return;
    }

    try {
      setIsCreatingBooking(true);

      // Validate traveler count matches quote
      const totalTravelers = 1 + data.guestTravelers.length; // Lead + guests
      const expectedTravelers = quote.travelersAdults || quote.travelers_adults || 1;
      
      if (totalTravelers !== expectedTravelers) {
        toast.error(`Traveler count mismatch. Expected ${expectedTravelers} adults, but have ${totalTravelers} travelers.`);
        return;
      }

      // Validate required fields for guest travelers
      const invalidGuests = data.guestTravelers.filter(guest => !guest.firstName || !guest.lastName);
      if (invalidGuests.length > 0) {
        toast.error('All guest travelers must have first and last names.');
        return;
      }

      // Validate payment schedule if using adjusted payments
      if (!data.useOriginalPaymentSchedule) {
        const totalAdjustedAmount = data.adjustedPayments.reduce((sum, payment) => sum + payment.amount, 0);
        const quoteTotal = Number(quote.totalPrice) || 0;
        
        if (Math.abs(totalAdjustedAmount - quoteTotal) > 0.01) { // Allow for small rounding differences
          toast.error(`Adjusted payment total (£${totalAdjustedAmount.toFixed(2)}) must equal quote total (£${quoteTotal.toFixed(2)})`);
          return;
        }
      }

      // Prepare booking data
      const bookingData: CreateBookingData = {
        quoteId: quote.id,
        leadTraveler: {
          firstName: data.leadTraveler.firstName,
          lastName: data.leadTraveler.lastName,
          email: data.leadTraveler.email,
          phone: data.leadTraveler.phone,
          address: `${data.leadTraveler.addressLine1}, ${data.leadTraveler.city}, ${data.leadTraveler.country}`,
        },
        guestTravelers: data.guestTravelers,
        adjustedPaymentSchedule: data.useOriginalPaymentSchedule ? undefined : data.adjustedPayments,
        bookingNotes: data.bookingNotes,
        internalNotes: data.internalNotes,
        specialRequests: data.specialRequests,
        depositPaid: data.depositPaid,
        depositReference: data.depositReference,
        flights: data.flights,
        loungePasses: data.loungePasses,
      };

      // Debug: Log the final booking data
      console.log('🔍 DEBUG: Final booking data being sent:', {
        flights: bookingData.flights,
        flightsLength: bookingData.flights?.length,
        quoteSelectedComponents: quote.selectedComponents,
        quoteFlights: quote.selectedComponents?.flights,
        selectedComponentsType: typeof quote.selectedComponents,
        isArray: Array.isArray(quote.selectedComponents)
      });

      // Create the booking
      const bookingId = await BookingService.createBookingFromQuote(bookingData);

      toast.success('Booking created successfully!');
      navigate(`/booking/${bookingId}`);

    } catch (err) {
      console.error('Error creating booking:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create booking';
      
      // Provide more specific error messages for common issues
      if (errorMessage.includes('already exists')) {
        toast.error('A booking already exists for this quote. Please check the bookings list.');
      } else if (errorMessage.includes('not available')) {
        toast.error('Some components are no longer available. Please check the quote and try again.');
      } else if (errorMessage.includes('not found')) {
        toast.error('Quote not found or access denied. Please refresh the page and try again.');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsCreatingBooking(false);
    }
  };

  if (loading) return <div className="p-8 text-center"><Loader2 className="animate-spin h-8 w-8 text-primary mx-auto" /> Loading quote...</div>;
  if (error || !quote) return <div className="p-8 text-center text-red-500">{error || 'Quote not found.'}</div>;

  // Show existing booking message if booking already exists
  if (existingBooking) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate(`/quotes/${quote.id}`)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Quote
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Booking Already Exists</h1>
              <p className="text-muted-foreground">
                Quote {quote.quoteNumber} • {quote.clientName}
              </p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Booking Created Successfully
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                A booking has already been created for this quote. You can view and manage the existing booking.
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Booking Reference</Label>
                <p className="font-medium">{existingBooking.booking_reference || existingBooking.id}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                <Badge variant="outline">{existingBooking.status}</Badge>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Created</Label>
                <p className="text-sm">{new Date(existingBooking.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Total Cost</Label>
                <p className="font-medium">£{existingBooking.totalCost?.toLocaleString()}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-4">
              <Button onClick={() => navigate(`/booking/${existingBooking.id}`)}>
                View Booking Details
              </Button>
              <Button variant="outline" onClick={() => navigate(`/quotes/${quote.id}`)}>
                Back to Quote
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Tabbed UI implementation
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate(`/quotes/${quote.id}`)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Quote
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Create Booking</h1>
            <p className="text-muted-foreground">
              Quote {quote.quoteNumber} • {quote.clientName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="text-white flex items-center gap-1">
            {quote.status}
          </Badge>
        </div>
      </div>

      {/* Quote Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Quote Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Event</Label>
              <p className="font-medium">{quote.eventName || 'Event Package'}</p>
              <p className="text-sm text-muted-foreground">{quote.eventLocation}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Travelers</Label>
              <p className="font-medium">{quote.travelersAdults} adults, {quote.travelersChildren} children</p>
              <p className="text-sm text-muted-foreground">
                {quote.eventStartDate && quote.eventEndDate
                  ? `${format(new Date(quote.eventStartDate), 'MMM dd')} - ${format(new Date(quote.eventEndDate), 'MMM dd, yyyy')}`
                  : 'Dates TBD'}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Total Cost</Label>
              <p className="text-2xl font-bold text-primary">£{quote.totalPrice?.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">
                Deposit: £{quote.paymentDeposit?.toLocaleString()}
              </p>
            </div>
          </div>
          
          {/* Status Warning */}
          {!['sent', 'accepted', 'confirmed'].includes(quote.status) && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Warning:</strong> This quote has status "{quote.status}". You can only create bookings from quotes that are sent, accepted, or confirmed.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Booking Form */}
      <form onSubmit={form.handleSubmit((data: any) => {
        console.log('✅ Form validation passed, calling handleSubmit');
        handleSubmit(data);
      }, (errors) => {
        console.log('❌ Form validation failed:', errors);
      })} className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="travelers">Travelers</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            {quote.selectedComponents?.flights && quote.selectedComponents.flights.length > 0 && (
              <TabsTrigger value="flights">Flights</TabsTrigger>
            )}
            {/* Check for lounge passes in different possible locations */}
            {(quote.selectedComponents?.lounge_passes?.length > 0 || 
              quote.selectedComponents?.loungePasses?.length > 0 ||
              !!quote.selectedComponents?.loungePass ||
              (Array.isArray(quote.selectedComponents) && quote.selectedComponents.some((c: any) => 
                c.type === 'lounge_pass' || 
                c.name?.toLowerCase().includes('lounge') ||
                c.data?.name?.toLowerCase().includes('lounge') ||
                c.data?.type === 'lounge_pass'
              ))) && (
              <TabsTrigger value="loungePasses">Lounge Passes</TabsTrigger>
            )}
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="review">Review</TabsTrigger>
          </TabsList>

          {/* Travelers Tab */}
          <TabsContent value="travelers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Lead Traveler
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="leadFirstName">First Name *</Label>
                    <Input id="leadFirstName" {...form.register('leadTraveler.firstName')} placeholder="Enter first name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="leadLastName">Last Name *</Label>
                    <Input id="leadLastName" {...form.register('leadTraveler.lastName')} placeholder="Enter last name" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="leadEmail">Email *</Label>
                    <Input id="leadEmail" type="email" {...form.register('leadTraveler.email')} placeholder="Enter email address" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="leadPhone">Phone</Label>
                    <Input id="leadPhone" {...form.register('leadTraveler.phone')} placeholder="Enter phone number" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="leadAddressLine1">Address Line 1 *</Label>
                  <Input id="leadAddressLine1" {...form.register('leadTraveler.addressLine1')} placeholder="Address Line 1" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="leadAddressLine2">Address Line 2</Label>
                  <Input id="leadAddressLine2" {...form.register('leadTraveler.addressLine2')} placeholder="Address Line 2" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="leadCity">City *</Label>
                  <Input id="leadCity" {...form.register('leadTraveler.city')} placeholder="City" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="leadState">State/Province</Label>
                  <Input id="leadState" {...form.register('leadTraveler.state')} placeholder="State/Province" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="leadPostalCode">Postal Code *</Label>
                  <Input id="leadPostalCode" {...form.register('leadTraveler.postalCode')} placeholder="Postal Code" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="leadCountry">Country *</Label>
                  <Input id="leadCountry" {...form.register('leadTraveler.country')} placeholder="Country" />
                </div>
              </CardContent>
            </Card>
            {/* Guest Travelers */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Guest Travelers
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {quote?.travelersAdults || 1} adults total • {form.watch('guestTravelers').length} guest travelers added
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">Lead: 1</Badge>
                      <Badge variant="outline" className="text-xs">Guests: {form.watch('guestTravelers').length}</Badge>
                      <Badge variant="outline" className="text-xs">Total: {1 + form.watch('guestTravelers').length}</Badge>
                    </div>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => form.setValue('guestTravelers', [...form.getValues('guestTravelers'), { firstName: '', lastName: '' }])} className="flex items-center gap-2" disabled={form.watch('guestTravelers').length >= ((quote?.travelersAdults || 1) - 1)}>
                    <Plus className="h-4 w-4" /> Add Guest
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {form.watch('guestTravelers').map((_, index) => (
                  <div key={index} className="space-y-4 p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Guest {index + 1}</h4>
                      <Button type="button" variant="ghost" size="sm" onClick={() => form.setValue('guestTravelers', form.getValues('guestTravelers').filter((_: any, i: number) => i !== index))} className="text-destructive">
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`guest${index}FirstName`}>First Name *</Label>
                        <Input id={`guest${index}FirstName`} {...form.register(`guestTravelers.${index}.firstName`)} placeholder="Enter first name" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`guest${index}LastName`}>Last Name *</Label>
                        <Input id={`guest${index}LastName`} {...form.register(`guestTravelers.${index}.lastName`)} placeholder="Enter last name" />
                      </div>
                    </div>
                  </div>
                ))}
                {form.watch('guestTravelers').length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No guest travelers added yet.</p>
                    <p className="text-sm">
                      {quote?.travelersAdults && quote.travelersAdults > 1
                        ? `Add up to ${quote.travelersAdults - 1} guest travelers.`
                        : 'No guest travelers needed for single adult booking.'}
                    </p>
                  </div>
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
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Deposit Payment */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch id="depositPaid" checked={form.watch('depositPaid')} onCheckedChange={(checked) => form.setValue('depositPaid', checked)} />
                    <Label htmlFor="depositPaid">Deposit has been paid</Label>
                  </div>
                  {form.watch('depositPaid') && (
                    <div className="space-y-2">
                      <Label htmlFor="depositReference">Payment Reference</Label>
                      <Input id="depositReference" {...form.register('depositReference')} placeholder="Enter payment reference or transaction ID" />
                    </div>
                  )}
                </div>
                <Separator />
                {/* Payment Schedule */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch id="useOriginalSchedule" checked={form.watch('useOriginalPaymentSchedule')} onCheckedChange={(checked) => form.setValue('useOriginalPaymentSchedule', checked)} />
                    <Label htmlFor="useOriginalSchedule">Use original payment schedule from quote</Label>
                  </div>
                  {!form.watch('useOriginalPaymentSchedule') && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Payment Schedule</h4>
                        <Button type="button" variant="outline" size="sm" onClick={() => {
                          const newPayment = { 
                            paymentType: 'additional' as 'additional', 
                            amount: 0, 
                            dueDate: format(addDays(new Date(), 90), 'yyyy-MM-dd'), 
                            notes: 'Additional payment' 
                          };
                          form.setValue('adjustedPayments', [...form.getValues('adjustedPayments'), newPayment]);
                        }} className="flex items-center gap-2">
                          <Plus className="h-4 w-4" /> Add Payment
                        </Button>
                      </div>
                      {form.watch('adjustedPayments').map((_, index) => (
                        <div key={index} className="space-y-4 p-4 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <h5 className="font-medium">Payment {index + 1}</h5>
                            <Button type="button" variant="ghost" size="sm" onClick={() => form.setValue('adjustedPayments', form.getValues('adjustedPayments').filter((_: any, i: number) => i !== index))} className="text-destructive">
                              <Minus className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label>Type</Label>
                              <select 
                                {...form.register(`adjustedPayments.${index}.paymentType`)} 
                                className="w-full p-2 border rounded-md"
                                onChange={(e) => {
                                  const newType = e.target.value;
                                  // If payment type is changed to deposit, set due date to current date
                                  if (newType === 'deposit') {
                                    form.setValue(`adjustedPayments.${index}.dueDate`, format(new Date(), 'yyyy-MM-dd'));
                                  }
                                  // Update the payment type
                                  form.setValue(`adjustedPayments.${index}.paymentType`, newType as any);
                                }}
                              >
                                <option value="deposit">Deposit</option>
                                <option value="second_payment">Second Payment</option>
                                <option value="final_payment">Final Payment</option>
                                <option value="additional">Additional</option>
                              </select>
                            </div>
                            <div className="space-y-2">
                              <Label>Amount (£)</Label>
                              <Input type="number" step="0.01" {...form.register(`adjustedPayments.${index}.amount`, { valueAsNumber: true })} placeholder="0.00" />
                            </div>
                            <div className="space-y-2">
                              <Label>Due Date</Label>
                              <Input type="date" {...form.register(`adjustedPayments.${index}.dueDate`)} />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Notes</Label>
                            <Input {...form.register(`adjustedPayments.${index}.notes`)} placeholder="Payment notes" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {form.watch('useOriginalPaymentSchedule') && (
                    <div className="space-y-4">
                      <h4 className="font-medium">Original Payment Schedule</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                          <span>Deposit</span>
                          <span className="font-medium">£{quote.paymentDeposit?.toLocaleString()}</span>
                          <span className="text-sm text-muted-foreground">{quote.paymentDepositDate ? format(new Date(quote.paymentDepositDate), 'MMM dd, yyyy') : format(new Date(), 'MMM dd, yyyy')}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                          <span>Second Payment</span>
                          <span className="font-medium">£{quote.paymentSecondPayment?.toLocaleString()}</span>
                          <span className="text-sm text-muted-foreground">{quote.paymentSecondPaymentDate ? format(new Date(quote.paymentSecondPaymentDate), 'MMM dd, yyyy') : 'TBD'}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                          <span>Final Payment</span>
                          <span className="font-medium">£{quote.paymentFinalPayment?.toLocaleString()}</span>
                          <span className="text-sm text-muted-foreground">{quote.paymentFinalPaymentDate ? format(new Date(quote.paymentFinalPaymentDate), 'MMM dd, yyyy') : 'TBD'}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Flights Tab (dynamic) */}
          {quote.selectedComponents?.flights && quote.selectedComponents.flights.length > 0 && (
            <TabsContent value="flights" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">Flights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {quote.selectedComponents.flights.map((flight: any, i: number) => (
                    <div key={i} className="space-y-4 p-4 border rounded-lg">
                      <div className="font-medium text-lg mb-2">
                        {flight.origin && flight.destination
                          ? `${flight.origin} → ${flight.destination}`
                          : flight.name || flight.flightNumber || `Flight ${i + 1}`}
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        {flight.departureDate && (
                          <span><b>Departure:</b> {flight.departureDate}</span>
                        )}
                        {flight.returnDate && (
                          <span className="ml-4"><b>Return:</b> {flight.returnDate}</span>
                        )}
                        {flight.airline && (
                          <span className="ml-4"><b>Airline:</b> {flight.airline}</span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        {typeof flight.price !== 'undefined' && (
                          <span><b>Price:</b> £{Number(flight.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`flights.${i}.bookingRef`}>Booking Reference (PNR)</Label>
                          <Input id={`flights.${i}.bookingRef`} {...form.register(`flights.${i}.bookingRef`)} placeholder="Enter PNR or booking ref" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`flights.${i}.ticketingDeadline`}>Ticketing Deadline</Label>
                          <Input id={`flights.${i}.ticketingDeadline`} type="date" {...form.register(`flights.${i}.ticketingDeadline`)} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`flights.${i}.flightStatus`}>Flight Booking Status</Label>
                          <Select value={form.watch(`flights.${i}.flightStatus`)} onValueChange={val => form.setValue(`flights.${i}.flightStatus`, val as any)}>
                            <SelectTrigger id={`flights.${i}.flightStatus`} className="w-full">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Booked - Ticketed - Paid">Booked - Ticketed - Paid</SelectItem>
                              <SelectItem value="Booked - Ticketed - Not Paid">Booked - Ticketed - Not Paid</SelectItem>
                              <SelectItem value="Booked - Not Ticketed">Booked - Not Ticketed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`flights.${i}.notes`}>Notes</Label>
                        <Textarea id={`flights.${i}.notes`} {...form.register(`flights.${i}.notes`)} placeholder="Flight notes" />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Lounge Passes Tab (dynamic) */}
          {(quote.selectedComponents?.lounge_passes?.length > 0 || 
            quote.selectedComponents?.loungePasses?.length > 0 ||
            !!quote.selectedComponents?.loungePass ||
            (Array.isArray(quote.selectedComponents) && quote.selectedComponents.some((c: any) => 
              c.type === 'lounge_pass' || 
              c.name?.toLowerCase().includes('lounge') ||
              c.data?.name?.toLowerCase().includes('lounge') ||
              c.data?.type === 'lounge_pass'
            ))) && (
            <TabsContent value="loungePasses" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">Lounge Passes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Handle both array format and object format */}
                  {(Array.isArray(quote.selectedComponents) 
                    ? quote.selectedComponents.filter((c: any) => 
                        c.type === 'lounge_pass' || 
                        c.name?.toLowerCase().includes('lounge') ||
                        c.data?.name?.toLowerCase().includes('lounge') ||
                        c.data?.type === 'lounge_pass'
                      )
                    : quote.selectedComponents?.lounge_passes || quote.selectedComponents?.loungePasses || 
                      (quote.selectedComponents?.loungePass ? [quote.selectedComponents.loungePass] : [])
                  ).map((lp: any, i: number) => (
                    <div key={i} className="space-y-4 p-4 border rounded-lg">
                      <div className="font-medium">{lp.name || lp.data?.name || `Lounge Pass ${i + 1}`}</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`loungePasses.${i}.bookingRef`}>Booking Reference *</Label>
                          <Input id={`loungePasses.${i}.bookingRef`} {...form.register(`loungePasses.${i}.bookingRef` as any)} placeholder="Enter booking ref" />
                          {form.formState.errors.loungePasses?.[i]?.bookingRef && (
                            <span className="text-destructive text-xs">{(form.formState.errors.loungePasses as any)[i]?.bookingRef?.message as string}</span>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`loungePasses.${i}.notes`}>Notes</Label>
                        <Textarea id={`loungePasses.${i}.notes`} {...form.register(`loungePasses.${i}.notes` as any)} placeholder="Lounge pass notes" />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Booking Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bookingNotes">Booking Notes</Label>
                  <Textarea id="bookingNotes" {...form.register('bookingNotes')} placeholder="Notes for the client about this booking" rows={3} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="internalNotes">Internal Notes</Label>
                  <Textarea id="internalNotes" {...form.register('internalNotes')} placeholder="Internal notes for your team" rows={3} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialRequests">Special Requests</Label>
                  <Textarea id="specialRequests" {...form.register('specialRequests')} placeholder="Any special requests or requirements for this booking" rows={3} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Review Tab */}
          <TabsContent value="review" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Review Booking
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Lead Traveler Review */}
                <div className="space-y-4">
                  <h4 className="font-medium">Lead Traveler</h4>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="font-medium">{form.watch('leadTraveler.firstName')} {form.watch('leadTraveler.lastName')}</p>
                    <p className="text-sm text-muted-foreground">{form.watch('leadTraveler.email')}</p>
                    {form.watch('leadTraveler.phone') && (
                      <p className="text-sm text-muted-foreground">{form.watch('leadTraveler.phone')}</p>
                    )}
                  </div>
                </div>
                {/* Guest Travelers Review */}
                {form.watch('guestTravelers').length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-medium">Guest Travelers</h4>
                    <div className="space-y-2">
                      {form.watch('guestTravelers').map((guest, index) => (
                        <div key={index} className="p-4 bg-muted rounded-lg">
                          <p className="font-medium">{guest.firstName} {guest.lastName}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Payment Review */}
                <div className="space-y-4">
                  <h4 className="font-medium">Payment Information</h4>
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span>Deposit Paid:</span>
                      <Badge variant={form.watch('depositPaid') ? 'default' : 'secondary'}>{form.watch('depositPaid') ? 'Yes' : 'No'}</Badge>
                    </div>
                    {form.watch('depositPaid') && form.watch('depositReference') && (
                      <p className="text-sm text-muted-foreground">Reference: {form.watch('depositReference')}</p>
                    )}
                  </div>
                </div>
                {/* Flights Review */}
                {quote.selectedComponents?.flights && quote.selectedComponents.flights.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-medium">Flights</h4>
                    <div className="space-y-2">
                      {form.watch('flights').map((flight, i) => (
                        <div key={i} className="p-4 bg-muted rounded-lg">
                          <p className="font-medium">{quote.selectedComponents.flights[i]?.name || quote.selectedComponents.flights[i]?.flightNumber || `Flight ${i + 1}`}</p>
                          <p className="text-sm text-muted-foreground">Booking Ref: {flight.bookingRef}</p>
                          <p className="text-sm text-muted-foreground">Ticketing Deadline: {flight.ticketingDeadline}</p>
                          <p className="text-sm text-muted-foreground">Status: {flight.flightStatus}</p>
                          {flight.notes && <p className="text-sm text-muted-foreground">Notes: {flight.notes}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Lounge Passes Review */}
                {quote.selectedComponents?.lounge_passes && quote.selectedComponents.lounge_passes.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-medium">Lounge Passes</h4>
                    <div className="space-y-2">
                      {form.watch('loungePasses').map((lp, i) => (
                        <div key={i} className="p-4 bg-muted rounded-lg">
                          <p className="font-medium">{quote.selectedComponents.lounge_passes[i]?.name || `Lounge Pass ${i + 1}`}</p>
                          <p className="text-sm text-muted-foreground">Booking Ref: {lp.bookingRef}</p>
                          {lp.notes && <p className="text-sm text-muted-foreground">Notes: {lp.notes}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Total Cost */}
                <div className="p-4 bg-primary/10 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Booking Cost:</span>
                    <span className="text-2xl font-bold text-primary">£{quote.totalPrice?.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        {/* Form Actions */}
        <div className="flex items-center justify-between">
          <Button type="button" variant="outline" onClick={() => navigate(`/quotes/${quote.id}`)}>Cancel</Button>
          <div className="flex items-center gap-2">
            {activeTab !== 'review' && (
              <Button type="button" variant="secondary" onClick={() => setActiveTab('review')}>Review</Button>
            )}
            <Button type="submit" variant="default" disabled={isCreatingBooking}>
              {isCreatingBooking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isCreatingBooking ? 'Creating...' : 'Create Booking'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
} 