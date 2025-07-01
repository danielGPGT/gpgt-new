import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Settings, 
  CheckCircle,
  Plus
} from 'lucide-react';

import { NewIntake } from '@/types/newIntake';

interface StepEventsProps {
  disabled?: boolean;
}

export function StepEvents({ disabled }: StepEventsProps) {
  const form = useFormContext<NewIntake>();
  const eventsEnabled = form.watch('events.enabled');

  return (
    <div className="space-y-6">
      {/* Enable/Disable Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Events & Excursions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Include Events</Label>
              <p className="text-sm text-gray-600">
                Add events, concerts, sports, or excursions to the trip
              </p>
            </div>
            <Controller
              name="events.enabled"
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

      {/* Events Configuration */}
      {eventsEnabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Event Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-900">Event Types</span>
              </div>
              <p className="text-sm text-blue-700">
                Add F1 races, football matches, concerts, theatre shows, and more.
              </p>
            </div>

            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-gray-600" />
                <span className="font-medium text-gray-900">Event Features</span>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• F1 Grand Prix tickets and hospitality</li>
                <li>• Football match tickets and VIP packages</li>
                <li>• Concert and theatre tickets</li>
                <li>• Sightseeing tours and excursions</li>
                <li>• Seat preference selection</li>
                <li>• Add-on services (transfers, VIP lounges)</li>
              </ul>
            </div>

            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">
                <Plus className="w-8 h-8 mx-auto" />
              </div>
              <p className="text-sm text-gray-500">
                Event configuration will be available when events are added
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-green-900">Events Summary</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-green-700">Events Included:</span>
              <span className="font-medium">
                {eventsEnabled ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 