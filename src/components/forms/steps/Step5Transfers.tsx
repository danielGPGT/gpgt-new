import React, { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Car, 
  Plane, 
  Users, 
  CheckCircle,
  Plus,
  Minus,
  MapPin,
  Clock,
  Package
} from 'lucide-react';
import { toast } from 'sonner';

import { NewIntake } from '@/types/newIntake';

interface Step5TransfersProps {
  disabled?: boolean;
}

const VEHICLE_TYPES = [
  { value: 'sedan', label: 'Sedan', description: '4 passengers, 2-3 bags' },
  { value: 'suv', label: 'SUV', description: '6 passengers, 4-6 bags' },
  { value: 'van', label: 'Van', description: '8 passengers, 6-8 bags' },
  { value: 'minibus', label: 'Minibus', description: '12 passengers, 12 bags' },
  { value: 'coach', label: 'Coach', description: '50+ passengers, 50+ bags' },
];

const TRANSFER_TYPES = [
  { value: 'airport-hotel', label: 'Airport to Hotel', description: 'Arrival transfer' },
  { value: 'hotel-airport', label: 'Hotel to Airport', description: 'Departure transfer' },
  { value: 'hotel-hotel', label: 'Hotel to Hotel', description: 'Inter-hotel transfer' },
  { value: 'round-trip', label: 'Round Trip', description: 'Return service' },
];

export function Step5Transfers({ disabled }: Step5TransfersProps) {
  const form = useFormContext<NewIntake>();
  const [transfersEnabled, setTransfersEnabled] = useState(false);

  // Watch form values
  const transferGroups = form.watch('transfers.groups') || [];
  const tripGroups = form.watch('tripDetails.groups') || [];
  const primaryDestination = form.watch('tripDetails.primaryDestination');
  const startDate = form.watch('tripDetails.startDate');
  const endDate = form.watch('tripDetails.endDate');

  // Initialize transfers enabled state
  useEffect(() => {
    const enabled = form.watch('transfers.enabled');
    setTransfersEnabled(enabled);
  }, [form.watch('transfers.enabled')]);

  // Handle transfers toggle
  const handleToggleTransfers = (enabled: boolean) => {
    setTransfersEnabled(enabled);
    form.setValue('transfers.enabled', enabled);
    
    if (enabled && transferGroups.length === 0) {
      // Auto-create transfer groups based on trip groups
      const newTransferGroups = tripGroups.map(group => ({
        id: `transfer_${group.id}`,
        groupId: group.id,
        type: 'airport-hotel',
        vehicleType: 'sedan',
        pickupLocation: 'Airport',
        dropoffLocation: primaryDestination || 'Hotel',
        pickupDate: startDate || '',
        pickupTime: '09:00',
        luggageCount: Math.ceil((group.adults + group.children) * 1.5), // Estimate luggage
        specialRequests: '',
        returnTransfer: false,
        returnDate: endDate || '',
        returnTime: '16:00',
      }));
      
      form.setValue('transfers.groups', newTransferGroups);
      toast.success('Transfer groups created based on travel groups');
    } else if (!enabled) {
      form.setValue('transfers.groups', []);
    }
  };

  // Check completion status
  const isComplete = transfersEnabled ? transferGroups.every(group => 
    group.pickupLocation && group.dropoffLocation && group.vehicleType
  ) : true;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mx-auto space-y-8"
    >
      <Card className="bg-gradient-to-br from-[var(--card)] via-[var(--card)]/95 to-[var(--background)]/30 border border-[var(--border)] rounded-3xl shadow-lg overflow-hidden backdrop-blur-sm">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-[var(--card-foreground)]">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary)]/10 flex items-center justify-center border border-[var(--primary)]/30 shadow-sm">
                <Car className="h-6 w-6 text-[var(--primary)]" />
              </div>
              <div>
                <div className="text-xl font-bold">Airport Transfers</div>
                <div className="text-sm font-normal text-[var(--muted-foreground)] mt-1">
                  Configure ground transportation for each travel group
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={transfersEnabled}
                onCheckedChange={handleToggleTransfers}
                disabled={disabled}
              />
              <Label className="text-sm font-medium">
                {transfersEnabled ? 'Include Transfers' : 'Exclude Transfers'}
              </Label>
            </div>
          </CardTitle>
        </CardHeader>

        {transfersEnabled && (
          <CardContent className="space-y-6">
            {transferGroups.length > 0 ? (
              <div className="space-y-4">
                {transferGroups.map((transferGroup, index) => {
                  const tripGroup = tripGroups.find(g => g.id === transferGroup.groupId);
                  const groupName = tripGroup?.name || `Group ${index + 1}`;

                  return (
                    <div
                      key={transferGroup.id}
                      className="border border-[var(--border)] rounded-2xl p-6 space-y-4 bg-gradient-to-br from-[var(--background)]/50 to-[var(--background)]/20 backdrop-blur-sm"
                    >
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-[var(--primary)]" />
                        <span className="font-semibold text-[var(--foreground)]">{groupName}</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-[var(--foreground)]">Transfer Type</Label>
                          <Select
                            value={transferGroup.type}
                            onValueChange={(value) => {
                              const updatedGroups = transferGroups.map(g => 
                                g.id === transferGroup.id ? { ...g, type: value } : g
                              );
                              form.setValue('transfers.groups', updatedGroups);
                            }}
                            disabled={disabled}
                          >
                            <SelectTrigger className="h-11 rounded-xl border-[var(--border)] bg-[var(--background)] focus:border-[var(--primary)] focus:ring-[var(--primary)]/20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TRANSFER_TYPES.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  <div>
                                    <div className="font-medium">{type.label}</div>
                                    <div className="text-xs text-[var(--muted-foreground)]">{type.description}</div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-[var(--foreground)]">Vehicle Type</Label>
                          <Select
                            value={transferGroup.vehicleType}
                            onValueChange={(value) => {
                              const updatedGroups = transferGroups.map(g => 
                                g.id === transferGroup.id ? { ...g, vehicleType: value } : g
                              );
                              form.setValue('transfers.groups', updatedGroups);
                            }}
                            disabled={disabled}
                          >
                            <SelectTrigger className="h-11 rounded-xl border-[var(--border)] bg-[var(--background)] focus:border-[var(--primary)] focus:ring-[var(--primary)]/20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {VEHICLE_TYPES.map((vehicle) => (
                                <SelectItem key={vehicle.value} value={vehicle.value}>
                                  <div>
                                    <div className="font-medium">{vehicle.label}</div>
                                    <div className="text-xs text-[var(--muted-foreground)]">{vehicle.description}</div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-[var(--foreground)] flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-[var(--primary)]" />
                            Pickup Location
                          </Label>
                          <Input
                            value={transferGroup.pickupLocation}
                            onChange={(e) => {
                              const updatedGroups = transferGroups.map(g => 
                                g.id === transferGroup.id ? { ...g, pickupLocation: e.target.value } : g
                              );
                              form.setValue('transfers.groups', updatedGroups);
                            }}
                            placeholder="e.g., Airport Terminal 1"
                            disabled={disabled}
                            className="h-11 rounded-xl border-[var(--border)] bg-[var(--background)] focus:border-[var(--primary)] focus:ring-[var(--primary)]/20"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-[var(--foreground)] flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-[var(--primary)]" />
                            Dropoff Location
                          </Label>
                          <Input
                            value={transferGroup.dropoffLocation}
                            onChange={(e) => {
                              const updatedGroups = transferGroups.map(g => 
                                g.id === transferGroup.id ? { ...g, dropoffLocation: e.target.value } : g
                              );
                              form.setValue('transfers.groups', updatedGroups);
                            }}
                            placeholder="e.g., Hotel Name"
                            disabled={disabled}
                            className="h-11 rounded-xl border-[var(--border)] bg-[var(--background)] focus:border-[var(--primary)] focus:ring-[var(--primary)]/20"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-[var(--foreground)]">Pickup Date</Label>
                          <Input
                            type="date"
                            value={transferGroup.pickupDate}
                            onChange={(e) => {
                              const updatedGroups = transferGroups.map(g => 
                                g.id === transferGroup.id ? { ...g, pickupDate: e.target.value } : g
                              );
                              form.setValue('transfers.groups', updatedGroups);
                            }}
                            disabled={disabled}
                            className="h-11 rounded-xl border-[var(--border)] bg-[var(--background)] focus:border-[var(--primary)] focus:ring-[var(--primary)]/20"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-[var(--foreground)] flex items-center gap-2">
                            <Clock className="h-4 w-4 text-[var(--primary)]" />
                            Pickup Time
                          </Label>
                          <Input
                            type="time"
                            value={transferGroup.pickupTime}
                            onChange={(e) => {
                              const updatedGroups = transferGroups.map(g => 
                                g.id === transferGroup.id ? { ...g, pickupTime: e.target.value } : g
                              );
                              form.setValue('transfers.groups', updatedGroups);
                            }}
                            disabled={disabled}
                            className="h-11 rounded-xl border-[var(--border)] bg-[var(--background)] focus:border-[var(--primary)] focus:ring-[var(--primary)]/20"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-[var(--foreground)] flex items-center gap-2">
                            <Package className="h-4 w-4 text-[var(--primary)]" />
                            Luggage Count
                          </Label>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const updatedGroups = transferGroups.map(g => 
                                  g.id === transferGroup.id ? { ...g, luggageCount: Math.max(0, g.luggageCount - 1) } : g
                                );
                                form.setValue('transfers.groups', updatedGroups);
                              }}
                              disabled={disabled || transferGroup.luggageCount <= 0}
                              className="h-10 w-10 rounded-xl"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <Input
                              type="number"
                              min="0"
                              value={transferGroup.luggageCount}
                              onChange={(e) => {
                                const updatedGroups = transferGroups.map(g => 
                                  g.id === transferGroup.id ? { ...g, luggageCount: parseInt(e.target.value) || 0 } : g
                                );
                                form.setValue('transfers.groups', updatedGroups);
                              }}
                              disabled={disabled}
                              className="h-10 rounded-xl border-[var(--border)] bg-[var(--background)] focus:border-[var(--primary)] focus:ring-[var(--primary)]/20 text-center"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const updatedGroups = transferGroups.map(g => 
                                  g.id === transferGroup.id ? { ...g, luggageCount: g.luggageCount + 1 } : g
                                );
                                form.setValue('transfers.groups', updatedGroups);
                              }}
                              disabled={disabled}
                              className="h-10 w-10 rounded-xl"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Return Transfer Toggle */}
                      <div className="flex items-center space-x-2 p-3 bg-[var(--accent)]/10 rounded-xl">
                        <Switch
                          checked={transferGroup.returnTransfer}
                          onCheckedChange={(checked) => {
                            const updatedGroups = transferGroups.map(g => 
                              g.id === transferGroup.id ? { ...g, returnTransfer: checked } : g
                            );
                            form.setValue('transfers.groups', updatedGroups);
                          }}
                          disabled={disabled}
                        />
                        <Label className="text-sm font-medium">
                          Include return transfer
                        </Label>
                      </div>

                      {/* Return Transfer Details */}
                      {transferGroup.returnTransfer && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-[var(--muted)]/10 rounded-xl">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-[var(--foreground)]">Return Date</Label>
                            <Input
                              type="date"
                              value={transferGroup.returnDate}
                              onChange={(e) => {
                                const updatedGroups = transferGroups.map(g => 
                                  g.id === transferGroup.id ? { ...g, returnDate: e.target.value } : g
                                );
                                form.setValue('transfers.groups', updatedGroups);
                              }}
                              disabled={disabled}
                              className="h-11 rounded-xl border-[var(--border)] bg-[var(--background)] focus:border-[var(--primary)] focus:ring-[var(--primary)]/20"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-[var(--foreground)]">Return Time</Label>
                            <Input
                              type="time"
                              value={transferGroup.returnTime}
                              onChange={(e) => {
                                const updatedGroups = transferGroups.map(g => 
                                  g.id === transferGroup.id ? { ...g, returnTime: e.target.value } : g
                                );
                                form.setValue('transfers.groups', updatedGroups);
                              }}
                              disabled={disabled}
                              className="h-11 rounded-xl border-[var(--border)] bg-[var(--background)] focus:border-[var(--primary)] focus:ring-[var(--primary)]/20"
                            />
                          </div>
                        </div>
                      )}

                      {/* Special Requests */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-[var(--foreground)]">
                          Special Requests
                        </Label>
                        <Input
                          value={transferGroup.specialRequests}
                          onChange={(e) => {
                            const updatedGroups = transferGroups.map(g => 
                              g.id === transferGroup.id ? { ...g, specialRequests: e.target.value } : g
                            );
                            form.setValue('transfers.groups', updatedGroups);
                          }}
                          placeholder="Any special requirements, accessibility needs, or preferences..."
                          disabled={disabled}
                          className="h-11 rounded-xl border-[var(--border)] bg-[var(--background)] focus:border-[var(--primary)] focus:ring-[var(--primary)]/20"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 border-2 border-dashed border-[var(--border)] rounded-2xl bg-[var(--muted)]/10">
                <Car className="h-12 w-12 text-[var(--muted-foreground)] mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">No transfer groups configured</h3>
                <p className="text-sm text-[var(--muted-foreground)] mb-4">
                  Transfer groups will be automatically created based on your travel groups
                </p>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Status Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="flex justify-between items-center pt-6"
      >
        <div className="text-sm text-[var(--muted-foreground)]">
          {transfersEnabled 
            ? (isComplete ? 'Transfer preferences complete - ready to proceed' : 'Please configure transfer preferences for all groups')
            : 'Transfers excluded from this trip'
          }
        </div>
        
        <div className="flex items-center gap-2">
          {isComplete && (
            <Badge variant="outline" className="bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20">
              <CheckCircle className="h-3 w-3 mr-1" />
              Complete
            </Badge>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
} 