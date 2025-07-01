import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Hotel, 
  Settings, 
  CheckCircle,
  Star
} from 'lucide-react';

import { NewIntake } from '@/types/newIntake';

interface StepHotelsProps {
  disabled?: boolean;
}

export function StepHotels({ disabled }: StepHotelsProps) {
  const form = useFormContext<NewIntake>();
  const hotelsEnabled = form.watch('hotels.enabled');
  const groups = form.watch('tripDetails.groups');
  const useSubgroups = form.watch('tripDetails.useSubgroups');

  return (
    <div className="space-y-6">
      {/* Enable/Disable Hotels */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hotel className="w-5 h-5" />
            Hotel Accommodation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Include Hotels</Label>
              <p className="text-sm text-gray-600">
                Search and book hotel accommodations
              </p>
            </div>
            <Controller
              name="hotels.enabled"
              control={form.control}
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={disabled}
                />
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Hotel Configuration */}
      {hotelsEnabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Hotel Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-900">RateHawk Integration</span>
              </div>
              <p className="text-sm text-blue-700">
                Real-time hotel availability and pricing through RateHawk API.
              </p>
            </div>

            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Hotel className="w-4 h-4 text-gray-600" />
                <span className="font-medium text-gray-900">Hotel Features</span>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Real-time availability and pricing</li>
                <li>• Star rating filters (1-5 stars)</li>
                <li>• Room type selection</li>
                <li>• Amenity preferences</li>
                <li>• Location-based search</li>
                <li>• Group booking support</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-green-900">Hotel Summary</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-green-700">Hotels Included:</span>
              <span className="font-medium">
                {hotelsEnabled ? 'Yes' : 'No'}
              </span>
            </div>
            {hotelsEnabled && (
              <div className="flex justify-between">
                <span className="text-green-700">API Integration:</span>
                <span className="font-medium">RateHawk</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 