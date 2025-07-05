import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Users,
  User,
  Plus,
  Minus,
  Calculator,
  Info,
  Heart,
  Group
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const travelerPresets = [
  { label: 'Solo', travelers: 1, icon: User, color: 'bg-muted hover:bg-muted/80' },
  { label: 'Couple', travelers: 2, icon: Heart, color: 'bg-muted hover:bg-muted/80' },
  { label: 'Small Group', travelers: 4, icon: Users, color: 'bg-muted hover:bg-muted/80' },
  { label: 'Large Group', travelers: 8, icon: Group, color: 'bg-muted hover:bg-muted/80' },
];

interface StepTravelerCountProps {
  disabled?: boolean;
}

export function StepTravelerCount({ disabled }: StepTravelerCountProps) {
  const form = useFormContext();
  const { control, watch, setValue, formState: { errors } } = form;

  const travelers = watch('travelers.total') || 1;

  const handleTravelersChange = (newValue: number) => {
    if (newValue < 1) {
      toast.error('At least one traveler is required');
      return;
    }
    if (newValue > 50) {
      toast.error('Maximum 50 travelers allowed');
      return;
    }
    setValue('travelers.total', newValue);
    setValue('travelers.adults', newValue);
    setValue('travelers.children', 0);
  };

  const handlePreset = (travelers: number) => {
    setValue('travelers.total', travelers);
    setValue('travelers.adults', travelers);
    setValue('travelers.children', 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-semibold text-foreground">How many people are traveling?</h3>
        <p className="text-muted-foreground">
          Specify the number of travelers to help us configure the perfect package for your group.
        </p>
      </div>

      {/* Quick Presets */}
      <div className="flex flex-wrap justify-center gap-3">
        {travelerPresets.map((preset) => (
          <Button
            key={preset.label}
            type="button"
            variant={travelers === preset.travelers ? "default" : "outline"}
            className="flex items-center gap-2"
            onClick={() => handlePreset(preset.travelers)}
            disabled={disabled}
          >
            <preset.icon className="h-4 w-4" />
            {preset.label}
          </Button>
        ))}
      </div>

      {/* Traveler Count Card */}
      <Card className="max-w-md mx-auto">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 justify-center">
            <Users className="h-5 w-5" />
            Number of Travelers
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center space-x-4">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => handleTravelersChange(travelers - 1)}
              disabled={travelers <= 1 || disabled}
              className="h-10 w-10"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground">{travelers}</div>
              <div className="text-sm text-muted-foreground">travelers</div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => handleTravelersChange(travelers + 1)}
              disabled={travelers >= 50 || disabled}
              className="h-10 w-10"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          {errors.travelers?.total && (
            <p className="text-sm text-destructive text-center">{errors.travelers.total.message}</p>
          )}
        </CardContent>
      </Card>



      {/* Info Section */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <h4 className="font-medium text-foreground">Traveler Information</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Group size affects room allocation and transfer requirements</li>
                <li>• Larger groups may qualify for special pricing</li>
                <li>• All travelers will be included in the package configuration</li>
                <li>• Maximum group size is 50 travelers</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validation Summary */}
      {Object.keys(errors).length > 0 && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-destructive">
              <Info className="h-4 w-4" />
              <span className="text-sm font-medium">Please fix the following issues:</span>
            </div>
            <ul className="mt-2 space-y-1">
              {errors.travelers?.total && (
                <li className="text-sm text-destructive">• {errors.travelers.total.message}</li>
              )}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 