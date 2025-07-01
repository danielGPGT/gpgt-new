import { useFormContext } from 'react-hook-form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  Clock,
  Hotel,
  Mountain,
  Leaf,
  Building2,
} from 'lucide-react';

const paceOptions = [
  { value: 'relaxed', label: 'Relaxed', description: 'Leisurely pace with plenty of downtime' },
  { value: 'balanced', label: 'Balanced', description: 'Mix of activities and relaxation' },
  { value: 'packed', label: 'Packed', description: 'Full itinerary with maximum experiences' },
];

const accommodationOptions = [
  {
    value: 'boutique',
    label: 'Boutique Hotel',
    description: 'Intimate, stylish properties with personalized service',
    icon: Hotel,
  },
  {
    value: 'resort',
    label: '5-Star Resort',
    description: 'Luxury resorts with world-class amenities',
    icon: Building2,
  },
  {
    value: 'villa',
    label: 'Luxury Villa',
    description: 'Private villas with exclusive privacy and space',
    icon: Mountain,
  },
  {
    value: 'eco',
    label: 'Eco Lodge',
    description: 'Sustainable luxury in natural settings',
    icon: Leaf,
  },
];

export function Step4Experience() {
  const form = useFormContext();

  return (
    <div className="space-y-10">
      {/* Pace Selection */}
      <div>
        <label className="block text-xl font-semibold mb-6 text-[var(--foreground)]">Choose Your Travel Pace</label>
        <RadioGroup
          value={form.watch('experience.pace')}
          onValueChange={(value) => form.setValue('experience.pace', value as any)}
          className="space-y-4"
        >
          {paceOptions.map(({ value, label, description }) => {
            const isSelected = form.watch('experience.pace') === value;
            return (
              <div
                key={value}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-lg border-2 transition-all duration-300',
                  'bg-card backdrop-blur-sm hover:bg-primary/10 hover:shadow-md',
                  isSelected 
                    ? 'border-[var(--primary)] bg-[var(--primary)]/5 shadow-md' 
                    : 'border-[var(--border)] hover:border-[var(--primary)]/30'
                )}
              >
                <RadioGroupItem
                  value={value}
                  id={value}
                  className="data-[state=checked]:bg-[var(--primary)] data-[state=checked]:border-[var(--primary)]"
                />
                <div className="flex-1">
                  <label htmlFor={value} className="text-base font-medium text-[var(--foreground)] cursor-pointer">
                    {label}
                  </label>
                  <p className="text-sm text-[var(--muted-foreground)] mt-1">{description}</p>
                </div>
                <Clock className={cn(
                  'h-5 w-5 transition-colors duration-300',
                  isSelected ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'
                )} />
              </div>
            );
          })}
        </RadioGroup>
        {form.formState.errors.experience?.pace && (
          <p className="text-sm text-destructive mt-4 font-medium">{form.formState.errors.experience.pace.message}</p>
        )}
      </div>

      {/* Accommodation Style */}
      <div>
        <label className="block text-xl font-semibold mb-6 text-[var(--foreground)]">Select Your Accommodation Style</label>
        <RadioGroup
          value={form.watch('experience.accommodation')}
          onValueChange={(value) => form.setValue('experience.accommodation', value as any)}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {accommodationOptions.map(({ value, label, description, icon: Icon }) => {
            const isSelected = form.watch('experience.accommodation') === value;
            return (
              <div
                key={value}
                className={cn(
                  'relative p-6 rounded-lg border-2 transition-all duration-300',
                  'bg-card backdrop-blur-sm hover:bg-primary/10 hover:shadow-lg',
                  isSelected 
                    ? 'border-[var(--primary)] bg-[var(--primary)]/5 shadow-lg' 
                    : 'border-[var(--border)] hover:border-[var(--primary)]/30'
                )}
              >
                <RadioGroupItem
                  value={value}
                  id={value}
                  className="absolute top-4 right-4 data-[state=checked]:bg-[var(--primary)] data-[state=checked]:border-[var(--primary)]"
                />
                <div className="flex items-start gap-4">
                  <Icon className={cn(
                    'h-8 w-8 mt-1 transition-colors duration-300',
                    isSelected ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'
                  )} />
                  <div className="flex-1">
                    <label htmlFor={value} className="text-lg font-semibold text-[var(--foreground)] cursor-pointer block">
                      {label}
                    </label>
                    <p className="text-sm text-[var(--muted-foreground)] mt-2 leading-relaxed">
                      {description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </RadioGroup>
        {form.formState.errors.experience?.accommodation && (
          <p className="text-sm text-destructive mt-4 font-medium">{form.formState.errors.experience.accommodation.message}</p>
        )}
      </div>

      {/* Special Requests */}
      <div>
        <label className="block text-xl font-semibold mb-6 text-[var(--foreground)]">Special Requests</label>
        <div className="space-y-4">
          <Textarea
            {...form.register('experience.specialRequests')}
            placeholder="Tell us about any specific experiences, preferences, or special requests you'd like us to include in your itinerary..."
            className="min-h-[120px] bg-white/80 backdrop-blur-sm border-2 border-[var(--border)] focus:border-[var(--primary)] transition-colors duration-300"
          />
          <p className="text-sm text-[var(--muted-foreground)]">
            Examples: "Include wine tasting in Tuscany", "Prefer morning activities", "Need accessible accommodations"
          </p>
        </div>
        {form.formState.errors.experience?.specialRequests && (
          <p className="text-sm text-destructive mt-4 font-medium">{form.formState.errors.experience.specialRequests.message}</p>
        )}
      </div>
    </div>
  );
} 