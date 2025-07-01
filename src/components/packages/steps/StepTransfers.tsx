import React from 'react';
import { UseFormReturn, useFieldArray } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Car, MapPin } from 'lucide-react';
import { Package } from '@/types/packages';

const VEHICLES = [
  'Sedan', 'SUV', 'Van', 'Minibus', 'Coach', 'Luxury Car', 'Limousine', 'Helicopter', 'Boat', 'Train'
];

const TRANSFER_TYPES = [
  { value: 'arrival', label: 'Arrival' },
  { value: 'inter_city', label: 'Inter-city' },
  { value: 'departure', label: 'Departure' },
];

interface StepTransfersProps {
  form: UseFormReturn<Package>;
}

export function StepTransfers({ form }: StepTransfersProps) {
  const { control, setValue, register, watch, formState: { errors } } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'transfers',
  });

  const watchedTransfers = watch('transfers');

  const handleAddTransfer = () => {
    append({
      id: `transfer_${Date.now()}`,
      type: 'arrival',
      fromLocation: '',
      toLocation: '',
      vehicle: '',
      notes: '',
      estimatedCost: undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Transfers</h3>
          <p className="text-muted-foreground">Add arrival, inter-city, or departure transfers</p>
        </div>
        <Button onClick={handleAddTransfer} type="button">
          <Plus className="w-4 h-4 mr-2" />
          Add Transfer
        </Button>
      </div>

      <div className="space-y-4">
        {fields.map((field, index) => {
          const transfer = watchedTransfers[index];
          return (
            <Card key={field.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Car className="w-5 h-5" />
                    Transfer {index + 1}
                  </CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`transfers.${index}.type`}>Type</Label>
                    <Select
                      value={transfer?.type || 'arrival'}
                      onValueChange={val => setValue(`transfers.${index}.type`, val)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TRANSFER_TYPES.map(t => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`transfers.${index}.fromLocation`}>From</Label>
                    <Input
                      id={`transfers.${index}.fromLocation`}
                      placeholder="e.g., Airport"
                      {...register(`transfers.${index}.fromLocation` as const)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`transfers.${index}.toLocation`}>To</Label>
                    <Input
                      id={`transfers.${index}.toLocation`}
                      placeholder="e.g., Hotel"
                      {...register(`transfers.${index}.toLocation` as const)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`transfers.${index}.vehicle`}>Vehicle</Label>
                    <Select
                      value={transfer?.vehicle || ''}
                      onValueChange={val => setValue(`transfers.${index}.vehicle`, val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select vehicle" />
                      </SelectTrigger>
                      <SelectContent>
                        {VEHICLES.map(v => (
                          <SelectItem key={v} value={v}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`transfers.${index}.estimatedCost`}>Estimated Cost</Label>
                    <Input
                      id={`transfers.${index}.estimatedCost`}
                      type="number"
                      min="0"
                      step="any"
                      placeholder="e.g., 80"
                      {...register(`transfers.${index}.estimatedCost` as const, { valueAsNumber: true })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`transfers.${index}.notes`}>Notes</Label>
                  <Textarea
                    id={`transfers.${index}.notes`}
                    placeholder="Any special requests or preferences..."
                    rows={2}
                    {...register(`transfers.${index}.notes` as const)}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      {fields.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Car className="w-12 h-12 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-lg font-medium">No transfers added</h3>
                <p className="text-muted-foreground">
                  Add your first transfer to start building your package
                </p>
              </div>
              <Button onClick={handleAddTransfer} type="button">
                <Plus className="w-4 h-4 mr-2" />
                Add First Transfer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      {errors.transfers && (
        <div className="text-sm text-destructive">
          {errors.transfers.message}
        </div>
      )}
    </div>
  );
} 