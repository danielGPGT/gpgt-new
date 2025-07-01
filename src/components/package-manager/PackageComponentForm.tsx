import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { PackageManagerService } from '@/lib/packageManagerService';
import type { PackageComponent, PackageComponentInsert, PackageComponentUpdate } from '@/lib/packageManagerService';

interface PackageComponentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  component?: PackageComponent;
  tierId?: string;
  eventId?: string;
}

export function PackageComponentForm({ open, onOpenChange, component, tierId, eventId }: PackageComponentFormProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<PackageComponentInsert>({
    tier_id: component?.tier_id || tierId || '',
    event_id: component?.event_id || eventId || '',
    component_type: component?.component_type || 'ticket',
    component_id: component?.component_id || '',
    quantity: component?.quantity || 1,
    price_override: component?.price_override || undefined,
    notes: component?.notes || '',
  });

  // Fetch available components for the selected type and event
  const { data: availableComponents } = useQuery({
    queryKey: ['available-components', formData.event_id, formData.component_type],
    queryFn: () => {
      if (formData.event_id && formData.component_type) {
        return PackageManagerService.getAvailableComponents(formData.event_id, formData.component_type);
      }
      return [];
    },
    enabled: !!formData.event_id && !!formData.component_type,
  });

  const createComponentMutation = useMutation({
    mutationFn: (data: PackageComponentInsert) => PackageManagerService.createPackageComponent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      onOpenChange(false);
      toast.success('Package component created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create package component: ${error.message}`);
    },
  });

  const updateComponentMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: PackageComponentUpdate }) =>
      PackageManagerService.updatePackageComponent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      onOpenChange(false);
      toast.success('Package component updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update package component: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (component) {
      updateComponentMutation.mutate({ id: component.id, data: formData });
    } else {
      createComponentMutation.mutate(formData);
    }
  };

  const isLoading = createComponentMutation.isPending || updateComponentMutation.isPending;

  const getComponentTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      ticket: 'Ticket',
      hotel_room: 'Hotel Room',
      circuit_transfer: 'Circuit Transfer',
      airport_transfer: 'Airport Transfer',
      flight: 'Flight',
      lounge_pass: 'Lounge Pass',
    };
    return labels[type] || type;
  };

  const getComponentDisplayName = (component: any) => {
    switch (formData.component_type) {
      case 'ticket':
        return `${component.ticket_category_id || 'Ticket'} - €${component.price_with_markup}`;
      case 'hotel_room':
        return `${component.room_type_id} - ${component.nights} nights - €${component.price_with_markup}`;
      case 'circuit_transfer':
        return `${component.transfer_type} - ${component.vehicle_name} - €${component.price_per_seat}`;
      case 'airport_transfer':
        return `${component.transfer_type} - ${component.vehicle_type} - €${component.client_price}`;
      case 'flight':
        return `${component.airline} ${component.outbound_flight_number} - €${component.price_gbp}`;
      case 'lounge_pass':
        return `${component.lounge_name} - €${component.price_gbp}`;
      default:
        return component.id;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{component ? 'Edit Package Component' : 'Add New Package Component'}</DialogTitle>
          <DialogDescription>
            {component ? 'Update component information' : 'Add a component to this package tier'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="component_type">Component Type *</Label>
              <Select
                value={formData.component_type}
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  component_type: value as any,
                  component_id: '' // Reset component selection when type changes
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select component type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ticket">Ticket</SelectItem>
                  <SelectItem value="hotel_room">Hotel Room</SelectItem>
                  <SelectItem value="circuit_transfer">Circuit Transfer</SelectItem>
                  <SelectItem value="airport_transfer">Airport Transfer</SelectItem>
                  <SelectItem value="flight">Flight</SelectItem>
                  <SelectItem value="lounge_pass">Lounge Pass</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                placeholder="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="component_id">Component *</Label>
              <Select
                value={formData.component_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, component_id: value }))}
                disabled={!availableComponents?.length}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`Select ${getComponentTypeLabel(formData.component_type)}`} />
                </SelectTrigger>
                <SelectContent>
                  {availableComponents?.map((comp) => (
                    <SelectItem key={comp.id} value={comp.id}>
                      {getComponentDisplayName(comp)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price_override">Price Override (EUR)</Label>
              <Input
                id="price_override"
                type="number"
                step="0.01"
                value={formData.price_override || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  price_override: e.target.value ? parseFloat(e.target.value) : undefined 
                }))}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes about this component..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.component_id}>
              {isLoading ? 'Saving...' : component ? 'Update Component' : 'Add Component'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 