import { useFormContext, Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import {
  DollarSign,
  Crown,
  TrendingUp,
  Plane,
  Building,
  Star,
} from 'lucide-react';

const currencyOptions = [
  { value: 'USD', label: 'USD ($)', symbol: '$' },
  { value: 'EUR', label: 'EUR (€)', symbol: '€' },
  { value: 'GBP', label: 'GBP (£)', symbol: '£' },
  { value: 'CAD', label: 'CAD (C$)', symbol: 'C$' },
  { value: 'AUD', label: 'AUD (A$)', symbol: 'A$' },
];

const experienceTypeOptions = [
  {
    value: 'exclusive',
    label: 'Exclusive Experiences',
    description: 'Premium, once-in-a-lifetime experiences with VIP access',
    icon: Crown,
  },
  {
    value: 'value',
    label: 'Value for Money',
    description: 'High-quality experiences at competitive prices',
    icon: TrendingUp,
  },
];

const travelClassOptions = [
  {
    value: 'economy',
    label: 'Economy',
    description: 'Standard travel class',
    icon: Plane,
  },
  {
    value: 'business',
    label: 'Business',
    description: 'Premium travel with enhanced comfort',
    icon: Building,
  },
  {
    value: 'first',
    label: 'First Class',
    description: 'Ultimate luxury travel experience',
    icon: Star,
  },
];

export function Step5Budget() {
  const form = useFormContext();

  return (
    <div className="space-y-10">
      {/* Budget Amount and Currency */}
      <div>
        <label className="block text-xl font-semibold mb-6 text-[var(--foreground)]">Set Your Budget</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-[var(--foreground)]">Total Budget</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[var(--muted-foreground)]" />
              <Input
                {...form.register('budget.amount', { valueAsNumber: true })}
                type="number"
                placeholder="0"
                className="pl-10 bg-white/80 backdrop-blur-sm border-2 border-[var(--border)] focus:border-[var(--primary)] transition-colors duration-300"
              />
            </div>
            {form.formState.errors.budget?.amount && (
              <p className="text-sm text-destructive mt-2 font-medium">{form.formState.errors.budget.amount.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-[var(--foreground)]">Currency</label>
            <Controller
              control={form.control}
              name="budget.currency"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="bg-white/80 backdrop-blur-sm border-2 border-[var(--border)] focus:border-[var(--primary)] transition-colors duration-300">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencyOptions.map(({ value, label, symbol }) => (
                      <SelectItem key={value} value={value}>
                        <span className="flex items-center gap-2">
                          <span className="font-medium">{symbol}</span>
                          <span>{label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.budget?.currency && (
              <p className="text-sm text-destructive mt-2 font-medium">{form.formState.errors.budget.currency.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Experience Type */}
      <div>
        <label className="block text-xl font-semibold mb-6 text-[var(--foreground)]">Experience Preference</label>
        <RadioGroup
          value={form.watch('budget.experienceType')}
          onValueChange={(value) => form.setValue('budget.experienceType', value as any)}
          className="space-y-4"
        >
          {experienceTypeOptions.map(({ value, label, description, icon: Icon }) => {
            const isSelected = form.watch('budget.experienceType') === value;
            return (
              <div
                key={value}
                className={cn(
                  'flex items-center gap-4 p-6 rounded-lg border-2 transition-all duration-300',
                  'bg-card backdrop-blur-sm hover:bg-primary/10 hover:shadow-lg',
                  isSelected 
                    ? 'border-[var(--primary)] bg-[var(--primary)]/5 shadow-lg' 
                    : 'border-[var(--border)] hover:border-[var(--primary)]/30'
                )}
              >
                <RadioGroupItem
                  value={value}
                  id={value}
                  className="data-[state=checked]:bg-[var(--primary)] data-[state=checked]:border-[var(--primary)]"
                />
                <Icon className={cn(
                  'h-8 w-8 transition-colors duration-300',
                  isSelected ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'
                )} />
                <div className="flex-1">
                  <label htmlFor={value} className="text-lg font-semibold text-[var(--foreground)] cursor-pointer block">
                    {label}
                  </label>
                  <p className="text-sm text-[var(--muted-foreground)] mt-1">{description}</p>
                </div>
              </div>
            );
          })}
        </RadioGroup>
        {form.formState.errors.budget?.experienceType && (
          <p className="text-sm text-destructive mt-4 font-medium">{form.formState.errors.budget.experienceType.message}</p>
        )}
      </div>

      {/* Travel Class */}
      <div>
        <label className="block text-xl font-semibold mb-6 text-[var(--foreground)]">Preferred Travel Class</label>
        <RadioGroup
          value={form.watch('budget.travelClass')}
          onValueChange={(value) => form.setValue('budget.travelClass', value as any)}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {travelClassOptions.map(({ value, label, description, icon: Icon }) => {
            const isSelected = form.watch('budget.travelClass') === value;
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
                <div className="flex flex-col items-center text-center gap-3">
                  <Icon className={cn(
                    'h-8 w-8 transition-colors duration-300',
                    isSelected ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'
                  )} />
                  <div>
                    <label htmlFor={value} className="text-lg font-semibold text-[var(--foreground)] cursor-pointer block">
                      {label}
                    </label>
                    <p className="text-sm text-[var(--muted-foreground)] mt-1">{description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </RadioGroup>
        {form.formState.errors.budget?.travelClass && (
          <p className="text-sm text-destructive mt-4 font-medium">{form.formState.errors.budget.travelClass.message}</p>
        )}
      </div>
    </div>
  );
} 