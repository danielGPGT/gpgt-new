import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Car, 
  Settings, 
  CheckCircle
} from 'lucide-react';

import { NewIntake } from '@/types/newIntake';

interface StepTransfersProps {
  disabled?: boolean;
}

export function StepTransfers({ disabled }: StepTransfersProps) {
  const form = useFormContext<NewIntake>();
  const transfersEnabled = form.watch('transfers.enabled');

  return (
    <div className="space-y-6">
      {/* Enable/Disable Transfers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="w-5 h-5" />
            Airport Transfers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Include Transfers</Label>
              <p className="text-sm text-gray-600">
                Arrange airport pickup and drop-off services
              </p>
            </div>
            <Controller
              name="transfers.enabled"
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

      {/* Transfer Configuration */}
      {transfersEnabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Transfer Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-900">Transfer Services</span>
              </div>
              <p className="text-sm text-blue-700">
                Configure airport transfers for arrival and departure.
              </p>
            </div>

            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Car className="w-4 h-4 text-gray-600" />
                <span className="font-medium text-gray-900">Transfer Features</span>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Arrival and departure transfers</li>
                <li>• Vehicle type selection (Sedan, Executive, Van, Minibus)</li>
                <li>• Pickup/drop-off location customization</li>
                <li>• Luggage capacity planning</li>
                <li>• Meet & greet services</li>
                <li>• Group transfer coordination</li>
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
            <h3 className="font-semibold text-green-900">Transfer Summary</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-green-700">Transfers Included:</span>
              <span className="font-medium">
                {transfersEnabled ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 