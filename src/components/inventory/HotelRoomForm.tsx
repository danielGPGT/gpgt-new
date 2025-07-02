import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Calendar, Bed, DollarSign, Users, Clock, FileText, Building, Calculator, TrendingUp, Upload, Eye, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { HotelRoomService, type HotelRoom, type HotelRoomInsert } from '@/lib/hotelRoomService';
import { HotelService } from '@/lib/hotelService';
import { InventoryService } from '@/lib/inventoryService';
import { PDFUploadService } from '@/lib/pdfUpload';
import { useAuth } from '@/lib/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, subDays, addDays } from 'date-fns';
import { cn } from '@/lib/utils';

// Live FX rate API using exchangerate-api.com (free tier)
const EXCHANGE_RATE_API_BASE = 'https://api.exchangerate-api.com/v4/latest';

// Cache for exchange rates to avoid excessive API calls
const rateCache = new Map<string, { rate: number; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Utility to get currency symbol
const getCurrencySymbol = (currency: string): string => {
  const symbols: Record<string, string> = {
    'EUR': '€',
    'GBP': '£',
    'USD': '$',
    'CAD': 'C$',
    'AUD': 'A$',
    'JPY': '¥',
    'CHF': 'CHF',
    'SEK': 'kr',
    'NOK': 'kr',
    'DKK': 'kr'
  };
  return symbols[currency] || currency;
};

// Utility to convert currency using live rates
const convertCurrency = async (amount: number, fromCurrency: string, toCurrency: string): Promise<number> => {
  if (fromCurrency === toCurrency) return amount;
  
  const cacheKey = `${fromCurrency}_${toCurrency}`;
  const cached = rateCache.get(cacheKey);
  
  // Check if we have a valid cached rate
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return parseFloat((amount * cached.rate).toFixed(2));
  }
  
  try {
    const response = await fetch(`${EXCHANGE_RATE_API_BASE}/${fromCurrency}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch exchange rate: ${response.statusText}`);
    }
    
    const data = await response.json();
    const rate = data.rates[toCurrency];
    
    if (!rate) {
      throw new Error(`Exchange rate not available for ${fromCurrency} to ${toCurrency}`);
    }
    
    // Cache the rate
    rateCache.set(cacheKey, { rate, timestamp: Date.now() });
    
    return parseFloat((amount * rate).toFixed(2));
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    // Fallback to a reasonable estimate if API fails
    const fallbackRates: Record<string, Record<string, number>> = {
      EUR: { GBP: 0.85, USD: 1.08, EUR: 1.0 },
      GBP: { EUR: 1.18, USD: 1.27, GBP: 1.0 },
      USD: { EUR: 0.93, GBP: 0.79, USD: 1.0 },
    };
    
    const fallbackRate = fallbackRates[fromCurrency]?.[toCurrency];
    if (fallbackRate) {
      return parseFloat((amount * fallbackRate).toFixed(2));
    }
    
    return amount; // Return original amount if conversion fails
  }
};

interface HotelRoomFormProps {
  hotelId: string;
  room?: HotelRoom | null;
  onClose: () => void;
  onSuccess: () => void;
}

const CURRENCIES = ['EUR', 'GBP', 'USD', 'CAD', 'AUD'];

export function HotelRoomForm({ hotelId, room, onClose, onSuccess }: HotelRoomFormProps) {
  const [formData, setFormData] = useState<HotelRoomInsert & { contract_file_path?: string }>({
    hotel_id: hotelId,
    room_type_id: room?.room_type_id || '',
    event_id: room?.event_id,
    check_in: room?.check_in ? new Date(room.check_in).toISOString().split('T')[0] : '',
    check_out: room?.check_out ? new Date(room.check_out).toISOString().split('T')[0] : '',
    quantity_total: room?.quantity_total || 0,
    markup_percent: room?.markup_percent || 0,
    currency: room?.currency || 'EUR',
    vat_percent: room?.vat_percent,
    resort_fee: room?.resort_fee,
    resort_fee_type: room?.resort_fee_type || 'per_night',
    city_tax_per_person_per_night: room?.city_tax_per_person_per_night,
    contracted: room?.contracted || false,
    attrition_deadline: room?.attrition_deadline,
    release_allowed_percent: room?.release_allowed_percent,
    penalty_terms: room?.penalty_terms,
    supplier: room?.supplier,
    supplier_ref: room?.supplier_ref,
    contract_file_path: (room as any)?.contract_file_path,
    active: room?.active ?? true,
    supplier_price: room?.supplier_price || 0,
    supplier_currency: room?.supplier_currency || 'EUR',
  });

  // Fetch parent hotel to get room types
  const { data: parentHotel } = useQuery({
    queryKey: ['hotel', hotelId],
    queryFn: () => HotelService.getHotel(hotelId),
  });

  // Fetch events for selection
  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: () => InventoryService.getEvents(),
  });

  // Get current user
  const { user } = useAuth();

  // Calculate nights
  const [nights, setNights] = useState(0);
  const [calendarKey, setCalendarKey] = useState(0);
  const [isConvertingCurrency, setIsConvertingCurrency] = useState(false);
  const [isUploadingPDF, setIsUploadingPDF] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [priceBreakdown, setPriceBreakdown] = useState({
    supplierPrice: 0,
    supplierPriceGBP: 0,
    vatAmount: 0,
    resortFeeAmount: 0,
    cityTaxAmount: 0,
    subtotalGBP: 0,
    markupAmount: 0,
    finalPriceGBP: 0,
    finalPriceDisplay: 0
  });
  
  useEffect(() => {
    if (formData.check_in && formData.check_out) {
      const checkIn = new Date(formData.check_in);
      const checkOut = new Date(formData.check_out);
      const diffTime = checkOut.getTime() - checkIn.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setNights(diffDays > 0 ? diffDays : 0);
    } else {
      setNights(0);
    }
  }, [formData.check_in, formData.check_out]);

  // Calculate pricing breakdown
  const calculatePricing = async () => {
    if (!formData.supplier_price || formData.supplier_price <= 0) {
      setPriceBreakdown({
        supplierPrice: 0,
        supplierPriceGBP: 0,
        vatAmount: 0,
        resortFeeAmount: 0,
        cityTaxAmount: 0,
        subtotalGBP: 0,
        markupAmount: 0,
        finalPriceGBP: 0,
        finalPriceDisplay: 0
      });
      return;
    }

    setIsConvertingCurrency(true);
    try {
      // Convert supplier price to GBP
      const supplierPriceGBP = await convertCurrency(
        formData.supplier_price, 
        formData.supplier_currency || 'EUR', 
        'GBP'
      );

      // Calculate taxes and fees
      const vatAmount = formData.vat_percent ? (supplierPriceGBP * formData.vat_percent / 100) : 0;
      
      const resortFeeAmount = formData.resort_fee ? 
        (formData.resort_fee_type === 'per_night' ? formData.resort_fee * nights : formData.resort_fee) : 0;
      
      const cityTaxAmount = formData.city_tax_per_person_per_night ? 
        formData.city_tax_per_person_per_night * nights : 0;

      // Calculate subtotal in GBP
      const subtotalGBP = supplierPriceGBP + vatAmount + resortFeeAmount + cityTaxAmount;

      // Apply markup
      const markupAmount = formData.markup_percent ? (subtotalGBP * formData.markup_percent / 100) : 0;
      const finalPriceGBP = subtotalGBP + markupAmount;

      // Convert to display currency if different from GBP
      let finalPriceDisplay = finalPriceGBP;
      if (formData.currency && formData.currency !== 'GBP') {
        finalPriceDisplay = await convertCurrency(finalPriceGBP, 'GBP', formData.currency);
      }

      setPriceBreakdown({
        supplierPrice: formData.supplier_price,
        supplierPriceGBP,
        vatAmount,
        resortFeeAmount,
        cityTaxAmount,
        subtotalGBP,
        markupAmount,
        finalPriceGBP,
        finalPriceDisplay
      });
    } catch (error) {
      console.error('Error calculating pricing:', error);
      toast.error('Failed to calculate pricing. Using fallback rates.');
    } finally {
      setIsConvertingCurrency(false);
    }
  };

  // Recalculate pricing when relevant fields change
  useEffect(() => {
    calculatePricing();
  }, [
    formData.supplier_price,
    formData.supplier_currency,
    formData.vat_percent,
    formData.resort_fee,
    formData.resort_fee_type,
    formData.city_tax_per_person_per_night,
    formData.markup_percent,
    formData.currency,
    nights
  ]);

  // Create room mutation
  const createMutation = useMutation({
    mutationFn: (data: HotelRoomInsert) => HotelRoomService.createRoom(data),
    onSuccess: () => {
      toast.success('Room created successfully');
      onSuccess();
    },
    onError: (error) => {
      toast.error(`Failed to create room: ${error.message}`);
    },
  });

  // Update room mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<HotelRoomInsert> }) => 
      HotelRoomService.updateRoom(id, data),
    onSuccess: () => {
      toast.success('Room updated successfully');
      onSuccess();
    },
    onError: (error) => {
      toast.error(`Failed to update room: ${error.message}`);
    },
  });

  const updateField = (field: keyof (HotelRoomInsert & { contract_file_path?: string }), value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEventChange = (eventId: string) => {
    updateField('event_id', eventId);
    
    // Auto-set check-in and check-out dates based on event
    if (eventId) {
      const selectedEvent = events.find(e => e.id === eventId);
      if (selectedEvent && selectedEvent.start_date && selectedEvent.end_date) {
        // Set check-in to one day before event start date
        const eventStartDate = new Date(selectedEvent.start_date);
        const checkInDate = subDays(eventStartDate, 1);
        updateField('check_in', format(checkInDate, 'yyyy-MM-dd'));
        
        // Set check-out to one day after event end date
        const eventEndDate = new Date(selectedEvent.end_date);
        const checkOutDate = addDays(eventEndDate, 1);
        updateField('check_out', format(checkOutDate, 'yyyy-MM-dd'));
        
        // Force calendar re-render
        setCalendarKey(prev => prev + 1);
      }
    }
  };

  const handleCheckInChange = (date: Date | undefined) => {
    if (date) {
      const checkInDate = format(date, 'yyyy-MM-dd');
      updateField('check_in', checkInDate);
      
      // Auto-set checkout date to 4 nights later
      const checkOutDate = new Date(date);
      checkOutDate.setDate(checkOutDate.getDate() + 4);
      const formattedCheckOut = format(checkOutDate, 'yyyy-MM-dd');
      updateField('check_out', formattedCheckOut);
    }
  };

  const handleCheckOutChange = (date: Date | undefined) => {
    if (date) {
      const checkOutDate = format(date, 'yyyy-MM-dd');
      updateField('check_out', checkOutDate);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!user) {
      toast.error('You must be logged in to upload files');
      return;
    }

    setIsUploadingPDF(true);
    try {
      const uploadedPDF = await PDFUploadService.uploadPDF(file, user.id, room?.id);
      updateField('contract_file_path', uploadedPDF.path);
      toast.success('Contract uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload contract');
    } finally {
      setIsUploadingPDF(false);
    }
  };

  const handleFileDelete = async () => {
    if (!formData.contract_file_path) return;

    try {
      await PDFUploadService.deletePDF(formData.contract_file_path);
      updateField('contract_file_path', undefined);
      toast.success('Contract deleted successfully');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete contract');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const pdfFile = files.find(file => file.type === 'application/pdf');
    
    if (pdfFile) {
      handleFileUpload(pdfFile);
    } else {
      toast.error('Please drop a PDF file');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.room_type_id || !formData.event_id || !formData.check_in || !formData.check_out || !formData.quantity_total || !formData.supplier_price) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (nights <= 0) {
      toast.error('Check-out date must be after check-in date');
      return;
    }

    if (room) {
      updateMutation.mutate({ id: room.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  // Get room types from parent hotel
  const hotelRoomTypes = parentHotel?.room_types || [];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-muted border-border">
          <TabsTrigger value="basic" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground">
            <Bed className="w-4 h-4" />
            Basic Info
          </TabsTrigger>
          <TabsTrigger value="pricing" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground">
            <DollarSign className="w-4 h-4" />
            Pricing
          </TabsTrigger>
          <TabsTrigger value="availability" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground">
            <Users className="w-4 h-4" />
            Availability
          </TabsTrigger>
          <TabsTrigger value="contract" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground">
            <FileText className="w-4 h-4" />
            Contract
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-card-foreground">
                <Bed className="w-5 h-5 text-primary" />
                Room Information
              </CardTitle>
              <CardDescription className="text-muted-foreground">Basic room details and configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="room_type_id" className="text-sm font-medium text-foreground">Room Type *</Label>
                  <Select
                    value={formData.room_type_id}
                    onValueChange={(value) => updateField('room_type_id', value)}
                  >
                    <SelectTrigger className="border-border bg-background">
                      <SelectValue placeholder="Select room type" />
                    </SelectTrigger>
                    <SelectContent>
                      {hotelRoomTypes.length > 0 ? (
                        hotelRoomTypes.map((type: string) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))
                      ) : (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">No room types available</div>
                      )}
                    </SelectContent>
                  </Select>
                  {hotelRoomTypes.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      No room types configured for this hotel. Please add room types in the hotel settings first.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="event_id" className="text-sm font-medium text-foreground">Event *</Label>
                  <Select
                    value={formData.event_id || ''}
                    onValueChange={(value) => handleEventChange(value)}
                  >
                    <SelectTrigger className="border-border bg-background">
                      <SelectValue placeholder="Select an event" />
                    </SelectTrigger>
                    <SelectContent>
                      {events.filter(event => event.id && event.id.trim() !== '').map(event => (
                        <SelectItem key={event.id} value={event.id}>
                          {event.name} - {event.start_date}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.event_id && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="text-sm font-medium mb-2">Event Details</div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Start Date</div>
                          <div className="font-medium">
                            {events.find(e => e.id === formData.event_id)?.start_date}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">End Date</div>
                          <div className="font-medium">
                            {events.find(e => e.id === formData.event_id)?.end_date}
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Set check-in/out dates to align with this event
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <Separator className="bg-border" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Check-in Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal border-border bg-background",
                          !formData.check_in && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {formData.check_in ? format(new Date(formData.check_in), 'PPP') : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        key={`checkin-${formData.check_in}-${calendarKey}`}
                        mode="single"
                        selected={formData.check_in ? new Date(formData.check_in) : undefined}
                        onSelect={handleCheckInChange}
                        initialFocus
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Check-out Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal border-border bg-background",
                          !formData.check_out && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {formData.check_out ? format(new Date(formData.check_out), 'PPP') : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        key={`checkout-${formData.check_out}-${calendarKey}`}
                        mode="single"
                        selected={formData.check_out ? new Date(formData.check_out) : undefined}
                        onSelect={handleCheckOutChange}
                        initialFocus
                        disabled={(date) => {
                          const checkInDate = formData.check_in ? new Date(formData.check_in) : new Date();
                          return date <= checkInDate;
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {nights > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  <Calendar className="w-4 h-4" />
                  {nights} night{nights !== 1 ? 's' : ''}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4">
          {/* Step 1: Supplier Information */}
          <Card className="border-[var(--border)] bg-[var(--card)]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-[var(--card-foreground)] text-base">
                <Building className="w-4 h-4 text-[var(--primary)]" />
                Step 1: Supplier Information
              </CardTitle>
              <CardDescription className="text-[var(--muted-foreground)] text-sm">Enter the raw cost from your supplier</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="supplier_price" className="text-sm font-medium text-[var(--foreground)]">Supplier Price *</Label>
                  <Input
                    id="supplier_price"
                    type="number"
                    step="0.01"
                    value={formData.supplier_price}
                    onChange={(e) => updateField('supplier_price', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="supplier_currency" className="text-sm font-medium text-[var(--foreground)]">Supplier Currency</Label>
                  <Select
                    value={formData.supplier_currency}
                    onValueChange={(value) => updateField('supplier_currency', value)}
                  >
                    <SelectTrigger className="border-[var(--border)] bg-[var(--background)]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map(currency => (
                        <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Quick Conversion Preview */}
              {formData.supplier_price > 0 && (
                <div className="p-3 bg-[var(--muted)]/50 rounded-lg border border-[var(--border)]/30">
                  <div className="text-sm font-medium mb-2 text-[var(--foreground)]">Quick Preview</div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <div>
                      <div className="text-[var(--muted-foreground)]">Supplier Price</div>
                      <div className="font-medium text-[var(--foreground)]">
                        {getCurrencySymbol(formData.supplier_currency || 'EUR')}{formData.supplier_price.toFixed(2)} {formData.supplier_currency}
                      </div>
                    </div>
                    <div>
                      <div className="text-[var(--muted-foreground)]">≈ GBP</div>
                      <div className="font-medium text-[var(--foreground)]">
                        £{priceBreakdown.supplierPriceGBP.toFixed(2)}
                      </div>
                    </div>
                    {formData.currency && formData.currency !== 'GBP' && (
                      <div>
                        <div className="text-[var(--muted-foreground)]">≈ {formData.currency}</div>
                        <div className="font-medium text-[var(--foreground)]">
                          {getCurrencySymbol(formData.currency)}{(priceBreakdown.supplierPriceGBP * (priceBreakdown.finalPriceDisplay / priceBreakdown.finalPriceGBP)).toFixed(2)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 2: Taxes & Fees */}
          <Card className="border-[var(--border)] bg-[var(--card)]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-[var(--card-foreground)] text-base">
                <Calculator className="w-4 h-4 text-[var(--primary)]" />
                Step 2: Taxes & Additional Fees
              </CardTitle>
              <CardDescription className="text-[var(--muted-foreground)] text-sm">Add any taxes, resort fees, or city taxes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="vat_percent" className="text-sm font-medium text-[var(--foreground)]">VAT %</Label>
                  <Input
                    id="vat_percent"
                    type="number"
                    step="0.01"
                    value={formData.vat_percent || ''}
                    onChange={(e) => updateField('vat_percent', e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="0.00"
                    className="border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="resort_fee" className="text-sm font-medium text-[var(--foreground)]">Resort Fee</Label>
                  <Input
                    id="resort_fee"
                    type="number"
                    step="0.01"
                    value={formData.resort_fee || ''}
                    onChange={(e) => updateField('resort_fee', e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="0.00"
                    className="border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="resort_fee_type" className="text-sm font-medium text-[var(--foreground)]">Resort Fee Type</Label>
                  <Select
                    value={formData.resort_fee_type}
                    onValueChange={(value: 'per_night' | 'per_stay') => updateField('resort_fee_type', value)}
                  >
                    <SelectTrigger className="border-[var(--border)] bg-[var(--background)]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="per_night">Per Night</SelectItem>
                      <SelectItem value="per_stay">Per Stay</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="city_tax_per_person_per_night" className="text-sm font-medium text-[var(--foreground)]">City Tax (per person/night)</Label>
                  <Input
                    id="city_tax_per_person_per_night"
                    type="number"
                    step="0.01"
                    value={formData.city_tax_per_person_per_night || ''}
                    onChange={(e) => updateField('city_tax_per_person_per_night', e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="0.00"
                    className="border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 3: Markup & Display */}
          <Card className="border-[var(--border)] bg-[var(--card)]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-[var(--card-foreground)] text-base">
                <TrendingUp className="w-4 h-4 text-[var(--primary)]" />
                Step 3: Markup & Display Settings
              </CardTitle>
              <CardDescription className="text-[var(--muted-foreground)] text-sm">Set your profit margin and display currency</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="markup_percent" className="text-sm font-medium text-[var(--foreground)]">Markup %</Label>
                  <Input
                    id="markup_percent"
                    type="number"
                    step="0.01"
                    value={formData.markup_percent}
                    onChange={(e) => updateField('markup_percent', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="currency" className="text-sm font-medium text-[var(--foreground)]">Display Currency</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => updateField('currency', value)}
                  >
                    <SelectTrigger className="border-[var(--border)] bg-[var(--background)]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map(currency => (
                        <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Final Price Breakdown */}
          {formData.supplier_price > 0 && (
            <Card className="border-[var(--border)] bg-[var(--muted)]/30">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-[var(--card-foreground)] text-lg">
                  <DollarSign className="w-5 h-5 text-[var(--primary)]" />
                  Final Price Summary
                  {isConvertingCurrency && (
                    <div className="text-sm text-[var(--muted-foreground)]">(Converting rates...)</div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Detailed Breakdown */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-2 border-b border-[var(--border)]/50">
                    <div className="text-sm text-[var(--muted-foreground)]">Supplier Price (GBP)</div>
                    <div className="font-medium text-[var(--foreground)]">£{priceBreakdown.supplierPriceGBP.toFixed(2)}</div>
                  </div>

                  {formData.vat_percent && formData.vat_percent > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-[var(--border)]/50">
                      <div className="text-sm text-[var(--muted-foreground)]">+ VAT ({formData.vat_percent}%)</div>
                      <div className="font-medium text-[var(--primary-600)]">£{priceBreakdown.vatAmount.toFixed(2)}</div>
                    </div>
                  )}

                  {formData.resort_fee && formData.resort_fee > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-[var(--border)]/50">
                      <div className="text-sm text-[var(--muted-foreground)]">+ Resort Fee</div>
                      <div className="font-medium text-[var(--primary-600)]">£{priceBreakdown.resortFeeAmount.toFixed(2)}</div>
                    </div>
                  )}

                  {formData.city_tax_per_person_per_night && formData.city_tax_per_person_per_night > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-[var(--border)]/50">
                      <div className="text-sm text-[var(--muted-foreground)]">+ City Tax ({nights} nights)</div>
                      <div className="font-medium text-[var(--primary-600)]">£{priceBreakdown.cityTaxAmount.toFixed(2)}</div>
                    </div>
                  )}

                  <div className="flex justify-between items-center py-2 border-b border-[var(--border)]/50">
                    <div className="text-sm font-medium text-[var(--foreground)]">Subtotal</div>
                    <div className="font-semibold text-[var(--foreground)]">£{priceBreakdown.subtotalGBP.toFixed(2)}</div>
                  </div>

                  {formData.markup_percent && formData.markup_percent > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-[var(--border)]/50">
                      <div className="text-sm text-[var(--muted-foreground)]">+ Markup ({formData.markup_percent}%)</div>
                      <div className="font-medium text-[var(--secondary-600)]">£{priceBreakdown.markupAmount.toFixed(2)}</div>
                    </div>
                  )}

                  <div className="flex justify-between items-center py-3 bg-[var(--primary)]/10 rounded-lg px-3">
                    <div className="text-lg font-semibold text-[var(--foreground)]">Final Price ({formData.currency})</div>
                    <div className="text-xl font-bold text-[var(--primary)]">
                      {getCurrencySymbol(formData.currency || 'GBP')}{priceBreakdown.finalPriceDisplay.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Per Night Summary */}
                {nights > 0 && (
                  <div className="mt-3 p-3 bg-[var(--muted)]/50 rounded-lg">
                    <div className="text-sm font-medium mb-2 text-[var(--foreground)]">Per Night Summary</div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-[var(--muted-foreground)]">Per Night</div>
                        <div className="font-medium text-[var(--foreground)]">
                          {getCurrencySymbol(formData.currency || 'GBP')}{(priceBreakdown.finalPriceDisplay / nights).toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[var(--muted-foreground)]">Total ({nights} nights)</div>
                        <div className="font-medium text-[var(--foreground)]">
                          {getCurrencySymbol(formData.currency || 'GBP')}{priceBreakdown.finalPriceDisplay.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="availability" className="space-y-4">
          <Card className="border-[var(--border)] bg-[var(--card)]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-[var(--card-foreground)] text-base">
                <Users className="w-4 h-4 text-[var(--primary)]" />
                Room Availability & Quantities
              </CardTitle>
              <CardDescription className="text-[var(--muted-foreground)] text-sm">Manage room quantities and track availability</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Quantity Inputs */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="quantity_total" className="text-sm font-medium text-[var(--foreground)]">Total Quantity *</Label>
                  <Input
                    id="quantity_total"
                    type="number"
                    value={formData.quantity_total}
                    onChange={(e) => updateField('quantity_total', parseInt(e.target.value) || 0)}
                    min="0"
                    className="border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]"
                  />
                  <p className="text-xs text-[var(--muted-foreground)]">Total rooms available for this type</p>
                </div>
              </div>

              {/* Availability Summary */}
              <div className="p-4 bg-[var(--muted)]/50 rounded-lg border border-[var(--border)]/30">
                <div className="text-sm font-medium mb-3 text-[var(--foreground)]">Availability Summary</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-[var(--background)] rounded-lg border border-[var(--border)]/50">
                    <div className="text-2xl font-bold text-[var(--foreground)]">
                      {formData.quantity_total}
                    </div>
                    <div className="text-xs text-[var(--muted-foreground)]">Total Rooms</div>
                  </div>
                  
                  <div className="text-center p-3 bg-[var(--primary)]/10 rounded-lg border border-[var(--primary)]/20">
                    <div className="text-2xl font-bold text-[var(--primary)]">
                      {formData.quantity_total}
                    </div>
                    <div className="text-xs text-[var(--muted-foreground)]">Available for Booking</div>
                  </div>
                </div>

                {/* Info Box */}
                <div className="mt-4 p-3 bg-[var(--accent)]/50 rounded-lg border border-[var(--border)]/30">
                  <div className="text-xs text-[var(--muted-foreground)]">
                    <strong>How it works:</strong> Set the total quantity of rooms available. Reserved and provisional bookings 
                    are tracked automatically from the bookings table and will reduce availability in real-time.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contract" className="space-y-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-card-foreground">
                <FileText className="w-5 h-5 text-primary" />
                Contract & Supplier Details
              </CardTitle>
              <CardDescription className="text-muted-foreground">Contract terms and supplier information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="supplier" className="text-sm font-medium text-foreground">Supplier</Label>
                  <Input
                    id="supplier"
                    value={formData.supplier || ''}
                    onChange={(e) => updateField('supplier', e.target.value || undefined)}
                    placeholder="Supplier name"
                    className="border-border bg-background text-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supplier_ref" className="text-sm font-medium text-foreground">Supplier Reference</Label>
                  <Input
                    id="supplier_ref"
                    value={formData.supplier_ref || ''}
                    onChange={(e) => updateField('supplier_ref', e.target.value || undefined)}
                    placeholder="Reference number"
                    className="border-border bg-background text-foreground"
                  />
                </div>
              </div>

              <Separator className="bg-border" />

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="contracted"
                  checked={formData.contracted}
                  onCheckedChange={(checked) => updateField('contracted', !!checked)}
                />
                <Label htmlFor="contracted" className="text-sm font-medium text-foreground">Contracted</Label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Attrition Deadline</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal border-border bg-background",
                          !formData.attrition_deadline && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {formData.attrition_deadline ? format(new Date(formData.attrition_deadline), 'PPP') : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        key={`attrition-${formData.attrition_deadline}-${calendarKey}`}
                        mode="single"
                        selected={formData.attrition_deadline ? new Date(formData.attrition_deadline) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            updateField('attrition_deadline', format(date, 'yyyy-MM-dd'));
                          }
                        }}
                        initialFocus
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-muted-foreground">Date by which room quantity can be reduced without penalty</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="release_allowed_percent" className="text-sm font-medium text-foreground">Release Allowed %</Label>
                  <Input
                    id="release_allowed_percent"
                    type="number"
                    step="0.01"
                    value={formData.release_allowed_percent || ''}
                    onChange={(e) => updateField('release_allowed_percent', e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="0.00"
                    className="border-border bg-background text-foreground"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="penalty_terms" className="text-sm font-medium text-foreground">Penalty Terms</Label>
                <Textarea
                  id="penalty_terms"
                  value={formData.penalty_terms || ''}
                  onChange={(e) => updateField('penalty_terms', e.target.value || undefined)}
                  placeholder="Describe penalty terms..."
                  rows={3}
                  className="border-border bg-background text-foreground"
                />
              </div>

              <Separator className="bg-border" />

              {/* Contract File Upload */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Contract PDF</Label>
                  <div className="space-y-3">
                    {formData.contract_file_path ? (
                      <div className="p-4 bg-[var(--muted)]/50 rounded-lg border border-[var(--border)]/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-[var(--primary)]" />
                            <div>
                              <div className="font-medium text-[var(--foreground)]">Contract uploaded</div>
                              <div className="text-sm text-[var(--muted-foreground)]">
                                {formData.contract_file_path.split('/').pop()}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(formData.contract_file_path, '_blank')}
                              className="border-[var(--border)] hover:bg-[var(--muted)]"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleFileDelete}
                              className="border-[var(--destructive)] hover:bg-[var(--destructive)]/10 text-[var(--destructive)]"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div 
                        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                          isDragOver 
                            ? 'border-[var(--primary)] bg-[var(--primary)]/5' 
                            : 'border-[var(--border)]'
                        }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                      >
                        <Upload className="w-8 h-8 text-[var(--muted-foreground)] mx-auto mb-3" />
                        <div className="text-sm font-medium text-[var(--foreground)] mb-1">Upload Contract PDF</div>
                        <div className="text-xs text-[var(--muted-foreground)] mb-4">
                          {isDragOver ? 'Drop your PDF here' : 'Drag and drop your contract PDF here, or click to browse'}
                        </div>
                        <input
                          type="file"
                          id="contract-upload"
                          accept=".pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFileUpload(file);
                            }
                          }}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('contract-upload')?.click()}
                          disabled={isUploadingPDF}
                          className="border-[var(--border)] hover:bg-[var(--muted)]"
                        >
                          {isUploadingPDF ? (
                            <>
                              <div className="w-4 h-4 mr-2 border-2 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              Choose File
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Upload the signed contract PDF for this room booking
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2 pt-4 border-t border-border">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onClose}
          className="border-border hover:bg-muted"
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {isLoading ? 'Saving...' : room ? 'Update Room' : 'Create Room'}
        </Button>
      </div>
    </form>
  );
} 