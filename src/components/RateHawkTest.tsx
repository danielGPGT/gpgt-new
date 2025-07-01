import { useState } from 'react';
import { StepHotelSelection } from './forms/steps/StepHotelSelection';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { tripIntakeSchema, TripIntake } from '@/types/trip';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, Search } from 'lucide-react';
import { format } from 'date-fns';

export function RateHawkTest() {
  console.log('🔍 RateHawkTest component rendering...');
  
  // Generate valid future dates for testing
  const today = new Date();
  const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7);
  const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 10);
  
  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  const form = useForm<TripIntake>({
    resolver: zodResolver(tripIntakeSchema) as any,
    defaultValues: {
      travelerInfo: {
        name: 'Test User',
        email: 'test@example.com',
        phone: '1234567890',
        address: {
          street: '123 Test St',
          city: 'Test City',
          state: 'Test State',
          zipCode: '12345',
          country: 'Test Country',
        },
        travelType: 'solo',
        transportType: 'plane',
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        travelers: {
          adults: 2,
          children: 0,
        },
      },
      destinations: {
        from: 'New York',
        primary: '',
        additional: [],
        duration: 5,
      },
      style: {
        tone: 'luxury',
        interests: ['fine-dining', 'art'],
      },
      experience: {
        pace: 'balanced',
        accommodation: 'boutique',
        specialRequests: '',
      },
      budget: {
        amount: 5000,
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
  });

  console.log('📋 Form initialized with default values:', form.getValues());

  const [formData, setFormData] = useState<any>(null);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [shouldSearchHotels, setShouldSearchHotels] = useState(false);

  const handleSearchHotels = () => {
    setShouldSearchHotels(true);
  };

  const onSubmit = (data: TripIntake) => {
    console.log('✅ Form submitted:', data);
    setFormData(data);
  };

  console.log('🎨 Rendering RateHawkTest component...');

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            RateHawk Hotel Selection Test
            <Badge variant="default" className="bg-green-600 hover:bg-green-700">
              Live RateHawk Data Enabled
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <Label htmlFor="region-input">Destination (Region/City)</Label>
                  <Input
                    id="region-input"
                    placeholder="e.g. Paris"
                    {...form.register('destinations.primary')}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Start Date</Label>
                  <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={
                          'w-full justify-start text-left font-normal bg-white/80 backdrop-blur-sm border-2 border-[var(--border)] hover:border-[var(--primary)]/30 transition-colors duration-300' +
                          (!form.watch('travelerInfo.startDate') ? ' text-[var(--muted-foreground)]' : '')
                        }
                        type="button"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.watch('travelerInfo.startDate') ? (
                          format(new Date(form.watch('travelerInfo.startDate')), 'PPP')
                        ) : (
                          <span>Pick a start date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={form.watch('travelerInfo.startDate') ? new Date(form.watch('travelerInfo.startDate')) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const day = String(date.getDate()).padStart(2, '0');
                            const dateString = `${year}-${month}-${day}`;
                            form.setValue('travelerInfo.startDate', dateString);
                            setStartDateOpen(false);
                          }
                        }}
                        disabled={(date) => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          return date < today;
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label>End Date</Label>
                  <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={
                          'w-full justify-start text-left font-normal bg-white/80 backdrop-blur-sm border-2 border-[var(--border)] hover:border-[var(--primary)]/30 transition-colors duration-300' +
                          (!form.watch('travelerInfo.endDate') ? ' text-[var(--muted-foreground)]' : '')
                        }
                        type="button"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.watch('travelerInfo.endDate') ? (
                          format(new Date(form.watch('travelerInfo.endDate')), 'PPP')
                        ) : (
                          <span>Pick an end date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={form.watch('travelerInfo.endDate') ? new Date(form.watch('travelerInfo.endDate')) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const day = String(date.getDate()).padStart(2, '0');
                            const dateString = `${year}-${month}-${day}`;
                            form.setValue('travelerInfo.endDate', dateString);
                            setEndDateOpen(false);
                          }
                        }}
                        disabled={(date) => {
                          const startDate = form.watch('travelerInfo.startDate');
                          if (startDate) {
                            const startDateTime = new Date(startDate);
                            startDateTime.setHours(0, 0, 0, 0);
                            return date < startDateTime;
                          }
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          return date < today;
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="flex justify-center mb-6">
                <Button 
                  type="button" 
                  onClick={handleSearchHotels}
                  className="px-8 py-3 bg-primary hover:bg-primary/90 text-white font-medium"
                >
                  <Search className="h-5 w-5 mr-2" />
                  Search Hotels
                </Button>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg mb-4">
                <h4 className="font-semibold text-blue-800 mb-2">Debug Info:</h4>
                <p className="text-sm text-blue-700">
                  Destination: {form.watch('destinations.primary')} | 
                  Start Date: {form.watch('travelerInfo.startDate')} | 
                  End Date: {form.watch('travelerInfo.endDate')} | 
                  Adults: {form.watch('travelerInfo.travelers.adults')}
                </p>
              </div>
              <StepHotelSelection shouldSearch={shouldSearchHotels} onSearchComplete={() => setShouldSearchHotels(false)} />
              <div className="flex gap-4">
                <Button type="submit">
                  Submit Form
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    const values = form.getValues();
                    console.log('📋 Current form values:', values);
                    setFormData(values);
                  }}
                >
                  Show Form Values
                </Button>
              </div>
            </form>
          </FormProvider>

          {formData && (
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Form Data:</h3>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(formData, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 