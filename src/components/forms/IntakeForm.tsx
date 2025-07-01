import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIntakeStore } from "@/store/intake";
import { Step6Events } from './steps/Step6Events';
import { Step6Inventory } from './steps/Step6Inventory';
import { StepHotelSelection } from './steps/StepHotelSelection';
import { createQuotePayload } from '@/utils/createQuotePayload';
import { useQuoteService } from '@/hooks/useQuoteService';
import { tripIntakeSchema, TripIntake, travelTypeEnum, toneEnum, paceEnum, accommodationEnum, experienceTypeEnum, travelClassEnum, interestsEnum } from '@/types/trip';

const interestsList = interestsEnum.options;
const toneList = toneEnum.options;
const travelTypeList = travelTypeEnum.options;
const paceList = paceEnum.options;
const accommodationList = accommodationEnum.options;
const experienceTypeList = experienceTypeEnum.options;
const travelClassList = travelClassEnum.options;

export function IntakeForm({ onSubmit }: { onSubmit?: (data: any) => void }) {
  const [step, setStep] = useState(0);
  const { setIntakeData } = useIntakeStore();
  const { createQuote, isCreatingQuote, error, clearError } = useQuoteService();
  
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
        travelers: { adults: 1, children: 0 },
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
      hotelSelection: {
        skipHotelSelection: false,
        selectedHotel: undefined,
        searchParams: undefined,
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

  const handleNext = async () => {
    // Validate only the fields for the current step
    let fieldsToValidate: string[] = [];
    if (step === 0) {
      fieldsToValidate = [
        'travelerInfo.name',
        'travelerInfo.email',
        'travelerInfo.phone',
        'travelerInfo.address.street',
        'travelerInfo.address.city',
        'travelerInfo.address.state',
        'travelerInfo.address.zipCode',
        'travelerInfo.address.country',
        'travelerInfo.travelType',
        'travelerInfo.transportType',
        'travelerInfo.startDate',
        'travelerInfo.endDate',
        'travelerInfo.travelers.adults',
        'travelerInfo.travelers.children',
      ];
    } else if (step === 1) {
      fieldsToValidate = [
        'destinations.from',
        'destinations.primary',
      ];
    } else if (step === 2) {
      fieldsToValidate = [
        'style.tone',
        'style.interests',
      ];
    } else if (step === 3) {
      fieldsToValidate = [
        'experience.pace',
        'experience.accommodation',
      ];
    } else if (step === 4) {
      fieldsToValidate = [
        'budget.amount',
        'budget.currency',
        'budget.experienceType',
        'budget.travelClass',
      ];
    } else if (step === 5) {
      // Hotel selection step - no validation required as it's optional
      fieldsToValidate = [];
    }
    const valid = await form.trigger(fieldsToValidate as any);
    if (valid) setStep((s) => s + 1);
  };
  
  const handlePrev = () => setStep((s) => s - 1);

  const handleFinalSubmit = form.handleSubmit(async (data: any) => {
    clearError();
    setIntakeData(data as TripIntake);
    
    try {
      const quotePayload = createQuotePayload(data as TripIntake);
      const quote = await createQuote(quotePayload);
      
      if (quote) {
        // Call the original onSubmit if provided
        if (onSubmit) {
          onSubmit(quote);
        }
        
        // You could also navigate to a quote review page here
        console.log('Quote created:', quote);
      }
    } catch (err) {
      console.error('Failed to create quote:', err);
    }
  });

  return (
    <form onSubmit={handleFinalSubmit} className="space-y-6 max-w-2xl mx-auto">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
      
      {step === 0 && (
        <div className="space-y-4">
          <div>
            <label className="block mb-2 text-sm font-medium">Full Name</label>
            <Input {...form.register('travelerInfo.name')} placeholder="Enter your full name" className="h-10" />
            {form.formState.errors.travelerInfo?.name && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.travelerInfo.name.message}</p>
            )}
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium">Email</label>
            <Input type="email" {...form.register('travelerInfo.email')} placeholder="Enter your email" className="h-10" />
            {form.formState.errors.travelerInfo?.email && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.travelerInfo.email.message}</p>
            )}
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium">Phone</label>
            <Input {...form.register('travelerInfo.phone')} placeholder="Enter your phone number" className="h-10" />
            {form.formState.errors.travelerInfo?.phone && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.travelerInfo.phone.message}</p>
            )}
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium">Street Address</label>
            <Input {...form.register('travelerInfo.address.street')} placeholder="Enter your street address" className="h-10" />
            {form.formState.errors.travelerInfo?.address?.street && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.travelerInfo.address.street.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 text-sm font-medium">City</label>
              <Input {...form.register('travelerInfo.address.city')} placeholder="City" className="h-10" />
              {form.formState.errors.travelerInfo?.address?.city && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.travelerInfo.address.city.message}</p>
              )}
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium">State/Province</label>
              <Input {...form.register('travelerInfo.address.state')} placeholder="State" className="h-10" />
              {form.formState.errors.travelerInfo?.address?.state && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.travelerInfo.address.state.message}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 text-sm font-medium">ZIP/Postal Code</label>
              <Input {...form.register('travelerInfo.address.zipCode')} placeholder="ZIP Code" className="h-10" />
              {form.formState.errors.travelerInfo?.address?.zipCode && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.travelerInfo.address.zipCode.message}</p>
              )}
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium">Country</label>
              <Input {...form.register('travelerInfo.address.country')} placeholder="Country" className="h-10" />
              {form.formState.errors.travelerInfo?.address?.country && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.travelerInfo.address.country.message}</p>
              )}
            </div>
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium">Travel Type</label>
            <Controller
              control={form.control}
              name="travelerInfo.travelType"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select travel type" />
                  </SelectTrigger>
                  <SelectContent>
                    {travelTypeList.map((type) => (
                      <SelectItem key={type} value={type} className="capitalize">{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium">Transport Type</label>
            <Controller
              control={form.control}
              name="travelerInfo.transportType"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select transport type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="plane">Plane</SelectItem>
                    <SelectItem value="train">Train</SelectItem>
                    <SelectItem value="car">Car</SelectItem>
                    <SelectItem value="ship">Ship</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 text-sm font-medium">Start Date</label>
              <Input type="date" {...form.register('travelerInfo.startDate')} className="h-10" />
              {form.formState.errors.travelerInfo?.startDate && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.travelerInfo.startDate.message}</p>
              )}
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium">End Date</label>
              <Input type="date" {...form.register('travelerInfo.endDate')} className="h-10" />
              {form.formState.errors.travelerInfo?.endDate && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.travelerInfo.endDate.message}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 text-sm font-medium">Adults</label>
              <Input type="number" min={1} {...form.register('travelerInfo.travelers.adults', { valueAsNumber: true })} className="h-10" />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium">Children</label>
              <Input type="number" min={0} {...form.register('travelerInfo.travelers.children', { valueAsNumber: true })} className="h-10" />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button type="button" onClick={handleNext} className="px-6">Next</Button>
          </div>
        </div>
      )}
      
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="block mb-2 text-sm font-medium">From</label>
            <Input {...form.register('destinations.from')} placeholder="e.g. London" className="h-10" />
            {form.formState.errors.destinations?.from && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.destinations.from.message}</p>
            )}
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium">Primary Destination</label>
            <Input {...form.register('destinations.primary')} placeholder="e.g. Paris" className="h-10" />
            {form.formState.errors.destinations?.primary && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.destinations.primary.message}</p>
            )}
          </div>
          <div className="flex justify-between pt-2">
            <Button type="button" variant="outline" onClick={handlePrev}>Back</Button>
            <Button type="button" onClick={handleNext}>Next</Button>
          </div>
        </div>
      )}
      
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label className="block mb-2 text-sm font-medium">Trip Style</label>
            <Controller
              control={form.control}
              name="style.tone"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select trip style" />
                  </SelectTrigger>
                  <SelectContent>
                    {toneList.map((tone) => (
                      <SelectItem key={tone} value={tone} className="capitalize">{tone}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium">Interests</label>
            <Controller
              control={form.control}
              name="style.interests"
              render={({ field }) => (
                <div className="grid grid-cols-2 gap-3">
                  {interestsList.map((interest) => (
                    <label key={interest} className="flex items-center space-x-2 p-3 border border-border/50 rounded-lg hover:bg-muted/30 cursor-pointer">
                      <Checkbox
                        checked={field.value?.includes(interest)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            field.onChange([...(field.value || []), interest]);
                          } else {
                            field.onChange((field.value || []).filter((i) => i !== interest));
                          }
                        }}
                      />
                      <span className="text-sm capitalize">{interest}</span>
                    </label>
                  ))}
                </div>
              )}
            />
            {form.formState.errors.style?.interests && (
              <p className="text-red-500 text-sm mt-2">{form.formState.errors.style.interests.message}</p>
            )}
          </div>
          <div className="flex justify-between pt-2">
            <Button type="button" variant="outline" onClick={handlePrev}>Back</Button>
            <Button type="button" onClick={handleNext}>Next</Button>
          </div>
        </div>
      )}
      
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <label className="block mb-2 text-sm font-medium">Experience Pace</label>
            <Controller
              control={form.control}
              name="experience.pace"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select experience pace" />
                  </SelectTrigger>
                  <SelectContent>
                    {paceList.map((pace) => (
                      <SelectItem key={pace} value={pace} className="capitalize">{pace}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium">Accommodation</label>
            <Controller
              control={form.control}
              name="experience.accommodation"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select accommodation" />
                  </SelectTrigger>
                  <SelectContent>
                    {accommodationList.map((accommodation) => (
                      <SelectItem key={accommodation} value={accommodation} className="capitalize">{accommodation}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium">Special Requests</label>
            <Input {...form.register('experience.specialRequests')} placeholder="Any special requests?" className="h-10" />
          </div>
          <div className="flex justify-between pt-2">
            <Button type="button" variant="outline" onClick={handlePrev}>Back</Button>
            <Button type="button" onClick={handleNext}>Next</Button>
          </div>
        </div>
      )}
      
      {step === 4 && (
        <div className="space-y-4">
          <div>
            <label className="block mb-2 text-sm font-medium">Budget Amount</label>
            <Input type="number" {...form.register('budget.amount', { valueAsNumber: true })} placeholder="5000" className="h-10" />
            {form.formState.errors.budget?.amount && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.budget.amount.message}</p>
            )}
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium">Currency</label>
            <Controller
              control={form.control}
              name="budget.currency"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.budget?.currency && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.budget.currency.message}</p>
            )}
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium">Experience Type</label>
            <Controller
              control={form.control}
              name="budget.experienceType"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select experience type" />
                  </SelectTrigger>
                  <SelectContent>
                    {experienceTypeList.map((experienceType) => (
                      <SelectItem key={experienceType} value={experienceType} className="capitalize">{experienceType}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium">Travel Class</label>
            <Controller
              control={form.control}
              name="budget.travelClass"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select travel class" />
                  </SelectTrigger>
                  <SelectContent>
                    {travelClassList.map((travelClass) => (
                      <SelectItem key={travelClass} value={travelClass} className="capitalize">{travelClass}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="flex justify-between pt-2">
            <Button type="button" variant="outline" onClick={handlePrev}>Back</Button>
            <Button type="button" onClick={handleNext}>Next</Button>
          </div>
        </div>
      )}

      {/* NEW: Step 5 - Hotel Selection */}
      {step === 5 && (
        <div className="space-y-4">
          <StepHotelSelection />
          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={handlePrev}>Back</Button>
            <Button type="button" onClick={handleNext}>Next</Button>
          </div>
        </div>
      )}
      
      {step === 6 && (
        <div className="space-y-4">
          <Step6Events />
          <Step6Inventory onBack={handlePrev} />
          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={handlePrev}>Back</Button>
            <Button type="submit" className="px-8" disabled={isCreatingQuote}>
              {isCreatingQuote ? 'Generating Quote...' : 'Generate Quote'}
            </Button>
          </div>
        </div>
      )}
    </form>
  );
} 