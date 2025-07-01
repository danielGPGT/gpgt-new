import { useFormContext, Controller } from 'react-hook-form';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import {
  Heart,
  Gem,
  Flower,
  Landmark,
  Mountain,
  PartyPopper,
  Utensils,
  Wine,
  Palette,
  BookOpen,
  Leaf,
  ShoppingBag,
  Umbrella,
  Moon,
  Dumbbell,
  Bath,
  Globe,
} from 'lucide-react';

const toneOptions = [
  { value: 'romantic', label: 'Romantic', icon: Heart },
  { value: 'luxury', label: 'Luxury', icon: Gem },
  { value: 'wellness', label: 'Wellness', icon: Flower },
  { value: 'cultural', label: 'Cultural', icon: Landmark },
  { value: 'adventure', label: 'Adventure', icon: Mountain },
  { value: 'celebration', label: 'Celebration', icon: PartyPopper },
];

const interestOptions = [
  { value: 'fine-dining', label: 'Fine Dining', icon: Utensils },
  { value: 'wine', label: 'Wine', icon: Wine },
  { value: 'art', label: 'Art', icon: Palette },
  { value: 'history', label: 'History', icon: BookOpen },
  { value: 'nature', label: 'Nature', icon: Leaf },
  { value: 'shopping', label: 'Shopping', icon: ShoppingBag },
  { value: 'beaches', label: 'Beaches', icon: Umbrella },
  { value: 'nightlife', label: 'Nightlife', icon: Moon },
  { value: 'sports', label: 'Sports', icon: Dumbbell },
  { value: 'spa', label: 'Spa', icon: Bath },
  { value: 'local-culture', label: 'Local Culture', icon: Globe },
];

export function Step3TripStyle() {
  const form = useFormContext();

  return (
    <div className="space-y-10">
      {/* Tone Picker */}
      <div>
        <label className="block text-xl font-semibold mb-6 text-[var(--foreground)]">Choose Your Trip Tone</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {toneOptions.map(({ value, label, icon: Icon }) => {
            const isSelected = form.watch('style.tone') === value;
            return (
              <Button
                key={value}
                type="button"
                variant="outline"
                onClick={() => form.setValue('style.tone', value)}
                className={cn(
                  'flex flex-col items-center gap-1 py-4 px-4 h-auto transition-all duration-300 border-2',
                  'bg-card backdrop-blur-sm hover:bg-primary/10 hover:shadow-lg',
                  isSelected 
                    ? 'border-[var(--primary)] bg-[var(--primary)]/5 shadow-lg' 
                    : 'border-[var(--border)] hover:border-[var(--primary)]/50'
                )}
              >
                <Icon className={cn(
                  'h-8 w-8 mb-2 transition-colors duration-300',
                  isSelected ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'
                )} />
                <span className={cn(
                  'text-base font-medium transition-colors duration-300',
                  isSelected ? 'text-[var(--primary)]' : 'text-[var(--foreground)]'
                )}>
                  {label}
                </span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Interests Multi-Select */}
      <div>
        <label className="block text-xl font-semibold mb-6 text-[var(--foreground)]">Select Your Interests</label>
        <Controller
          control={form.control}
          name="style.interests"
          render={({ field }) => (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {interestOptions.map(({ value, label, icon: Icon }) => {
                const isSelected = field.value?.includes(value);
                return (
                  <label 
                    key={value} 
                    className={cn(
                      'flex items-center gap-4 cursor-pointer p-4 rounded-lg border-2 transition-all duration-300',
                      'bg-card backdrop-blur-sm hover:bg-primary/10 hover:shadow-md',
                      isSelected 
                        ? 'border-[var(--primary)] bg-[var(--primary)]/5 shadow-md' 
                        : 'border-[var(--border)] hover:border-[var(--primary)]/30'
                    )}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={checked => {
                        if (checked) {
                          field.onChange([...(field.value || []), value]);
                        } else {
                          field.onChange((field.value || []).filter((i: string) => i !== value));
                        }
                      }}
                      className="data-[state=checked]:bg-[var(--primary)] data-[state=checked]:border-[var(--primary)]"
                    />
                    <Icon className={cn(
                      'h-6 w-6 transition-colors duration-300',
                      isSelected ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'
                    )} />
                    <span className={cn(
                      'text-base font-medium transition-colors duration-300',
                      isSelected ? 'text-[var(--primary)]' : 'text-[var(--foreground)]'
                    )}>
                      {label}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        />
        {form.formState.errors.style?.interests && (
          <p className="text-sm text-destructive mt-4 font-medium">{form.formState.errors.style.interests.message}</p>
        )}
      </div>
    </div>
  );
} 