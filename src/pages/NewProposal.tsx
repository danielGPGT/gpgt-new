import { useMultiStepForm } from '@/hooks/useMultiStepForm';
import { Step1TravelerInfo } from '@/components/forms/steps/Step1TravelerInfo';
import { Step2Destinations } from '@/components/forms/steps/Step2Destinations';
import { Step3TripStyle } from '@/components/forms/steps/Step3TripStyle';
import { Step4Experience } from '@/components/forms/steps/Step4Experience';
import { Step5Budget } from '@/components/forms/steps/Step5Budget';
import { Step6Events } from '@/components/forms/steps/Step6Events';
import { Step6Review } from '@/components/forms/steps/Step6Review';
import { StepPackageComponents } from '@/components/forms/steps/StepPackageComponents';
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
  Eye
} from 'lucide-react';
import { StepTransition } from '@/components/forms/StepTransition';
import { useGoogleMapsScript } from '@/hooks/useGoogleMapsScript';
import { FormProvider } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { TripIntake } from '@/types/trip';
import { useAuth } from '@/lib/AuthProvider';
import { toast } from 'sonner';
import { useIntakeStore } from '@/store/intake';
import { useQuoteService } from '@/hooks/useQuoteService';
import { createQuotePayload } from '@/utils/createQuotePayload';
import { useNavigate } from 'react-router-dom';

import bgImg from '@/assets/imgs/spencer-davis-Ivwyqtw3PzU-unsplash.jpg';

// Helper to fetch event details and tickets from Sports Events 365 API
async function fetchEventDetailsAndTickets(eventId: string) {
  const API_KEY = import.meta.env.VITE_SPORTSEVENTS365_API_KEY || '';
  // Fetch event details
  const eventRes = await fetch(`https://api-v2.sandbox365.com/events/${eventId}`, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Accept': 'application/json',
    },
  });
  if (!eventRes.ok) throw new Error('Failed to fetch event');
  const event = await eventRes.json();

  // Fetch ticket options for the event
  const ticketRes = await fetch(`https://api-v2.sandbox365.com/events/${eventId}/tickets`, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Accept': 'application/json',
    },
  });
  if (!ticketRes.ok) throw new Error('Failed to fetch tickets');
  const tickets = await ticketRes.json();

  return { ...event, tickets: tickets.categories || [] };
}

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
    title: "Destinations",
    tips: [
      "Research peak/off-peak seasons to optimize pricing and availability",
      "Include nearby airports and transfer options for better logistics",
      "Consider visa requirements and entry restrictions for international travel"
    ],
    icon: MapPin
  },
  {
    step: 3,
    title: "Trip Style",
    tips: [
      "Match luxury tone with premium hotels and exclusive experiences",
      "Adventure seekers prefer unique activities over traditional tours",
      "Family travelers need kid-friendly accommodations and activities"
    ],
    icon: Star
  },
  {
    step: 4,
    title: "Experience",
    tips: [
      "Fast-paced itineraries work best for business travelers",
      "Relaxed pace suits honeymooners and luxury clients",
      "Boutique hotels often provide better commission rates than chains"
    ],
    icon: Activity
  },
  {
    step: 5,
    title: "Budget",
    tips: [
      "Include 15-20% buffer for seasonal price fluctuations",
      "Premium clients expect all-inclusive pricing with no hidden fees",
      "Consider currency exchange rates and payment processing fees"
    ],
    icon: DollarSign
  },
  {
    step: 6,
    title: "Package Components",
    tips: [
      "AI recommendations are based on all previous form data and preferences",
      "Bundle packages offer significant savings over individual components",
      "Review AI reasoning to understand why each option was recommended"
    ],
    icon: Sparkles
  },
  {
    step: 7,
    title: "Events & Activities",
    tips: [
      "Research booking lead times for popular attractions",
      "Include both guided tours and free time for flexibility",
      "Check cancellation policies for weather-dependent activities"
    ],
    icon: Calendar
  },
  {
    step: 8,
    title: "Review & Generate",
    tips: [
      "Double-check all pricing and commission calculations",
      "Ensure client contact details are complete for follow-up",
      "Review proposal tone matches client's travel style"
    ],
    icon: CheckCircle
  }
];

// Step configuration with CSS variables
const stepConfig = [
  { id: 1, title: "Client Selection", icon: Users, color: "var(--color-primary-500)" },
  { id: 2, title: "Destinations", icon: MapPin, color: "var(--color-secondary-600)" },
  { id: 3, title: "Trip Style", icon: Star, color: "var(--color-primary-600)" },
  { id: 4, title: "Experience", icon: Activity, color: "var(--color-secondary-700)" },
  { id: 5, title: "Budget", icon: DollarSign, color: "var(--color-primary-700)" },
  { id: 6, title: "Package Components", icon: Sparkles, color: "var(--color-secondary-800)" },
  { id: 7, title: "Events & Activities", icon: Calendar, color: "var(--color-primary-800)" },
  { id: 8, title: "Review & Generate", icon: CheckCircle, color: "var(--color-secondary-900)" }
];

export default function NewProposal() {
  const {
    form,
    currentStep,
    totalSteps,
    nextStep,
    prevStep,
    isFirstStep,
    isLastStep,
    stepIndex,
    setCurrentStep,
  } = useMultiStepForm();

  const { isLoaded, error } = useGoogleMapsScript();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const { user } = useAuth();
  const { createQuote, isCreatingQuote, error: quoteError, clearError } = useQuoteService();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('form');

  // Calculate progress percentage
  const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100;

  const onSubmit = async (data: any) => {
    console.log('🚀 Form submission started with data:', data);
    setIsGenerating(true);
    setGenerationError(null);
    clearError();
    
    try {
      const quotePayload = createQuotePayload(data as TripIntake);
      console.log('📋 Creating quote with payload:', quotePayload);
      
      const quote = await createQuote(quotePayload);
      
      if (quote && quote.id) {
        console.log('✅ Quote created successfully:', quote);
        toast.success('Quote generated successfully!');
        navigate(`/quote/${quote.id}`);
      } else {
        throw new Error('Failed to create quote');
      }
    } catch (error) {
      console.error('Failed to create quote:', error);
      setGenerationError(error instanceof Error ? error.message : 'Failed to generate quote');
      toast.error('Failed to generate quote. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const resetForm = () => {
    setGenerationError(null);
    form.reset();
  };

  if (error) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const currentStepConfig = stepConfig[currentStep - 1];
  const currentProTips = proTips[currentStep - 1];

  return (
    <div className="mx-auto px-8 pt-0 pb-8 space-y-8">
 
      
      {/* Main Content */}
      <div className="mx-auto py-6">
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
                      {currentStep === 1 && "Select or create a client for this proposal"}
                      {currentStep === 2 && "Define travel destinations and dates"}
                      {currentStep === 3 && "Choose the style and tone of the trip"}
                      {currentStep === 4 && "Set experience preferences and pace"}
                      {currentStep === 5 && "Define budget and travel class"}
                      {currentStep === 6 && "AI-powered package recommendations"}
                      {currentStep === 7 && "Add events and activities"}
                      {currentStep === 8 && "Review and generate the final proposal"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Form Content */}
            <Card className="py-0 bg-gradient-to-b from-card/95 to-background/20 border border-border rounded-2xl shadow-sm">
              <FormProvider {...form}>
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    if (isLastStep) {
                      form.handleSubmit(onSubmit)();
                    } else {
                      nextStep();
                    }
                  }}
                  className="min-h-[600px] flex flex-col"
                >
                  <CardContent className="p-6 flex-1">
                    {generationError && (
                      <Alert variant="destructive" className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{generationError}</AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="space-y-6">
                      <StepTransition step={1} currentStep={currentStep}>
                        <Step1TravelerInfo />
                      </StepTransition>
                      <StepTransition step={2} currentStep={currentStep}>
                        <Step2Destinations disabled={!isLoaded} />
                      </StepTransition>
                      <StepTransition step={3} currentStep={currentStep}>
                        <Step3TripStyle />
                      </StepTransition>
                      <StepTransition step={4} currentStep={currentStep}>
                        <Step4Experience />
                      </StepTransition>
                      <StepTransition step={5} currentStep={currentStep}>
                        <Step5Budget />
                      </StepTransition>
                      <StepTransition step={6} currentStep={currentStep}>
                        <StepPackageComponents />
                      </StepTransition>
                      <StepTransition step={7} currentStep={currentStep}>
                        <Step6Events />
                      </StepTransition>
                      <StepTransition step={8} currentStep={currentStep}>
                        <Step6Review />
                      </StepTransition>
                    </div>
                  </CardContent>

                  <CardFooter className="p-6 border-t border-border/30 bg-muted/20">
                    <div className="flex justify-between items-center w-full">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={prevStep}
                        disabled={isFirstStep || isGenerating}
                        className="border-border/50 bg-background hover:bg-muted px-6"
                      >
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Back
                      </Button>
                      
                      {isLastStep ? (
                        <Button
                          type="button"
                          disabled={isGenerating}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md px-8"
                          onClick={() => form.handleSubmit(onSubmit)()}
                        >
                          {isGenerating ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Generating Quote...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4 mr-2" />
                              Generate Quote
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          onClick={nextStep}
                          disabled={isGenerating}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md px-8"
                        >
                          Next
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                      )}
                    </div>
                  </CardFooter>
                </form>
              </FormProvider>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
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
                    {currentStep}
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">{currentProTips.title}</h4>
                    <p className="text-xs text-muted-foreground">Step {currentStep} of {totalSteps}</p>
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
                    <div className="text-2xl font-bold text-foreground">{currentStep}</div>
                    <div className="text-xs text-muted-foreground">Current Step</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/40 border border-border/50">
                    <div className="text-2xl font-bold text-foreground">{totalSteps - currentStep}</div>
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
      </div>
    </div>
  );
} 