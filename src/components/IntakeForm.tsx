import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const tripPreferencesSchema = z.object({
  clientName: z.string().min(2, 'Client name is required'),
  destination: z.string().min(2, 'Destination is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  numberOfTravelers: z.number().min(1, 'Number of travelers is required'),
  budget: z.object({
    min: z.number().min(0, 'Minimum budget is required'),
    max: z.number().min(0, 'Maximum budget is required'),
    currency: z.string().min(1, 'Currency is required'),
  }),
  preferences: z.object({
    luxuryLevel: z.enum(['ultra-luxury', 'luxury', 'premium']),
    pace: z.enum(['relaxed', 'moderate', 'active']),
    interests: z.array(z.string()).min(1, 'Select at least one interest'),
    accommodationType: z.array(z.string()).min(1, 'Select at least one accommodation type'),
    diningPreferences: z.array(z.string()).min(1, 'Select at least one dining preference'),
  }),
  specialRequests: z.string().optional(),
});

type TripPreferences = z.infer<typeof tripPreferencesSchema>;

interface IntakeFormProps {
  onSubmit: (data: TripPreferences) => void;
  isLoading?: boolean;
}

export function IntakeForm({ onSubmit, isLoading }: IntakeFormProps) {
  const form = useForm<TripPreferences>({
    resolver: zodResolver(tripPreferencesSchema),
    defaultValues: {
      clientName: '',
      destination: '',
      startDate: '',
      endDate: '',
      numberOfTravelers: 1,
      budget: {
        min: 0,
        max: 0,
        currency: 'USD',
      },
      preferences: {
        luxuryLevel: 'luxury',
        pace: 'moderate',
        interests: [],
        accommodationType: [],
        diningPreferences: [],
      },
      specialRequests: '',
    },
  });

  const handleSubmit = async (data: TripPreferences) => {
    try {
      await onSubmit(data);
      toast.success('Preferences submitted successfully');
    } catch (error) {
      toast.error('Failed to submit preferences');
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 w-full">
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Client Name</label>
          <Input {...form.register('clientName')} />
          {form.formState.errors.clientName && (
            <p className="text-sm text-red-500">{form.formState.errors.clientName.message}</p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium">Destination</label>
          <Input {...form.register('destination')} />
          {form.formState.errors.destination && (
            <p className="text-sm text-red-500">{form.formState.errors.destination.message}</p>
          )}
        </div>

        {/* More form fields will be added here */}
        <p className="text-sm text-muted-foreground">More fields coming soon...</p>
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Generating...' : 'Generate Itinerary'}
      </Button>
    </form>
  );
} 