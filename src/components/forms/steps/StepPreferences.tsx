import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  Heart, 
  DollarSign, 
  Globe, 
  FileText,
  Zap,
  Clock,
  Star,
  Shield,
  TrendingDown,
  CheckCircle,
  Users,
  Crown
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { NewIntake, Tone, Currency, TravelPriority } from '@/types/newIntake';

interface StepPreferencesProps {
  disabled?: boolean;
}

const TONE_OPTIONS: { value: Tone; label: string; icon: any; description: string; color: string }[] = [
  { 
    value: 'luxury', 
    label: 'Luxury', 
    icon: Crown, 
    description: 'Premium experiences and high-end accommodations',
    color: 'bg-gradient-to-br from-amber-500/20 to-amber-600/10 text-amber-700 border-amber-200'
  },
  { 
    value: 'romantic', 
    label: 'Romantic', 
    icon: Heart, 
    description: 'Intimate settings and couple-focused activities',
    color: 'bg-gradient-to-br from-pink-500/20 to-pink-600/10 text-pink-700 border-pink-200'
  },
  { 
    value: 'relaxed', 
    label: 'Relaxed', 
    icon: Clock, 
    description: 'Leisurely pace with plenty of downtime',
    color: 'bg-gradient-to-br from-blue-500/20 to-blue-600/10 text-blue-700 border-blue-200'
  },
  { 
    value: 'vip', 
    label: 'VIP', 
    icon: Shield, 
    description: 'Exclusive access and personalized service',
    color: 'bg-gradient-to-br from-purple-500/20 to-purple-600/10 text-purple-700 border-purple-200'
  },
  { 
    value: 'family', 
    label: 'Family', 
    icon: Users, 
    description: 'Kid-friendly activities and family accommodations',
    color: 'bg-gradient-to-br from-green-500/20 to-green-600/10 text-green-700 border-green-200'
  },
];

const CURRENCY_OPTIONS: { value: Currency; label: string; symbol: string }[] = [
  { value: 'GBP', label: 'British Pound', symbol: '£' },
  { value: 'USD', label: 'US Dollar', symbol: '$' },
  { value: 'EUR', label: 'Euro', symbol: '€' },
];

const TRAVEL_PRIORITIES: { value: TravelPriority; label: string; icon: any; description: string; color: string }[] = [
  { 
    value: 'comfort', 
    label: 'Comfort', 
    icon: Star, 
    description: 'Premium seating, spacious accommodations',
    color: 'bg-gradient-to-br from-blue-500/20 to-blue-600/10 text-blue-700 border-blue-200'
  },
  { 
    value: 'speed', 
    label: 'Speed', 
    icon: Zap, 
    description: 'Direct flights, express services',
    color: 'bg-gradient-to-br from-orange-500/20 to-orange-600/10 text-orange-700 border-orange-200'
  },
  { 
    value: 'experience', 
    label: 'Experience', 
    icon: Heart, 
    description: 'Unique activities, local immersion',
    color: 'bg-gradient-to-br from-purple-500/20 to-purple-600/10 text-purple-700 border-purple-200'
  },
  { 
    value: 'privacy', 
    label: 'Privacy', 
    icon: Shield, 
    description: 'Private transfers, exclusive access',
    color: 'bg-gradient-to-br from-gray-500/20 to-gray-600/10 text-gray-700 border-gray-200'
  },
  { 
    value: 'cost', 
    label: 'Cost', 
    icon: TrendingDown, 
    description: 'Budget-friendly options, value for money',
    color: 'bg-gradient-to-br from-green-500/20 to-green-600/10 text-green-700 border-green-200'
  },
];

export function StepPreferences({ disabled }: StepPreferencesProps) {
  const form = useFormContext<NewIntake>();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mx-auto space-y-6"
    >
      {/* Trip Style */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-gradient-to-b from-[var(--card)]/95 to-[var(--background)]/20 border border-[var(--border)] rounded-2xl shadow-sm overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-[var(--card-foreground)]">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary)]/10 flex items-center justify-center border border-[var(--primary)]/20">
                <Heart className="h-5 w-5 text-[var(--primary)]" />
              </div>
              <div>
                <div className="text-lg font-semibold">Trip Style & Tone</div>
                <div className="text-sm font-normal text-[var(--muted-foreground)]">
                  Define the overall style and atmosphere of your journey
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Trip Tone Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-[var(--foreground)]">Preferred Trip Tone</Label>
                <Badge variant="outline" className="bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20 text-xs">
                  Select One
                </Badge>
              </div>
              
              <Controller
                name="preferences.tone"
                control={form.control}
                render={({ field }) => (
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
                  >
                    {TONE_OPTIONS.map((option) => (
                      <label
                        key={option.value}
                        className={cn(
                          "relative flex flex-col p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 group hover:shadow-md",
                          field.value === option.value
                            ? "border-[var(--primary)] bg-gradient-to-br from-[var(--primary)]/10 to-[var(--primary)]/5 shadow-sm"
                            : "border-[var(--border)] hover:border-[var(--primary)]/50 hover:bg-[var(--accent)]/50"
                        )}
                      >
                        <RadioGroupItem
                          value={option.value}
                          className="sr-only"
                        />
                        
                        {/* Selection Indicator */}
                        <div className={cn(
                          "absolute top-3 right-3 w-5 h-5 rounded-full border-2 transition-all duration-200",
                          field.value === option.value
                            ? "border-[var(--primary)] bg-[var(--primary)]"
                            : "border-[var(--border)] bg-[var(--background)]"
                        )}>
                          {field.value === option.value && (
                            <CheckCircle className="w-4 h-4 text-white" />
                          )}
                        </div>

                        {/* Icon */}
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-all duration-200",
                          option.color,
                          field.value === option.value && "scale-105"
                        )}>
                          <option.icon className="w-5 h-5" />
                        </div>

                        {/* Content */}
                        <div className="space-y-1">
                          <h3 className="font-semibold text-[var(--foreground)] text-base">
                            {option.label}
                          </h3>
                          <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                            {option.description}
                          </p>
                        </div>

                        {/* Hover Effect */}
                        <div className={cn(
                          "absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--primary)]/5 to-transparent opacity-0 transition-opacity duration-200",
                          "group-hover:opacity-100"
                        )} />
                      </label>
                    ))}
                  </RadioGroup>
                )}
              />
              
              {form.formState.errors.preferences?.tone && (
                <p className="text-red-500 text-sm mt-2">
                  {form.formState.errors.preferences.tone.message}
                </p>
              )}
            </div>

            {/* Language Preference */}
            <div className="space-y-2">
              <Label htmlFor="language" className="text-sm font-semibold text-[var(--foreground)]">
                Language Preference
              </Label>
              <Controller
                name="preferences.language"
                control={form.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger disabled={disabled} className="h-12 rounded-xl border-[var(--border)] bg-[var(--background)] focus:border-[var(--primary)] focus:ring-[var(--primary)]/20">
                      <SelectValue placeholder="Select your preferred language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">🇺🇸 English</SelectItem>
                      <SelectItem value="es">🇪🇸 Spanish</SelectItem>
                      <SelectItem value="fr">🇫🇷 French</SelectItem>
                      <SelectItem value="de">🇩🇪 German</SelectItem>
                      <SelectItem value="it">🇮🇹 Italian</SelectItem>
                      <SelectItem value="pt">🇵🇹 Portuguese</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Budget */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-gradient-to-b from-[var(--card)]/95 to-[var(--background)]/20 border border-[var(--border)] rounded-2xl shadow-sm overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-[var(--card-foreground)]">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--secondary)]/20 to-[var(--secondary)]/10 flex items-center justify-center border border-[var(--secondary)]/20">
                <DollarSign className="h-5 w-5 text-[var(--secondary)]" />
              </div>
              <div>
                <div className="text-lg font-semibold">Budget & Pricing</div>
                <div className="text-sm font-normal text-[var(--muted-foreground)]">
                  Set budget expectations and currency preferences
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budgetAmount" className="text-sm font-semibold text-[var(--foreground)]">
                  Budget Amount
                </Label>
                <Controller
                  name="preferences.budget.amount"
                  control={form.control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="budgetAmount"
                      type="number"
                      min="0"
                      step="100"
                      placeholder="5000 (optional)"
                      disabled={disabled}
                      value={field.value || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value === '' ? undefined : Number(value));
                      }}
                      className="h-12 rounded-xl border-[var(--border)] bg-[var(--background)] focus:border-[var(--primary)] focus:ring-[var(--primary)]/20"
                    />
                  )}
                />
                {form.formState.errors.preferences?.budget?.amount && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.preferences.budget.amount.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency" className="text-sm font-semibold text-[var(--foreground)]">
                  Currency
                </Label>
                <Controller
                  name="preferences.currency"
                  control={form.control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger disabled={disabled} className="h-12 rounded-xl border-[var(--border)] bg-[var(--background)] focus:border-[var(--primary)] focus:ring-[var(--primary)]/20">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCY_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{option.symbol}</span>
                              <span>{option.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="budgetType" className="text-sm font-semibold text-[var(--foreground)]">
                Budget Type
              </Label>
              <Controller
                name="preferences.budget.type"
                control={form.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger disabled={disabled} className="h-12 rounded-xl border-[var(--border)] bg-[var(--background)] focus:border-[var(--primary)] focus:ring-[var(--primary)]/20">
                      <SelectValue placeholder="Select budget type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="total">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          <span>Total Budget</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="per-person">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>Per Person</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Travel Priorities */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="bg-gradient-to-b from-[var(--card)]/95 to-[var(--background)]/20 border border-[var(--border)] rounded-2xl shadow-sm overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-[var(--card-foreground)]">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary-600)]/20 to-[var(--primary-600)]/10 flex items-center justify-center border border-[var(--primary-600)]/20">
                <Zap className="h-5 w-5 text-[var(--primary-600)]" />
              </div>
              <div>
                <div className="text-lg font-semibold">Travel Priorities</div>
                <div className="text-sm font-normal text-[var(--muted-foreground)]">
                  Select what matters most for this trip experience
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold text-[var(--foreground)]">Select Your Priorities</Label>
              <Badge variant="outline" className="bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20 text-xs">
                Multiple Choice
              </Badge>
            </div>
            
            <Controller
              name="preferences.travelPriorities"
              control={form.control}
              render={({ field }) => (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {TRAVEL_PRIORITIES.map((priority) => (
                    <label
                      key={priority.value}
                      className={cn(
                        "relative flex flex-col p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 group hover:shadow-md",
                        field.value?.includes(priority.value)
                          ? "border-[var(--primary)] bg-gradient-to-br from-[var(--primary)]/10 to-[var(--primary)]/5 shadow-sm"
                          : "border-[var(--border)] hover:border-[var(--primary)]/50 hover:bg-[var(--accent)]/50"
                      )}
                    >
                      <Checkbox
                        checked={field.value?.includes(priority.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            field.onChange([...(field.value || []), priority.value]);
                          } else {
                            field.onChange((field.value || []).filter((p) => p !== priority.value));
                          }
                        }}
                        className="sr-only"
                      />
                      
                                             {/* Selection Indicator */}
                       <div className={cn(
                         "absolute top-3 right-3 w-5 h-5 rounded-full border-2 transition-all duration-200 flex items-center justify-center",
                         field.value?.includes(priority.value)
                           ? "border-[var(--primary)] bg-[var(--primary)]"
                           : "border-[var(--border)] bg-[var(--background)]"
                       )}>
                         {field.value?.includes(priority.value) && (
                           <CheckCircle className="w-4 h-4 text-white" />
                         )}
                       </div>

                       {/* Icon */}
                       <div className={cn(
                         "w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-all duration-200",
                         priority.color,
                         field.value?.includes(priority.value) && "scale-105"
                       )}>
                         <priority.icon className="w-5 h-5" />
                       </div>

                       {/* Content */}
                       <div className="space-y-1">
                         <h3 className="font-semibold text-[var(--foreground)] text-base">
                           {priority.label}
                         </h3>
                         <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                           {priority.description}
                         </p>
                       </div>

                      {/* Hover Effect */}
                      <div className={cn(
                        "absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--primary)]/5 to-transparent opacity-0 transition-opacity duration-200",
                        "group-hover:opacity-100"
                      )} />
                    </label>
                  ))}
                </div>
              )}
            />
            {form.formState.errors.preferences?.travelPriorities && (
              <p className="text-red-500 text-sm mt-2">
                {form.formState.errors.preferences.travelPriorities.message}
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Special Requests */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <Card className="bg-gradient-to-b from-[var(--card)]/95 to-[var(--background)]/20 border border-[var(--border)] rounded-2xl shadow-sm overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-[var(--card-foreground)]">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--secondary-600)]/20 to-[var(--secondary-600)]/10 flex items-center justify-center border border-[var(--secondary-600)]/20">
                <FileText className="h-5 w-5 text-[var(--secondary-600)]" />
              </div>
              <div>
                <div className="text-lg font-semibold">Special Requests</div>
                <div className="text-sm font-normal text-[var(--muted-foreground)]">
                  Any additional requirements or preferences
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="specialRequests" className="text-sm font-semibold text-[var(--foreground)]">
                Additional Notes
              </Label>
              <Controller
                name="preferences.specialRequests"
                control={form.control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    id="specialRequests"
                    placeholder="Any special requests, dietary requirements, accessibility needs, or other preferences..."
                    disabled={disabled}
                    className="min-h-[100px] rounded-lg border-[var(--border)] bg-[var(--background)] focus:border-[var(--primary)] focus:ring-[var(--primary)]/20 resize-none text-sm"
                  />
                )}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Status Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className="flex justify-between items-center pt-6"
      >
        <div className="text-sm text-[var(--muted-foreground)]">
          <span className="font-medium">Preferences configured</span> - ready for next step
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20 px-3 py-1">
            <CheckCircle className="h-3 w-3 mr-1" />
            Configured
          </Badge>
        </div>
      </motion.div>
    </motion.div>
  );
} 