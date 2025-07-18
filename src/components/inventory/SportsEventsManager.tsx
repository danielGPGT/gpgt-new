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
import { EventFormDrawer } from '@/components/forms/EventFormDrawer';

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
// Moved to src/components/forms/EventFormDrawer.tsx
 