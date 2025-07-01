import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Brain, X } from 'lucide-react';
import { toast } from 'sonner';

import { Package } from '@/types/packages';
import { usePackageStore } from '@/store/packages';

interface StepPackageOverviewProps {
  form: UseFormReturn<Package>;
}

const AVAILABLE_TAGS = [
  'luxury', 'beach', 'couple', 'group', 'multi-city', 'adventure', 
  'romantic', 'family', 'business', 'honeymoon', 'wellness', 'cultural',
  'food', 'wine', 'golf', 'skiing', 'safari', 'cruise', 'road-trip'
];

export function StepPackageOverview({ form }: StepPackageOverviewProps) {
  const { generateIntroCopy, isGeneratingAI } = usePackageStore();
  const { register, watch, setValue, formState: { errors } } = form;

  const watchedTags = watch('tags');
  const watchedName = watch('name');
  const watchedDescription = watch('description');
  const watchedDurationDays = watch('durationDays');
  const watchedMinTravelers = watch('minTravelers');
  const watchedMaxTravelers = watch('maxTravelers');

  const handleAddTag = (tag: string) => {
    if (!watchedTags.includes(tag)) {
      setValue('tags', [...watchedTags, tag]);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setValue('tags', watchedTags.filter(tag => tag !== tagToRemove));
  };

  const handleGenerateIntroCopy = async () => {
    const currentData = form.getValues();
    if (!currentData.name || currentData.destinations.length === 0) {
      toast.error('Please add a package name and at least one destination first');
      return;
    }

    const introCopy = await generateIntroCopy(currentData);
    if (introCopy) {
      setValue('description', introCopy);
      toast.success('Intro copy generated successfully!');
    }
  };

  return (
    <div className="space-y-6">
      {/* Package Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Package Name *</Label>
        <Input
          id="name"
          placeholder="e.g., Luxury Bali Honeymoon Package"
          {...register('name')}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="description">Description</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGenerateIntroCopy}
            disabled={isGeneratingAI || !watchedName}
          >
            <Brain className="w-4 h-4 mr-2" />
            {isGeneratingAI ? 'Generating...' : 'Generate Intro Copy'}
          </Button>
        </div>
        <Textarea
          id="description"
          placeholder="Describe your package to help clients understand what's included..."
          rows={4}
          {...register('description')}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      {/* Tags */}
      <div className="space-y-3">
        <Label>Tags</Label>
        <div className="flex flex-wrap gap-2">
          {watchedTags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="ml-1 hover:text-destructive"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_TAGS.filter(tag => !watchedTags.includes(tag)).map((tag) => (
            <Button
              key={tag}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleAddTag(tag)}
            >
              + {tag}
            </Button>
          ))}
        </div>
      </div>

      {/* Duration and Travelers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="durationDays">Duration (Days) *</Label>
          <Input
            id="durationDays"
            type="number"
            min="1"
            max="365"
            {...register('durationDays', { valueAsNumber: true })}
          />
          {errors.durationDays && (
            <p className="text-sm text-destructive">{errors.durationDays.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="minTravelers">Min Travelers *</Label>
          <Input
            id="minTravelers"
            type="number"
            min="1"
            max="100"
            {...register('minTravelers', { valueAsNumber: true })}
          />
          {errors.minTravelers && (
            <p className="text-sm text-destructive">{errors.minTravelers.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxTravelers">Max Travelers</Label>
          <Input
            id="maxTravelers"
            type="number"
            min={watchedMinTravelers}
            placeholder="No limit"
            {...register('maxTravelers', { valueAsNumber: true })}
          />
          {errors.maxTravelers && (
            <p className="text-sm text-destructive">{errors.maxTravelers.message}</p>
          )}
        </div>
      </div>

      {/* Visibility */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Package Visibility</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="isPublic">Make Package Public</Label>
              <p className="text-sm text-muted-foreground">
                Public packages can be viewed by other travel agents
              </p>
            </div>
            <Switch
              id="isPublic"
              checked={watch('isPublic')}
              onCheckedChange={(checked) => setValue('isPublic', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Package Summary */}
      {(watchedName || watchedDescription || watchedTags.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Package Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {watchedName && (
                <div>
                  <h3 className="font-semibold">{watchedName}</h3>
                </div>
              )}
              
              {watchedDescription && (
                <p className="text-muted-foreground">{watchedDescription}</p>
              )}
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {watchedDurationDays > 0 && (
                  <span>{watchedDurationDays} days</span>
                )}
                {watchedMinTravelers > 0 && (
                  <span>
                    {watchedMinTravelers}
                    {watchedMaxTravelers && watchedMaxTravelers > watchedMinTravelers 
                      ? `-${watchedMaxTravelers}` 
                      : ''} travelers
                  </span>
                )}
              </div>
              
              {watchedTags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {watchedTags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 