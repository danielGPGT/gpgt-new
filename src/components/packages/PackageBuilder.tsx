import React, { useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ChevronLeft, 
  ChevronRight, 
  Package as PackageIcon, 
  MapPin, 
  Plane, 
  Car, 
  Calendar,
  DollarSign,
  CheckCircle,
  Save,
  Eye,
  Copy,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';

import { packageSchema, Package, PackageBuilderStep } from '@/types/packages';
import { usePackageStore } from '@/store/packages';
import { StepPackageOverview } from './steps/StepPackageOverview';
import { StepDestinations } from './steps/StepDestinations';
import { StepFlights } from './steps/StepFlights';
import { StepTransfers } from './steps/StepTransfers';
import { StepEvents } from './steps/StepEvents';
import { StepPricing } from './steps/StepPricing';
import { StepReview } from './steps/StepReview';

interface PackageBuilderProps {
  packageId?: string;
  onSave?: (packageId: string) => void;
  onCancel?: () => void;
}

const STEPS: Array<{
  id: PackageBuilderStep;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}> = [
  { id: 'overview', title: 'Package Overview', icon: PackageIcon, description: 'Basic package information' },
  { id: 'destinations', title: 'Destinations & Hotels', icon: MapPin, description: 'Add destinations and accommodations' },
  { id: 'flights', title: 'Flights', icon: Plane, description: 'Flight requirements (optional)' },
  { id: 'transfers', title: 'Transfers', icon: Car, description: 'Airport transfers (optional)' },
  { id: 'events', title: 'Events & Activities', icon: Calendar, description: 'Events and excursions' },
  { id: 'pricing', title: 'Pricing & Markup', icon: DollarSign, description: 'Set pricing and margins' },
  { id: 'review', title: 'Review & Save', icon: CheckCircle, description: 'Review and publish package' },
];

export function PackageBuilder({ packageId, onSave, onCancel }: PackageBuilderProps) {
  const {
    currentStep,
    currentPackage,
    isSubmitting,
    isGeneratingAI,
    setCurrentStep,
    setCurrentPackage,
    updateCurrentPackage,
    resetBuilder,
    createPackage,
    updatePackage,
    fetchPackage,
  } = usePackageStore();

  const form = useForm<Package>({
    resolver: zodResolver(packageSchema),
    defaultValues: currentPackage || {
      name: '',
      description: '',
      tags: [],
      durationDays: 7,
      minTravelers: 1,
      maxTravelers: undefined,
      isPublic: false,
      status: 'draft',
      destinations: [],
      flights: {
        enabled: false,
      },
      transfers: [],
      events: [],
      itineraryText: '',
      pricing: {
        basePrice: 0,
        currency: 'GBP',
        pricingType: 'per_person',
        marginType: 'percentage',
        marginValue: 0.15,
        internalNotes: '',
      },
      version: '1.0',
    },
    mode: 'onChange',
  });

  // Load existing package if editing
  useEffect(() => {
    if (packageId) {
      fetchPackage(packageId).then((pkg) => {
        if (pkg) {
          setCurrentPackage(pkg);
          form.reset(pkg);
        }
      });
    } else {
      resetBuilder();
      form.reset();
    }
  }, [packageId, fetchPackage, setCurrentPackage, resetBuilder, form]);

  // Update form when currentPackage changes
  useEffect(() => {
    if (currentPackage) {
      form.reset(currentPackage);
    }
  }, [currentPackage, form]);

  const currentStepIndex = STEPS.findIndex(step => step.id === currentStep);
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;

  const handleNext = async () => {
    const isValid = await form.trigger();
    if (isValid && currentStepIndex < STEPS.length - 1) {
      const nextStep = STEPS[currentStepIndex + 1].id;
      setCurrentStep(nextStep);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      const prevStep = STEPS[currentStepIndex - 1].id;
      setCurrentStep(prevStep);
    }
  };

  const handleSave = async (status: 'draft' | 'published' = 'draft') => {
    const formData = form.getValues();
    const packageData = { ...formData, status };

    try {
      if (packageId) {
        const success = await updatePackage(packageId, packageData);
        if (success && onSave) {
          onSave(packageId);
        }
      } else {
        const newPackageId = await createPackage(packageData);
        if (newPackageId && onSave) {
          onSave(newPackageId);
        }
      }
    } catch (error) {
      console.error('Error saving package:', error);
    }
  };

  const handleSaveDraft = () => handleSave('draft');
  const handlePublish = () => handleSave('published');

  const renderStep = () => {
    switch (currentStep) {
      case 'overview':
        return <StepPackageOverview form={form} />;
      case 'destinations':
        return <StepDestinations form={form} />;
      case 'flights':
        return <StepFlights form={form} />;
      case 'transfers':
        return <StepTransfers form={form} />;
      case 'events':
        return <StepEvents form={form} />;
      case 'pricing':
        return <StepPricing form={form} />;
      case 'review':
        return <StepReview form={form} />;
      default:
        return null;
    }
  };

  const isLastStep = currentStepIndex === STEPS.length - 1;
  const isFirstStep = currentStepIndex === 0;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {packageId ? 'Edit Package' : 'Create New Package'}
          </h1>
          <p className="text-muted-foreground">
            Build a reusable travel package for your clients
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            variant="outline" 
            onClick={handleSaveDraft}
            disabled={isSubmitting}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
          {!isLastStep && (
            <Button 
              onClick={handlePublish}
              disabled={isSubmitting}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Publish
            </Button>
          )}
        </div>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                Step {currentStepIndex + 1} of {STEPS.length}
              </span>
              <span className="text-sm text-muted-foreground">
                {STEPS[currentStepIndex]?.title}
              </span>
            </div>
            <Progress value={progress} className="w-full" />
            <div className="flex justify-between text-xs text-muted-foreground">
              {STEPS.map((step, index) => (
                <div key={step.id} className="flex flex-col items-center">
                  {React.createElement(step.icon, { 
                    className: `w-4 h-4 ${
                      index <= currentStepIndex ? 'text-primary' : 'text-muted-foreground'
                    }`
                  })}
                  <span className="mt-1 text-center max-w-16">{step.title}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <FormProvider {...form}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {STEPS[currentStepIndex]?.icon && (
                React.createElement(STEPS[currentStepIndex].icon, { className: "w-5 h-5" })
              )}
              {STEPS[currentStepIndex]?.title}
            </CardTitle>
            <p className="text-muted-foreground">
              {STEPS[currentStepIndex]?.description}
            </p>
          </CardHeader>
          <CardContent>
            {renderStep()}
          </CardContent>
        </Card>
      </FormProvider>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={isFirstStep || isSubmitting}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        <div className="flex gap-2">
          {isLastStep ? (
            <>
              <Button 
                variant="outline" 
                onClick={handleSaveDraft}
                disabled={isSubmitting}
              >
                <Save className="w-4 h-4 mr-2" />
                Save as Draft
              </Button>
              <Button 
                onClick={handlePublish}
                disabled={isSubmitting}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Publish Package
              </Button>
            </>
          ) : (
            <Button 
              onClick={handleNext}
              disabled={isSubmitting || isGeneratingAI}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
} 