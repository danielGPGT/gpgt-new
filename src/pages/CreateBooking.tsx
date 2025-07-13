import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
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
import { 
  ArrowLeft, 
  Save, 
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Users,
  DollarSign,
  MapPin,
  Calendar,
  CreditCard,
  User,
  UserPlus,
  Hotel,
  Ticket,
  Car,
  Plane,
  Star,
  Info,
  Plus,
  Minus
} from 'lucide-react';
import { QuoteService, Quote } from '@/lib/quoteService';
import { BookingService, CreateBookingData, BookingTraveler, LeadTraveler, BookingPayment } from '@/lib/bookingService';
import { toast } from 'sonner';
import { format, addDays } from 'date-fns';

// Schema for booking creation form
const createBookingSchema = z.object({
  // Lead traveler information
  leadTraveler: z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Valid email is required'),
    phone: z.string().optional(),
    address: z.string().optional(),
  }),
  
  // Guest travelers (only names required)
  guestTravelers: z.array(z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
  })),
  
  // Payment information
  depositPaid: z.boolean().default(true),
  depositReference: z.string().optional(),
  
  // Payment schedule adjustments
  useOriginalPaymentSchedule: z.boolean().default(true),
  adjustedPayments: z.array(z.object({
    paymentType: z.enum(['deposit', 'second_payment', 'final_payment', 'additional']),
    amount: z.number().min(0, 'Amount must be positive'),
    dueDate: z.string().min(1, 'Due date is required'),
    notes: z.string().optional(),
  })),
  
  // Booking details
  bookingNotes: z.string().optional(),
  internalNotes: z.string().optional(),
  specialRequests: z.string().optional(),
});

type CreateBookingFormData = z.infer<typeof createBookingSchema>;

export function CreateBooking() {
  const { quoteId } = useParams<{ quoteId: string }>();
  const navigate = useNavigate();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availabilityCheck, setAvailabilityCheck] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('travelers');

  const form = useForm<CreateBookingFormData>({
    resolver: zodResolver(createBookingSchema),
    defaultValues: {
      leadTraveler: {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
      },
      guestTravelers: [],
      depositPaid: false,
      depositReference: '',
      useOriginalPaymentSchedule: true,
      adjustedPayments: [],
      bookingNotes: '',
      internalNotes: '',
      specialRequests: '',
    },
  });

  // Load quote and check availability
  useEffect(() => {
    const loadQuote = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!quoteId) {
          throw new Error('Quote ID is required');
        }

        const quoteData = await QuoteService.getQuoteById(quoteId);
        setQuote(quoteData);

        // Check component availability
        const availability = await BookingService.checkComponentAvailability(quoteData);
        setAvailabilityCheck(availability);

        if (!availability.allAvailable) {
          setError(`Some components are no longer available: ${availability.unavailableComponents.join(', ')}`);
        }

        // Pre-populate form with quote data
        const [firstName, ...lastNameParts] = quoteData.clientName.split(' ');
        const lastName = lastNameParts.join(' ');
        
        form.reset({
          leadTraveler: {
            firstName: firstName || '',
            lastName: lastName || '',
            email: quoteData.clientEmail || '',
            phone: quoteData.clientPhone || '',
            address: '',
          },
          guestTravelers: [],
          depositPaid: true,
          depositReference: '',
          useOriginalPaymentSchedule: true,
          adjustedPayments: [
            {
              paymentType: 'deposit',
              amount: quoteData.paymentDeposit || 0,
              dueDate: quoteData.paymentDepositDate || format(new Date(), 'yyyy-MM-dd'),
              notes: 'Deposit payment'
            },
            {
              paymentType: 'second_payment',
              amount: quoteData.paymentSecondPayment || 0,
              dueDate: quoteData.paymentSecondPaymentDate || format(addDays(new Date(), 30), 'yyyy-MM-dd'),
              notes: 'Second payment'
            },
            {
              paymentType: 'final_payment',
              amount: quoteData.paymentFinalPayment || 0,
              dueDate: quoteData.paymentFinalPaymentDate || format(addDays(new Date(), 60), 'yyyy-MM-dd'),
              notes: 'Final payment'
            }
          ],
          bookingNotes: '',
          internalNotes: '',
          specialRequests: '',
        });

        // Add guest travelers based on quote data (adults - 1 for lead traveler)
        const adults = quoteData.travelersAdults || 1;
        const guestTravelers: BookingTraveler[] = [];
        
        for (let i = 1; i < adults; i++) {
          guestTravelers.push({
            firstName: '',
            lastName: '',
          });
        }
        
        form.setValue('guestTravelers', guestTravelers);

      } catch (err) {
        console.error('Error loading quote:', err);
        setError(err instanceof Error ? err.message : 'Failed to load quote');
      } finally {
        setLoading(false);
      }
    };

    loadQuote();
  }, [quoteId, form]);

  const handleSubmit = async (data: CreateBookingFormData) => {
    if (!quote || !quoteId) return;

    try {
      setSaving(true);

      // Validate traveler count matches quote
      const totalTravelers = 1 + data.guestTravelers.length; // Lead + guests
      if (totalTravelers !== quote.travelersAdults) {
        throw new Error(`Traveler count mismatch. Expected ${quote.travelersAdults} adults, but have ${totalTravelers} travelers.`);
      }

      // Prepare booking data
      const bookingData: CreateBookingData = {
        quoteId,
        leadTraveler: data.leadTraveler,
        guestTravelers: data.guestTravelers,
        adjustedPaymentSchedule: data.useOriginalPaymentSchedule ? undefined : data.adjustedPayments,
        bookingNotes: data.bookingNotes,
        internalNotes: data.internalNotes,
        specialRequests: data.specialRequests,
        depositPaid: data.depositPaid,
        depositReference: data.depositReference,
      };

      // Create the booking
      const bookingId = await BookingService.createBookingFromQuote(bookingData);

      toast.success('Booking created successfully!');
      navigate(`/bookings/${bookingId}`);

    } catch (err) {
      console.error('Error creating booking:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to create booking');
    } finally {
      setSaving(false);
    }
  };

  const addGuestTraveler = () => {
    const currentGuests = form.getValues('guestTravelers');
    const adults = quote?.travelersAdults || 1;
    const maxGuests = adults - 1; // Lead traveler counts as 1
    
    if (currentGuests.length >= maxGuests) {
      toast.error(`Cannot add more guests. Maximum ${maxGuests} guest travelers allowed for ${adults} adults.`);
      return;
    }
    
    const newGuest: BookingTraveler = {
      firstName: '',
      lastName: '',
    };
    form.setValue('guestTravelers', [...currentGuests, newGuest]);
  };

  const removeGuestTraveler = (index: number) => {
    const currentGuests = form.getValues('guestTravelers');
    form.setValue('guestTravelers', currentGuests.filter((_, i) => i !== index));
  };

  const addPayment = () => {
    const currentPayments = form.getValues('adjustedPayments');
    const newPayment: BookingPayment = {
      paymentType: 'additional',
      amount: 0,
      dueDate: format(addDays(new Date(), 90), 'yyyy-MM-dd'),
      notes: 'Additional payment'
    };
    form.setValue('adjustedPayments', [...currentPayments, newPayment]);
  };

  const handlePaymentTypeChange = (index: number, newType: string) => {
    // If payment type is changed to deposit, set due date to current date
    if (newType === 'deposit') {
      form.setValue(`adjustedPayments.${index}.dueDate`, format(new Date(), 'yyyy-MM-dd'));
    }
    // Update the payment type
    form.setValue(`adjustedPayments.${index}.paymentType`, newType as any);
  };

  const removePayment = (index: number) => {
    const currentPayments = form.getValues('adjustedPayments');
    form.setValue('adjustedPayments', currentPayments.filter((_, i) => i !== index));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-500';
      case 'sent': return 'bg-blue-500';
      case 'accepted': return 'bg-green-500';
      case 'declined': return 'bg-red-500';
      case 'confirmed': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <Clock className="h-4 w-4" />;
      case 'sent': return <Mail className="h-4 w-4" />;
      case 'accepted': return <CheckCircle className="h-4 w-4" />;
      case 'declined': return <XCircle className="h-4 w-4" />;
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center space-y-4">
            <Loader2 className="animate-spin h-8 w-8 text-primary mx-auto" />
            <p className="text-muted-foreground">Loading quote details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Quote not found'}</AlertDescription>
        </Alert>
      </div>
    );
  }

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
          <Badge className={`${getStatusColor(quote.status)} text-white flex items-center gap-1`}>
            {getStatusIcon(quote.status)}
            {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
          </Badge>
        </div>
      </div>

      {/* Availability Warning */}
      {availabilityCheck && !availabilityCheck.allAvailable && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Component Availability Issue:</strong> {availabilityCheck.unavailableComponents.join(', ')}
          </AlertDescription>
        </Alert>
      )}

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
                {format(new Date(quote.startDate), 'MMM dd')} - {format(new Date(quote.endDate), 'MMM dd, yyyy')}
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
        </CardContent>
      </Card>

      {/* Booking Form */}
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="travelers">Travelers</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="review">Review</TabsTrigger>
          </TabsList>

          {/* Travelers Tab */}
          <TabsContent value="travelers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Lead Traveler
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="leadFirstName">First Name *</Label>
                    <Input
                      id="leadFirstName"
                      {...form.register('leadTraveler.firstName')}
                      placeholder="Enter first name"
                    />
                    {form.formState.errors.leadTraveler?.firstName && (
                      <p className="text-sm text-destructive">{form.formState.errors.leadTraveler.firstName.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="leadLastName">Last Name *</Label>
                    <Input
                      id="leadLastName"
                      {...form.register('leadTraveler.lastName')}
                      placeholder="Enter last name"
                    />
                    {form.formState.errors.leadTraveler?.lastName && (
                      <p className="text-sm text-destructive">{form.formState.errors.leadTraveler.lastName.message}</p>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="leadEmail">Email *</Label>
                    <Input
                      id="leadEmail"
                      type="email"
                      {...form.register('leadTraveler.email')}
                      placeholder="Enter email address"
                    />
                    {form.formState.errors.leadTraveler?.email && (
                      <p className="text-sm text-destructive">{form.formState.errors.leadTraveler.email.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="leadPhone">Phone</Label>
                    <Input
                      id="leadPhone"
                      {...form.register('leadTraveler.phone')}
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="leadAddress">Address</Label>
                  <Textarea
                    id="leadAddress"
                    {...form.register('leadTraveler.address')}
                    placeholder="Enter full address"
                    rows={3}
                  />
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
                      <Badge variant="outline" className="text-xs">
                        Lead: 1
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Guests: {form.watch('guestTravelers').length}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Total: {1 + form.watch('guestTravelers').length}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addGuestTraveler}
                    className="flex items-center gap-2"
                    disabled={form.watch('guestTravelers').length >= ((quote?.travelersAdults || 1) - 1)}
                  >
                    <Plus className="h-4 w-4" />
                    Add Guest
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {form.watch('guestTravelers').map((_, index) => (
                  <div key={index} className="space-y-4 p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Guest {index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeGuestTraveler(index)}
                        className="text-destructive"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`guest${index}FirstName`}>First Name *</Label>
                        <Input
                          id={`guest${index}FirstName`}
                          {...form.register(`guestTravelers.${index}.firstName`)}
                          placeholder="Enter first name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`guest${index}LastName`}>Last Name *</Label>
                        <Input
                          id={`guest${index}LastName`}
                          {...form.register(`guestTravelers.${index}.lastName`)}
                          placeholder="Enter last name"
                        />
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
                        : 'No guest travelers needed for single adult booking.'
                      }
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
                    <Switch
                      id="depositPaid"
                      checked={form.watch('depositPaid')}
                      onCheckedChange={(checked) => form.setValue('depositPaid', checked)}
                    />
                    <Label htmlFor="depositPaid">Deposit has been paid</Label>
                  </div>
                  
                  {form.watch('depositPaid') && (
                    <div className="space-y-2">
                      <Label htmlFor="depositReference">Payment Reference</Label>
                      <Input
                        id="depositReference"
                        {...form.register('depositReference')}
                        placeholder="Enter payment reference or transaction ID"
                      />
                    </div>
                  )}
                </div>

                <Separator />

                {/* Payment Schedule */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="useOriginalSchedule"
                      checked={form.watch('useOriginalPaymentSchedule')}
                      onCheckedChange={(checked) => form.setValue('useOriginalPaymentSchedule', checked)}
                    />
                    <Label htmlFor="useOriginalSchedule">Use original payment schedule from quote</Label>
                  </div>

                  {!form.watch('useOriginalPaymentSchedule') && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Payment Schedule</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addPayment}
                          className="flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Add Payment
                        </Button>
                      </div>

                      {form.watch('adjustedPayments').map((_, index) => (
                        <div key={index} className="space-y-4 p-4 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <h5 className="font-medium">Payment {index + 1}</h5>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removePayment(index)}
                              className="text-destructive"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label>Type</Label>
                              <select
                                {...form.register(`adjustedPayments.${index}.paymentType`)}
                                className="w-full p-2 border rounded-md"
                                onChange={(e) => handlePaymentTypeChange(index, e.target.value)}
                              >
                                <option value="deposit">Deposit</option>
                                <option value="second_payment">Second Payment</option>
                                <option value="final_payment">Final Payment</option>
                                <option value="additional">Additional</option>
                              </select>
                            </div>
                            <div className="space-y-2">
                              <Label>Amount (£)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                {...form.register(`adjustedPayments.${index}.amount`, { valueAsNumber: true })}
                                placeholder="0.00"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Due Date</Label>
                              <Input
                                type="date"
                                {...form.register(`adjustedPayments.${index}.dueDate`)}
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Notes</Label>
                            <Input
                              {...form.register(`adjustedPayments.${index}.notes`)}
                              placeholder="Payment notes"
                            />
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
                          <span className="text-sm text-muted-foreground">
                            {quote.paymentDepositDate ? format(new Date(quote.paymentDepositDate), 'MMM dd, yyyy') : format(new Date(), 'MMM dd, yyyy')}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                          <span>Second Payment</span>
                          <span className="font-medium">£{quote.paymentSecondPayment?.toLocaleString()}</span>
                          <span className="text-sm text-muted-foreground">
                            {quote.paymentSecondPaymentDate ? format(new Date(quote.paymentSecondPaymentDate), 'MMM dd, yyyy') : 'TBD'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                          <span>Final Payment</span>
                          <span className="font-medium">£{quote.paymentFinalPayment?.toLocaleString()}</span>
                          <span className="text-sm text-muted-foreground">
                            {quote.paymentFinalPaymentDate ? format(new Date(quote.paymentFinalPaymentDate), 'MMM dd, yyyy') : 'TBD'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

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
                  <Textarea
                    id="bookingNotes"
                    {...form.register('bookingNotes')}
                    placeholder="Notes for the client about this booking"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="internalNotes">Internal Notes</Label>
                  <Textarea
                    id="internalNotes"
                    {...form.register('internalNotes')}
                    placeholder="Internal notes for your team"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specialRequests">Special Requests</Label>
                  <Textarea
                    id="specialRequests"
                    {...form.register('specialRequests')}
                    placeholder="Any special requests or requirements for this booking"
                    rows={3}
                  />
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
                    <p className="font-medium">
                      {form.watch('leadTraveler.firstName')} {form.watch('leadTraveler.lastName')}
                    </p>
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
                          <p className="font-medium">
                            {guest.firstName} {guest.lastName}
                          </p>
                          {guest.email && (
                            <p className="text-sm text-muted-foreground">{guest.email}</p>
                          )}
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
                      <Badge variant={form.watch('depositPaid') ? 'default' : 'secondary'}>
                        {form.watch('depositPaid') ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    {form.watch('depositPaid') && form.watch('depositReference') && (
                      <p className="text-sm text-muted-foreground">
                        Reference: {form.watch('depositReference')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Total Cost */}
                <div className="p-4 bg-primary/10 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Booking Cost:</span>
                    <span className="text-2xl font-bold text-primary">
                      £{quote.totalPrice?.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Form Actions */}
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/quotes/${quote.id}`)}
          >
            Cancel
          </Button>
          
          <div className="flex items-center gap-2">
            {activeTab !== 'review' && (
              <Button
                type="button"
                onClick={() => {
                  const tabs = ['travelers', 'payments', 'details', 'review'];
                  const currentIndex = tabs.indexOf(activeTab);
                  if (currentIndex < tabs.length - 1) {
                    setActiveTab(tabs[currentIndex + 1]);
                  }
                }}
              >
                Next
              </Button>
            )}
            
            {activeTab === 'review' && (
              <Button
                type="submit"
                disabled={saving || !availabilityCheck?.allAvailable}
                className="flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating Booking...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Create Booking
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
} 