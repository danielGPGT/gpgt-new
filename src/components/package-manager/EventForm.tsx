import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { PackageManagerService } from '@/lib/packageManagerService';
import type { Event, EventInsert, EventUpdate, Sport, Venue } from '@/lib/packageManagerService';
import { cleanEventUpdate } from '@/components/inventory/SportsEventsManager';

interface EventFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: Event;
  sports: Sport[];
  venues: Venue[];
}

export function EventForm({ open, onOpenChange, event, sports, venues }: EventFormProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<EventInsert>({
    name: event?.name || '',
    location: event?.location || '',
    start_date: event?.start_date || '',
    end_date: event?.end_date || '',
    sport_id: event?.sport_id || '',
    venue_id: event?.venue_id || '',
  });

  const createEventMutation = useMutation({
    mutationFn: (data: EventInsert) => PackageManagerService.createEvent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      onOpenChange(false);
      toast.success('Event created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create event: ${error.message}`);
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: EventUpdate }) =>
      PackageManagerService.updateEvent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      onOpenChange(false);
      toast.success('Event updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update event: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = cleanEventUpdate(formData);
    if (event) {
      updateEventMutation.mutate({ id: event.id, data: cleaned });
    } else {
      createEventMutation.mutate(cleaned);
    }
  };

  const isLoading = createEventMutation.isPending || updateEventMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{event ? 'Edit Event' : 'Add New Event'}</DialogTitle>
          <DialogDescription>
            {event ? 'Update event information' : 'Create a new event for packages'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Event Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Monaco Grand Prix 2024"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="e.g., Monte Carlo, Monaco"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sport_id">Sport *</Label>
              <Select
                value={formData.sport_id || 'none'}
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  sport_id: value === 'none' ? undefined : value 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sport" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No sport</SelectItem>
                  {sports.map((sport) => (
                    <SelectItem key={sport.id} value={sport.id}>
                      {sport.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="venue_id">Venue</Label>
              <Select
                value={formData.venue_id || 'none'}
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  venue_id: value === 'none' ? undefined : value 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select venue" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No venue</SelectItem>
                  {venues.map((venue) => (
                    <SelectItem key={venue.id} value={venue.id}>
                      {venue.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : event ? 'Update Event' : 'Create Event'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 