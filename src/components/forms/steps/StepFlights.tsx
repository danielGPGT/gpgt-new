import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Plane, 
  Settings, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';

import { NewIntake } from '@/types/newIntake';

interface StepFlightsProps {
  disabled?: boolean;
}

export function StepFlights({ disabled }: StepFlightsProps) {
  const form = useFormContext<NewIntake>();
  const flightsEnabled = form.watch('flights.enabled');
  const groups = form.watch('tripDetails.groups');
  const useSubgroups = form.watch('tripDetails.useSubgroups');

  return (
    <div className="space-y-6">
      {/* Enable/Disable Flights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="w-5 h-5" />
            Flight Requirements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Include Flights</Label>
              <p className="text-sm text-gray-600">
                Search and book flights for this trip
              </p>
            </div>
            <Controller
              name="flights.enabled"
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

      {/* Flight Configuration */}
      {flightsEnabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Flight Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!useSubgroups ? (
              /* Simple Flight Setup */
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-900">Simple Flight Setup</span>
                </div>
                <p className="text-sm text-blue-700">
                  Flight preferences will be configured based on the primary destination and traveler count.
                </p>
              </div>
            ) : (
              /* Group-based Flight Setup */
              <div className="space-y-4">
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-orange-600" />
                    <span className="font-medium text-orange-900">Group Flight Configuration</span>
                  </div>
                  <p className="text-sm text-orange-700">
                    Configure flight preferences for each traveler group. This allows different groups to have 
                    different departure airports, cabin classes, and airline preferences.
                  </p>
                </div>

                {groups.map((group) => (
                  <div key={group.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">{group.name}</h4>
                      <Badge variant="outline">
                        {group.adults} Adults, {group.children} Children
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label>Origin Airport</Label>
                        <div className="text-gray-600 mt-1">To be configured</div>
                      </div>
                      <div>
                        <Label>Destination Airport</Label>
                        <div className="text-gray-600 mt-1">Auto-filled from trip</div>
                      </div>
                      <div>
                        <Label>Cabin Class</Label>
                        <div className="text-gray-600 mt-1">Economy (default)</div>
                      </div>
                      <div>
                        <Label>Preferred Airlines</Label>
                        <div className="text-gray-600 mt-1">Any available</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Plane className="w-4 h-4 text-gray-600" />
                <span className="font-medium text-gray-900">Flight Search Features</span>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Real-time flight availability and pricing</li>
                <li>• Multiple cabin class options (Economy to First)</li>
                <li>• Preferred airline selection</li>
                <li>• Flexible date search</li>
                <li>• Frequent flyer program integration</li>
                <li>• Multi-city routing support</li>
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
            <h3 className="font-semibold text-green-900">Flight Summary</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-green-700">Flights Included:</span>
              <span className="font-medium">
                {flightsEnabled ? 'Yes' : 'No'}
              </span>
            </div>
            {flightsEnabled && (
              <>
                <div className="flex justify-between">
                  <span className="text-green-700">Configuration Type:</span>
                  <span className="font-medium">
                    {useSubgroups ? 'Group-based' : 'Simple'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Groups to Configure:</span>
                  <span className="font-medium">
                    {useSubgroups ? groups.length : 1}
                  </span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 