import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Package } from '@/types/packages';

interface StepPricingProps {
  form: UseFormReturn<Package>;
}

const CURRENCIES = [
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'CAD', label: 'CAD (C$)' },
  { value: 'AUD', label: 'AUD (A$)' },
];

const PRICING_TYPES = [
  { value: 'per_person', label: 'Per Person' },
  { value: 'per_group', label: 'Per Group' },
  { value: 'dynamic', label: 'Dynamic (API-based at quote time)' },
];

const MARGIN_TYPES = [
  { value: 'percentage', label: 'Percentage (%)' },
  { value: 'fixed', label: 'Fixed Amount' },
];

export function StepPricing({ form }: StepPricingProps) {
  const { register, setValue, watch } = form;
  const watchedPricing = watch('pricing');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Pricing Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pricing.basePrice">Base Price *</Label>
              <Input
                id="pricing.basePrice"
                type="number"
                min="0"
                step="any"
                placeholder="e.g., 2500"
                {...register('pricing.basePrice', { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pricing.currency">Currency</Label>
              <Select
                value={watchedPricing?.currency || 'GBP'}
                onValueChange={val => setValue('pricing.currency', val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pricing.pricingType">Pricing Type</Label>
            <Select
              value={watchedPricing?.pricingType || 'per_person'}
              onValueChange={val => setValue('pricing.pricingType', val)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRICING_TYPES.map(p => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pricing.marginType">Margin Type</Label>
              <Select
                value={watchedPricing?.marginType || 'percentage'}
                onValueChange={val => setValue('pricing.marginType', val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MARGIN_TYPES.map(m => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pricing.marginValue">
                Margin Value {watchedPricing?.marginType === 'percentage' ? '(%)' : '(Amount)'}
              </Label>
              <Input
                id="pricing.marginValue"
                type="number"
                min="0"
                step="any"
                placeholder={watchedPricing?.marginType === 'percentage' ? 'e.g., 15' : 'e.g., 500'}
                {...register('pricing.marginValue', { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pricing.internalNotes">Internal Notes (Agent Only)</Label>
            <Textarea
              id="pricing.internalNotes"
              placeholder="Internal notes about pricing, costs, or margins..."
              rows={3}
              {...register('pricing.internalNotes')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Pricing Summary */}
      {watchedPricing?.basePrice && (
        <Card>
          <CardHeader>
            <CardTitle>Pricing Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Base Price:</span>
                <span className="font-medium">
                  {watchedPricing.basePrice} {watchedPricing.currency}
                  {watchedPricing.pricingType === 'per_person' && ' per person'}
                  {watchedPricing.pricingType === 'per_group' && ' per group'}
                </span>
              </div>
              {watchedPricing.marginValue && (
                <div className="flex justify-between">
                  <span>Margin:</span>
                  <span className="font-medium">
                    {watchedPricing.marginValue}
                    {watchedPricing.marginType === 'percentage' ? '%' : ` ${watchedPricing.currency}`}
                  </span>
                </div>
              )}
              {watchedPricing.pricingType === 'dynamic' && (
                <div className="text-sm text-muted-foreground">
                  * Dynamic pricing will be calculated at quote time using live API data
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 