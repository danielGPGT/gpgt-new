import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
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
  Ticket
} from 'lucide-react';
import { useState, useEffect } from 'react';
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

// Package Intake Schema
const packageIntakeSchema = z.object({
  client: z.object({
    id: z.string().optional(),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Valid email is required'),
    phone: z.string().optional(),
    company: z.string().optional(),
    address: z.object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
      country: z.string().optional(),
    }).optional(),
    preferences: z.object({
      language: z.string().default('en'),
      tone: z.enum(['luxury', 'romantic', 'relaxed', 'vip', 'family']).optional(),
      notes: z.string().optional(),
    }).optional(),
    pastTrips: z.array(z.object({
      id: z.string(),
      destination: z.string(),
      date: z.string(),
      type: z.string(),
    })).optional(),
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
      id: z.string(),
      quantity: z.number().min(1),
      price: z.number(),
      roomType: z.string(),
    })).default([]),
    circuitTransfers: z.array(z.object({
      id: z.string(),
      quantity: z.number().min(1),
      price: z.number(),
      transferType: z.string(),
    })).default([]),
    airportTransfers: z.array(z.object({
      id: z.string(),
      quantity: z.number().min(1),
      price: z.number(),
      transportType: z.string(),
      transferDirection: z.enum(['outbound', 'return', 'both']).optional().default('outbound'),
    })).default([]),
  }).default({
    tickets: [],
    hotels: [],
    circuitTransfers: [],
    airportTransfers: [],
  }),
  flights: z.object({
    needed: z.boolean().default(false),
    selectedFlight: z.object({
      id: z.string().optional(),
      outboundFlightNumber: z.string().optional(),
      inboundFlightNumber: z.string().optional(),
      price: z.number().optional(),
    }).optional(),
  }).default({
    needed: false,
    selectedFlight: undefined,
  }),
  loungePass: z.object({
    needed: z.boolean().default(false),
    variant: z.enum(['Airport Lounge Pass included (Departure only)', 'Airport Lounge Pass included (Departure & Return)']).optional(),
    price: z.number().optional(),
  }).default({
    needed: false,
    variant: undefined,
    price: undefined,
  }),
  summary: z.object({
    totalPrice: z.number().default(0),
    currency: z.string().default('GBP'),
    internalNotes: z.string().optional(),
    quoteReference: z.string().optional(),
  }).default({
    totalPrice: 0,
    currency: 'GBP',
    internalNotes: '',
    quoteReference: '',
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
  { id: 6, title: "Flights", icon: Plane, color: "var(--color-secondary-800)" },
  { id: 7, title: "Lounge Pass", icon: Award, color: "var(--color-primary-800)" },
  { id: 8, title: "Summary", icon: FileText, color: "var(--color-secondary-900)" }
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
      "All components with the same event ID are interchangeable",
      "Quantities can be adjusted based on group size",
      "Review pricing and availability for each component"
    ],
    icon: Settings
  },
  {
    step: 7,
    title: "Flights",
    tips: [
      "Check flight availability for event dates",
      "Consider airport transfer requirements",
      "Compare prices across different airlines and routes"
    ],
    icon: Plane
  },
  {
    step: 8,
    title: "Lounge Pass",
    tips: [
      "Departure-only passes are more cost-effective",
      "Return passes provide comfort for the journey home",
      "Consider client travel preferences and budget"
    ],
    icon: Award
  },
  {
    step: 9,
    title: "Summary",
    tips: [
      "Double-check all pricing and component selections",
      "Ensure client contact details are complete",
      "Review the complete package before submission"
    ],
    icon: FileText
  }
];

export function PackageIntakeTest() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);

  const totalSteps = 8;

  // Create form instance for validation
  const form = useForm<PackageIntake>({
    resolver: zodResolver(packageIntakeSchema),
    mode: 'onChange',
    defaultValues: {
      client: {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        company: '',
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: '',
        },
        preferences: {
          language: 'en',
          tone: 'luxury',
          notes: '',
        },
        pastTrips: [],
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
      },
      flights: {
        needed: false,
        selectedFlight: undefined,
      },
      loungePass: {
        needed: false,
        variant: undefined,
        price: undefined,
      },
      summary: {
        totalPrice: 0,
        currency: 'GBP',
        internalNotes: '',
        quoteReference: '',
      },
    },
  });

  // Price Summary Card Component - defined inside to have access to form context
  function PriceSummaryCardContent() {
    const { watch } = useFormContext();
    const components = watch('components') || { tickets: [], hotels: [], circuitTransfers: [], airportTransfers: [] };
    const [hotelRooms, setHotelRooms] = useState<any[]>([]);
    
    // Fetch hotel room data for price calculation
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
    
    // Calculate hotel room prices dynamically
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
    
    const circuitTransfersTotal = (components.circuitTransfers || []).reduce((sum: number, c: any) => {
      const transferPrice = (c.price || 0) * (c.quantity || 0);
      return sum + transferPrice;
    }, 0);
    
    const airportTransfersTotal = (components.airportTransfers || []).reduce((sum: number, a: any) => {
      const directionMultiplier = a.transferDirection === 'both' ? 2 : 1;
      const transferPrice = (a.price || 0) * (a.quantity || 0) * directionMultiplier;
      return sum + transferPrice;
    }, 0);
    
    const total = ticketsTotal + hotelsTotal + circuitTransfersTotal + airportTransfersTotal;

    return (
      <Card className="bg-gradient-to-b from-card/95 to-background/20 border border-border rounded-2xl shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Price Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-base font-semibold">
              <span>Total</span>
              <span>£{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
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
              <span>Circuit Transfers {components.circuitTransfers?.length > 0 && `x ${components.circuitTransfers.reduce((sum: number, c: any) => sum + (c.quantity || 0), 0)}`}</span>
              <span>£{circuitTransfersTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Airport Transfers {components.airportTransfers?.length > 0 && `x ${components.airportTransfers.reduce((sum: number, a: any) => {
                const directionMultiplier = a.transferDirection === 'both' ? 2 : 1;
                return sum + ((a.quantity || 0) * directionMultiplier);
              }, 0)}`}</span>
              <span>£{airportTransfersTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            {components.airportTransfers?.length > 0 && (
              <div className="ml-4 text-xs text-[var(--color-muted-foreground)]">
                {components.airportTransfers.map((a: any, i: number) => {
                  const directionMultiplier = a.transferDirection === 'both' ? 2 : 1;
                  const totalTransfers = (a.quantity || 0) * directionMultiplier;
                  const transferPrice = (a.price || 0) * (a.quantity || 0) * directionMultiplier;
                  return (
                    <div key={i} className="flex justify-between">
                      <span>• {a.transferDirection || 'outbound'} ({totalTransfers} transfers)</span>
                      <span>£{transferPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

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
      5: [], // Flights (optional)
      6: [], // Lounge Pass (optional)
      7: [], // Summary
    };

    const fieldsToValidate = stepValidationFields[currentStep as keyof typeof stepValidationFields] || [];
    
    // Only validate if there are fields to validate for this step
    let isValid = true;
    if (fieldsToValidate.length > 0) {
      isValid = await form.trigger(fieldsToValidate as any);
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

  const handleGenerateQuote = (data: PackageIntake) => {
    console.log('🧠 Generate Quote:', data);
    toast.success('Quote generation started!');
    
    // Here you would:
    // 1. Calculate total pricing
    // 2. Generate quote document
    // 3. Send to client
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

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <StepClientSelection />;
      case 1:
        return <StepTravelerCount />;
      case 2:
        return <StepEventSelection setCurrentStep={setCurrentStep} currentStep={currentStep} />;
      case 3:
        return <StepPackageAndTierSelection setCurrentStep={setCurrentStep} currentStep={currentStep} />;
      case 4:
        return <StepComponents setCurrentStep={setCurrentStep} currentStep={currentStep} />;
      case 5:
        return <div className="p-6 text-center">
          <h3 className="text-lg font-semibold mb-2">Flights</h3>
          <p className="text-muted-foreground">Flights step will be implemented here</p>
        </div>;
      case 6:
        return <div className="p-6 text-center">
          <h3 className="text-lg font-semibold mb-2">Lounge Pass</h3>
          <p className="text-muted-foreground">Lounge pass step will be implemented here</p>
        </div>;
      case 7:
        return <div className="p-6 text-center">
          <h3 className="text-lg font-semibold mb-2">Summary</h3>
          <p className="text-muted-foreground">Summary step will be implemented here</p>
        </div>;
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
                      {currentStep === 5 && "Add flight requirements if needed"}
                      {currentStep === 6 && "Add lounge pass if needed"}
                      {currentStep === 7 && "Review and submit the package proposal"}
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
                      onClick={handleNext}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardFooter>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Price Summary - only show during components step */}
            {currentStep === 4 && (
              <PriceSummaryCardContent />
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