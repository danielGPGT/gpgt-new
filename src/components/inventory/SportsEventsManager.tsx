import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from '@/components/ui/drawer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { InventoryService } from '@/lib/inventoryService';
import type { Sport, SportInsert, SportUpdate, Event, EventInsert, EventUpdate, Venue, EventWithRelations } from '@/types/inventory';
import { Plus, Edit, Trash2, Calendar, Search, AlertTriangle, ArrowUpDown, ArrowUp, ArrowDown, Image } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogClose, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import MediaLibrarySelector from '../MediaLibrarySelector';
import { Textarea } from '@/components/ui/textarea';
import type { MediaItem } from '@/lib/mediaLibrary';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { SportForm } from '@/components/forms/SportForm';
import { EventConsultantSelector } from '@/components/EventConsultantSelector';

// Utility to clean event form data for update
export function cleanEventUpdate(data: any) {
  const cleaned: any = {};
  for (const key in data) {
    if (data[key] === '' || data[key] === undefined) {
      // Set nullable fields to null, skip others
      if (["sport_id", "location", "start_date", "end_date", "venue_id", "event_image"].includes(key)) {
        cleaned[key] = null;
      }
    } else {
      cleaned[key] = data[key];
    }
  }
  return cleaned;
}

export function SportsEventsManager() {
  const queryClient = useQueryClient();
  // Sports state
  const [selectedSport, setSelectedSport] = useState<Sport | null>(null);
  const [sportDrawerOpen, setSportDrawerOpen] = useState(false);
  const [editingSport, setEditingSport] = useState<Sport | null>(null);
  const [sportSearch, setSportSearch] = useState('');
  // Events state
  const [eventDrawerOpen, setEventDrawerOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [eventSearch, setEventSearch] = useState('');
  // Filters
  const [showExpiringEvents, setShowExpiringEvents] = useState(false);
  const [sortKey, setSortKey] = useState<'name' | 'venue' | 'start_date' | 'end_date' | 'status'>('start_date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
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
  const [venuesList, setVenuesList] = useState<Venue[]>([]);
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [selectedImages, setSelectedImages] = useState<MediaItem[]>([]);
  // State for confirmation dialogs
  const [confirmDeleteSport, setConfirmDeleteSport] = useState<Sport | null>(null);
  const [confirmDeleteEvent, setConfirmDeleteEvent] = useState<Event | null>(null);

  // Fetch sports
  const { data: sports = [], isLoading: sportsLoading } = useQuery({
    queryKey: ['sports'],
    queryFn: () => InventoryService.getSports(),
  });

  // Fetch events (all if no sport selected)
  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['events', selectedSport?.id ?? 'all'],
    queryFn: () => selectedSport ? InventoryService.getEvents({ sport_id: selectedSport.id }) : InventoryService.getEvents(),
  }) as { data: EventWithRelations[], isLoading: boolean };

  // Fetch venues for event form
  const { data: venues = [] } = useQuery({
    queryKey: ['venues'],
    queryFn: () => InventoryService.getVenues(),
  });

  // CRUD mutations for sports
  const createSportMutation = useMutation({
    mutationFn: (data: SportInsert) => InventoryService.createSport(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sports'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['venues'] });
      setSportDrawerOpen(false);
    },
  });
  const updateSportMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: SportUpdate }) => InventoryService.updateSport(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sports'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['venues'] });
      setSportDrawerOpen(false);
      setEditingSport(null);
    },
  });
  const deleteSportMutation = useMutation({
    mutationFn: (id: string) => InventoryService.deleteSport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sports'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['venues'] });
      setSelectedSport(null);
    },
  });

  // CRUD mutations for events
  const createEventMutation = useMutation({
    mutationFn: (data: EventInsert) => {
      console.log('[CREATE EVENT] Payload:', data);
      return InventoryService.createEvent(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['sports'] });
      queryClient.invalidateQueries({ queryKey: ['venues'] });
      setEventDrawerOpen(false);
    },
    onError: (error) => {
      console.error('[CREATE EVENT] Error:', error);
      if (error && error.message) {
        alert('Create event failed: ' + error.message);
      }
    },
  });
  const updateEventMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: EventUpdate }) => {
      console.log('[UPDATE EVENT] Payload:', data);
      return InventoryService.updateEvent(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['sports'] });
      queryClient.invalidateQueries({ queryKey: ['venues'] });
      setEventDrawerOpen(false);
      setEditingEvent(null);
    },
    onError: (error) => {
      console.error('[UPDATE EVENT] Error:', error);
      if (error && error.message) {
        alert('Update event failed: ' + error.message);
      }
    },
  });
  const deleteEventMutation = useMutation({
    mutationFn: (id: string) => InventoryService.deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['sports'] });
      queryClient.invalidateQueries({ queryKey: ['venues'] });
    },
  });

  // Filtered sports
  const filteredSports = sports.filter(sport => {
    if (sportSearch && !sport.name.toLowerCase().includes(sportSearch.toLowerCase())) return false;
    return true;
  });

  // Helper: count events for a sport
  const getEventCountForSport = (sportId: string) => {
    return events.filter(event => event.sport_id === sportId).length;
  };

  // Filtered events
  const filteredEvents = events.filter(event => {
    if (selectedSport && event.sport_id !== selectedSport.id) return false;
    const search = eventSearch.toLowerCase();
    if (
      eventSearch &&
      !(
        event.name.toLowerCase().includes(search) ||
        (event.location && event.location.toLowerCase().includes(search)) ||
        (venues.find(v => v.id === event.venue_id)?.name?.toLowerCase().includes(search))
      )
    ) return false;
    return true;
  });

  // Sorting logic
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    let aValue: any, bValue: any;
    switch (sortKey) {
      case 'name':
        aValue = a.name?.toLowerCase() || '';
        bValue = b.name?.toLowerCase() || '';
        break;
      case 'venue':
        aValue = venues.find(v => v.id === a.venue_id)?.name?.toLowerCase() || '';
        bValue = venues.find(v => v.id === b.venue_id)?.name?.toLowerCase() || '';
        break;
      case 'start_date':
        aValue = a.start_date || '';
        bValue = b.start_date || '';
        break;
      case 'end_date':
        aValue = a.end_date || '';
        bValue = b.end_date || '';
        break;
      case 'status':
        const now = new Date();
        const aExpired = a.end_date && new Date(a.end_date) < now;
        const bExpired = b.end_date && new Date(b.end_date) < now;
        aValue = aExpired ? 1 : 0;
        bValue = bExpired ? 1 : 0;
        break;
      default:
        aValue = '';
        bValue = '';
    }
    if (aValue < bValue) return sortDir === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  React.useEffect(() => { setVenuesList(venues || []); }, [venues]);

  // --- UI ---
  return (
    <div className="flex gap-6">
      {/* Sports List */}
      <div className="w-1/5 min-w-[260px]">
        <Card >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Sports
              <Button size="icon" variant="outline" onClick={() => { setEditingSport(null); setSportDrawerOpen(true); }}>
                <Plus className="h-4 w-4" />
              </Button>
            </CardTitle>
            <div className="flex gap-2 mt-2">
              <Input placeholder="Search..." value={sportSearch} onChange={e => setSportSearch(e.target.value)} />
            </div>
          </CardHeader>
          <CardContent className="px-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Events</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSports.map(sport => (
                  <TableRow key={sport.id} className={selectedSport?.id === sport.id ? 'bg-muted' : ''}>
                    <TableCell onClick={() => setSelectedSport(sport)} className="cursor-pointer font-medium">{sport.name}</TableCell>
                    <TableCell>{getEventCountForSport(sport.id)}</TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => { setEditingSport(sport); setSportDrawerOpen(true); }}><Edit className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => setConfirmDeleteSport(sport)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredSports.length === 0 && <div className="p-4 text-center text-muted-foreground">No sports found</div>}
          </CardContent>
        </Card>
      </div>
      {/* Events Table */}
      <div className="flex-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Events
              <Button size="icon" variant="outline" onClick={() => { setEditingEvent(null); setEventDrawerOpen(true); }} disabled={sports.length === 0}>
                <Plus className="h-4 w-4" />
              </Button>
            </CardTitle>
            {/* Search bar and clear sorting */}
            <div className="mt-2 w-full items-stretch flex flex-col md:flex-row  md:justify-between gap-2 md:gap-4">
              <Input
                placeholder="Search events by name, venue, or location..."
                value={eventSearch}
                onChange={e => setEventSearch(e.target.value)}
                className=""
              />
              <div className="flex md:justify-end w-full md:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10"
                  onClick={() => { setSortKey('start_date'); setSortDir('asc'); }}
                >
                  Clear Sorting
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer select-none" onClick={() => {
                    setSortKey('name');
                    setSortDir(sortKey === 'name' && sortDir === 'asc' ? 'desc' : 'asc');
                  }}>
                    <span className="inline-flex items-center gap-1">
                      Name
                      {sortKey === 'name' ? (
                        sortDir === 'asc' ? <ArrowUp className="w-4 h-4 text-primary" /> : <ArrowDown className="w-4 h-4 text-primary" />
                      ) : (
                        <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </span>
                  </TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => {
                    setSortKey('venue');
                    setSortDir(sortKey === 'venue' && sortDir === 'asc' ? 'desc' : 'asc');
                  }}>
                    <span className="inline-flex items-center gap-1">
                      Venue
                      {sortKey === 'venue' ? (
                        sortDir === 'asc' ? <ArrowUp className="w-4 h-4 text-primary" /> : <ArrowDown className="w-4 h-4 text-primary" />
                      ) : (
                        <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => {
                    setSortKey('start_date');
                    setSortDir(sortKey === 'start_date' && sortDir === 'asc' ? 'desc' : 'asc');
                  }}>
                    <span className="inline-flex items-center gap-1">
                      Start
                      {sortKey === 'start_date' ? (
                        sortDir === 'asc' ? <ArrowUp className="w-4 h-4 text-primary" /> : <ArrowDown className="w-4 h-4 text-primary" />
                      ) : (
                        <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => {
                    setSortKey('end_date');
                    setSortDir(sortKey === 'end_date' && sortDir === 'asc' ? 'desc' : 'asc');
                  }}>
                    <span className="inline-flex items-center gap-1">
                      End
                      {sortKey === 'end_date' ? (
                        sortDir === 'asc' ? <ArrowUp className="w-4 h-4 text-primary" /> : <ArrowDown className="w-4 h-4 text-primary" />
                      ) : (
                        <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => {
                    setSortKey('status');
                    setSortDir(sortKey === 'status' && sortDir === 'asc' ? 'desc' : 'asc');
                  }}>
                    <span className="inline-flex items-center gap-1">
                      Status
                      {sortKey === 'status' ? (
                        sortDir === 'asc' ? <ArrowUp className="w-4 h-4 text-primary" /> : <ArrowDown className="w-4 h-4 text-primary" />
                      ) : (
                        <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </span>
                  </TableHead>
                  <TableHead>Consultant</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedEvents.length > 0 ? (
                  sortedEvents.map(event => (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium">{event.name}</TableCell>
                      <TableCell>
                        {event.event_image ? (
                          <img 
                            src={event.event_image.image_url || event.event_image.thumbnail_url} 
                            alt={event.event_image.description || 'Event image'} 
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                            <Image className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{event.venue_id ? (venues.find(v => v.id === event.venue_id)?.name || '-') : '-'}</TableCell>
                      <TableCell>{event.start_date || '-'}</TableCell>
                      <TableCell>{event.end_date || '-'}</TableCell>
                      <TableCell>
                        {event.end_date && new Date(event.end_date) < new Date() ? (
                          <Badge variant="destructive">Expired</Badge>
                        ) : (
                          <Badge variant="default">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {event.event_consultants && event.event_consultants.length > 0 ? (
                          <div className="space-y-1">
                            {event.event_consultants.map(consultant => (
                              <div key={consultant.id} className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {consultant.consultant?.name || consultant.consultant?.email || 'Unknown'}
                                  </Badge>
                                  {consultant.status !== 'active' && (
                                    <Badge variant="secondary" className="text-xs">
                                      {consultant.status}
                                    </Badge>
                                  )}
                                </div>
                                {consultant.consultant?.phone && (
                                  <div className="text-xs text-muted-foreground">
                                    📞 {consultant.consultant.phone}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className='text-right'>
                        <Button size="icon" variant="ghost" onClick={() => { setEditingEvent(event); setEventDrawerOpen(true); }}><Edit className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => setConfirmDeleteEvent(event)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      <AlertTriangle className="inline-block mr-2 text-yellow-500" />
                      No events found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            {selectedSport && sortedEvents.length === 0 && <div className="p-4 text-center text-muted-foreground">No events found for this sport</div>}
          </CardContent>
        </Card>
      </div>

      {/* Sport Drawer */}
      <Drawer open={sportDrawerOpen} onOpenChange={setSportDrawerOpen} direction="right">
        <DrawerContent className="!w-[900px] max-w-none">
          <DrawerHeader>
            <DrawerTitle>{editingSport ? 'Edit Sport' : 'Add New Sport'}</DrawerTitle>
            <DrawerDescription>{editingSport ? 'Update sport information' : 'Create a new sport for events'}</DrawerDescription>
          </DrawerHeader>
          <SportForm
            sport={editingSport || undefined}
            onSubmit={data => {
              if (editingSport) {
                updateSportMutation.mutate({ id: editingSport.id, data });
              } else {
                createSportMutation.mutate(data);
              }
            }}
            onCancel={() => setSportDrawerOpen(false)}
            isLoading={createSportMutation.isPending || updateSportMutation.isPending}
            service="inventory"
          />
        </DrawerContent>
      </Drawer>
      {/* Event Drawer */}
      <Drawer open={eventDrawerOpen} onOpenChange={setEventDrawerOpen} direction="right">
        <DrawerContent className="!w-[900px] max-w-none">
          <DrawerHeader>
            <DrawerTitle>{editingEvent ? 'Edit Event' : 'Add New Event'}</DrawerTitle>
            <DrawerDescription>{editingEvent ? 'Update event information' : 'Create a new event for this sport'}</DrawerDescription>
          </DrawerHeader>
          <EventFormDrawer
            event={editingEvent || undefined}
            sportId={selectedSport?.id}
            sports={sports}
            venues={venues}
            onSubmit={data => {
              if (editingEvent) {
                updateEventMutation.mutate({ id: editingEvent.id, data: cleanEventUpdate(data) });
              } else {
                createEventMutation.mutate(cleanEventUpdate(data));
              }
            }}
            onCancel={() => setEventDrawerOpen(false)}
            isLoading={createEventMutation.isPending || updateEventMutation.isPending}
            queryClient={queryClient}
          />
        </DrawerContent>
      </Drawer>
      {/* Sport Delete Confirmation Dialog */}
      <Dialog open={!!confirmDeleteSport} onOpenChange={open => { if (!open) setConfirmDeleteSport(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Sport</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete the sport "{confirmDeleteSport?.name}"?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteSport(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { if (confirmDeleteSport) { deleteSportMutation.mutate(confirmDeleteSport.id); setConfirmDeleteSport(null); } }}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Event Delete Confirmation Dialog */}
      <Dialog open={!!confirmDeleteEvent} onOpenChange={open => { if (!open) setConfirmDeleteEvent(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Event</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete the event "{confirmDeleteEvent?.name}"?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteEvent(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { if (confirmDeleteEvent) { deleteEventMutation.mutate(confirmDeleteEvent.id); setConfirmDeleteEvent(null); } }}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}



// --- Event Form Drawer ---
function EventFormDrawer({ event, sportId, sports, venues, onSubmit, onCancel, isLoading, queryClient }: {
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

  React.useEffect(() => { setVenuesList(venues || []); }, [venues]);

  // Reset slugManuallyEdited when dialog closes
  React.useEffect(() => {
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