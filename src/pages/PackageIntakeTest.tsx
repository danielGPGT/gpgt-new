import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  Sparkles, 
  Lightbulb,
  Clock,
  Target,
  TrendingUp,
  Users,
  MapPin,
  Calendar,
  DollarSign,
  Star,
  CheckCircle,
  AlertCircle,
  Info,
  Zap,
  Award,
  BookOpen,
  Heart,
  Shield,
  Globe,
  Plane,
  Hotel,
  Camera,
  Utensils,
  Activity,
  FileText,
  BarChart3,
  Settings,
  HelpCircle,
  Eye,
  Car,
  Ticket,
  PlaneTakeoff,
  PlaneLanding,
  BaggageClaim,
  CreditCard
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useAuth } from '@/lib/AuthProvider';
import { toast } from 'sonner';
import { useForm, FormProvider, useFormContext } from 'react-hook-form';
import { supabase } from '@/lib/supabase';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { StepClientSelection } from '@/components/forms/steps/StepClientSelection';
import { StepTravelerCount } from '@/components/forms/steps/StepTravelerCount';
import { StepEventSelection } from '@/components/forms/steps/StepEventSelection';
import { StepPackageAndTierSelection } from '@/components/forms/steps/StepPackageAndTierSelection';
import { StepComponents } from '@/components/forms/steps/StepComponents';
import { StepFlights, FlightSource, SelectedFlight } from '@/components/forms/steps/StepFlights';
import { QuoteService } from '@/lib/quoteService';
import { CurrencyService } from '@/lib/currencyService';
import { FlightApiService } from '@/lib/flightApiService';
import { hasTeamFeature } from '@/lib/teamUtils';
import { ConsultantDetailsCard } from '@/components/ConsultantDetailsCard';

// Package Intake Schema
const packageIntakeSchema = z.object({
  client: z.object({
    id: z.string().optional(),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Valid email is required'),
    phone: z.string().optional(),
    address: z.object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
      country: z.string().optional(),
    }).optional(),
  }),
  isNewClient: z.boolean().default(false),
  travelers: z.object({
    adults: z.number().min(1, 'At least one adult required'),
    children: z.number().min(0).default(0),
    total: z.number().min(1, 'At least one traveler required'),
  }),
  selectedEvent: z.object({
    id: z.string().optional(),
    name: z.string().optional(),
    location: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }).optional(),
  selectedPackage: z.object({
    id: z.string().optional(),
    name: z.string().optional(),
    baseType: z.enum(['Grandstand', 'VIP']).optional(),
  }).optional(),
  selectedTier: z.object({
    id: z.string().optional(),
    name: z.string().optional(),
    description: z.string().optional(),
    priceOverride: z.number().optional(),
  }).optional(),
  components: z.object({
    tickets: z.array(z.object({
      id: z.string(),
      quantity: z.number().min(1),
      price: z.number(),
      category: z.string(),
    })).default([]),
    hotels: z.array(z.object({
      id: z.string().optional(),
      hotelId: z.string().optional(),
      roomId: z.string().optional(),
      quantity: z.number().min(1).optional(),
      price: z.number().optional(),
      roomType: z.string().optional(),
      checkIn: z.string().optional(),
      checkOut: z.string().optional(),
      bed_type: z.string().optional(),
    })).default([]),
    circuitTransfers: z.array(z.object({
      id: z.string(),
      quantity: z.number().min(1),
      price: z.number(),
      transferType: z.string().optional(),
      packageComponentId: z.string().optional(),
    })).default([]),
    airportTransfers: z.array(z.object({
      id: z.string(),
      quantity: z.number().min(1),
      price: z.number(),
      transportType: z.string().optional(),
      transferDirection: z.enum(['outbound', 'return', 'both']).optional().default('outbound'),
      packageComponentId: z.string().optional(),
    })).default([]),
    flights: z.array(z.object({
      id: z.string(),
      source: z.enum(['none', 'database', 'api']),
      origin: z.string(),
      destination: z.string(),
      departureDate: z.string(),
      returnDate: z.string().optional(),
      price: z.number(),
      passengers: z.number(),
      outboundFlightNumber: z.string().optional(),
      outboundDepartureAirportCode: z.string().optional(),
      outboundArrivalAirportCode: z.string().optional(),
      outboundDepartureDatetime: z.string().optional(),
      outboundArrivalDatetime: z.string().optional(),
      inboundFlightNumber: z.string().optional(),
      inboundDepartureAirportCode: z.string().optional(),
      inboundArrivalAirportCode: z.string().optional(),
      inboundDepartureDatetime: z.string().optional(),
      inboundArrivalDatetime: z.string().optional(),
      airline: z.string().optional(),
      cabin: z.string().optional(),
      baggageAllowance: z.string().optional(),
      refundable: z.boolean().optional(),
    })).default([]),
    flightsSource: z.enum(['none', 'database', 'api']).default('none'),
    loungePass: z.object({
      id: z.string().optional(),
      variant: z.string().optional(),
      price: z.number().optional(),
      currency: z.string().optional(),
      quantity: z.number().optional(),
    }).optional(),
  }).default({
    tickets: [],
    hotels: [],
    circuitTransfers: [],
    airportTransfers: [],
    flights: [],
    flightsSource: 'none',
    loungePass: undefined,
  }),
  loungePass: z.object({
    needed: z.boolean().default(false),
    variant: z.enum(['Airport Lounge Pass included (Departure only)', 'Airport Lounge Pass included (Departure & Return)']).optional(),
    price: z.number().optional(),
  }).default({ needed: false }),
  summary: z.object({
    totalPrice: z.number().default(0),
    currency: z.string().default('GBP'),
    convertedPrice: z.number().default(0),
    exchangeRate: z.number().default(1),
    internalNotes: z.string().optional(),
    quoteReference: z.string().optional(),
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
});

type PackageIntake = z.infer<typeof packageIntakeSchema>;

// Step configuration
const stepConfig = [
  { id: 1, title: "Client Selection", icon: Users, color: "var(--color-primary-500)" },
  { id: 2, title: "Traveler Count", icon: Users, color: "var(--color-secondary-600)" },
  { id: 3, title: "Select Event", icon: Calendar, color: "var(--color-primary-600)" },
  { id: 4, title: "Package & Tier", icon: Ticket, color: "var(--color-secondary-700)" },
  { id: 5, title: "Components", icon: Settings, color: "var(--color-primary-700)" },
  { id: 6, title: "Summary", icon: FileText, color: "var(--color-secondary-900)" }
];

// Pro Tips Data
const proTips = [
  {
    step: 1,
    title: "Client Selection",
    tips: [
      "Use existing clients to leverage their travel history and preferences",
      "Create detailed client profiles to improve future proposal accuracy",
      "Check client status (VIP, prospect, active) to prioritize service level"
    ],
    icon: Users
  },
  {
    step: 2,
    title: "Traveler Count",
    tips: [
      "Accurate traveler counts help with room allocation and pricing",
      "Consider age groups for child pricing and activities",
      "Group size affects transfer vehicle requirements"
    ],
    icon: Users
  },
  {
    step: 3,
    title: "Event Selection",
    tips: [
      "Check event dates for availability and pricing",
      "Consider travel time to and from the event venue",
      "Research event-specific requirements and restrictions"
    ],
    icon: Calendar
  },
  {
    step: 4,
    title: "Package Selection",
    tips: [
      "Grandstand packages offer great value for larger groups",
      "VIP packages include premium amenities and services",
      "Consider client preferences and budget when selecting"
    ],
    icon: Ticket
  },
  {
    step: 5,
    title: "Tier Selection",
    tips: [
      "Higher tiers offer better seating and amenities",
      "Compare value across different tier options",
      "Consider group dynamics and preferences"
    ],
    icon: Star
  },
  {
    step: 6,
    title: "Components",
    tips: [
      "Use toggles to include or exclude circuit and airport transfers",
      "All components with the same event ID are interchangeable",
      "Quantities can be adjusted based on group size",
      "Review pricing and availability for each component"
    ],
    icon: Settings
  },
  {
    step: 7,
    title: "Summary",
    tips: [
      "Double-check all pricing and component selections",
      "Ensure client contact details are complete",
      "Review the complete package before submission"
    ],
    icon: FileText
  }
];

// Utility function: round up to nearest 100, then subtract 2
function roundUpHundredMinusTwo(n: number) {
  return Math.ceil(n / 100) * 100 - 2;
}

// --- PRICE SUMMARY CARD COMPONENT ---
  function PriceSummaryCardContent() {
    const { watch, setValue } = useFormContext();
    const components = watch('components') || { tickets: [], hotels: [], circuitTransfers: [], airportTransfers: [], flights: [], loungePass: {}, flightsSource: 'none' };
    const selectedCurrency = watch('summary.currency') || 'GBP';
    const [isConverting, setIsConverting] = useState(false);
    const [convertedTotal, setConvertedTotal] = useState(0);
    const [exchangeRate, setExchangeRate] = useState(1);
    const [hotelRooms, setHotelRooms] = useState<any[]>([]);
    useEffect(() => {
      if (components.hotels && components.hotels.length > 0) {
        const roomIds = components.hotels.map((h: any) => h.roomId);
        supabase
          .from('hotel_rooms')
          .select('*')
          .in('id', roomIds)
          .then(({ data }) => {
            setHotelRooms(data || []);
          });
      }
    }, [components.hotels]);
    const calculateHotelPrice = (hotelSelection: any) => {
      const room = hotelRooms.find(r => r.id === hotelSelection.roomId);
      if (!room) return 0;
      const checkIn = hotelSelection.checkIn || room.check_in;
      const checkOut = hotelSelection.checkOut || room.check_out;
      const nights = (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24);
      const baseNights = (new Date(room.check_out).getTime() - new Date(room.check_in).getTime()) / (1000 * 60 * 60 * 24);
      const extraNights = Math.max(0, nights - baseNights);
      const basePrice = (room.total_price_per_stay_gbp_with_markup || room.total_price_per_stay_gbp || 0) * (hotelSelection.quantity || 1);
      const extraNightPrice = (room.extra_night_price_gbp || 0) * (hotelSelection.quantity || 1);
      return basePrice + extraNights * extraNightPrice;
    };
    const ticketsTotal = (components.tickets || []).reduce((sum: number, t: any) => {
      const ticketPrice = (t.price || 0) * (t.quantity || 0);
      return sum + ticketPrice;
    }, 0);
    const hotelsTotal = (components.hotels || []).reduce((sum: number, h: any) => {
      const hotelPrice = calculateHotelPrice(h);
      return sum + hotelPrice;
    }, 0);
    const circuitTransfersTotal = (components.circuitTransfers && components.circuitTransfers.length > 0) 
      ? components.circuitTransfers.reduce((sum: number, c: any) => {
          const transferPrice = (c.price || 0) * (c.quantity || 0);
          return sum + transferPrice;
        }, 0)
      : 0;
    const safeAirportTransfers = Array.isArray(components.airportTransfers) ? components.airportTransfers : [];
    const airportTransfersTotal = (safeAirportTransfers.length > 0)
      ? safeAirportTransfers.reduce((sum: number, a: any) => {
          const directionMultiplier = a.transferDirection === 'both' ? 2 : 1;
          const transferPrice = (a.price || 0) * (a.quantity || 0) * directionMultiplier;
          return sum + transferPrice;
        }, 0)
      : 0;
    const flightsTotal = (components.flights || []).reduce((sum: number, f: any) => {
      const flightPrice = (f.price || 0) * (f.passengers || 0);
      return sum + flightPrice;
    }, 0);
  // --- Lounge Pass ---
  const loungePass = components.loungePass;
  const loungePassTotal = loungePass && loungePass.id ? (loungePass.price || 0) * (loungePass.quantity || 1) : 0;
  const originalTotal = ticketsTotal + hotelsTotal + circuitTransfersTotal + airportTransfersTotal + flightsTotal + loungePassTotal;
  
  // Apply hidden 10% markup for teams other than the specific team ID
  const [teamId, setTeamId] = useState<string | null>(null);
  
  useEffect(() => {
    const getTeamId = async () => {
      try {
        const { getCurrentUserTeamId } = await import('@/lib/teamUtils');
        const id = await getCurrentUserTeamId();
        setTeamId(id);
      } catch (error) {
        console.error('Error getting team ID:', error);
        setTeamId(null);
      }
    };
    getTeamId();
  }, []);
  
  // Apply 10% markup for all teams except the specific team ID
  const markupMultiplier = teamId && teamId !== '0cef0867-1b40-4de1-9936-16b867a753d7' ? 1.10 : 1.00;
  const totalWithMarkup = originalTotal * markupMultiplier;
  const roundedTotal = roundUpHundredMinusTwo(totalWithMarkup);

    // Currency conversion effect
    useEffect(() => {
      const convertCurrency = async () => {
        if (selectedCurrency === 'GBP') {
          setConvertedTotal(roundedTotal);
          setExchangeRate(1);
          setValue('summary.convertedPrice', roundedTotal);
          setValue('summary.exchangeRate', 1);
          setValue('summary.totalPrice', roundedTotal); // Ensure form value is updated
          return;
        }

        setIsConverting(true);
        try {
          const conversion = await CurrencyService.convertCurrency(roundedTotal, 'GBP', selectedCurrency);
          setConvertedTotal(conversion.convertedAmount);
          setExchangeRate(conversion.adjustedRate);
          setValue('summary.convertedPrice', conversion.convertedAmount);
          setValue('summary.exchangeRate', conversion.adjustedRate);
          setValue('summary.totalPrice', roundedTotal); // Store original rounded GBP value
        } catch (error) {
          console.error('Currency conversion failed:', error);
          toast.error('Failed to convert currency. Using GBP rates.');
          setConvertedTotal(roundedTotal);
          setExchangeRate(1);
          setValue('summary.convertedPrice', roundedTotal);
          setValue('summary.exchangeRate', 1);
          setValue('summary.totalPrice', roundedTotal);
        } finally {
          setIsConverting(false);
        }
      };

      convertCurrency();
    }, [roundedTotal, selectedCurrency, setValue]);

    const handleCurrencyChange = (newCurrency: string) => {
      setValue('summary.currency', newCurrency);
    };

    return (
      <Card className="bg-gradient-to-b from-card/95 to-background/20 border border-border rounded-2xl shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Price Summary
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Currency:</span>
              <Select value={selectedCurrency} onValueChange={handleCurrencyChange}>
                <SelectTrigger className="w-32 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CurrencyService.getSupportedCurrencies().slice(0, 20).map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.code} ({currency.symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isConverting && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-base font-semibold">
              <span className="flex items-center gap-2">
                Total
                {selectedCurrency !== 'GBP' && (
                  <Badge variant="outline" className="text-xs">
                    {selectedCurrency}
                  </Badge>
                )}
              </span>
              <span>
                {selectedCurrency === 'GBP' 
                  ? `£${roundedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : CurrencyService.formatCurrency(convertedTotal, selectedCurrency)
                }
              </span>
            </div>
            {selectedCurrency !== 'GBP' && (
              <div className="text-xs text-muted-foreground text-right">
                Exchange rate: 1 GBP = {exchangeRate.toFixed(4)} {selectedCurrency} (includes 5% spread)
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-sm">
              <span>Tickets {components.tickets?.length > 0 && `x ${components.tickets.reduce((sum: number, t: any) => sum + (t.quantity || 0), 0)}`}</span>
              <span>£{ticketsTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Hotels {components.hotels?.length > 0 && `x ${components.hotels.reduce((sum: number, h: any) => sum + (h.quantity || 0), 0)}`}</span>
              <span>£{hotelsTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-2">
                Circuit Transfers 
                {components.circuitTransfers?.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    x {components.circuitTransfers.reduce((sum: number, c: any) => sum + (c.quantity || 0), 0)}
                  </Badge>
                )}
                {components.circuitTransfers?.length === 0 && (
                  <Badge variant="outline" className="text-xs text-muted-foreground">
                    Excluded
                  </Badge>
                )}
              </span>
              <span>£{circuitTransfersTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-2">
                Airport Transfers 
                {safeAirportTransfers.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    x {safeAirportTransfers.reduce((sum: number, a: any) => sum + (a.quantity || 0), 0)}
                  </Badge>
                )}
                {safeAirportTransfers.length === 0 && (
                  <Badge variant="outline" className="text-xs text-muted-foreground">
                    Excluded
                  </Badge>
                )}
              </span>
              <span>£{airportTransfersTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-2">
                Flights 
                {components.flights?.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    x {components.flights.reduce((sum: number, f: any) => sum + (f.passengers || 0), 0)}
                  </Badge>
                )}
                {components.flights?.length === 0 && (
                  <Badge variant="outline" className="text-xs text-muted-foreground">
                    Excluded
                  </Badge>
                )}
              </span>
              <span>£{flightsTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          {/* Lounge Pass line item */}
          <div className="flex justify-between text-sm">
            <span className="flex items-center gap-2">
              Lounge Pass
              {loungePass && loungePass.id ? (
                <Badge variant="secondary" className="text-xs">
                   × {loungePass.quantity || 1}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  Excluded
                </Badge>
              )}
            </span>
            <span>£{loungePassTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
          </div>
        </CardContent>
      </Card>
    );
  }



export function PackageIntakeTest() {
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);

  // Move these to the main component scope:
  const [hotels, setHotels] = useState<any[]>([]);
  const [hotelRooms, setHotelRooms] = useState<any[]>([]);
  const [circuitTransfers, setCircuitTransfers] = useState<any[]>([]);
  const [airportTransfers, setAirportTransfers] = useState<any[]>([]);

  const totalSteps = 6;

  // Create form instance for validation
  const form = useForm<PackageIntake>({
    resolver: zodResolver(packageIntakeSchema) as any,
    mode: 'onChange',
    defaultValues: {
      client: {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: '',
        },
      },
      isNewClient: false,
      travelers: {
        adults: 2,
        children: 0,
        total: 2,
      },
      selectedEvent: undefined,
      selectedPackage: undefined,
      selectedTier: undefined,
      components: {
        tickets: [],
        hotels: [],
        circuitTransfers: [],
        airportTransfers: [],
        flights: [],
        flightsSource: 'none',
        loungePass: undefined,
      },
      loungePass: { needed: false },
      summary: {
        totalPrice: 0,
        currency: 'GBP',
        convertedPrice: 0,
        exchangeRate: 1,
        internalNotes: '',
        quoteReference: '',
      },
      payments: {
        total: 0,
        deposit: 0,
        secondPayment: 0,
        finalPayment: 0,
        depositDate: undefined,
        secondPaymentDate: undefined,
        finalPaymentDate: undefined,
      },
    },
  });

  // Add this useEffect after the useState declarations in the main component:
  useEffect(() => {
    const hotelIds = form.getValues('components.hotels').map((h: any) => h.hotelId).filter(Boolean);
    const roomIds = form.getValues('components.hotels').map((h: any) => h.roomId).filter(Boolean);
    if (hotelIds.length > 0) {
      supabase.from('gpgt_hotels').select('*').in('id', hotelIds).then(({ data }) => setHotels(data || []));
    }
    if (roomIds.length > 0) {
      supabase.from('hotel_rooms').select('*').in('id', roomIds).then(({ data }) => setHotelRooms(data || []));
    }
  }, [JSON.stringify(form.getValues('components.hotels'))]);

  // Migration step: ensure all airport transfers in form state have hotel_id
  useEffect(() => {
    const transfers = form.getValues('components.airportTransfers') || [];
    const selectedRooms = form.getValues('components.hotels') || [];
    const selectedHotelId = selectedRooms.length === 1 ? selectedRooms[0].hotelId : null;
    const patchedTransfers = transfers.map(t => ({
      ...t,
      hotel_id: t.hotel_id || selectedHotelId
    }));
    if (JSON.stringify(transfers) !== JSON.stringify(patchedTransfers)) {
      form.setValue('components.airportTransfers', patchedTransfers);
    }
  }, []);

  // Calculate progress percentage
  const progressPercentage = ((currentStep + 1) / totalSteps) * 100;

  const handleNext = async () => {
    // Define which fields to validate for each step
    const stepValidationFields = {
      0: ['client.firstName', 'client.lastName', 'client.email'], // Client Selection
      1: ['travelers.adults', 'travelers.total'], // Traveler Count
      2: [], // Event Selection
      3: [], // Package & Tier Selection
      4: [], // Components
      5: [], // Summary
    };

    const fieldsToValidate = stepValidationFields[currentStep as keyof typeof stepValidationFields] || [];
    
    // Only validate if there are fields to validate for this step
    let isValid = true;
    if (fieldsToValidate.length > 0) {
      isValid = await form.trigger(fieldsToValidate as any);
    }

    // Custom validation for hotel/transfer compatibility (on the components step)
    if (currentStep === 4) {
      const hotelIds = form.getValues('components.hotels').map((h: any) => String(h.hotelId)).filter(Boolean);
      const circuitTransfers = form.getValues('components.circuitTransfers') || [];
      const airportTransfers = form.getValues('components.airportTransfers') || [];
      const allTransfers = [...circuitTransfers, ...airportTransfers];
      console.log('Hotel IDs:', hotelIds);
      console.log('All transfers:', allTransfers);
      // Only block if there are transfers and any of them do not match a selected hotel room
      if (allTransfers.length > 0) {
        const invalidTransfers = allTransfers.filter((t: any) => {
          const transferHotelId = (t.hotelId || t.hotel_id || '').toString().trim();
          return !hotelIds.map(id => id.toString().trim()).includes(transferHotelId);
        });
        if (invalidTransfers.length > 0) {
          toast.error('One or more selected transfers do not match the selected hotel rooms. Please review your selections.');
          return; // Prevent advancing
        }
      }
    }

    if (isValid && currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (data: PackageIntake) => {
    console.log('📋 Package Intake Form Submitted:', data);
    setIsGenerating(true);
    setGenerationError(null);
    
    try {
      toast.success('Package intake form submitted successfully!');
      
      // Here you would typically:
      // 1. Save to database
      // 2. Generate quote
      // 3. Send notifications
      // 4. Create booking
    } catch (error) {
      console.error('Failed to submit form:', error);
      setGenerationError(error instanceof Error ? error.message : 'Failed to submit form');
      toast.error('Failed to submit form. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveDraft = (data: PackageIntake) => {
    console.log('💾 Draft Saved:', data);
    toast.success('Draft saved successfully!');
  };

  const handleGenerateQuote = async (data: PackageIntake) => {
    try {
      setIsGenerating(true);
      
      // Validate required data
      if (!data.selectedEvent?.id || !data.selectedPackage?.id || !data.selectedTier?.id) {
        throw new Error('Missing required event, package, or tier selection');
      }

      // Prepare data for quote creation
      const quoteData = {
        clientId: data.client.id || undefined,
        clientData: {
          firstName: data.client.firstName,
          lastName: data.client.lastName,
          email: data.client.email,
          phone: data.client.phone,
          address: data.client.address ? {
            street: data.client.address.street || '',
            city: data.client.address.city || '',
            state: data.client.address.state || '',
            zipCode: data.client.address.zipCode || '',
            country: data.client.address.country || ''
          } : undefined
        },
        travelersData: {
          adults: data.travelers.adults,
          children: data.travelers.children || 0,
          total: data.travelers.total
        },
        eventData: {
          id: data.selectedEvent.id,
          name: data.selectedEvent.name || '',
          location: data.selectedEvent.location || '',
          startDate: data.selectedEvent.startDate || '',
          endDate: data.selectedEvent.endDate || ''
        },
        packageData: {
          id: data.selectedPackage.id,
          name: data.selectedPackage.name || '',
          baseType: data.selectedPackage.baseType || 'Grandstand',
          tierId: data.selectedTier.id,
          tierName: data.selectedTier.name || '',
          tierDescription: data.selectedTier.description,
          tierPriceOverride: data.selectedTier.priceOverride
        },
        componentsData: {
          tickets: data.components.tickets || [],
          hotels: (data.components.hotels || []).map(h => {
            const hotel = hotels.find((ht: any) => ht.id === h.hotelId) || {};
            const room = hotelRooms.find((rm: any) => rm.id === h.roomId) || {};
            // Calculate price logic as in StepComponents
            const checkIn = h.checkIn || room.check_in;
            const checkOut = h.checkOut || room.check_out;
            const nights = (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24);
            const baseNights = (new Date(room.check_out).getTime() - new Date(room.check_in).getTime()) / (1000 * 60 * 60 * 24);
            const extraNights = Math.max(0, nights - baseNights);
            const basePrice = (room.total_price_per_stay_gbp_with_markup || room.total_price_per_stay_gbp || 0) * (h.quantity || 1);
            const extraNightPrice = (room.extra_night_price_gbp || 0) * (h.quantity || 1);
            const totalPrice = basePrice + extraNights * extraNightPrice;
            return {
              ...h,
              hotelName: hotel.name || '',
              hotelBrand: hotel.brand || '',
              hotelCity: hotel.city || '',
              hotelCountry: hotel.country || '',
              hotelStarRating: hotel.star_rating || 0,
              roomType: room.room_type_id || '',
              pricePerNight: room.price_per_night_gbp || 0,
              totalPricePerStay: room.total_price_per_stay_gbp_with_markup || room.total_price_per_stay_gbp || 0,
              maxPeople: room.max_people || 0,
              images: room.images || hotel.images || [],
              amenities: [...(hotel.amenities || []), ...(room.amenities || [])],
              basePrice,
              extraNightPrice,
              extraNights,
              totalPrice,
              price: totalPrice, // for compatibility with frontend display
            };
          }),
          circuitTransfers: data.components.circuitTransfers || [],
          airportTransfers: data.components.airportTransfers || [],
          flights: (data.components.flights || []).map((f: any) => ({ ...f })), // send all flight details
          loungePass: data.components.loungePass
        },
        paymentsData: {
          total: data.summary.convertedPrice || data.summary.totalPrice,
          currency: data.summary.currency,
          deposit: data.payments.deposit,
          secondPayment: data.payments.secondPayment,
          finalPayment: data.payments.finalPayment,
          depositDate: data.payments.depositDate,
          secondPaymentDate: data.payments.secondPaymentDate,
          finalPaymentDate: data.payments.finalPaymentDate
        },
        internalNotes: data.summary.internalNotes
      };

      // Debug: Log the quote data being sent
      console.log('📋 Quote Data being sent:', quoteData);
      console.log('🎫 Lounge Pass Data:', quoteData.componentsData.loungePass);
      console.log('🏨 Hotel Data:', quoteData.componentsData.hotels);
      
      // Debug: Log payment data specifically to check constraint
      console.log('💰 Payment Data Debug:', {
        total: quoteData.paymentsData.total,
        deposit: quoteData.paymentsData.deposit,
        secondPayment: quoteData.paymentsData.secondPayment,
        finalPayment: quoteData.paymentsData.finalPayment,
        sum: quoteData.paymentsData.deposit + quoteData.paymentsData.secondPayment + quoteData.paymentsData.finalPayment,
        difference: quoteData.paymentsData.total - (quoteData.paymentsData.deposit + quoteData.paymentsData.secondPayment + quoteData.paymentsData.finalPayment),
        currency: quoteData.paymentsData.currency
      });
      
      // --- Payment Calculation ---
      // Calculate payment breakdown - ensure they add up exactly to total
      const total = quoteData.paymentsData.total;
      const deposit = Math.round((total / 3) * 100) / 100;
      const secondPayment = Math.round((total / 3) * 100) / 100;
      let finalPayment = Math.round((total - deposit - secondPayment) * 100) / 100;
      // Fix any floating point error by adjusting finalPayment
      const sum = Math.round((deposit + secondPayment + finalPayment) * 100) / 100;
      if (sum !== Math.round(total * 100) / 100) {
        finalPayment = Math.round((total - deposit - secondPayment) * 100) / 100 + (Math.round(total * 100) / 100 - sum);
        finalPayment = Math.round(finalPayment * 100) / 100;
      }
      quoteData.paymentsData.deposit = deposit;
      quoteData.paymentsData.secondPayment = secondPayment;
      quoteData.paymentsData.finalPayment = finalPayment;
      // --- End Payment Calculation ---
      
      console.log('🔧 Fixed Payment Data:', {
        total: quoteData.paymentsData.total,
        deposit: quoteData.paymentsData.deposit,
        secondPayment: quoteData.paymentsData.secondPayment,
        finalPayment: quoteData.paymentsData.finalPayment,
        sum: quoteData.paymentsData.deposit + quoteData.paymentsData.secondPayment + quoteData.paymentsData.finalPayment,
        difference: quoteData.paymentsData.total - (quoteData.paymentsData.deposit + quoteData.paymentsData.secondPayment + quoteData.paymentsData.finalPayment)
      });
      
      // Create quote
      const quoteId = await QuoteService.createQuoteFromIntake(quoteData);
      
      toast.success('Quote generated successfully!');
      
      // Navigate to quote page
      navigate(`/quotes/${quoteId}`);
      
    } catch (error) {
      console.error('Error generating quote:', error);
      toast.error('Failed to generate quote. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportPDF = (data: PackageIntake) => {
    console.log('📄 Export PDF:', data);
    toast.success('PDF export started!');
    
    // Here you would:
    // 1. Generate PDF with form data
    // 2. Include pricing and recommendations
    // 3. Download or email PDF
  };

  // Convert 0-based step to 1-based for display
  const displayStep = currentStep + 1;
  const currentStepConfig = stepConfig[displayStep - 1];
  const currentProTips = proTips[displayStep - 1];

  const [showPrices, setShowPrices] = useState(false);
  useEffect(() => {
    (async () => {
      setShowPrices(await hasTeamFeature('show_prices'));
    })();
  }, []);

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <StepClientSelection showPrices={showPrices} />;
      case 1:
        return <StepTravelerCount showPrices={showPrices} />;
      case 2:
        return <StepEventSelection setCurrentStep={setCurrentStep} currentStep={currentStep} showPrices={showPrices} />;
      case 3:
        return <StepPackageAndTierSelection setCurrentStep={setCurrentStep} currentStep={currentStep} showPrices={showPrices} />;
      case 4:
        return <StepComponents setCurrentStep={setCurrentStep} currentStep={currentStep} showPrices={showPrices} />;
      case 5:
        // --- SUMMARY STEP ---
        return <SummaryStep form={form} isGenerating={isGenerating} showPrices={showPrices} />;
      default:
        return <div className="p-6 text-center">
          <h3 className="text-lg font-semibold mb-2">Step Not Found</h3>
          <p className="text-muted-foreground">This step has not been implemented yet</p>
        </div>;
    }
  };

  return (
    <div className="mx-auto px-8 pt-0 pb-8 space-y-8">
      
      {/* Main Content */}
      <div className="mx-auto py-6">
        <FormProvider {...form}>
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-8">
            {/* Form Section */}
            <div className="space-y-6">
            {/* Step Indicator */}
            <Card className="bg-gradient-to-b py-0 from-card/95 to-background/20 border border-border rounded-2xl shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg"
                    style={{ backgroundColor: currentStepConfig.color }}
                  >
                    <currentStepConfig.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-foreground">{currentStepConfig.title}</h2>
                    <p className="text-sm text-muted-foreground">
                      {currentStep === 0 && "Select or create a client for this package proposal"}
                      {currentStep === 1 && "Define the number of travelers for this package"}
                      {currentStep === 2 && "Select the event for this package"}
                      {currentStep === 3 && "Choose the package type and tier"}
                      {currentStep === 4 && "Configure package components (tickets, hotels, transfers)"}
                      {currentStep === 5 && "Review and submit the package proposal"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Form Content */}
            <Card className="py-0 bg-gradient-to-b from-card/95 to-background/20 border border-border rounded-2xl shadow-sm">
              <div className="min-h-[600px] flex flex-col">
                <CardContent className="p-6 flex-1">
                  {generationError && (
                    <Alert variant="destructive" className="mb-6">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{generationError}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="space-y-6">
                    {renderStep()}
                  </div>
                </CardContent>

                <CardFooter className="p-6 border-t border-border/30 bg-muted/20">
                  <div className="flex justify-between items-center w-full">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={currentStep === 0 || isGenerating}
                      className="border-border/50 bg-background hover:bg-muted px-6"
                      onClick={handlePrev}
                    >
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      type="button"
                      disabled={isGenerating}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md px-8"
                      onClick={
                        currentStep === totalSteps - 1
                          ? () => handleGenerateQuote(form.getValues())
                          : handleNext
                      }
                    >
                      {currentStep === totalSteps - 1 ? 'Generate Quote' : 'Next'}
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardFooter>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Price Summary - only show during components step and when showPrices is enabled */}
            {currentStep === 4 && (
              showPrices
                ? <PriceSummaryCardContent />
                : <ConsultantDetailsCard eventId={form.getValues('selectedEvent')?.id} />
            )}

            {/* Pro Tips Card */}
            <Card className="bg-gradient-to-b from-card/95 to-background/20 border border-border rounded-2xl shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" style={{ color: 'var(--color-primary-500)' }} />
                  Pro Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-semibold"
                    style={{ backgroundColor: currentStepConfig.color }}
                  >
                    {displayStep}
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">{currentProTips.title}</h4>
                    <p className="text-xs text-muted-foreground">Step {displayStep} of {totalSteps}</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {currentProTips.tips.map((tip, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border border-border/50">
                      <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: 'var(--color-primary-500)' }} />
                      <p className="text-sm text-foreground">{tip}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="bg-gradient-to-b from-card/95 to-background/20 border border-border rounded-2xl shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 rounded-lg bg-muted/40 border border-border/50">
                    <div className="text-2xl font-bold text-foreground">{displayStep}</div>
                    <div className="text-xs text-muted-foreground">Current Step</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/40 border border-border/50">
                    <div className="text-2xl font-bold text-foreground">{totalSteps - displayStep}</div>
                    <div className="text-xs text-muted-foreground">Steps Left</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{Math.round(progressPercentage)}%</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Help & Resources */}
            <Card className="bg-gradient-to-b from-card/95 to-background/20 border border-border rounded-2xl shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5" />
                  Help & Resources
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <BookOpen className="h-4 w-4 mr-2" />
                  User Guide
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Shield className="h-4 w-4 mr-2" />
                  Support
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        </FormProvider>
      </div>
    </div>
  );
}

export function SummaryStep({ form, isGenerating, showPrices }: { form: any, isGenerating: boolean, showPrices: boolean }) {
  const data = form.getValues();
  const { client, travelers, selectedEvent, selectedPackage, selectedTier, components } = data;
  // --- Fetch hotel, room, and transfer details for display ---
  const [hotels, setHotels] = useState<any[]>([]);
  const [hotelRooms, setHotelRooms] = useState<any[]>([]);
  const [circuitTransfers, setCircuitTransfers] = useState<any[]>([]);
  const [airportTransfers, setAirportTransfers] = useState<any[]>([]);
  useEffect(() => {
    // Fetch all hotels and rooms for selected hotelIds/roomIds
    const hotelIds = components.hotels.map((h: any) => h.hotelId).filter(Boolean);
    const roomIds = components.hotels.map((h: any) => h.roomId).filter(Boolean);
    if (hotelIds.length > 0) {
      supabase.from('gpgt_hotels').select('*').in('id', hotelIds).then(({ data }) => setHotels(data || []));
    }
    if (roomIds.length > 0) {
      supabase.from('hotel_rooms').select('*').in('id', roomIds).then(({ data }) => setHotelRooms(data || []));
    }
    // Fetch all circuit transfers
    const circuitIds = components.circuitTransfers.map((c: any) => c.id).filter(Boolean);
    if (circuitIds.length > 0) {
      supabase.from('circuit_transfers').select('*').in('id', circuitIds).then(({ data }) => setCircuitTransfers(data || []));
    }
    // Fetch all airport transfers
    const airportIds = components.airportTransfers.map((a: any) => a.id).filter(Boolean);
    if (airportIds.length > 0) {
      supabase.from('airport_transfers').select('*').in('id', airportIds).then(({ data }) => setAirportTransfers(data || []));
    }
  }, [components.hotels, components.circuitTransfers, components.airportTransfers]);
  // Helpers
  function getHotel(hotelId: string) { return hotels.find(h => h.id === hotelId); }
  function getRoom(roomId: string) { return hotelRooms.find(r => r.id === roomId); }
  function getCircuitTransfer(id: string) { return circuitTransfers.find(t => t.id === id); }
  function getAirportTransfer(id: string) { return airportTransfers.find(t => t.id === id); }
  

  
  const calculateHotelPrice = (hotelSelection: any) => {
    const room = hotelRooms.find(r => r.id === hotelSelection.roomId);
    if (!room) return 0;
    const checkIn = hotelSelection.checkIn || room.check_in;
    const checkOut = hotelSelection.checkOut || room.check_out;
    const nights = (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24);
    const baseNights = (new Date(room.check_out).getTime() - new Date(room.check_in).getTime()) / (1000 * 60 * 60 * 24);
    const extraNights = Math.max(0, nights - baseNights);
    const basePrice = (room.total_price_per_stay_gbp_with_markup || room.total_price_per_stay_gbp || 0) * (hotelSelection.quantity || 1);
    const extraNightPrice = (room.extra_night_price_gbp || 0) * (hotelSelection.quantity || 1);
    return basePrice + extraNights * extraNightPrice;
  };
  
  const ticketsTotal = (components.tickets || []).reduce((sum: number, t: any) => {
    const ticketPrice = (t.price || 0) * (t.quantity || 0);
    return sum + ticketPrice;
  }, 0);
  
  const hotelsTotal = (components.hotels || []).reduce((sum: number, h: any) => {
    const hotelPrice = calculateHotelPrice(h);
    return sum + hotelPrice;
  }, 0);
  
  const circuitTransfersTotal = (components.circuitTransfers && components.circuitTransfers.length > 0) 
    ? components.circuitTransfers.reduce((sum: number, c: any) => {
        const transferPrice = (c.price || 0) * (c.quantity || 0);
        return sum + transferPrice;
      }, 0)
    : 0;
  
  const airportTransfersTotal = (components.airportTransfers && components.airportTransfers.length > 0)
    ? components.airportTransfers.reduce((sum: number, a: any) => {
        const directionMultiplier = a.transferDirection === 'both' ? 2 : 1;
        const transferPrice = (a.price || 0) * (a.quantity || 0) * directionMultiplier;
        return sum + transferPrice;
      }, 0)
    : 0;
  
  const flightsTotal = (components.flights || []).reduce((sum: number, f: any) => {
    const flightPrice = (f.price || 0) * (f.passengers || 0);
    return sum + flightPrice;
  }, 0);
  
  const loungePass = components.loungePass;
  const loungePassTotal = loungePass && loungePass.id ? (loungePass.price || 0) * (loungePass.quantity || 1) : 0;
  const originalTotal = ticketsTotal + hotelsTotal + circuitTransfersTotal + airportTransfersTotal + flightsTotal + loungePassTotal;
  
  // Apply hidden 10% markup for teams other than the specific team ID
  const [teamId, setTeamId] = useState<string | null>(null);
  
  useEffect(() => {
    const getTeamId = async () => {
      try {
        const { getCurrentUserTeamId } = await import('@/lib/teamUtils');
        const id = await getCurrentUserTeamId();
        setTeamId(id);
      } catch (error) {
        console.error('Error getting team ID:', error);
        setTeamId(null);
      }
    };
    getTeamId();
  }, []);
  
  // Apply 10% markup for all teams except the specific team ID
  const markupMultiplier = teamId && teamId !== '0cef0867-1b40-4de1-9936-16b867a753d7' ? 1.10 : 1.00;
  const totalWithMarkup = originalTotal * markupMultiplier;
  const roundedTotal = roundUpHundredMinusTwo(totalWithMarkup);

  // Debug log (only in development)
  if (process.env.NODE_ENV === 'development' && markupMultiplier > 1.00) {
    console.log('💰 Team markup applied (SummaryStep):', {
      teamId,
      originalTotal: originalTotal.toFixed(2),
      markupMultiplier,
      totalWithMarkup: totalWithMarkup.toFixed(2),
      roundedTotal: roundedTotal.toFixed(2)
    });
  }
  
  // Calculate payment breakdown - ensure they add up exactly to total
  const deposit = Math.round((roundedTotal / 3) * 100) / 100;
  const secondPayment = Math.round((roundedTotal / 3) * 100) / 100;
  let finalPayment = Math.round((roundedTotal - deposit - secondPayment) * 100) / 100;
  // Fix any floating point error by adjusting finalPayment
  const sum = Math.round((deposit + secondPayment + finalPayment) * 100) / 100;
  if (sum !== Math.round(roundedTotal * 100) / 100) {
    finalPayment = Math.round((roundedTotal - deposit - secondPayment) * 100) / 100 + (Math.round(roundedTotal * 100) / 100 - sum);
    finalPayment = Math.round(finalPayment * 100) / 100;
  }
  
  // Get the converted total if currency is not GBP
  const currentCurrency = form.getValues('summary.currency');
  const convertedTotal = form.getValues('summary.convertedPrice') || roundedTotal;
  const exchangeRate = form.getValues('summary.exchangeRate') || 1;
  
  // Use converted amounts for payments if currency is not GBP
  const paymentTotal = currentCurrency === 'GBP' ? roundedTotal : convertedTotal;
  const paymentDeposit = currentCurrency === 'GBP' ? deposit : Math.round((convertedTotal / 3) * 100) / 100;
  const paymentSecondPayment = currentCurrency === 'GBP' ? secondPayment : Math.round((convertedTotal / 3) * 100) / 100;
  let paymentFinalPayment = currentCurrency === 'GBP' ? finalPayment : Math.round((convertedTotal - paymentDeposit - paymentSecondPayment) * 100) / 100;
  
  // Fix any floating point error for converted payments
  if (currentCurrency !== 'GBP') {
    const convertedSum = Math.round((paymentDeposit + paymentSecondPayment + paymentFinalPayment) * 100) / 100;
    if (convertedSum !== Math.round(convertedTotal * 100) / 100) {
      paymentFinalPayment = Math.round((convertedTotal - paymentDeposit - paymentSecondPayment) * 100) / 100 + (Math.round(convertedTotal * 100) / 100 - convertedSum);
      paymentFinalPayment = Math.round(paymentFinalPayment * 100) / 100;
    }
  }
  
  // --- Payment Dates: Only set defaults if not already set, allow user override ---
  const didSetDefaultDates = useRef(false);
  useEffect(() => {
    if (didSetDefaultDates.current) return;
    didSetDefaultDates.current = true;
    const today = new Date();
    const defaultSecondPaymentDate = new Date(today.getTime() + 2 * 30 * 24 * 60 * 60 * 1000);
    defaultSecondPaymentDate.setDate(1);
    const defaultFinalPaymentDate = new Date(defaultSecondPaymentDate.getTime() + 2 * 30 * 24 * 60 * 60 * 1000);
    defaultFinalPaymentDate.setDate(1);
    const currentSecondPaymentDate = form.getValues('payments.secondPaymentDate');
    const currentFinalPaymentDate = form.getValues('payments.finalPaymentDate');
    if (!currentSecondPaymentDate) {
      form.setValue('payments.secondPaymentDate', defaultSecondPaymentDate.toISOString().slice(0, 10));
    }
    if (!currentFinalPaymentDate) {
      form.setValue('payments.finalPaymentDate', defaultFinalPaymentDate.toISOString().slice(0, 10));
    }
  }, []);

  // Sync calculated payment values to form state so UI always shows correct values
  useEffect(() => {
    form.setValue('payments.deposit', paymentDeposit);
    form.setValue('payments.secondPayment', paymentSecondPayment);
    form.setValue('payments.finalPayment', paymentFinalPayment);
    form.setValue('payments.total', paymentTotal);
  }, [paymentDeposit, paymentSecondPayment, paymentFinalPayment, paymentTotal]);

  // --- UI ---
  return (
    <div className="space-y-8">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Review & Confirm</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Client Info */}
            <div>
              <h4 className="font-semibold mb-2">Client</h4>
              <div className="text-sm text-muted-foreground">
                {client.firstName} {client.lastName}<br />
                {client.email}<br />
                {client.phone && <>{client.phone}<br /></>}
                {client.company && <>{client.company}<br /></>}
              </div>
            </div>
            {/* Travelers */}
            <div>
              <h4 className="font-semibold mb-2">Travelers</h4>
              <div className="text-sm text-muted-foreground">
                {travelers.adults} adult{travelers.adults !== 1 ? 's' : ''}<br />
                {travelers.children > 0 && <>{travelers.children} child{travelers.children !== 1 ? 'ren' : ''}<br /></>}
                Total: {travelers.total}
              </div>
            </div>
            {/* Event */}
            <div>
              <h4 className="font-semibold mb-2">Event</h4>
              <div className="text-sm text-muted-foreground">
                {selectedEvent?.name}<br />
                {selectedEvent?.location && <>{selectedEvent.location}<br /></>}
                {selectedEvent?.startDate && <>
                  {selectedEvent.startDate}
                  {selectedEvent.endDate && <> - {selectedEvent.endDate}</>}
                  <br />
                </>}
              </div>
            </div>
            {/* Package & Tier */}
            <div>
              <h4 className="font-semibold mb-2">Package & Tier</h4>
              <div className="text-sm text-muted-foreground">
                {selectedPackage?.name && <>{selectedPackage.name}<br /></>}
                {selectedTier?.name && <>{selectedTier.name}<br /></>}
                {selectedTier?.description && <>{selectedTier.description}<br /></>}
                {selectedTier?.priceOverride && <>
                  <span className="font-bold text-[var(--color-primary)]">Tier Price: £{selectedTier.priceOverride.toLocaleString()}</span><br />
                </>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Components Summary */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Selected Components</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tickets */}
          <div>
            <h4 className="font-semibold mb-1 flex items-center gap-2">
              <Ticket className="h-4 w-4 text-[var(--color-primary-600)]" /> Tickets
            </h4>
            {components.tickets.length > 0 ? (
              <ul className="ml-4 space-y-1">
                {components.tickets.map((t: any, i: number) => (
                  <li key={i} className="text-sm">
                    <span className="font-medium">{t.category}</span>
                    {t.ticket_type && <> • {t.ticket_type}</>}
                    {t.ticket_days && <> • <Calendar className="inline h-3 w-3" /> {t.ticket_days}</>}
                    <span className="ml-2">× {t.quantity} {showPrices ? <span className="text-muted-foreground">(@ £{Number(t.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} each)</span> : <span className="text-muted-foreground">(Included)</span>}</span>
                  </li>
                ))}
              </ul>
            ) : <span className="text-muted-foreground">None</span>}
          </div>
          {/* Hotels */}
          <div>
            <h4 className="font-semibold mb-1 flex items-center gap-2">
              <Hotel className="h-4 w-4 text-[var(--color-secondary-600)]" /> Hotels
            </h4>
            {components.hotels.length > 0 ? (
              <ul className="ml-4 space-y-1">
                {components.hotels.map((h: any, i: number) => {
                  const hotel = getHotel(h.hotelId);
                  const room = getRoom(h.roomId);
                  // Price breakdown logic (matches HotelRoomsTab)
                  let priceBreakdown = null;
                  if (showPrices && room) {
                    const checkIn = h.checkIn || room.check_in;
                    const checkOut = h.checkOut || room.check_out;
                    const nights = (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24);
                    const baseNights = (new Date(room.check_out).getTime() - new Date(room.check_in).getTime()) / (1000 * 60 * 60 * 24);
                    const extraNights = Math.max(0, nights - baseNights);
                    const basePrice = (room.total_price_per_stay_gbp_with_markup || room.total_price_per_stay_gbp || 0) * (h.quantity || 1);
                    const extraNightPrice = (room.extra_night_price_gbp || 0) * (h.quantity || 1);
                    const total = basePrice + extraNights * extraNightPrice;
                    priceBreakdown = (
                      <div className="text-xs text-[var(--color-muted-foreground)] ml-2">
                        Base stay ({baseNights} night{baseNights !== 1 ? 's' : ''}): <span className="font-semibold">£{basePrice.toLocaleString()}</span>
                        {extraNights > 0 && (
                          <span> • Extra nights ({extraNights}): <span className="font-semibold">£{(extraNightPrice * extraNights).toLocaleString()}</span></span>
                        )}
                        <span> • <span className="font-bold text-[var(--color-primary)]">Total: £{total.toLocaleString()}</span></span>
                      </div>
                    );
                  }
                  return (
                    <li key={i} className="text-sm">
                      <span className="font-medium">{hotel?.name || 'Hotel'}</span>
                      {room && <> • {room.room_type_id}</>}
                      <span className="ml-2">× {h.quantity}</span>
                      <span className="ml-2">
                        <Calendar className="inline h-3 w-3" /> {h.checkIn} to {h.checkOut}
                      </span>
                      {hotel?.city && <> • {hotel.city}, {hotel.country}</>}
                      {showPrices ? priceBreakdown : <span className="ml-2 text-muted-foreground">(Included)</span>}
                    </li>
                  );
                })}
              </ul>
            ) : <span className="text-muted-foreground">None</span>}
          </div>
          {/* Circuit Transfers */}
          <div>
            <h4 className="font-semibold mb-1 flex items-center gap-2">
              <Car className="h-4 w-4 text-[var(--color-primary-500)]" /> Circuit Transfers
            </h4>
            {components.circuitTransfers.length > 0 ? (
              <ul className="ml-4 space-y-1">
                {components.circuitTransfers.map((c: any, i: number) => {
                  const transfer = getCircuitTransfer(c.id);
                  const hotel = transfer ? getHotel(transfer.hotel_id) : undefined;
                  return (
                    <li key={i} className="text-sm">
                      <span className="font-medium">{transfer?.transfer_type || 'Transfer'}</span>
                      {hotel && <> • {hotel.name}</>}
                      <span className="ml-2">× {c.quantity}</span>
                      {showPrices ? <span className="ml-2">@ £{Number(c.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} per seat</span> : <span className="ml-2 text-muted-foreground">(Included)</span>}
                    </li>
                  );
                })}
              </ul>
            ) : <span className="text-muted-foreground">None</span>}
          </div>
          {/* Airport Transfers */}
          <div>
            <h4 className="font-semibold mb-1 flex items-center gap-2">
              <Car className="h-4 w-4 text-[var(--color-secondary-500)]" /> Airport Transfers
            </h4>
            {components.airportTransfers.length > 0 ? (
              <ul className="ml-4 space-y-1">
                {components.airportTransfers.map((a: any, i: number) => {
                  const transfer = getAirportTransfer(a.id);
                  const hotel = transfer ? getHotel(transfer.hotel_id) : undefined;
                  return (
                    <li key={i} className="text-sm">
                      <span className="font-medium">{transfer?.transport_type || 'Transfer'}</span>
                      {hotel && <> • {hotel.name}</>}
                      <span className="ml-2">× {a.quantity}</span>
                      <span className="ml-2">{a.transferDirection}</span>
                      {showPrices ? <span className="ml-2">@ £{Number(a.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} per vehicle</span> : <span className="ml-2 text-muted-foreground">(Included)</span>}
                    </li>
                  );
                })}
              </ul>
            ) : <span className="text-muted-foreground">None</span>}
          </div>
          {/* Flights */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Plane className="h-4 w-4 text-[var(--color-primary-700)]" /> Flights
            </h4>
            {components.flights.length > 0 ? (
              <div className="space-y-4">
                {components.flights.map((f: any, i: number) => (
                  <div key={i} className="border border-[var(--color-border)] rounded-lg p-4 bg-[var(--color-muted)]/20">
                    {/* Flight Route Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-[var(--color-primary-600)]" />
                        <span className="font-semibold text-base">
                          {f.origin} → {f.destination}
                        </span>
                        {f.returnDate && (
                          <span className="text-sm text-[var(--color-muted-foreground)]">
                            (Round Trip)
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-[var(--color-primary)]">
                          £{Number(f.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-xs text-[var(--color-muted-foreground)]">
                          per passenger × {f.passengers}
                        </div>
                      </div>
                    </div>

                    {/* Outbound Flight Details */}
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <PlaneTakeoff className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-sm">Outbound Flight</span>
                      </div>
                      
                      {/* Multi-segment outbound flight display */}
                      {f.outboundFlightSegments && f.outboundFlightSegments.length > 0 ? (
                        <div className="space-y-3 border border-primary/40 rounded-lg p-4">
                          {f.outboundFlightSegments.map((segment: any, segmentIndex: number) => (
                            <div key={segmentIndex} className="space-y-2">
                              {/* Flight Segment */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                <div>
                                  <span className="text-[var(--color-muted-foreground)]">Flight Number:</span>
                                  <span className="ml-2 font-medium">
                                    {segment.marketingAirlineId && segment.flightNumber ? 
                                      `${segment.marketingAirlineId}${segment.flightNumber}` : 
                                      f.outboundFlightNumber || f.flightNumber || f.airline || 'TBD'
                                    }
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[var(--color-muted-foreground)]">Route:</span>
                                  <span className="ml-2 font-medium">
                                    {segment.departureAirportId} → {segment.arrivalAirportId}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[var(--color-muted-foreground)]">Airports:</span>
                                  <span className="ml-2 font-medium">
                                    {segment.departureAirportName || segment.departureAirportId} → {segment.arrivalAirportName || segment.arrivalAirportId}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[var(--color-muted-foreground)]">Departure:</span>
                                  <span className="ml-2 font-medium">
                                    {segment.departureDateTime ? new Date(segment.departureDateTime).toLocaleString('en-GB', {
                                      weekday: 'short',
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    }) : 'TBD'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[var(--color-muted-foreground)]">Arrival:</span>
                                  <span className="ml-2 font-medium">
                                    {segment.arrivalDateTime ? new Date(segment.arrivalDateTime).toLocaleString('en-GB', {
                                      weekday: 'short',
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    }) : 'TBD'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[var(--color-muted-foreground)]">Duration:</span>
                                  <span className="ml-2 font-medium">
                                    {segment.flightDuration || 'TBD'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[var(--color-muted-foreground)]">Airline:</span>
                                  <span className="ml-2 font-medium">
                                    {segment.marketingAirlineName || segment.operatingAirlineName || 'TBD'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[var(--color-muted-foreground)]">Aircraft:</span>
                                  <span className="ml-2 font-medium">
                                    {segment.aircraftType || 'TBD'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[var(--color-muted-foreground)]">Class:</span>
                                  <span className="ml-2 font-medium">
                                    {segment.cabinName || segment.cabinId || 'TBD'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[var(--color-muted-foreground)]">Terminals:</span>
                                  <span className="ml-2 font-medium">
                                    {segment.departureTerminal && segment.arrivalTerminal ? 
                                      `${segment.departureTerminal} → ${segment.arrivalTerminal}` : 'TBD'
                                    }
                                  </span>
                                </div>
                              </div>

                              {/* Layover information (if not the last segment) */}
                              {!segment.isLastSegment && f.outboundLayoverInfo && f.outboundLayoverInfo[segmentIndex] && (
                                <div className="bg-muted/50 p-2 rounded text-xs">
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium">
                                      Layover at {f.outboundLayoverInfo[segmentIndex].airport}
                                    </span>
                                    <span className="text-muted-foreground">
                                      {f.outboundLayoverInfo[segmentIndex].duration}
                                    </span>
                                  </div>
                                  {f.outboundLayoverInfo[segmentIndex].terminal && (
                                    <div className="text-muted-foreground">
                                      Terminal {f.outboundLayoverInfo[segmentIndex].terminal}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        /* Fallback to single segment display */
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-[var(--color-muted-foreground)]">Flight Number:</span>
                            <span className="ml-2 font-medium">
                              {f.outboundFlightNumber || f.flightNumber || f.airline || 'TBD'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[var(--color-muted-foreground)]">Route:</span>
                            <span className="ml-2 font-medium">
                              {f.outboundDepartureAirportId || f.outboundDepartureAirportCode || f.origin} → {f.outboundArrivalAirportId || f.outboundArrivalAirportCode || f.destination}
                            </span>
                          </div>
                          <div>
                            <span className="text-[var(--color-muted-foreground)]">Airports:</span>
                            <span className="ml-2 font-medium">
                              {f.outboundDepartureAirportName || f.outboundDepartureAirportCode || f.origin} → {f.outboundArrivalAirportName || f.outboundArrivalAirportCode || f.destination}
                            </span>
                          </div>
                          <div>
                            <span className="text-[var(--color-muted-foreground)]">Departure:</span>
                            <span className="ml-2 font-medium">
                              {f.outboundDepartureDateTime || f.departureDate ? new Date(f.outboundDepartureDateTime || f.departureDate).toLocaleString('en-GB', {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : 'TBD'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[var(--color-muted-foreground)]">Arrival:</span>
                            <span className="ml-2 font-medium">
                              {f.outboundArrivalDateTime ? new Date(f.outboundArrivalDateTime).toLocaleString('en-GB', {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : 'TBD'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[var(--color-muted-foreground)]">Duration:</span>
                            <span className="ml-2 font-medium">
                              {f.outboundFlightDuration || f.duration || 'TBD'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[var(--color-muted-foreground)]">Airline:</span>
                            <span className="ml-2 font-medium">
                              {f.outboundMarketingAirlineName || f.outboundOperatingAirlineName || f.airline || 'TBD'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[var(--color-muted-foreground)]">Aircraft:</span>
                            <span className="ml-2 font-medium">
                              {f.outboundAircraftType || f.aircraft || 'TBD'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[var(--color-muted-foreground)]">Class:</span>
                            <span className="ml-2 font-medium">
                              {f.outboundCabinName || f.outboundCabinId || f.cabin || 'TBD'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[var(--color-muted-foreground)]">Terminals:</span>
                            <span className="ml-2 font-medium">
                              {f.outboundDepartureTerminal && f.outboundArrivalTerminal ? 
                                `${f.outboundDepartureTerminal} → ${f.outboundArrivalTerminal}` : 
                                f.departureTerminal && f.arrivalTerminal ? 
                                `${f.departureTerminal} → ${f.arrivalTerminal}` : 'TBD'
                              }
                            </span>
                          </div>
                          <div>
                            <span className="text-[var(--color-muted-foreground)]">Stops:</span>
                            <span className="ml-2 font-medium">
                              {f.outboundStops?.length || f.stops || 0} {f.outboundStops?.length === 1 || f.stops === 1 ? 'stop' : 'stops'}
                            </span>
                          </div>
                          {/* Baggage Information */}
                          {(f.outboundCheckedBaggage || f.outboundCarryOnBaggage || f.outboundBaggageAllowance || f.baggageAllowance) && (
                            <div className="md:col-span-2">
                              <span className="text-[var(--color-muted-foreground)]">Baggage:</span>
                              <div className="ml-2 mt-1 space-y-1">
                                {f.outboundCheckedBaggage && (
                                  <div className="flex items-center gap-1 text-xs">
                                    <BaggageClaim className="h-3 w-3" />
                                    <span className="font-medium">Checked:</span>
                                    {f.outboundCheckedBaggage.pieces && <span>{f.outboundCheckedBaggage.pieces} piece{f.outboundCheckedBaggage.pieces !== 1 ? 's' : ''}</span>}
                                    {f.outboundCheckedBaggage.weight && <span>{f.outboundCheckedBaggage.weight} {f.outboundCheckedBaggage.weightUnit}</span>}
                                    {f.outboundCheckedBaggage.dimensions && <span>({f.outboundCheckedBaggage.dimensions})</span>}
                                  </div>
                                )}
                                {f.outboundCarryOnBaggage && (
                                  <div className="flex items-center gap-1 text-xs">
                                    <BaggageClaim className="h-3 w-3" />
                                    <span className="font-medium">Carry-on:</span>
                                    {f.outboundCarryOnBaggage.pieces && <span>{f.outboundCarryOnBaggage.pieces} piece{f.outboundCarryOnBaggage.pieces !== 1 ? 's' : ''}</span>}
                                    {f.outboundCarryOnBaggage.weight && <span>{f.outboundCarryOnBaggage.weight} {f.outboundCarryOnBaggage.weightUnit}</span>}
                                    {f.outboundCarryOnBaggage.dimensions && <span>({f.outboundCarryOnBaggage.dimensions})</span>}
                                  </div>
                                )}
                                {f.outboundBaggageAllowance && !f.outboundCheckedBaggage && !f.outboundCarryOnBaggage && (
                                  <div className="flex items-center gap-1 text-xs">
                                    <BaggageClaim className="h-3 w-3" />
                                    <span>
                                      {typeof f.outboundBaggageAllowance === 'string'
                                        ? f.outboundBaggageAllowance
                                        : f.outboundBaggageAllowance.pieces
                                          ? `${f.outboundBaggageAllowance.pieces} pieces`
                                          : f.outboundBaggageAllowance.weight
                                            ? `${f.outboundBaggageAllowance.weight}${f.outboundBaggageAllowance.weightUnit || 'kg'}`
                                            : 'Baggage included'
                                      }
                                    </span>
                                  </div>
                                )}
                                {f.baggageAllowance && !f.outboundCheckedBaggage && !f.outboundCarryOnBaggage && !f.outboundBaggageAllowance && (
                                  <div className="flex items-center gap-1 text-xs">
                                    <BaggageClaim className="h-3 w-3" />
                                    <span>
                                      {typeof f.baggageAllowance === 'string'
                                        ? f.baggageAllowance
                                        : f.baggageAllowance.NumberOfPieces
                                          ? `${f.baggageAllowance.NumberOfPieces} pieces`
                                          : f.baggageAllowance.WeightInKilograms
                                            ? `${f.baggageAllowance.WeightInKilograms}kg`
                                            : 'Baggage included'
                                      }
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Inbound Flight Details (if return flight) */}
                    {f.returnDate && (f.inboundFlightNumber || f.returnFlightNumber || f.returnFlightSegments) && (
                      <div className="border-t border-[var(--color-border)] pt-3">
                        <div className="flex items-center gap-2 mb-2">
                          <PlaneLanding className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-sm">Return Flight</span>
                        </div>
                        
                        {/* Multi-segment return flight display */}
                        {f.returnFlightSegments && f.returnFlightSegments.length > 0 ? (
                          <div className="space-y-3 border border-primary/40 rounded-lg p-4">
                            {f.returnFlightSegments.map((segment: any, segmentIndex: number) => (
                              <div key={segmentIndex} className="space-y-2">
                                {/* Flight Segment */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                  <div>
                                    <span className="text-[var(--color-muted-foreground)]">Flight Number:</span>
                                    <span className="ml-2 font-medium">
                                      {segment.marketingAirlineId && segment.flightNumber ? 
                                        `${segment.marketingAirlineId}${segment.flightNumber}` : 
                                        f.inboundFlightNumber || f.returnFlightNumber || 'TBD'
                                      }
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[var(--color-muted-foreground)]">Route:</span>
                                    <span className="ml-2 font-medium">
                                      {segment.departureAirportId} → {segment.arrivalAirportId}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[var(--color-muted-foreground)]">Airports:</span>
                                    <span className="ml-2 font-medium">
                                      {segment.departureAirportName || segment.departureAirportId} → {segment.arrivalAirportName || segment.arrivalAirportId}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[var(--color-muted-foreground)]">Departure:</span>
                                    <span className="ml-2 font-medium">
                                      {segment.departureDateTime ? new Date(segment.departureDateTime).toLocaleString('en-GB', {
                                        weekday: 'short',
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      }) : 'TBD'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[var(--color-muted-foreground)]">Arrival:</span>
                                    <span className="ml-2 font-medium">
                                      {segment.arrivalDateTime ? new Date(segment.arrivalDateTime).toLocaleString('en-GB', {
                                        weekday: 'short',
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      }) : 'TBD'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[var(--color-muted-foreground)]">Duration:</span>
                                    <span className="ml-2 font-medium">
                                      {segment.flightDuration || 'TBD'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[var(--color-muted-foreground)]">Airline:</span>
                                    <span className="ml-2 font-medium">
                                      {segment.marketingAirlineName || segment.operatingAirlineName || 'TBD'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[var(--color-muted-foreground)]">Aircraft:</span>
                                    <span className="ml-2 font-medium">
                                      {segment.aircraftType || 'TBD'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[var(--color-muted-foreground)]">Class:</span>
                                    <span className="ml-2 font-medium">
                                      {segment.cabinName || segment.cabinId || 'TBD'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[var(--color-muted-foreground)]">Terminals:</span>
                                    <span className="ml-2 font-medium">
                                      {segment.departureTerminal && segment.arrivalTerminal ? 
                                        `${segment.departureTerminal} → ${segment.arrivalTerminal}` : 'TBD'
                                      }
                                    </span>
                                  </div>
                                </div>

                                {/* Layover information (if not the last segment) */}
                                {!segment.isLastSegment && f.inboundLayoverInfo && f.inboundLayoverInfo[segmentIndex] && (
                                  <div className="bg-muted/50 p-2 rounded text-xs">
                                    <div className="flex items-center justify-between">
                                      <span className="font-medium">
                                        Layover at {f.inboundLayoverInfo[segmentIndex].airport}
                                      </span>
                                      <span className="text-muted-foreground">
                                        {f.inboundLayoverInfo[segmentIndex].duration}
                                      </span>
                                    </div>
                                    {f.inboundLayoverInfo[segmentIndex].terminal && (
                                      <div className="text-muted-foreground">
                                        Terminal {f.inboundLayoverInfo[segmentIndex].terminal}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          /* Fallback to single segment display */
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-[var(--color-muted-foreground)]">Flight Number:</span>
                              <span className="ml-2 font-medium">
                                {f.inboundFlightNumber || f.returnFlightNumber || 'TBD'}
                              </span>
                            </div>
                            <div>
                              <span className="text-[var(--color-muted-foreground)]">Route:</span>
                              <span className="ml-2 font-medium">
                                {f.inboundDepartureAirportId || f.inboundDepartureAirportCode} → {f.inboundArrivalAirportId || f.inboundArrivalAirportCode}
                              </span>
                            </div>
                            <div>
                              <span className="text-[var(--color-muted-foreground)]">Airports:</span>
                              <span className="ml-2 font-medium">
                                {f.inboundDepartureAirportName || f.inboundDepartureAirportCode} → {f.inboundArrivalAirportName || f.inboundArrivalAirportCode}
                              </span>
                            </div>
                            <div>
                              <span className="text-[var(--color-muted-foreground)]">Departure:</span>
                              <span className="ml-2 font-medium">
                                {f.inboundDepartureDateTime ? new Date(f.inboundDepartureDateTime).toLocaleString('en-GB', {
                                  weekday: 'short',
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }) : 'TBD'}
                              </span>
                            </div>
                            <div>
                              <span className="text-[var(--color-muted-foreground)]">Arrival:</span>
                              <span className="ml-2 font-medium">
                                {f.inboundArrivalDateTime ? new Date(f.inboundArrivalDateTime).toLocaleString('en-GB', {
                                  weekday: 'short',
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }) : 'TBD'}
                              </span>
                            </div>
                            <div>
                              <span className="text-[var(--color-muted-foreground)]">Duration:</span>
                              <span className="ml-2 font-medium">
                                {f.inboundFlightDuration || f.returnDuration || 'TBD'}
                              </span>
                            </div>
                            <div>
                              <span className="text-[var(--color-muted-foreground)]">Airline:</span>
                              <span className="ml-2 font-medium">
                                {f.inboundMarketingAirlineName || f.inboundOperatingAirlineName || 'TBD'}
                              </span>
                            </div>
                            <div>
                              <span className="text-[var(--color-muted-foreground)]">Aircraft:</span>
                              <span className="ml-2 font-medium">
                                {f.inboundAircraftType || f.returnAircraft || 'TBD'}
                              </span>
                            </div>
                            <div>
                              <span className="text-[var(--color-muted-foreground)]">Class:</span>
                              <span className="ml-2 font-medium">
                                {f.inboundCabinName || f.inboundCabinId || 'TBD'}
                              </span>
                            </div>
                            <div>
                              <span className="text-[var(--color-muted-foreground)]">Terminals:</span>
                              <span className="ml-2 font-medium">
                                {f.inboundDepartureTerminal && f.inboundArrivalTerminal ? 
                                  `${f.inboundDepartureTerminal} → ${f.inboundArrivalTerminal}` : 
                                  f.returnDepartureTerminal && f.returnArrivalTerminal ? 
                                  `${f.returnDepartureTerminal} → ${f.returnArrivalTerminal}` : 'TBD'
                                }
                              </span>
                            </div>
                            <div>
                              <span className="text-[var(--color-muted-foreground)]">Stops:</span>
                              <span className="ml-2 font-medium">
                                {f.inboundStops?.length || f.returnStops || 0} {f.inboundStops?.length === 1 || f.returnStops === 1 ? 'stop' : 'stops'}
                              </span>
                            </div>
                            {/* Baggage Information for Return Flight */}
                            {(f.inboundCheckedBaggage || f.inboundCarryOnBaggage || f.inboundBaggageAllowance) && (
                              <div className="md:col-span-2">
                                <span className="text-[var(--color-muted-foreground)]">Baggage:</span>
                                <div className="ml-2 mt-1 space-y-1">
                                  {f.inboundCheckedBaggage && (
                                    <div className="flex items-center gap-1 text-xs">
                                      <BaggageClaim className="h-3 w-3" />
                                      <span className="font-medium">Checked:</span>
                                      {f.inboundCheckedBaggage.pieces && <span>{f.inboundCheckedBaggage.pieces} piece{f.inboundCheckedBaggage.pieces !== 1 ? 's' : ''}</span>}
                                      {f.inboundCheckedBaggage.weight && <span>{f.inboundCheckedBaggage.weight} {f.inboundCheckedBaggage.weightUnit}</span>}
                                      {f.inboundCheckedBaggage.dimensions && <span>({f.inboundCheckedBaggage.dimensions})</span>}
                                    </div>
                                  )}
                                  {f.inboundCarryOnBaggage && (
                                    <div className="flex items-center gap-1 text-xs">
                                      <BaggageClaim className="h-3 w-3" />
                                      <span className="font-medium">Carry-on:</span>
                                      {f.inboundCarryOnBaggage.pieces && <span>{f.inboundCarryOnBaggage.pieces} piece{f.inboundCarryOnBaggage.pieces !== 1 ? 's' : ''}</span>}
                                      {f.inboundCarryOnBaggage.weight && <span>{f.inboundCarryOnBaggage.weight} {f.inboundCarryOnBaggage.weightUnit}</span>}
                                      {f.inboundCarryOnBaggage.dimensions && <span>({f.inboundCarryOnBaggage.dimensions})</span>}
                                    </div>
                                  )}
                                  {f.inboundBaggageAllowance && !f.inboundCheckedBaggage && !f.inboundCarryOnBaggage && (
                                    <div className="flex items-center gap-1 text-xs">
                                      <BaggageClaim className="h-3 w-3" />
                                      <span>
                                        {typeof f.inboundBaggageAllowance === 'string'
                                          ? f.inboundBaggageAllowance
                                          : f.inboundBaggageAllowance.pieces
                                            ? `${f.inboundBaggageAllowance.pieces} pieces`
                                            : f.inboundBaggageAllowance.weight
                                              ? `${f.inboundBaggageAllowance.weight}${f.inboundBaggageAllowance.weightUnit || 'kg'}`
                                              : 'Baggage included'
                                        }
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Fare and Pricing Details */}
                    {(f.fareTypeName || f.fareSubTypeName || f.revenueStreamName || f.baseFare || f.taxes || f.fees) && (
                      <div className="border-t border-[var(--color-border)] pt-3">
                        <div className="flex items-center gap-2 mb-2">
                          <CreditCard className="h-4 w-4 text-purple-600" />
                          <span className="font-medium text-sm">Fare Details</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          {f.fareTypeName && (
                            <div>
                              <span className="text-[var(--color-muted-foreground)]">Fare Type:</span>
                              <span className="ml-2 font-medium">{f.fareTypeName}</span>
                            </div>
                          )}
                          {f.fareSubTypeName && (
                            <div>
                              <span className="text-[var(--color-muted-foreground)]">Fare Sub-Type:</span>
                              <span className="ml-2 font-medium">{f.fareSubTypeName}</span>
                            </div>
                          )}
                          {f.revenueStreamName && (
                            <div>
                              <span className="text-[var(--color-muted-foreground)]">Revenue Stream:</span>
                              <span className="ml-2 font-medium">{f.revenueStreamName}</span>
                            </div>
                          )}
                          {f.baseFare && (
                            <div>
                              <span className="text-[var(--color-muted-foreground)]">Base Fare:</span>
                              <span className="ml-2 font-medium">
                                {f.currencySymbol || f.currencyId || '£'}{f.baseFare.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          )}
                          {f.taxes && (
                            <div>
                              <span className="text-[var(--color-muted-foreground)]">Taxes:</span>
                              <span className="ml-2 font-medium">
                                {f.currencySymbol || f.currencyId || '£'}{f.taxes.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          )}
                          {f.fees && (
                            <div>
                              <span className="text-[var(--color-muted-foreground)]">Fees:</span>
                              <span className="ml-2 font-medium">
                                {f.currencySymbol || f.currencyId || '£'}{f.fees.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          )}
                          {f.ticketingDeadline && (
                            <div>
                              <span className="text-[var(--color-muted-foreground)]">Ticketing Deadline:</span>
                              <span className="ml-2 font-medium">
                                {new Date(f.ticketingDeadline).toLocaleDateString('en-GB')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Flight Summary */}
                    <div className="border-t border-[var(--color-border)] pt-3 mt-3">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                          <span className="text-[var(--color-muted-foreground)]">
                            Passengers: <span className="font-medium">{f.passengers}</span>
                          </span>
                          {f.refundable !== undefined && (
                            <span className="text-[var(--color-muted-foreground)]">
                              Refundable: <span className="font-medium">{f.refundable ? 'Yes' : 'No'}</span>
                            </span>
                          )}
                          {f.validatingAirlineName && (
                            <span className="text-[var(--color-muted-foreground)]">
                              Validating: <span className="font-medium">{f.validatingAirlineName}</span>
                            </span>
                          )}
                          {f.skytraxRating && (
                            <span className="text-[var(--color-muted-foreground)]">
                              Rating: <span className="font-medium">{f.skytraxRating}/5</span>
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            Total: £{(Number(f.price) * f.passengers).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : <span className="text-muted-foreground">None</span>}
          </div>
          {/* Lounge Pass */}
          <div>
            <h4 className="font-semibold mb-1 flex items-center gap-2">
              <Star className="h-4 w-4 text-[var(--color-primary-800)]" /> Lounge Pass
            </h4>
            {components.loungePass && components.loungePass.id ? (
              <div className="text-sm">
                {components.loungePass.variant} × {components.loungePass.quantity} @ £{Number(components.loungePass.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} each
              </div>
            ) : <span className="text-muted-foreground">None</span>}
          </div>
        </CardContent>
      </Card>
      {/* Payment Breakdown */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-[var(--color-primary-600)]" />
            Payment Schedule
            {data.summary.currency !== 'GBP' && (
              <Badge variant="outline" className="text-xs">
                {data.summary.currency}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Deposit */}
            <div className="p-4 border border-[var(--color-border)] rounded-lg bg-[var(--color-muted)]/20">
              <div className="text-sm font-semibold text-[var(--color-foreground)] mb-1">Deposit</div>
              <div className="text-2xl font-bold text-[var(--color-primary)] mb-2">
                {data.summary.currency === 'GBP' 
                  ? `£${data.payments.deposit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : CurrencyService.formatCurrency(data.payments.deposit, data.summary.currency)
                }
              </div>
              <div className="text-xs text-[var(--color-muted-foreground)]">
                Due: Upon acceptance of quote
              </div>
            </div>
            {/* Second Payment */}
            <div className="p-4 border border-[var(--color-border)] rounded-lg bg-[var(--color-muted)]/20">
              <div className="text-sm font-semibold text-[var(--color-foreground)] mb-1">Second Payment</div>
              <div className="text-2xl font-bold text-[var(--color-primary)] mb-2">
                {data.summary.currency === 'GBP' 
                  ? `£${data.payments.secondPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : CurrencyService.formatCurrency(data.payments.secondPayment, data.summary.currency)
                }
              </div>
              <div className="text-xs text-[var(--color-muted-foreground)] mb-2">
                Due: 2 months after deposit
              </div>
              <div className="flex items-center gap-2">
                <DatePicker
                  selected={form.watch('payments.secondPaymentDate') ? new Date(form.watch('payments.secondPaymentDate')) : null}
                  onChange={(date) => {
                    const newDate = date ? date.toISOString().slice(0, 10) : form.watch('payments.secondPaymentDate');
                    form.setValue('payments.secondPaymentDate', newDate);
                  }}
                  dateFormat="yyyy-MM-dd"
                  minDate={new Date()}
                  className="w-full text-xs border rounded px-2 py-1"
                  placeholderText="Select date"
                />
              </div>
            </div>
            {/* Final Payment */}
            <div className="p-4 border border-[var(--color-border)] rounded-lg bg-[var(--color-muted)]/20">
              <div className="text-sm font-semibold text-[var(--color-foreground)] mb-1">Final Payment</div>
              <div className="text-2xl font-bold text-[var(--color-primary)] mb-2">
                {data.summary.currency === 'GBP' 
                  ? `£${data.payments.finalPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : CurrencyService.formatCurrency(data.payments.finalPayment, data.summary.currency)
                }
              </div>
              <div className="text-xs text-[var(--color-muted-foreground)] mb-2">
                Due: 2 months after second payment
              </div>
              <div className="flex items-center gap-2">
                <DatePicker
                  selected={form.watch('payments.finalPaymentDate') ? new Date(form.watch('payments.finalPaymentDate')) : null}
                  onChange={(date) => {
                    const newDate = date ? date.toISOString().slice(0, 10) : form.watch('payments.finalPaymentDate');
                    form.setValue('payments.finalPaymentDate', newDate);
                  }}
                  dateFormat="yyyy-MM-dd"
                  minDate={new Date()}
                  className="w-full text-xs border rounded px-2 py-1"
                  placeholderText="Select date"
                />
              </div>
            </div>
          </div>
          <div className="text-center text-sm text-[var(--color-muted-foreground)]">
            Total: {data.summary.currency === 'GBP' 
              ? `£${data.payments.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : CurrencyService.formatCurrency(data.payments.total, data.summary.currency)
            }
          </div>
          {/* Payment Schedule Info */}
          <div className="mt-4 p-3 bg-[var(--color-muted)]/20 rounded-lg">
            <div className="text-xs text-[var(--color-muted-foreground)]">
              <strong>Payment Schedule:</strong> Deposit upon quote acceptance, second and final payments on the 1st of the month (2 months apart). 
              {selectedEvent?.startDate && (
                <span className="block mt-1">
                  <strong>Event Date:</strong> {selectedEvent.startDate} - Final payment adjusted to 7 days before event if needed, still on 1st of month when possible.
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Price Summary */}

      <div className="flex justify-end mt-8">
        {showPrices ? (
          ""
        ) : (
          <Button onClick={handleRequest} disabled={isGenerating || requesting}>
            {requesting ? 'Sending...' : 'Send Request'}
          </Button>
        )}
      </div>
    </div>
  );
} 