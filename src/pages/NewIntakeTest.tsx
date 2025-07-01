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
  Car
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { NewIntake } from '@/types/newIntake';
import { useAuth } from '@/lib/AuthProvider';
import { toast } from 'sonner';
import { NewIntakeForm } from '@/components/forms';
import { useNewIntakeStore } from '@/store/newIntake';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { newIntakeSchema } from '@/types/newIntake';

import bgImg from '@/assets/imgs/spencer-davis-Ivwyqtw3PzU-unsplash.jpg';

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
    title: "Trip Details",
    tips: [
      "Research peak/off-peak seasons to optimize pricing and availability",
      "Include nearby airports and transfer options for better logistics",
      "Consider visa requirements and entry restrictions for international travel"
    ],
    icon: Calendar
  },
  {
    step: 3,
    title: "Preferences",
    tips: [
      "Match luxury tone with premium hotels and exclusive experiences",
      "Adventure seekers prefer unique activities over traditional tours",
      "Family travelers need kid-friendly accommodations and activities"
    ],
    icon: CheckCircle
  },
  {
    step: 4,
    title: "Flights",
    tips: [
      "Fast-paced itineraries work best for business travelers",
      "Relaxed pace suits honeymooners and luxury clients",
      "Boutique hotels often provide better commission rates than chains"
    ],
    icon: Plane
  },
  {
    step: 5,
    title: "Hotels",
    tips: [
      "Include 15-20% buffer for seasonal price fluctuations",
      "Premium clients expect all-inclusive pricing with no hidden fees",
      "Consider currency exchange rates and payment processing fees"
    ],
    icon: Hotel
  },
  {
    step: 6,
    title: "Transfers",
    tips: [
      "AI recommendations are based on all previous form data and preferences",
      "Bundle packages offer significant savings over individual components",
      "Review AI reasoning to understand why each option was recommended"
    ],
    icon: Car
  },
  {
    step: 7,
    title: "Events",
    tips: [
      "Research booking lead times for popular attractions",
      "Include both guided tours and free time for flexibility",
      "Check cancellation policies for weather-dependent activities"
    ],
    icon: Calendar
  },
  {
    step: 8,
    title: "Summary",
    tips: [
      "Double-check all pricing and commission calculations",
      "Ensure client contact details are complete for follow-up",
      "Review proposal tone matches client's travel style"
    ],
    icon: FileText
  }
];

// Step configuration with CSS variables
const stepConfig = [
  { id: 1, title: "Client Selection", icon: Users, color: "var(--color-primary-500)" },
  { id: 2, title: "Trip Details", icon: Calendar, color: "var(--color-secondary-600)" },
  { id: 3, title: "Preferences", icon: CheckCircle, color: "var(--color-primary-600)" },
  { id: 4, title: "Flights", icon: Plane, color: "var(--color-secondary-700)" },
  { id: 5, title: "Hotels", icon: Hotel, color: "var(--color-primary-700)" },
  { id: 6, title: "Transfers", icon: Car, color: "var(--color-secondary-800)" },
  { id: 7, title: "Events", icon: Calendar, color: "var(--color-primary-800)" },
  { id: 8, title: "Summary", icon: FileText, color: "var(--color-secondary-900)" }
];

export function NewIntakeTest() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('form');

  // Use the same store as NewIntakeForm
  const {
    currentStep,
    setCurrentStep,
  } = useNewIntakeStore();

  const totalSteps = 8;

  // Create form instance for validation
  const form = useForm<NewIntake>({
    resolver: zodResolver(newIntakeSchema),
    mode: 'onChange',
  });

  // Calculate progress percentage (convert 0-based to 1-based for display)
  const progressPercentage = ((currentStep + 1) / totalSteps) * 100;

  const handleNext = async () => {
    // Define which fields to validate for each step
    const stepValidationFields = {
      0: ['client.firstName', 'client.lastName', 'client.email'], // Client Selection
      1: ['tripDetails.primaryDestination', 'tripDetails.startDate', 'tripDetails.endDate', 'tripDetails.totalTravelers.adults'], // Trip Details
      2: [], // Preferences (temporarily no validation)
      3: [], // Flights (optional - has toggle)
      4: [], // Hotels (optional)
      5: [], // Transfers (optional)
      6: [], // Events (optional)
      7: [], // Summary (optional)
    };

    const fieldsToValidate = stepValidationFields[currentStep as keyof typeof stepValidationFields] || [];
    
    // Only validate if there are fields to validate for this step
    let isValid = true;
    if (fieldsToValidate.length > 0) {
      isValid = await form.trigger(fieldsToValidate as any);
    }
    
    // For Step 2, always allow proceeding (temporary fix)
    if (currentStep === 2) {
      isValid = true;
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

  const handleSubmit = async (data: NewIntake) => {
    console.log('📋 New Intake Form Submitted:', data);
    setIsGenerating(true);
    setGenerationError(null);
    
    try {
      toast.success('New intake form submitted successfully!');
      
      // Here you would typically:
      // 1. Save to database
      // 2. Generate quote
      // 3. Send notifications
      // 4. Create itinerary
    } catch (error) {
      console.error('Failed to submit form:', error);
      setGenerationError(error instanceof Error ? error.message : 'Failed to submit form');
      toast.error('Failed to submit form. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveDraft = (data: NewIntake) => {
    console.log('💾 Draft Saved:', data);
    toast.success('Draft saved successfully!');
  };

  const handleGenerateItinerary = (data: NewIntake) => {
    console.log('🧠 Generate Itinerary:', data);
    toast.success('AI itinerary generation started!');
    
    // Here you would:
    // 1. Call AI service
    // 2. Generate itinerary based on preferences
    // 3. Return structured itinerary
  };

  const handleExportPDF = (data: NewIntake) => {
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
                      {currentStep === 0 && "Select or create a client for this proposal"}
                      {currentStep === 1 && "Define travel destinations and dates"}
                      {currentStep === 2 && "Set client preferences and budget"}
                      {currentStep === 3 && "Configure flight requirements"}
                      {currentStep === 4 && "Select accommodation options"}
                      {currentStep === 5 && "Arrange airport transfers"}
                      {currentStep === 6 && "Add events and activities"}
                      {currentStep === 7 && "Review and submit the proposal"}
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
                    <NewIntakeForm
                      onSubmit={handleSubmit}
                      onSaveDraft={handleSaveDraft}
                      onGenerateItinerary={handleGenerateItinerary}
                      onExportPDF={handleExportPDF}
                    />
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
      </div>
    </div>
  );
} 