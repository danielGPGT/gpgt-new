import React, { useState } from 'react';
import { useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

import { PackageManagerService } from '@/lib/packageManagerService';
import type { Event, EventInsert, EventUpdate, Sport, Venue } from '@/lib/packageManagerService';
import { cleanEventUpdate } from '@/components/inventory/SportsEventsManager';
import { EventConsultantSelector } from '@/components/EventConsultantSelector';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

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

  // Update formData when event or open changes
  useEffect(() => {
    setFormData({
      name: event?.name || '',
      location: event?.location || '',
      start_date: event?.start_date || '',
      end_date: event?.end_date || '',
      sport_id: event?.sport_id || '',
      venue_id: event?.venue_id || '',
    });
  }, [event, open]);

  // Convert string dates to Date objects for the calendar
  const startDate = formData.start_date ? new Date(formData.start_date) : undefined;
  const endDate = formData.end_date ? new Date(formData.end_date) : undefined;

  // State for calendar month navigation
  const [startDateMonth, setStartDateMonth] = useState<Date>(startDate || new Date());
  const [endDateMonth, setEndDateMonth] = useState<Date>(endDate || new Date());

  // Generate years array (current year - 3 to current year + 17)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 21 }, (_, i) => currentYear - 3 + i);

  // Generate months array
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Handle start date change and auto-set end date to 2 days later
  const handleStartDateChange = (date: Date | undefined) => {
    if (date) {
      const startDateStr = format(date, 'yyyy-MM-dd');
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 2);
      const endDateStr = format(endDate, 'yyyy-MM-dd');
      
      setFormData(prev => ({
        ...prev,
        start_date: startDateStr,
        end_date: endDateStr
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        start_date: '',
        end_date: ''
      }));
    }
  };

  // Handle end date change
  const handleEndDateChange = (date: Date | undefined) => {
    if (date) {
      const endDateStr = format(date, 'yyyy-MM-dd');
      setFormData(prev => ({
        ...prev,
        end_date: endDateStr
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        end_date: ''
      }));
    }
  };

  // Handle month navigation
  const handleStartMonthChange = (month: number, year: number) => {
    const newDate = new Date(year, month, 1);
    setStartDateMonth(newDate);
  };

  const handleEndMonthChange = (month: number, year: number) => {
    const newDate = new Date(year, month, 1);
    setEndDateMonth(newDate);
  };

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
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className='!max-w-4xl'>
        <DrawerHeader>
          <DrawerTitle>{event ? 'Edit Event' : 'Add New Event'}</DrawerTitle>
          <DrawerDescription>
            {event ? 'Update event information' : 'Create a new event for packages'}
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Event Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Monaco Grand Prix 2026"
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
                <DatePicker
                  selected={startDate || null}
                  onChange={date => handleStartDateChange(date as Date)}
                  dateFormat="yyyy-MM-dd"
                  minDate={new Date()}
                  className="w-full border rounded px-2 py-2"
                  placeholderText="Select start date"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <DatePicker
                  selected={endDate || null}
                  onChange={date => handleEndDateChange(date as Date)}
                  dateFormat="yyyy-MM-dd"
                  minDate={startDate || new Date()}
                  className="w-full border rounded px-2 py-2"
                  placeholderText="Select end date"
                />
              </div>
            </div>

            {/* Consultant Assignment - Only show for existing events */}
            {event && (
              <EventConsultantSelector
                eventId={event.id}
                eventName={event.name}
                compact={true}
                onConsultantAssigned={() => {
                  // Optionally refresh data or show success message
                  toast.success('Consultant assignment updated');
                }}
              />
            )}
          </form>
        </div>
        <DrawerFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading}
            onClick={handleSubmit}
          >
            {isLoading ? 'Saving...' : event ? 'Update Event' : 'Create Event'}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
} 