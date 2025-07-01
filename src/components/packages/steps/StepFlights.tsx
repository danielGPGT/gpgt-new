import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Package } from '@/types/packages';

interface StepFlightsProps {
  form: UseFormReturn<Package>;
}

const CABIN_CLASSES = [
  { value: 'economy', label: 'Economy' },
  { value: 'premium_economy', label: 'Premium Economy' },
  { value: 'business', label: 'Business' },
  { value: 'first', label: 'First' },
];

export function StepFlights({ form }: StepFlightsProps) {
  const { register, setValue, watch } = form;
  const watchedFlights = watch('flights');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sample Flight Routing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="flights.fromCity">From City / Country</Label>
              <Input
                id="flights.fromCity"
                placeholder="e.g., London, UK"
                {...register('flights.fromCity')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="flights.toCity">To City / Country</Label>
              <Input
                id="flights.toCity"
                placeholder="e.g., Bali, Indonesia"
                {...register('flights.toCity')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="flights.cabinClass">Cabin Class</Label>
              <Select
                value={watchedFlights?.cabinClass || ''}
                onValueChange={val => setValue('flights.cabinClass', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select cabin class" />
                </SelectTrigger>
                <SelectContent>
                  {CABIN_CLASSES.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="flights.airlinePreference">Airline Preference</Label>
              <Input
                id="flights.airlinePreference"
                placeholder="e.g., Emirates, Qatar Airways"
                {...register('flights.airlinePreference')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="flights.estimatedCost">Estimated Cost / Price Band</Label>
            <Input
              id="flights.estimatedCost"
              type="number"
              min="0"
              step="any"
              placeholder="e.g., 1200 (per person)"
              {...register('flights.estimatedCost', { valueAsNumber: true })}
            />
          </div>

          <div className="flex items-center gap-4 mt-4">
            <Switch
              id="flights.quoteSeparately"
              checked={!!watchedFlights?.quoteSeparately}
              onCheckedChange={checked => setValue('flights.quoteSeparately', checked)}
            />
            <Label htmlFor="flights.quoteSeparately">Let agent quote flights separately</Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 