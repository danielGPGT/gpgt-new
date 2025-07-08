import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogClose, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import MediaLibrarySelector from '../MediaLibrarySelector';
import { Textarea } from '@/components/ui/textarea';
import type { MediaItem } from '@/lib/mediaLibrary';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { DrawerFooter } from '@/components/ui/drawer';
import { EventConsultantSelector } from '@/components/EventConsultantSelector';
import type { Sport, Event, EventInsert, Venue } from '@/types/inventory';
import { InventoryService } from '@/lib/inventoryService';

export function EventFormDrawer({ event, sportId, sports, venues, onSubmit, onCancel, isLoading, queryClient }: {
  event?: Event;
  sportId?: string;
  sports: Sport[];
  venues: Venue[];
  onSubmit: (data: EventInsert) => void;
  onCancel: () => void;
  isLoading: boolean;
  queryClient: any;
}) {
  const [formData, setFormData] = useState<EventInsert>({
    sport_id: event?.sport_id || sportId || '',
    name: event?.name || '',
    start_date: event?.start_date || '',
    end_date: event?.end_date || '',
    venue_id: event?.venue_id ?? '',
    event_image: event?.event_image || null,
  });
  const [venuesList, setVenuesList] = useState<Venue[]>(venues || []);
  const [venueDialogOpen, setVenueDialogOpen] = useState(false);
  const [newVenue, setNewVenue] = useState({
    name: '',
    city: '',
    country: '',
    slug: '',
    latitude: '',
    longitude: '',
    description: '',
    map_url: '',
    images: [] as MediaItem[],
  });
  const [venueLoading, setVenueLoading] = useState(false);
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [selectedImages, setSelectedImages] = useState<MediaItem[]>([]);

  useEffect(() => { setVenuesList(venues || []); }, [venues]);

  // Reset slugManuallyEdited when dialog closes
  useEffect(() => {
    if (!venueDialogOpen) setSlugManuallyEdited(false);
  }, [venueDialogOpen]);

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(formData); }} className="space-y-4 p-4">
      <div className="space-y-2">
        <Label htmlFor="sport">Sport *</Label>
        <Select
          value={formData.sport_id ?? ''}
          onValueChange={v => setFormData(prev => ({ ...prev, sport_id: v }))}
          required
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select sport" />
          </SelectTrigger>
          <SelectContent>
            {sports.map(s => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="name">Event Name *</Label>
        <Input id="name" value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="venue">Venue</Label>
        <Select
          value={(formData.venue_id ?? '') + ''}
          onValueChange={v => {
            if (v === '__create__') setVenueDialogOpen(true);
            else setFormData(prev => ({ ...prev, venue_id: v }));
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select venue" />
          </SelectTrigger>
          <SelectContent>
            {venuesList.map(v => (
              <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
            ))}
            <SelectItem value="__create__" className="text-primary font-semibold">+ Create new venue</SelectItem>
          </SelectContent>
        </Select>
        {/* Venue creation dialog */}
        <Dialog open={venueDialogOpen} onOpenChange={setVenueDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{'Add New Venue'}</DialogTitle>
              <DialogDescription>{'Create a new venue for events'}</DialogDescription>
            </DialogHeader>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setVenueLoading(true);
                // Always send images as array of objects (id, image_url, thumbnail_url, description)
                const images = (newVenue.images || []).map((img: any) => ({
                  id: img.id,
                  image_url: img.image_url,
                  thumbnail_url: img.thumbnail_url,
                  description: img.description,
                }));
                const payload = { ...newVenue, images, latitude: newVenue.latitude ? parseFloat(newVenue.latitude) : undefined, longitude: newVenue.longitude ? parseFloat(newVenue.longitude) : undefined };
                const created = await InventoryService.createVenue(payload);
                setVenuesList((prev) => [...prev, created]);
                setFormData((prev) => ({ ...prev, venue_id: created.id }));
                setVenueDialogOpen(false);
                setNewVenue({
                  name: '',
                  slug: '',
                  country: '',
                  city: '',
                  latitude: '',
                  longitude: '',
                  description: '',
                  map_url: '',
                  images: [],
                });
                setVenueLoading(false);
                queryClient.invalidateQueries({ queryKey: ['venues'] });
                queryClient.invalidateQueries({ queryKey: ['events'] });
                queryClient.invalidateQueries({ queryKey: ['sports'] });
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="venue-name">Venue Name *</Label>
                  <Input
                    id="venue-name"
                    value={newVenue.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setNewVenue((prev) => {
                        let slug = prev.slug;
                        if (!slugManuallyEdited) {
                          slug = name
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, '-')
                            .replace(/(^-|-$)+/g, '');
                        }
                        return { ...prev, name, slug };
                      });
                    }}
                    placeholder="e.g., Circuit de Monaco"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="venue-slug">Slug</Label>
                  <Input
                    id="venue-slug"
                    value={newVenue.slug}
                    onChange={(e) => {
                      setSlugManuallyEdited(true);
                      setNewVenue((prev) => ({ ...prev, slug: e.target.value }));
                    }}
                    placeholder="e.g., circuit-de-monaco"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="venue-country">Country</Label>
                  <Input
                    id="venue-country"
                    value={newVenue.country}
                    onChange={(e) => setNewVenue((prev) => ({ ...prev, country: e.target.value }))}
                    placeholder="e.g., Monaco"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="venue-city">City</Label>
                  <Input
                    id="venue-city"
                    value={newVenue.city}
                    onChange={(e) => setNewVenue((prev) => ({ ...prev, city: e.target.value }))}
                    placeholder="e.g., Monte Carlo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="venue-latitude">Latitude</Label>
                  <Input
                    id="venue-latitude"
                    type="number"
                    step="any"
                    value={newVenue.latitude}
                    onChange={(e) => setNewVenue((prev) => ({ ...prev, latitude: e.target.value }))}
                    placeholder="e.g., 43.7384"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="venue-longitude">Longitude</Label>
                  <Input
                    id="venue-longitude"
                    type="number"
                    step="any"
                    value={newVenue.longitude}
                    onChange={(e) => setNewVenue((prev) => ({ ...prev, longitude: e.target.value }))}
                    placeholder="e.g., 7.4246"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="venue-description">Description</Label>
                  <Textarea
                    id="venue-description"
                    value={newVenue.description}
                    onChange={(e) => setNewVenue((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Venue description..."
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="venue-map-url">Map URL</Label>
                  <Input
                    id="venue-map-url"
                    value={newVenue.map_url}
                    onChange={(e) => setNewVenue((prev) => ({ ...prev, map_url: e.target.value }))}
                    placeholder="https://maps.example.com"
                  />
                </div>
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Venue Images</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {(newVenue.images || []).length > 0 ? (
                    (newVenue.images as MediaItem[]).map((img) => (
                      <div key={img.id} className="relative group w-24 h-24 border rounded overflow-hidden">
                        <img src={img.thumbnail_url || img.image_url} alt={img.description || ''} className="object-cover w-full h-full" />
                        <button
                          type="button"
                          className="absolute top-1 right-1 bg-white/80 rounded-full p-1 text-xs opacity-0 group-hover:opacity-100 transition"
                          onClick={() => setNewVenue(prev => ({ ...prev, images: (prev.images || []).filter((i: MediaItem) => i.id !== img.id) }))}
                          aria-label="Remove image"
                        >
                          ×
                        </button>
                      </div>
                    ))
                  ) : (
                    <span className="text-muted-foreground text-sm">No images selected</span>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSelectedImages(newVenue.images || []);
                    setShowImageSelector(true);
                  }}
                >
                  {newVenue.images && newVenue.images.length > 0 ? 'Edit Images' : 'Select Images'}
                </Button>
                <Dialog open={showImageSelector} onOpenChange={setShowImageSelector}>
                  <DialogContent className="!max-w-6xl max-h-[80vh] flex flex-col">
                    <DialogHeader className="flex-shrink-0">
                      <DialogTitle>Select Venue Images</DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-hidden min-h-0">
                      <MediaLibrarySelector
                        selectedItems={Array.isArray(selectedImages) ? selectedImages : []}
                        onSelect={(item) => {
                          setSelectedImages((prev) => {
                            const exists = prev.find((img) => img.id === item.id);
                            if (exists) {
                              return prev.filter((img) => img.id !== item.id);
                            } else {
                              return [...prev, item];
                            }
                          });
                        }}
                        multiple={true}
                      />
                    </div>
                    <DialogFooter className="flex-shrink-0">
                      <Button
                        type="button"
                        onClick={() => {
                          setNewVenue(prev => ({ ...prev, images: selectedImages }));
                          setShowImageSelector(false);
                        }}
                      >
                        Confirm Selection
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={venueLoading}>{venueLoading ? 'Saving...' : 'Create Venue'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex gap-4">
        <div className="space-y-2 flex-1">
          <Label htmlFor="start_date">Start Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.start_date && "text-muted-foreground"
                )}
              >
                {formData.start_date
                  ? new Date(formData.start_date).toLocaleDateString()
                  : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <CalendarComponent
                mode="single"
                selected={formData.start_date ? new Date(formData.start_date) : undefined}
                onSelect={(date: Date | undefined) => {
                  setFormData(prev => ({
                    ...prev,
                    start_date: date ? date.toISOString().slice(0, 10) : ''
                  }));
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2 flex-1">
          <Label htmlFor="end_date">End Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.end_date && "text-muted-foreground"
                )}
              >
                {formData.end_date
                  ? new Date(formData.end_date).toLocaleDateString()
                  : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <CalendarComponent
                mode="single"
                selected={formData.end_date ? new Date(formData.end_date) : undefined}
                onSelect={(date: Date | undefined) => {
                  setFormData(prev => ({
                    ...prev,
                    end_date: date ? date.toISOString().slice(0, 10) : ''
                  }));
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      {/* Event Image */}
      <div className="space-y-2">
        <Label>Event Image</Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {formData.event_image ? (
            <div className="relative group w-24 h-24 border rounded overflow-hidden">
              <img 
                src={formData.event_image.image_url || formData.event_image.thumbnail_url} 
                alt={formData.event_image.description || 'Event image'} 
                className="object-cover w-full h-full" 
              />
              <button
                type="button"
                className="absolute top-1 right-1 bg-white/80 rounded-full p-1 text-xs opacity-0 group-hover:opacity-100 transition"
                onClick={() => setFormData(prev => ({ ...prev, event_image: null }))}
                aria-label="Remove image"
              >
                ×
              </button>
            </div>
          ) : (
            <span className="text-muted-foreground text-sm">No image selected</span>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setSelectedImages(formData.event_image ? [formData.event_image] : []);
            setShowImageSelector(true);
          }}
        >
          {formData.event_image ? 'Change Image' : 'Select Image'}
        </Button>
        
        {/* Image Selection Dialog */}
        <Dialog open={showImageSelector} onOpenChange={setShowImageSelector}>
          <DialogContent className="!max-w-6xl max-h-[80vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>Select Event Image</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-hidden min-h-0">
              <MediaLibrarySelector
                selectedItems={Array.isArray(selectedImages) ? selectedImages : []}
                onSelect={(item) => {
                  setSelectedImages([item]); // Only allow single image selection
                }}
                multiple={false}
              />
            </div>
            <DialogFooter className="flex-shrink-0">
              <Button
                type="button"
                onClick={() => {
                  setFormData(prev => ({ 
                    ...prev, 
                    event_image: selectedImages.length > 0 ? selectedImages[0] : null 
                  }));
                  setShowImageSelector(false);
                }}
              >
                Confirm Selection
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Consultant Assignment - Only show for existing events */}
      {event && (
        <div className="space-y-4 pt-4 border-t">
          <EventConsultantSelector
            eventId={event.id}
            eventName={event.name}
            compact={true}
            onConsultantAssigned={() => {
              // Optionally refresh data or show success message
              console.log('Consultant assigned to event:', event.name);
            }}
          />
        </div>
      )}
      
      <DrawerFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isLoading}>{isLoading ? 'Saving...' : event ? 'Update Event' : 'Create Event'}</Button>
      </DrawerFooter>
    </form>
  );
} 