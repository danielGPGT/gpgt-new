import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Save, 
  Loader2,
  AlertCircle,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Users,
  DollarSign,
  MapPin,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Ticket,
  Hotel,
  Car,
  Plane,
  Star,
  Settings,
  User,
  Building,
  CreditCard
} from 'lucide-react';
import { QuoteService, Quote } from '@/lib/quoteService';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Quote Editor Schema
const quoteEditorSchema = z.object({
  client: z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Valid email is required'),
    phone: z.string().optional(),
  }),
  travelers: z.object({
    adults: z.number().min(1, 'At least one adult required'),
    children: z.number().min(0).default(0),
    total: z.number().min(1, 'At least one traveler required'),
  }),
  event: z.object({
    name: z.string().optional(),
    location: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
  package: z.object({
    name: z.string().optional(),
    tierName: z.string().optional(),
    description: z.string().optional(),
  }),
  components: z.object({
    tickets: z.array(z.object({
      id: z.string(),
      quantity: z.number().min(1),
      price: z.number(),
      category: z.string(),
    })).default([]),
    hotels: z.array(z.object({
      hotelId: z.string().optional(),
      roomId: z.string().optional(),
      quantity: z.number().min(1).optional(),
      price: z.number().optional(),
      checkIn: z.string().optional(),
      checkOut: z.string().optional(),
      hotelName: z.string().optional(),
      roomType: z.string().optional(),
    })).default([]),
    circuitTransfers: z.array(z.object({
      id: z.string(),
      quantity: z.number().min(1),
      price: z.number(),
    })).default([]),
    airportTransfers: z.array(z.object({
      id: z.string(),
      quantity: z.number().min(1),
      price: z.number(),
      transferDirection: z.enum(['outbound', 'return', 'both']).optional(),
    })).default([]),
    flights: z.array(z.object({
      id: z.string(),
      origin: z.string(),
      destination: z.string(),
      departureDate: z.string(),
      returnDate: z.string().optional(),
      price: z.number(),
      passengers: z.number(),
    })).default([]),
    loungePass: z.object({
      id: z.string().optional(),
      variant: z.string().optional(),
      price: z.number().optional(),
      quantity: z.number().optional(),
    }).optional(),
  }),
  payments: z.object({
    total: z.number().default(0),
    deposit: z.number().default(0),
    secondPayment: z.number().default(0),
    finalPayment: z.number().default(0),
    depositDate: z.string().optional(),
    secondPaymentDate: z.string().optional(),
    finalPaymentDate: z.string().optional(),
  }),
  internalNotes: z.string().optional(),
  status: z.enum(['draft', 'sent', 'accepted', 'declined', 'expired', 'confirmed', 'cancelled']),
});

type QuoteEditorData = z.infer<typeof quoteEditorSchema>;

export function EditQuote() {
  const { quoteId } = useParams<{ quoteId: string }>();
  const navigate = useNavigate();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Form setup
  const form = useForm<QuoteEditorData>({
    resolver: zodResolver(quoteEditorSchema),
    defaultValues: {
      client: { firstName: '', lastName: '', email: '', phone: '' },
      travelers: { adults: 1, children: 0, total: 1 },
      event: { name: '', location: '', startDate: '', endDate: '' },
      package: { name: '', tierName: '', description: '' },
      components: {
        tickets: [],
        hotels: [],
        circuitTransfers: [],
        airportTransfers: [],
        flights: [],
        loungePass: undefined,
      },
      payments: { total: 0, deposit: 0, secondPayment: 0, finalPayment: 0 },
      internalNotes: '',
      status: 'draft',
    },
  });

  useEffect(() => {
    if (quoteId) {
      loadQuote();
    }
  }, [quoteId]);

  const loadQuote = async () => {
    try {
      setLoading(true);
      setError(null);
      const quoteData = await QuoteService.getQuoteById(quoteId!);
      setQuote(quoteData);
      
      // Populate form with quote data
      if (quoteData) {
        const [firstName, ...lastNameParts] = quoteData.clientName.split(' ');
        const lastName = lastNameParts.join(' ');
        
        form.reset({
          client: {
            firstName: firstName || '',
            lastName: lastName || '',
            email: quoteData.clientEmail || '',
            phone: quoteData.clientPhone || '',
          },
          travelers: {
            adults: quoteData.travelersAdults || 1,
            children: quoteData.travelersChildren || 0,
            total: quoteData.travelersTotal || 1,
          },
          event: {
            name: quoteData.eventName || '',
            location: quoteData.eventLocation || '',
            startDate: quoteData.startDate || '',
            endDate: quoteData.endDate || '',
          },
          package: {
            name: quoteData.packageName || '',
            tierName: quoteData.tierName || '',
            description: quoteData.selectedTier?.description || '',
          },
          components: {
            tickets: quoteData.selectedComponents?.tickets || [],
            hotels: quoteData.selectedComponents?.hotels || [],
            circuitTransfers: quoteData.selectedComponents?.circuitTransfers || [],
            airportTransfers: quoteData.selectedComponents?.airportTransfers || [],
            flights: quoteData.selectedComponents?.flights || [],
            loungePass: quoteData.selectedComponents?.loungePass,
          },
          payments: {
            total: quoteData.totalPrice || 0,
            deposit: quoteData.paymentDeposit || 0,
            secondPayment: quoteData.paymentSecondPayment || 0,
            finalPayment: quoteData.paymentFinalPayment || 0,
            depositDate: quoteData.paymentDepositDate || '',
            secondPaymentDate: quoteData.paymentSecondPaymentDate || '',
            finalPaymentDate: quoteData.paymentFinalPaymentDate || '',
          },
          internalNotes: quoteData.internalNotes || '',
          status: quoteData.status,
        });
      }
    } catch (err) {
      console.error('Error loading quote:', err);
      setError(err instanceof Error ? err.message : 'Failed to load quote');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!quote) return;
    
    try {
      setSaving(true);
      const formData = form.getValues();
      
      // Update quote with form data
      await QuoteService.updateQuote(quote.id, {
        clientName: `${formData.client.firstName} ${formData.client.lastName}`,
        clientEmail: formData.client.email,
        clientPhone: formData.client.phone,
        travelersAdults: formData.travelers.adults,
        travelersChildren: formData.travelers.children,
        travelersTotal: formData.travelers.total,
        eventName: formData.event.name,
        eventLocation: formData.event.location,
        startDate: formData.event.startDate,
        endDate: formData.event.endDate,
        totalPrice: formData.payments.total,
        paymentDeposit: formData.payments.deposit,
        paymentSecondPayment: formData.payments.secondPayment,
        paymentFinalPayment: formData.payments.finalPayment,
        paymentDepositDate: formData.payments.depositDate,
        paymentSecondPaymentDate: formData.payments.secondPaymentDate,
        paymentFinalPaymentDate: formData.payments.finalPaymentDate,
        selectedComponents: formData.components,
        internalNotes: formData.internalNotes,
        status: formData.status,
      });
      
      toast.success('Quote updated successfully');
      navigate(`/quotes/${quote.id}`);
    } catch (err) {
      console.error('Error saving quote:', err);
      toast.error('Failed to save quote');
    } finally {
      setSaving(false);
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

  const formatCurrency = (amount: number, currency: string = 'GBP') => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading quote...</p>
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
        <div className="mt-4">
          <Button onClick={() => navigate('/quotes')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Quotes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <FormProvider {...form}>
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
              <h1 className="text-2xl font-bold">Edit Quote {quote.quoteNumber}</h1>
              <p className="text-muted-foreground">
                {quote.clientName} • {quote.eventName || 'Event Package'}
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

        {/* Quote Editor Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="client" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Client
            </TabsTrigger>
            <TabsTrigger value="components" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Components
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="notes" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Notes
            </TabsTrigger>
            <TabsTrigger value="status" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Status
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quote Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">Client</span>
                    </div>
                    <p className="font-medium">{quote.clientName}</p>
                    <p className="text-sm text-muted-foreground">{quote.clientEmail}</p>
                    {quote.clientPhone && (
                      <p className="text-sm text-muted-foreground">{quote.clientPhone}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">Event</span>
                    </div>
                    <p className="font-medium">{quote.eventName || 'N/A'}</p>
                    <p className="text-sm text-muted-foreground">{quote.eventLocation}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">Dates</span>
                    </div>
                    <p className="font-medium">
                      {format(new Date(quote.startDate), 'MMM dd')} - {format(new Date(quote.endDate), 'MMM dd, yyyy')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {quote.travelersTotal} travelers
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">Total</span>
                    </div>
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(quote.totalPrice, quote.currency)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {quote.packageName} • {quote.tierName}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Client Tab */}
          <TabsContent value="client" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Client Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      {...form.register('client.firstName')}
                      placeholder="Enter first name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      {...form.register('client.lastName')}
                      placeholder="Enter last name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      {...form.register('client.email')}
                      placeholder="Enter email address"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      {...form.register('client.phone')}
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="adults">Adults</Label>
                    <Input
                      id="adults"
                      type="number"
                      {...form.register('travelers.adults', { valueAsNumber: true })}
                      min={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="children">Children</Label>
                    <Input
                      id="children"
                      type="number"
                      {...form.register('travelers.children', { valueAsNumber: true })}
                      min={0}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="total">Total Travelers</Label>
                    <Input
                      id="total"
                      type="number"
                      {...form.register('travelers.total', { valueAsNumber: true })}
                      min={1}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Components Tab */}
          <TabsContent value="components" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Package Components</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Tickets */}
                {form.watch('components.tickets')?.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Ticket className="h-5 w-5 text-primary" />
                      Event Tickets
                    </h4>
                    {form.watch('components.tickets').map((ticket: any, index: number) => (
                      <div key={index} className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{ticket.category}</p>
                          <p className="text-sm text-muted-foreground">
                            £{ticket.price} each
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-sm">Quantity:</Label>
                          <Input
                            type="number"
                            value={ticket.quantity}
                            onChange={(e) => {
                              const newTickets = [...form.watch('components.tickets')];
                              newTickets[index].quantity = parseInt(e.target.value) || 1;
                              form.setValue('components.tickets', newTickets);
                            }}
                            className="w-20"
                            min={1}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Hotels */}
                {form.watch('components.hotels')?.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Hotel className="h-5 w-5 text-primary" />
                      Hotel Rooms
                    </h4>
                    {form.watch('components.hotels').map((hotel: any, index: number) => (
                      <div key={index} className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{hotel.hotelName || `Hotel ${index + 1}`}</p>
                          <p className="text-sm text-muted-foreground">
                            {hotel.roomType || 'Room'} • {hotel.checkIn} - {hotel.checkOut}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-sm">Rooms:</Label>
                          <Input
                            type="number"
                            value={hotel.quantity || 1}
                            onChange={(e) => {
                              const newHotels = [...form.watch('components.hotels')];
                              newHotels[index].quantity = parseInt(e.target.value) || 1;
                              form.setValue('components.hotels', newHotels);
                            }}
                            className="w-20"
                            min={1}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Other components can be added here */}
                <div className="text-center py-8 text-muted-foreground">
                  <p>More component editing options coming soon...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Schedule</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="total">Total Price</Label>
                    <Input
                      id="total"
                      type="number"
                      step="0.01"
                      {...form.register('payments.total', { valueAsNumber: true })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deposit">Deposit Amount</Label>
                    <Input
                      id="deposit"
                      type="number"
                      step="0.01"
                      {...form.register('payments.deposit', { valueAsNumber: true })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondPayment">Second Payment</Label>
                    <Input
                      id="secondPayment"
                      type="number"
                      step="0.01"
                      {...form.register('payments.secondPayment', { valueAsNumber: true })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="finalPayment">Final Payment</Label>
                    <Input
                      id="finalPayment"
                      type="number"
                      step="0.01"
                      {...form.register('payments.finalPayment', { valueAsNumber: true })}
                    />
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="depositDate">Deposit Date</Label>
                    <Input
                      id="depositDate"
                      type="date"
                      {...form.register('payments.depositDate')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondPaymentDate">Second Payment Date</Label>
                    <Input
                      id="secondPaymentDate"
                      type="date"
                      {...form.register('payments.secondPaymentDate')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="finalPaymentDate">Final Payment Date</Label>
                    <Input
                      id="finalPaymentDate"
                      type="date"
                      {...form.register('payments.finalPaymentDate')}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Internal Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    {...form.register('internalNotes')}
                    placeholder="Add internal notes about this quote..."
                    rows={6}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Status Tab */}
          <TabsContent value="status" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quote Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={form.watch('status')}
                    onValueChange={(value) => form.setValue('status', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
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
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => navigate(`/quotes/${quote.id}`)}
          >
            Cancel
          </Button>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => navigate(`/quotes/${quote.id}`)}
            >
              View Quote
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </FormProvider>
  );
} 