import { useState } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { tripIntakeSchema, TripIntake } from '@/types/trip';

export function useMultiStepForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 8;

  const form = useForm<TripIntake>({
    resolver: zodResolver(tripIntakeSchema) as any,
    defaultValues: {
      travelerInfo: {
        name: '',
        email: '',
        phone: '',
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: '',
        },
        travelType: 'solo',
        transportType: 'plane',
        startDate: '',
        endDate: '',
        travelers: {
          adults: 1,
          children: 0,
        },
      },
      destinations: {
        from: '',
        primary: '',
        additional: [],
        duration: 0,
      },
      style: {
        tone: 'luxury',
        interests: [],
      },
      experience: {
        pace: 'balanced',
        accommodation: 'boutique',
        specialRequests: '',
      },
      budget: {
        amount: 0,
        currency: 'USD',
        experienceType: 'exclusive',
        travelClass: 'business',
      },
      eventRequests: '',
      eventTypes: [],
      includeInventory: { flights: false, hotels: false, events: false },
      flightFilters: undefined,
      hotelFilters: undefined,
      eventFilters: undefined,
      agentContext: undefined,
    },
    mode: 'onTouched',
  });

  const nextStep = async () => {
    // Get specific fields to validate for the current step
    const fieldsToValidate = getFieldsForStep(currentStep);
    
    // For step 1, we need special validation logic since it's client selection
    if (currentStep === 1) {
      const clientId = form.getValues('clientId');
      const travelerName = form.getValues('travelerInfo.name');
      
      console.log('Step 1 validation check:', { clientId, travelerName });
      
      // Check if either a client is selected OR traveler info is filled
      if (!clientId && !travelerName) {
        // Trigger validation error for traveler name to show error message
        await form.trigger('travelerInfo.name');
        return;
      }
      
      // If client is selected but name is empty, try to trigger validation to clear errors
      if (clientId && !travelerName) {
        console.log('Client selected but name is empty, triggering validation');
        await form.trigger(['travelerInfo.name', 'travelerInfo.email', 'travelerInfo.phone']);
        return;
      }
    }
    
    const isValid = await form.trigger(fieldsToValidate);
    
    if (isValid && currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const getFieldsForStep = (step: number): (keyof TripIntake)[] => {
    switch (step) {
      case 1:
        // Step 1: Only validate that we have either a client ID or traveler name
        // The actual validation will be handled in nextStep() for step 1
        return [];
      case 2:
        // Step 2: Validate destinations, travel dates, transport type, traveler count, and travel type
        return [
          'destinations.from',
          'destinations.primary',
          'travelerInfo.transportType',
          'travelerInfo.startDate',
          'travelerInfo.endDate',
          'travelerInfo.travelers.adults',
          'travelerInfo.travelers.children',
          'travelerInfo.travelType'
        ] as any;
      case 3:
        return ['style.tone', 'style.interests'] as any;
      case 4:
        return ['experience.pace', 'experience.accommodation'] as any;
      case 5:
        return ['budget.amount', 'budget.currency', 'budget.experienceType', 'budget.travelClass'] as any;
      case 6:
        return []; // Package components step - no validation needed (AI recommendations)
      case 7:
        return ['eventRequests', 'eventTypes'] as any;
      case 8:
        return []; // Review step - no validation needed
      default:
        return [];
    }
  };

  return {
    form,
    currentStep,
    totalSteps,
    nextStep,
    prevStep,
    setCurrentStep,
    isFirstStep: currentStep === 1,
    isLastStep: currentStep === totalSteps,
    stepIndex: currentStep - 1,
  };
} 