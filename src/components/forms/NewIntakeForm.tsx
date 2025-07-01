import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ChevronLeft, 
  ChevronRight, 
  Users, 
  Plane, 
  Hotel, 
  Car, 
  Calendar,
  CheckCircle,
  FileText,
  Brain,
  Download,
  MessageSquare,
  RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';

import { newIntakeSchema, NewIntake } from '@/types/newIntake';
import { useNewIntakeStore } from '@/store/newIntake';
import { useGoogleMapsScript } from '@/hooks/useGoogleMapsScript';
import { StepClientSelection } from './steps/StepClientSelection';
import { StepTripDetails } from './steps/StepTripDetails';
import { StepPreferences } from './steps/StepPreferences';
import { Step3Flights } from './steps/Step3Flights';
import { Step4Hotels } from './steps/Step4Hotels';
import { Step5Transfers } from './steps/Step5Transfers';
import { Step6Events } from './steps/Step6Events';
import { Step7Summary } from './steps/Step7Summary';

interface NewIntakeFormProps {
  onSubmit?: (data: NewIntake) => void;
  onGenerateItinerary?: (data: NewIntake) => void;
  onExportPDF?: (data: NewIntake) => void;
  initialData?: Partial<NewIntake>;
}

const STEPS = [
  { id: 0, title: 'Client Selection', icon: Users, description: 'Select or create client' },
  { id: 1, title: 'Trip Details', icon: Calendar, description: 'Basic trip information' },
  { id: 2, title: 'Preferences', icon: CheckCircle, description: 'Client preferences' },
  { id: 3, title: 'Flights', icon: Plane, description: 'Flight requirements' },
  { id: 4, title: 'Hotels', icon: Hotel, description: 'Accommodation needs' },
  { id: 5, title: 'Transfers', icon: Car, description: 'Airport transfers' },
  { id: 6, title: 'Events', icon: Calendar, description: 'Events & excursions' },
  { id: 7, title: 'Summary', icon: FileText, description: 'Review & submit' },
];

export function NewIntakeForm({ 
  onSubmit, 
  onGenerateItinerary, 
  onExportPDF,
  initialData 
}: NewIntakeFormProps) {
  const {
    currentStep,
    isSubmitting,
    setCurrentStep,
    resetForm,
  } = useNewIntakeStore();

  const { isLoaded, error } = useGoogleMapsScript();
  const [showPreview, setShowPreview] = useState(false);

  const form = useForm<NewIntake>({
    resolver: zodResolver(newIntakeSchema),
    defaultValues: initialData || {
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
      tripDetails: {
        tripName: '',
        primaryDestination: '',
        startDate: '',
        endDate: '',
        duration: 0,
        purpose: 'leisure',
        totalTravelers: {
          adults: 1,
          children: 0,
        },
        useSubgroups: false,
        groups: [],
      },
      preferences: {
        tone: 'luxury',
        currency: 'GBP',
        budget: {
          amount: 0,
          type: 'total',
        },
        language: 'en',
        specialRequests: '',
        travelPriorities: ['comfort', 'experience'],
      },
      flights: {
        enabled: false,
        groups: [],
      },
      hotels: {
        enabled: false,
        groups: [],
      },
      transfers: {
        enabled: false,
        groups: [],
      },
      events: {
        enabled: false,
        events: [],
      },
      summary: {
        internalNotes: '',
        quoteReference: '',
        agentId: '',
      },
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'draft',
        version: '1.0',
      },
    },
    mode: 'onChange',
  });

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
    
    if (isValid && currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      if (onSubmit) {
        await onSubmit(data);
      }
      
      toast.success('Intake form submitted successfully!');
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to submit form. Please try again.');
    }
  });

  const handleGenerateItinerary = () => {
    const formData = form.getValues();
    if (onGenerateItinerary) {
      onGenerateItinerary(formData);
    }
  };

  const handleExportPDF = () => {
    const formData = form.getValues();
    if (onExportPDF) {
      onExportPDF(formData);
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset the form? This will clear all data and return to step 1. This action cannot be undone.')) {
      resetForm();
      form.reset();
      toast.success('Form reset successfully');
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <StepClientSelection />;
      case 1:
        return <StepTripDetails disabled={!isLoaded} />;
      case 2:
        return <StepPreferences />;
      case 3:
        return <Step3Flights />;
      case 4:
        return <Step4Hotels />;
      case 5:
        return <Step5Transfers />;
      case 6:
        return <Step6Events />;
      case 7:
        return <Step7Summary 
          onGenerateItinerary={handleGenerateItinerary}
          onExportPDF={handleExportPDF}
        />;
      default:
        return (
          <div className="p-6 text-center">
            <h3 className="text-lg font-semibold mb-2 text-[var(--foreground)]">Client Selection</h3>
            <p className="text-[var(--muted-foreground)]">Step component will be loaded here</p>
          </div>
        );
    }
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  // Handle Google Maps loading error
  if (error) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-2 text-red-600">Google Maps Error</h3>
            <p className="text-sm text-muted-foreground">{error}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Please check your internet connection and try refreshing the page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full">
      <FormProvider {...form}>
        <div className="transition-all duration-300 space-y-6">
          {renderStep()}
        </div>
      </FormProvider>
    </div>
  );
} 