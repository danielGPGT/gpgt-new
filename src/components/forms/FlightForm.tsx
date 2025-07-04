import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { InventoryService } from '@/lib/inventoryService';
import type { Flight, FlightInsert, FlightUpdate, Event } from '@/types/inventory';
import { AIRPORTS } from '@/data/airports';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface FlightFormProps {
  // For standalone drawer mode
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  flight?: Flight;
  
  // For embedded form mode
  onSubmit?: (data: FlightInsert | FlightUpdate) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  
  // Additional options
  showDeleteButton?: boolean;
}

// Helper to find airport name by code
function getAirportNameByCode(code: string) {
  const found = AIRPORTS.find(a => a.code.toUpperCase() === code.toUpperCase());
  return found ? found.name : '';
}

export function FlightForm({ 
  open, 
  onOpenChange, 
  flight, 
  onSubmit, 
  onCancel, 
  isLoading: externalLoading,
  showDeleteButton = false
}: FlightFormProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<FlightInsert>({
    event_id: flight?.event_id || null,
    departure_airport_code: flight?.departure_airport_code || '',
    arrival_airport_code: flight?.arrival_airport_code || '',
    return_departure_airport_code: flight?.return_departure_airport_code || null,
    return_arrival_airport_code: flight?.return_arrival_airport_code || null,
    airline: flight?.airline || null,
    flight_class: flight?.flight_class || null,
    outbound_flight_number: flight?.outbound_flight_number || null,
    return_flight_number: flight?.return_flight_number || null,
    outbound_departure_datetime: flight?.outbound_departure_datetime || null,
    outbound_arrival_datetime: flight?.outbound_arrival_datetime || null,
    return_departure_datetime: flight?.return_departure_datetime || null,
    return_arrival_datetime: flight?.return_arrival_datetime || null,
    stops_outbound: flight?.stops_outbound || 0,
    stops_return: flight?.stops_return || 0,
    layovers_outbound: flight?.layovers_outbound || null,
    layovers_return: flight?.layovers_return || null,
    supplier: flight?.supplier || null,
    quote_currency: flight?.quote_currency || 'GBP',
    supplier_quote: flight?.supplier_quote || null,
    markup_percent: flight?.markup_percent || 0,
    baggage_policy: flight?.baggage_policy || null,
    notes: flight?.notes || null,
    is_active: flight?.is_active ?? true,
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Determine if we're in standalone mode (with drawer) or embedded mode
  const isStandalone = open !== undefined && onOpenChange !== undefined;

  // Reset form when flight changes
  useEffect(() => {
    setFormData({
      event_id: flight?.event_id || null,
      departure_airport_code: flight?.departure_airport_code || '',
      arrival_airport_code: flight?.arrival_airport_code || '',
      return_departure_airport_code: flight?.return_departure_airport_code || null,
      return_arrival_airport_code: flight?.return_arrival_airport_code || null,
      airline: flight?.airline || null,
      flight_class: flight?.flight_class || null,
      outbound_flight_number: flight?.outbound_flight_number || null,
      return_flight_number: flight?.return_flight_number || null,
      outbound_departure_datetime: flight?.outbound_departure_datetime || null,
      outbound_arrival_datetime: flight?.outbound_arrival_datetime || null,
      return_departure_datetime: flight?.return_departure_datetime || null,
      return_arrival_datetime: flight?.return_arrival_datetime || null,
      stops_outbound: flight?.stops_outbound || 0,
      stops_return: flight?.stops_return || 0,
      layovers_outbound: flight?.layovers_outbound || null,
      layovers_return: flight?.layovers_return || null,
      supplier: flight?.supplier || null,
      quote_currency: flight?.quote_currency || 'GBP',
      supplier_quote: flight?.supplier_quote || null,
      markup_percent: flight?.markup_percent || 0,
      baggage_policy: flight?.baggage_policy || null,
      notes: flight?.notes || null,
      is_active: flight?.is_active ?? true,
    });
    setErrors({});
  }, [flight]);

  const createFlightMutation = useMutation({
    mutationFn: (data: FlightInsert) => InventoryService.createFlight(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flights'] });
      if (isStandalone) {
        onOpenChange!(false);
      }
      toast.success('Flight created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create flight: ${error.message}`);
    },
  });

  const updateFlightMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FlightUpdate }) =>
      InventoryService.updateFlight(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flights'] });
      if (isStandalone) {
        onOpenChange!(false);
      }
      toast.success('Flight updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update flight: ${error.message}`);
    },
  });

  const deleteFlightMutation = useMutation({
    mutationFn: (id: string) => InventoryService.deleteFlight(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flights'] });
      if (isStandalone) {
        onOpenChange!(false);
      }
      toast.success('Flight deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete flight: ${error.message}`);
    },
  });

  const handleDelete = async () => {
    if (!flight) return;
    if (!window.confirm('Are you sure you want to delete this flight? This action cannot be undone.')) return;
    setDeleteLoading(true);
    try {
      await deleteFlightMutation.mutateAsync(flight.id);
    } finally {
      setDeleteLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.event_id) {
      newErrors.event_id = 'Event is required';
    }
    if (!formData.departure_airport_code) {
      newErrors.departure_airport_code = 'Departure airport code is required';
    }
    if (!formData.arrival_airport_code) {
      newErrors.arrival_airport_code = 'Arrival airport code is required';
    }
    if (!formData.outbound_flight_number) {
      newErrors.outbound_flight_number = 'Outbound flight number is required';
    }
    if (!formData.outbound_departure_datetime) {
      newErrors.outbound_departure_datetime = 'Outbound departure datetime is required';
    }
    if (!formData.outbound_arrival_datetime) {
      newErrors.outbound_arrival_datetime = 'Outbound arrival datetime is required';
    }
    if (!formData.quote_currency) {
      newErrors.quote_currency = 'Currency is required';
    }
    if (formData.markup_percent === undefined || formData.markup_percent < 0) {
      newErrors.markup_percent = 'Markup percent must be 0 or greater';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const payload = { ...formData };
    
    if (isStandalone) {
      // Standalone mode - use internal mutations
      if (flight) {
        updateFlightMutation.mutate({ id: flight.id, data: payload });
      } else {
        createFlightMutation.mutate(payload);
      }
    } else {
      // Embedded mode - call external onSubmit
      onSubmit?.(payload);
    }
  };

  const isLoading = externalLoading || createFlightMutation.isPending || updateFlightMutation.isPending;

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Section 1: Basic Info */}
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
          <h3 className="text-base font-semibold text-card-foreground">Basic Info</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="event_id">Event *</Label>
            <Select 
              value={formData.event_id || ''} 
              onValueChange={(v: string) => setFormData((f) => ({ ...f, event_id: v || null }))}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select event" />
              </SelectTrigger>
              <SelectContent>
                {/* Events would be passed as props or fetched */}
                <SelectItem value="">No event</SelectItem>
              </SelectContent>
            </Select>
            {errors.event_id && <div className="text-destructive text-xs mt-1">{errors.event_id}</div>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="airline">Airline</Label>
            <Input 
              id="airline" 
              value={formData.airline || ''} 
              onChange={e => setFormData(f => ({ ...f, airline: e.target.value || null }))} 
              placeholder="e.g. British Airways" 
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="flight_class">Flight Class</Label>
            <Input 
              id="flight_class" 
              value={formData.flight_class || ''} 
              onChange={e => setFormData(f => ({ ...f, flight_class: e.target.value || null }))} 
              placeholder="e.g. Economy" 
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="supplier">Supplier</Label>
            <Input 
              id="supplier" 
              value={formData.supplier || ''} 
              onChange={e => setFormData(f => ({ ...f, supplier: e.target.value || null }))} 
              placeholder="e.g. Expedia" 
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="baggage_policy">Baggage Policy</Label>
            <Input 
              id="baggage_policy" 
              value={formData.baggage_policy || ''} 
              onChange={e => setFormData(f => ({ ...f, baggage_policy: e.target.value || null }))} 
              placeholder="e.g. 1 checked bag" 
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="is_active">Active</Label>
            <Checkbox 
              id="is_active" 
              checked={!!formData.is_active} 
              onCheckedChange={checked => setFormData(f => ({ ...f, is_active: Boolean(checked) }))} 
            />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea 
              id="notes" 
              value={formData.notes || ''} 
              onChange={e => setFormData(f => ({ ...f, notes: e.target.value || null }))} 
              placeholder="Any additional notes..." 
            />
          </div>
        </div>
      </div>

      {/* Section 2: Outbound Flight */}
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
          <h3 className="text-base font-semibold text-card-foreground">Outbound Flight</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="outbound_flight_number">Flight Number *</Label>
            <Input 
              id="outbound_flight_number" 
              value={formData.outbound_flight_number || ''} 
              onChange={e => setFormData(f => ({ ...f, outbound_flight_number: e.target.value || null }))} 
              placeholder="e.g. BA123" 
            />
            {errors.outbound_flight_number && <div className="text-destructive text-xs mt-1">{errors.outbound_flight_number}</div>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="departure_airport_code">Departure Airport Code *</Label>
            <Input 
              id="departure_airport_code" 
              value={formData.departure_airport_code} 
              onChange={e => {
                const code = e.target.value;
                setFormData(f => ({
                  ...f,
                  departure_airport_code: code,
                  // Auto-fill return arrival (return destination)
                  return_arrival_airport_code: code
                }));
              }} 
              placeholder="e.g. LHR" 
            />
            {errors.departure_airport_code && <div className="text-destructive text-xs mt-1">{errors.departure_airport_code}</div>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="arrival_airport_code">Arrival Airport Code *</Label>
            <Input 
              id="arrival_airport_code" 
              value={formData.arrival_airport_code} 
              onChange={e => {
                const code = e.target.value;
                setFormData(f => ({
                  ...f,
                  arrival_airport_code: code,
                  // Auto-fill return departure (return origin)
                  return_departure_airport_code: code
                }));
              }} 
              placeholder="e.g. CDG" 
            />
            {errors.arrival_airport_code && <div className="text-destructive text-xs mt-1">{errors.arrival_airport_code}</div>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="outbound_departure_datetime">Departure Datetime *</Label>
            <DatePicker
              selected={formData.outbound_departure_datetime ? new Date(formData.outbound_departure_datetime) : null}
              onChange={(date) => setFormData(f => ({ ...f, outbound_departure_datetime: date ? date.toISOString() : null }))}
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              dateFormat="MMMM d, yyyy h:mm aa"
              className="w-full px-3 py-2 border border-input bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholderText="Select departure date and time"
            />
            {errors.outbound_departure_datetime && <div className="text-destructive text-xs mt-1">{errors.outbound_departure_datetime}</div>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="outbound_arrival_datetime">Arrival Datetime *</Label>
            <DatePicker
              selected={formData.outbound_arrival_datetime ? new Date(formData.outbound_arrival_datetime) : null}
              onChange={(date) => setFormData(f => ({ ...f, outbound_arrival_datetime: date ? date.toISOString() : null }))}
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              dateFormat="MMMM d, yyyy h:mm aa"
              className="w-full px-3 py-2 border border-input bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholderText="Select arrival date and time"
            />
            {errors.outbound_arrival_datetime && <div className="text-destructive text-xs mt-1">{errors.outbound_arrival_datetime}</div>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="stops_outbound">Stops (Outbound)</Label>
            <Input 
              type="number" 
              id="stops_outbound" 
              value={formData.stops_outbound} 
              onChange={e => setFormData(f => ({ ...f, stops_outbound: parseInt(e.target.value) || 0 }))} 
              min="0"
              placeholder="0" 
            />
          </div>
        </div>
      </div>

      {/* Section 3: Return Flight (optional) */}
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
          <h3 className="text-base font-semibold text-card-foreground">Return Flight (Optional)</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="return_flight_number">Flight Number</Label>
            <Input 
              id="return_flight_number" 
              value={formData.return_flight_number || ''} 
              onChange={e => setFormData(f => ({ ...f, return_flight_number: e.target.value || null }))} 
              placeholder="e.g. BA124" 
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="return_departure_airport_code">Departure Airport Code (Auto-filled)</Label>
            <Input 
              id="return_departure_airport_code" 
              value={formData.return_departure_airport_code || ''} 
              readOnly 
              className="bg-muted" 
              placeholder="Auto-filled from outbound arrival" 
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="return_arrival_airport_code">Arrival Airport Code (Auto-filled)</Label>
            <Input 
              id="return_arrival_airport_code" 
              value={formData.return_arrival_airport_code || ''} 
              readOnly 
              className="bg-muted" 
              placeholder="Auto-filled from outbound departure" 
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="return_departure_datetime">Departure Datetime</Label>
            <DatePicker
              selected={formData.return_departure_datetime ? new Date(formData.return_departure_datetime) : null}
              onChange={(date) => setFormData(f => ({ ...f, return_departure_datetime: date ? date.toISOString() : null }))}
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              dateFormat="MMMM d, yyyy h:mm aa"
              className="w-full px-3 py-2 border border-input bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholderText="Select return departure date and time"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="return_arrival_datetime">Arrival Datetime</Label>
            <DatePicker
              selected={formData.return_arrival_datetime ? new Date(formData.return_arrival_datetime) : null}
              onChange={(date) => setFormData(f => ({ ...f, return_arrival_datetime: date ? date.toISOString() : null }))}
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              dateFormat="MMMM d, yyyy h:mm aa"
              className="w-full px-3 py-2 border border-input bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholderText="Select return arrival date and time"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="stops_return">Stops (Return)</Label>
            <Input 
              type="number" 
              id="stops_return" 
              value={formData.stops_return} 
              onChange={e => setFormData(f => ({ ...f, stops_return: parseInt(e.target.value) || 0 }))} 
              min="0"
              placeholder="0" 
            />
          </div>
        </div>
      </div>

      {/* Section 4: Pricing */}
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
          <h3 className="text-base font-semibold text-card-foreground">Pricing</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="supplier_quote">Supplier Quote</Label>
            <Input 
              type="number" 
              id="supplier_quote" 
              value={formData.supplier_quote || ''} 
              onChange={e => setFormData(f => ({ ...f, supplier_quote: e.target.value ? parseFloat(e.target.value) : null }))} 
              placeholder="e.g. 300" 
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="quote_currency">Currency *</Label>
            <Input 
              id="quote_currency" 
              value={formData.quote_currency} 
              onChange={e => setFormData(f => ({ ...f, quote_currency: e.target.value }))} 
              placeholder="e.g. GBP" 
            />
            {errors.quote_currency && <div className="text-destructive text-xs mt-1">{errors.quote_currency}</div>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="markup_percent">Markup Percent *</Label>
            <Input 
              type="number" 
              id="markup_percent" 
              value={formData.markup_percent} 
              onChange={e => setFormData(f => ({ ...f, markup_percent: parseFloat(e.target.value) || 0 }))} 
              placeholder="e.g. 15" 
            />
            {errors.markup_percent && <div className="text-destructive text-xs mt-1">{errors.markup_percent}</div>}
          </div>
        </div>
      </div>

      {!isStandalone && (
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          {showDeleteButton && flight && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : flight ? 'Update Flight' : 'Create Flight'}
          </Button>
        </div>
      )}
    </form>
  );

  // If in standalone mode, wrap in drawer
  if (isStandalone) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange} direction="right">
        <DrawerContent className="!max-w-4xl h-full">
          <DrawerHeader>
            <DrawerTitle>{flight ? 'Edit Flight' : 'New Flight'}</DrawerTitle>
            <DrawerDescription>
              {flight ? 'Update flight information' : 'Create a new flight'}
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {formContent}
          </div>
          <DrawerFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {showDeleteButton && flight && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </Button>
            )}
            <Button 
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : flight ? 'Update Flight' : 'Create Flight'}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  // Embedded mode - return just the form content
  return formContent;
} 