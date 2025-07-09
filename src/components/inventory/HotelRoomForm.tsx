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
import { FormField } from '@/components/ui/form';

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

const CURRENCIES = ['EUR', 'GBP', 'USD', 'CAD', 'AUD', 'BHD', 'AED', 'SAR', 'QAR', 'SGD'];

export function HotelRoomForm({ hotelId, room, onClose, onSuccess }: HotelRoomFormProps) {
  const [formData, setFormData] = useState<HotelRoomInsert & { contract_file_path?: string }>({
    hotel_id: hotelId,
    room_type_id: room?.room_type_id || '',
    event_id: room?.event_id ?? null,
    check_in: room?.check_in ? new Date(room.check_in).toISOString().split('T')[0] : '',
    check_out: room?.check_out ? new Date(room.check_out).toISOString().split('T')[0] : '',
    quantity_total: room?.quantity_total ?? 0,
    quantity_reserved: room?.quantity_reserved ?? 0,
    supplier_price_per_night: room?.supplier_price_per_night ?? 0,
    supplier_currency: room?.supplier_currency ?? 'EUR',
    markup_percent: room?.markup_percent ?? 60,
    vat_percentage: room?.vat_percentage ?? 0,
    resort_fee: room?.resort_fee ?? 0,
    resort_fee_type: room?.resort_fee_type ?? 'per_night',
    city_tax: room?.city_tax ?? 0,
    city_tax_type: room?.city_tax_type ?? 'per_person_per_night',
    breakfast_included: room?.breakfast_included ?? true,
    extra_night_markup_percent: room?.extra_night_markup_percent ?? 28,
    contracted: room?.contracted ?? false,
    attrition_deadline: room?.attrition_deadline ?? '',
    release_allowed_percent: room?.release_allowed_percent ?? 0,
    penalty_terms: room?.penalty_terms ?? '',
    supplier: room?.supplier ?? '',
    supplier_ref: room?.supplier_ref ?? '',
    contract_file_path: (room as any)?.contract_file_path ?? '',
    active: room?.active ?? true,
    max_people: room?.max_people ?? 1,
    breakfast_price_per_person_per_night: room?.breakfast_price_per_person_per_night ?? 0,
    is_provisional: Boolean(room?.is_provisional),
    bed_type: room?.bed_type || 'Double Room',
    commission_percent: room?.commission_percent ?? 0,
    flexibility: room?.flexibility ?? 'Flex',
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
    commissionAmount: 0,
    finalPriceGBP: 0,
    finalPriceDisplay: 0
  });
  const [supplierPriceGbp, setSupplierPriceGbp] = useState(0);

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

  // Auto-set quantity_total to 0 when is_provisional is true
  useEffect(() => {
    if (formData.is_provisional && formData.quantity_total !== 0) {
      updateField('quantity_total', 0);
    }
  }, [formData.is_provisional]);

  useEffect(() => {
    const convert = async () => {
      const price = formData.supplier_price_per_night ?? 0;
      const currency = formData.supplier_currency ?? 'EUR';
      if (currency === 'GBP') {
        setSupplierPriceGbp(price);
      } else {
        const gbp = await convertCurrency(price, currency, 'GBP');
        setSupplierPriceGbp(gbp);
      }
    };
    convert();
  }, [formData.supplier_price_per_night, formData.supplier_currency]);

  // Calculate pricing breakdown
  const calculatePricing = async () => {
    if (!formData.supplier_price_per_night || formData.supplier_price_per_night <= 0) {
      setPriceBreakdown({
        supplierPrice: 0,
        supplierPriceGBP: 0,
        vatAmount: 0,
        resortFeeAmount: 0,
        cityTaxAmount: 0,
        subtotalGBP: 0,
        markupAmount: 0,
        commissionAmount: 0,
        finalPriceGBP: 0,
        finalPriceDisplay: 0
      });
      return;
    }

    setIsConvertingCurrency(true);
    try {
      // Calculate taxes and fees
      const vatAmount = formData.vat_percentage ? (supplierPriceGbp * formData.vat_percentage / 100) : 0;
      
      const resortFeeAmount = formData.resort_fee ? 
        (formData.resort_fee_type === 'per_night' ? formData.resort_fee * nights : formData.resort_fee) : 0;
      
      const cityTaxAmount = formData.city_tax ? 
        formData.city_tax * nights : 0;

      // Calculate subtotal in GBP
      const subtotalGBP = supplierPriceGbp + vatAmount + resortFeeAmount + cityTaxAmount;

      // Apply markup
      const markupAmount = formData.markup_percent ? (subtotalGBP * formData.markup_percent / 100) : 0;
      // Apply commission
      const commissionAmount = formData.commission_percent ? (subtotalGBP * formData.commission_percent / 100) : 0;
      const finalPriceGBP = subtotalGBP + markupAmount + commissionAmount;

      // Convert to display currency if different from GBP
      let finalPriceDisplay = finalPriceGBP;
      if (formData.supplier_currency && formData.supplier_currency !== 'GBP') {
        finalPriceDisplay = await convertCurrency(finalPriceGBP, 'GBP', formData.supplier_currency);
      }

      setPriceBreakdown({
        supplierPrice: formData.supplier_price_per_night,
        supplierPriceGBP: supplierPriceGbp,
        vatAmount,
        resortFeeAmount,
        cityTaxAmount,
        subtotalGBP,
        markupAmount,
        commissionAmount,
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
    formData.supplier_price_per_night,
    formData.supplier_currency,
    formData.vat_percentage,
    formData.resort_fee,
    formData.resort_fee_type,
    formData.city_tax,
    formData.markup_percent,
    formData.commission_percent,
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

  function calculatePriceFields(formData: any, supplierPriceGbp: number, nights: number, exchangeRate: number = 1) {
    const maxPeople = formData.max_people ?? 1;
    const supplierPrice = Number(formData.supplier_price_per_night) || 0;
    const vat = Number(formData.vat_percentage) || 0;
    const cityTax = Number(formData.city_tax) || 0;
    const resortFee = Number(formData.resort_fee) || 0;
    const breakfast = Number(formData.breakfast_price_per_person_per_night) || 0;

    const total_supplier_price_per_night =
      supplierPrice
      + (supplierPrice * vat / 100)
      + (cityTax * maxPeople)
      + resortFee
      + (breakfast * maxPeople);

    const total_price_per_night_gbp = total_supplier_price_per_night * exchangeRate;
    const total_price_per_stay_gbp = total_price_per_night_gbp * nights;

    return {
      total_supplier_price_per_night,
      total_price_per_night_gbp,
      total_price_per_stay_gbp,
    };
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Calculate nights first
    const nights = formData.check_in && formData.check_out ? Math.max(1, Math.ceil((new Date(formData.check_out).getTime() - new Date(formData.check_in).getTime()) / (1000 * 60 * 60 * 24))) : 1;

    if (!formData.room_type_id || !formData.event_id || !formData.check_in || !formData.check_out || (!formData.is_provisional && !formData.quantity_total) || !formData.supplier_price_per_night) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (nights <= 0) {
      toast.error('Check-out date must be after check-in date');
      return;
    }

    // Use supplierPriceGbp / supplier_price_per_night as exchange rate if not GBP
    const exchangeRate = (formData.supplier_currency === 'GBP' || !formData.supplier_price_per_night)
      ? 1
      : (supplierPriceGbp / formData.supplier_price_per_night);
    const priceFields = calculatePriceFields(formData, supplierPriceGbp, nights, exchangeRate);
    const submissionData = {
      ...formData,
      attrition_deadline: formData.attrition_deadline === '' ? null : formData.attrition_deadline,
      ...priceFields,
    };

    if (room) {
      updateMutation.mutate({ id: room.id, data: submissionData });
    } else {
      createMutation.mutate(submissionData);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  // Get room types from parent hotel
  const hotelRoomTypes = parentHotel?.room_types || [];

  // Add a useRef to track if max_people was manually changed
  const maxPeopleManuallyChanged = React.useRef(false);

  // When user changes max_people, set the flag
  const handleMaxPeopleChange = (value: number) => {
    maxPeopleManuallyChanged.current = true;
    updateField('max_people', value);
  };

  // Auto-set max_people based on bed_type, unless user has changed it
  useEffect(() => {
    if (!maxPeopleManuallyChanged.current) {
      if (formData.bed_type === 'Double Room' || formData.bed_type === 'Twin Room') {
        updateField('max_people', 2);
      } else if (formData.bed_type === 'Triple Room') {
        updateField('max_people', 3);
      }
    }
  }, [formData.bed_type]);

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
              <div className="space-y-2 mb-6">
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
                  <Label htmlFor="bed_type" className="text-sm font-medium text-foreground">Bed Type *</Label>
                  <Select
                    value={formData.bed_type}
                    onValueChange={value => updateField('bed_type', value)}
                  >
                    <SelectTrigger className="border-border bg-background">
                      <SelectValue placeholder="Select bed type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Double Room">Double Room</SelectItem>
                      <SelectItem value="Twin Room">Twin Room</SelectItem>
                      <SelectItem value="Triple Room">Triple Room</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="flexibility" className="text-sm font-medium text-foreground">Flexibility</Label>
                  <Select
                    value={formData.flexibility ?? 'Flex'}
                    onValueChange={value => updateField('flexibility' as keyof HotelRoomInsert, value)}
                  >
                    <SelectTrigger className="border-border bg-background">
                      <SelectValue placeholder="Select flexibility" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Flex">Flex</SelectItem>
                      <SelectItem value="Non Flex">Non Flex</SelectItem>
                    </SelectContent>
                  </Select>
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

              <div className="space-y-2">
                <Label htmlFor="max_people" className="text-sm font-medium text-foreground">Max People</Label>
                <Input
                  id="max_people"
                  type="number"
                  min={1}
                  value={formData.max_people ?? 1}
                  onChange={e => handleMaxPeopleChange(parseInt(e.target.value) || 1)}
                  placeholder="Max people in room"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-card-foreground">
                <DollarSign className="w-5 h-5 text-primary" />
                Pricing
              </CardTitle>
              <CardDescription className="text-muted-foreground">Configure pricing and taxes for this room</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supplier_price_per_night" className="text-sm font-medium text-foreground">Supplier Price Per Night *</Label>
                  <Input
                    id="supplier_price_per_night"
                    type="number"
                    step="0.01"
                    value={formData.supplier_price_per_night ?? 0}
                    onChange={e => updateField('supplier_price_per_night', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplier_currency" className="text-sm font-medium text-foreground">Supplier Currency</Label>
                  <Select
                    value={formData.supplier_currency ?? ''}
                    onValueChange={value => updateField('supplier_currency', value)}
                  >
                    <SelectTrigger className="border-border bg-background">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map(currency => (
                        <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vat_percentage" className="text-sm font-medium text-foreground">VAT %</Label>
                  <Input
                    id="vat_percentage"
                    type="number"
                    step="0.01"
                    value={formData.vat_percentage ?? 0}
                    onChange={e => updateField('vat_percentage', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resort_fee" className="text-sm font-medium text-foreground">Resort Fee</Label>
                  <Input
                    id="resort_fee"
                    type="number"
                    step="0.01"
                    value={formData.resort_fee ?? 0}
                    onChange={e => updateField('resort_fee', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resort_fee_type" className="text-sm font-medium text-foreground">Resort Fee Type</Label>
                  <Select
                    value={formData.resort_fee_type ?? 'per_night'}
                    onValueChange={value => updateField('resort_fee_type', value)}
                  >
                    <SelectTrigger className="border-border bg-background">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="per_night">Per Night</SelectItem>
                      <SelectItem value="per_stay">Per Stay</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city_tax" className="text-sm font-medium text-foreground">City Tax</Label>
                  <Input
                    id="city_tax"
                    type="number"
                    step="0.01"
                    value={formData.city_tax ?? 0}
                    onChange={e => updateField('city_tax', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city_tax_type" className="text-sm font-medium text-foreground">City Tax Type</Label>
                  <Select
                    value={formData.city_tax_type ?? 'per_person_per_night'}
                    onValueChange={value => updateField('city_tax_type', value)}
                  >
                    <SelectTrigger className="border-border bg-background">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="per_person_per_night">Per Person Per Night</SelectItem>
                      <SelectItem value="per_stay">Per Stay</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 flex items-center gap-2">
                  <Checkbox
                    id="breakfast_included"
                    checked={!!formData.breakfast_included}
                    onCheckedChange={checked => updateField('breakfast_included', !!checked)}
                  />
                  <Label htmlFor="breakfast_included" className="text-sm font-medium text-foreground">Breakfast Included</Label>
                </div>
                {!formData.breakfast_included && (
                  <div className="space-y-2">
                    <Label htmlFor="breakfast_price_per_person_per_night" className="text-sm font-medium text-foreground">Breakfast Price Per Person Per Night</Label>
                    <Input
                      id="breakfast_price_per_person_per_night"
                      type="number"
                      min={0}
                      step={0.01}
                      value={formData.breakfast_price_per_person_per_night ?? 0}
                      onChange={e => updateField('breakfast_price_per_person_per_night', parseFloat(e.target.value) || 0)}
                      placeholder="e.g. 10"
                    />
                  </div>
                )}
                {/* Move markup fields to the end for better flow */}
                <div className="space-y-2">
                  <Label htmlFor="markup_percent" className="text-sm font-medium text-foreground">Markup %</Label>
                  <Input
                    id="markup_percent"
                    type="number"
                    step="0.01"
                    value={formData.markup_percent ?? 0}
                    onChange={e => updateField('markup_percent', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="extra_night_markup_percent" className="text-sm font-medium text-foreground">Extra Night Markup %</Label>
                  <Input
                    id="extra_night_markup_percent"
                    type="number"
                    step="0.01"
                    value={formData.extra_night_markup_percent ?? 0}
                    onChange={e => updateField('extra_night_markup_percent', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="commission_percent" className="text-sm font-medium text-foreground">Commission %</Label>
                  <Input
                    id="commission_percent"
                    type="number"
                    step="0.01"
                    value={formData.commission_percent ?? 0}
                    onChange={e => updateField('commission_percent', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Hotel Room Price Summary (read-only, generated columns) */}
          <Card className="border-border bg-muted/30 mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-card-foreground">
                <DollarSign className="w-5 h-5 text-primary" />
                Hotel Room Price Summary
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                These values are calculated live and include all taxes and fees.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(() => {
                const nights = formData.check_in && formData.check_out ? Math.max(1, Math.ceil((new Date(formData.check_out).getTime() - new Date(formData.check_in).getTime()) / (1000 * 60 * 60 * 24))) : 1;
                const maxPeople = formData.max_people ?? 1;
                const cityTax = formData.city_tax ?? 0;
                const cityTaxType = formData.city_tax_type ?? 'per_person_per_night';
                const resortFee = formData.resort_fee ?? 0;
                const resortFeeType = formData.resort_fee_type ?? 'per_night';
                const breakfastIncluded = !!formData.breakfast_included;
                const breakfastPerPersonPerNight = !breakfastIncluded ? (formData.breakfast_price_per_person_per_night ?? 0) : 0;
                const vat = formData.vat_percentage ?? 0;
                const markup = formData.markup_percent ?? 0;
                const commission = formData.commission_percent ?? 0;
                const supplierCurrency = formData.supplier_currency ?? 'EUR';
                const supplierSymbol = getCurrencySymbol(supplierCurrency);
                // Room price (raw)
                const roomPriceSupplier = (formData.supplier_price_per_night ?? 0) * nights;
                const roomPriceGbp = supplierPriceGbp * nights;
                // VAT (supplier)
                const vatAmountSupplier = roomPriceSupplier * (vat / 100);
                const vatAmountGbp = roomPriceGbp * (vat / 100);
                // City tax
                let cityTaxTotalSupplier = 0;
                let cityTaxTotalGbp = 0;
                if (cityTaxType === 'per_person_per_night') {
                  cityTaxTotalSupplier = cityTax * maxPeople * nights;
                  cityTaxTotalGbp = cityTaxTotalSupplier * (supplierCurrency === 'GBP' ? 1 : supplierPriceGbp / (formData.supplier_price_per_night || 1));
                } else if (cityTaxType === 'per_stay') {
                  cityTaxTotalSupplier = cityTax;
                  cityTaxTotalGbp = cityTaxTotalSupplier * (supplierCurrency === 'GBP' ? 1 : supplierPriceGbp / (formData.supplier_price_per_night || 1));
                }
                // Resort fee
                let resortFeeTotalSupplier = 0;
                let resortFeeTotalGbp = 0;
                if (resortFeeType === 'per_night') {
                  resortFeeTotalSupplier = resortFee * nights;
                  resortFeeTotalGbp = resortFeeTotalSupplier * (supplierCurrency === 'GBP' ? 1 : supplierPriceGbp / (formData.supplier_price_per_night || 1));
                } else if (resortFeeType === 'per_stay') {
                  resortFeeTotalSupplier = resortFee;
                  resortFeeTotalGbp = resortFeeTotalSupplier * (supplierCurrency === 'GBP' ? 1 : supplierPriceGbp / (formData.supplier_price_per_night || 1));
                }
                // Breakfast
                const breakfastTotalSupplier = breakfastPerPersonPerNight * maxPeople * nights;
                const breakfastTotalGbp = breakfastTotalSupplier * (supplierCurrency === 'GBP' ? 1 : supplierPriceGbp / (formData.supplier_price_per_night || 1));
                // Subtotal (your total cost)
                const subtotalSupplier = roomPriceSupplier + vatAmountSupplier + cityTaxTotalSupplier + resortFeeTotalSupplier + breakfastTotalSupplier;
                const subtotalGbp = roomPriceGbp + vatAmountGbp + cityTaxTotalGbp + resortFeeTotalGbp + breakfastTotalGbp;
                // Markup
                const markupAmountSupplier = subtotalSupplier * (markup / 100);
                const markupAmountGbp = subtotalGbp * (markup / 100);
                // Commission
                const commissionAmountSupplier = subtotalSupplier * (commission / 100);
                const commissionAmountGbp = subtotalGbp * (commission / 100);
                // Total (what you charge the customer)
                const totalSupplier = subtotalSupplier + markupAmountSupplier + commissionAmountSupplier;
                const totalGbp = subtotalGbp + markupAmountGbp + commissionAmountGbp;
                // Per night breakdown
                const perNight = nights > 0 ? {
                  room: { supplier: (formData.supplier_price_per_night ?? 0), gbp: supplierPriceGbp },
                  vat: { supplier: vatAmountSupplier / nights, gbp: vatAmountGbp / nights },
                  cityTax: { supplier: cityTaxTotalSupplier / nights, gbp: cityTaxTotalGbp / nights },
                  resortFee: { supplier: resortFeeTotalSupplier / nights, gbp: resortFeeTotalGbp / nights },
                  breakfast: { supplier: breakfastTotalSupplier / nights, gbp: breakfastTotalGbp / nights },
                  subtotal: { supplier: subtotalSupplier / nights, gbp: subtotalGbp / nights },
                  markup: { supplier: markupAmountSupplier / nights, gbp: markupAmountGbp / nights },
                  commission: { supplier: commissionAmountSupplier / nights, gbp: commissionAmountGbp / nights },
                  total: { supplier: totalSupplier / nights, gbp: totalGbp / nights },
                } : null;
                const showBoth = supplierCurrency !== 'GBP';
                return (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between"><span>Room Price:</span>
                        <span className="font-semibold">
                          {showBoth ? `${supplierSymbol}${roomPriceSupplier.toFixed(2)} | ` : ''}£{roomPriceGbp.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between"><span>VAT (supplier):</span>
                        <span className="font-semibold">
                          {showBoth ? `${supplierSymbol}${vatAmountSupplier.toFixed(2)} | ` : ''}£{vatAmountGbp.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between"><span>City Tax:</span>
                        <span className="font-semibold">
                          {showBoth ? `${supplierSymbol}${cityTaxTotalSupplier.toFixed(2)} | ` : ''}£{cityTaxTotalGbp.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between"><span>Resort Fee:</span>
                        <span className="font-semibold">
                          {showBoth ? `${supplierSymbol}${resortFeeTotalSupplier.toFixed(2)} | ` : ''}£{resortFeeTotalGbp.toFixed(2)}
                        </span>
                      </div>
                      {!breakfastIncluded && breakfastPerPersonPerNight > 0 && (
                        <div className="flex justify-between items-center">
                          <span>Breakfast ({maxPeople} guests × {supplierSymbol}{breakfastPerPersonPerNight} × {nights} nights):</span>
                          <span className="font-semibold">
                            {showBoth ? `${supplierSymbol}${breakfastTotalSupplier.toFixed(2)} | ` : ''}£{breakfastTotalGbp.toFixed(2)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between border-t pt-2 mt-2 font-bold">
                        <span>Subtotal (our total cost):</span>
                        <span>
                          {showBoth ? `${supplierSymbol}${subtotalSupplier.toFixed(2)} | ` : ''}£{subtotalGbp.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between"><span>Markup ({markup}%):</span>
                        <span className="font-semibold">
                          {showBoth ? `${supplierSymbol}${markupAmountSupplier.toFixed(2)} | ` : ''}£{markupAmountGbp.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between"><span>Commission ({commission}%):</span>
                        <span className="font-semibold">
                          {showBoth ? `${supplierSymbol}${commissionAmountSupplier.toFixed(2)} | ` : ''}£{commissionAmountGbp.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between border-t pt-2 mt-2 font-bold text-lg">
                        <span>Total (what we charge the customer):</span>
                        <span>
                          {showBoth ? `${supplierSymbol}${totalSupplier.toFixed(2)} | ` : ''}£{totalGbp.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    {perNight && (
                      <div className="mt-6 p-4 rounded-lg bg-gradient-to-br from-muted/30 to-muted/50 border border-border/50">
                        <div className="flex items-center gap-2 mb-3">
                          <Calendar className="w-4 h-4 text-primary" />
                          <div className="font-semibold text-sm">Per Night Breakdown</div>
                        </div>
                        
                        {/* Base Costs */}
                        <div className="space-y-1.5 mb-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Room Rate</span>
                            <span className="font-medium">{showBoth ? `${supplierSymbol}${perNight.room.supplier.toFixed(2)} | ` : ''}£{perNight.room.gbp.toFixed(2)}</span>
                          </div>
                          
                          {/* Taxes & Fees */}
                          {perNight.vat.supplier > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">VAT ({vat}%)</span>
                              <span className="font-medium">{showBoth ? `${supplierSymbol}${perNight.vat.supplier.toFixed(2)} | ` : ''}£{perNight.vat.gbp.toFixed(2)}</span>
                            </div>
                          )}
                          
                          {perNight.cityTax.supplier > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">City Tax</span>
                              <span className="font-medium">{showBoth ? `${supplierSymbol}${perNight.cityTax.supplier.toFixed(2)} | ` : ''}£{perNight.cityTax.gbp.toFixed(2)}</span>
                            </div>
                          )}
                          
                          {perNight.resortFee.supplier > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Resort Fee</span>
                              <span className="font-medium">{showBoth ? `${supplierSymbol}${perNight.resortFee.supplier.toFixed(2)} | ` : ''}£{perNight.resortFee.gbp.toFixed(2)}</span>
                            </div>
                          )}
                          
                          {!breakfastIncluded && breakfastPerPersonPerNight > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Breakfast ({maxPeople}×{supplierSymbol}{breakfastPerPersonPerNight})</span>
                              <span className="font-medium">{showBoth ? `${supplierSymbol}${perNight.breakfast.supplier.toFixed(2)} | ` : ''}£{perNight.breakfast.gbp.toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Subtotal */}
                        <div className="flex justify-between py-2 border-t border-border/30 font-semibold text-sm">
                          <span>Subtotal (Our Cost)</span>
                          <span>{showBoth ? `${supplierSymbol}${perNight.subtotal.supplier.toFixed(2)} | ` : ''}£{perNight.subtotal.gbp.toFixed(2)}</span>
                        </div>
                        
                        {/* Markup */}
                        {markup > 0 && (
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-muted-foreground">Markup ({markup}%)</span>
                            <span className="font-medium">{showBoth ? `${supplierSymbol}${perNight.markup.supplier.toFixed(2)} | ` : ''}£{perNight.markup.gbp.toFixed(2)}</span>
                          </div>
                        )}
                        
                        {/* Commission */}
                        {commission > 0 && (
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-muted-foreground">Commission ({commission}%)</span>
                            <span className="font-medium">{showBoth ? `${supplierSymbol}${perNight.commission.supplier.toFixed(2)} | ` : ''}£{perNight.commission.gbp.toFixed(2)}</span>
                          </div>
                        )}
                        
                        {/* Total */}
                        <div className="flex justify-between py-2 border-t border-primary/20 bg-primary/5 rounded px-2 font-bold text-base">
                          <span>Total per Night</span>
                          <span className="text-primary">{showBoth ? `${supplierSymbol}${perNight.total.supplier.toFixed(2)} | ` : ''}£{perNight.total.gbp.toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </CardContent>
          </Card>
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
              {/* Provisional Checkbox */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_provisional"
                    checked={formData.is_provisional}
                    onCheckedChange={(checked) => updateField('is_provisional', !!checked)}
                  />
                  <Label htmlFor="is_provisional" className="text-sm font-medium text-[var(--foreground)]">Provisional Room</Label>
                </div>
                <p className="text-xs text-[var(--muted-foreground)] ml-6">
                  If checked, this room is provisional and quantity will always be 0 (purchased to order).
                </p>
              </div>

              {/* Quantity Inputs */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="quantity_total" className="text-sm font-medium text-[var(--foreground)]">Total Quantity *</Label>
                  <Input
                    id="quantity_total"
                    type="number"
                    value={formData.is_provisional ? 0 : formData.quantity_total}
                    onChange={(e) => updateField('quantity_total', parseInt(e.target.value) || 0)}
                    min="0"
                    disabled={formData.is_provisional}
                    className="border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]"
                  />
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {formData.is_provisional 
                      ? 'Provisional rooms always have quantity 0.' 
                      : 'Total rooms available for this type'
                    }
                  </p>
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
                      {formData.is_provisional ? 'PTO' : formData.quantity_total}
                    </div>
                    <div className="text-xs text-[var(--muted-foreground)]">
                      {formData.is_provisional ? 'Purchased to order' : 'Available for Booking'}
                    </div>
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
                    value={formData.supplier ?? ''}
                    onChange={(e) => updateField('supplier', e.target.value || undefined)}
                    placeholder="Supplier name"
                    className="border-border bg-background text-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supplier_ref" className="text-sm font-medium text-foreground">Supplier Reference</Label>
                  <Input
                    id="supplier_ref"
                    value={formData.supplier_ref ?? ''}
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
                  checked={!!formData.contracted}
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
                  value={formData.penalty_terms ?? ''}
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