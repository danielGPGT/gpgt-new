import React, { useState } from 'react';
import { UseFormReturn, useFieldArray } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Calendar, Brain } from 'lucide-react';
import { Package } from '@/types/packages';
import { mockEventData } from '@/lib/mockData/mockEventData';
import { usePackageStore } from '@/store/packages';
import { toast } from 'sonner';

interface StepEventsProps {
  form: UseFormReturn<Package>;
}

export function StepEvents({ form }: StepEventsProps) {
  const { control, setValue, register, watch, formState: { errors } } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'events',
  });
  const { generateItineraryText, isGeneratingAI } = usePackageStore();
  const watchedEvents = watch('events');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter mock events
  const filteredEvents = mockEventData.filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.location?.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 10);

  const handleAddEvent = () => {
    append({
      id: `event_${Date.now()}`,
      name: '',
      location: '',
      description: '',
      cost: undefined,
      isAddOn: false,
      addOnOptions: [],
    });
  };

  const handleAddMockEvent = (event: any) => {
    append({
      id: event.id,
      name: event.title,
      location: event.location,
      description: event.description,
      cost: event.cost,
      isAddOn: false,
      addOnOptions: [],
    });
  };

  const handleGenerateItinerary = async () => {
    const pkg = form.getValues();
    const text = await generateItineraryText(pkg);
    if (text) {
      setValue('itineraryText', text);
      toast.success('Itinerary copy generated!');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Events & Activities</h3>
          <p className="text-muted-foreground">Add activities from API or define manually</p>
        </div>
        <Button onClick={handleAddEvent} type="button">
          <Plus className="w-4 h-4 mr-2" />
          Add Event
        </Button>
      </div>

      {/* API Event Search */}
      <div className="space-y-2">
        <Label>Search API Events</Label>
        <Input
          placeholder="Search events by name or location..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <div className="max-h-48 overflow-y-auto border rounded-md mt-2">
            {filteredEvents.map(event => (
              <div
                key={event.id}
                className="p-3 border-b cursor-pointer hover:bg-muted"
                onClick={() => handleAddMockEvent(event)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{event.title}</h4>
                    <p className="text-xs text-muted-foreground">{event.location}</p>
                  </div>
                  <Badge variant="secondary">API</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Events List */}
      <div className="space-y-4">
        {fields.map((field, index) => {
          const event = watchedEvents[index];
          return (
            <Card key={field.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Event {index + 1}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`events.${index}.name`}>Event Name *</Label>
                    <Input
                      id={`events.${index}.name`}
                      placeholder="e.g., Balinese Cooking Class"
                      {...register(`events.${index}.name` as const)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`events.${index}.location`}>Location</Label>
                    <Input
                      id={`events.${index}.location`}
                      placeholder="e.g., Ubud, Bali"
                      {...register(`events.${index}.location` as const)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`events.${index}.description`}>Description</Label>
                  <Textarea
                    id={`events.${index}.description`}
                    placeholder="Describe the event or activity..."
                    rows={2}
                    {...register(`events.${index}.description` as const)}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`events.${index}.cost`}>Cost</Label>
                    <Input
                      id={`events.${index}.cost`}
                      type="number"
                      min="0"
                      step="any"
                      placeholder="e.g., 120"
                      {...register(`events.${index}.cost` as const, { valueAsNumber: true })}
                    />
                  </div>
                  <div className="flex items-center gap-4 mt-6">
                    <Switch
                      id={`events.${index}.isAddOn`}
                      checked={!!event?.isAddOn}
                      onCheckedChange={checked => setValue(`events.${index}.isAddOn`, checked)}
                    />
                    <Label htmlFor={`events.${index}.isAddOn`}>Add-on (VIP, lounge, etc.)</Label>
                  </div>
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
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-lg font-medium">No events added</h3>
                <p className="text-muted-foreground">
                  Add your first event or activity to start building your package
                </p>
              </div>
              <Button onClick={handleAddEvent} type="button">
                <Plus className="w-4 h-4 mr-2" />
                Add First Event
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      <div className="flex items-center gap-4 mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={handleGenerateItinerary}
          disabled={isGeneratingAI}
        >
          <Brain className="w-4 h-4 mr-2" />
          {isGeneratingAI ? 'Generating...' : 'Generate 7-day itinerary copy'}
        </Button>
      </div>
      {errors.events && (
        <div className="text-sm text-destructive">
          {errors.events.message}
        </div>
      )}
    </div>
  );
} 