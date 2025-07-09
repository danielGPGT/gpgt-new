import React, { useEffect, useState, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, Calendar, Users, ChevronDown, ChevronUp } from 'lucide-react';

type EventType = {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  location: string | null;
  event_image?: any;
  sport?: { id: string; name: string };
  venue?: { id: string; name: string; city: string | null; country: string | null };
};

type SportType = { id: string; name: string };
type VenueType = { id: string; name: string; city: string | null; country: string | null };

type StepEventSelectionProps = {
  setCurrentStep: (step: number) => void;
  currentStep: number;
};

export function StepEventSelection({ setCurrentStep, currentStep }: StepEventSelectionProps) {
  const { setValue, watch } = useFormContext();
  const selectedEventId = watch('selectedEvent.id');

  const [events, setEvents] = useState<EventType[]>([]);
  const [sports, setSports] = useState<SportType[]>([]);
  const [venues, setVenues] = useState<VenueType[]>([]);
  const [loading, setLoading] = useState(true);
  const [sportFilter, setSportFilter] = useState('all');
  const [venueFilter, setVenueFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch events, sports, venues
  useEffect(() => {
    setLoading(true);
    Promise.all([
      supabase
        .from('events')
        .select(`
          id,
          name,
          start_date,
          end_date,
          location,
          event_image,
          sport:sport_id ( id, name ),
          venue:venue_id ( id, name, city, country )
        `),
      supabase.from('sports').select('id, name'),
      supabase.from('venues').select('id, name, city, country'),
    ]).then(([eventsRes, sportsRes, venuesRes]) => {
      // Map events to correct type
      const mappedEvents = (eventsRes.data || []).map((e: any) => ({
        ...e,
        sport: Array.isArray(e.sport) ? e.sport[0] : e.sport,
        venue: Array.isArray(e.venue) ? e.venue[0] : e.venue,
      }));
      setEvents(mappedEvents);
      setSports(sportsRes.data || []);
      setVenues(venuesRes.data || []);
      setLoading(false);
    });
  }, []);

  // Filtering and sorting
  const filteredEvents = useMemo(() => {
    let filtered = [...events];
    if (searchTerm.trim()) {
      const searchLower = searchTerm.trim().toLowerCase();
      filtered = filtered.filter(e =>
        (e.name && e.name.toLowerCase().includes(searchLower)) ||
        (e.venue && e.venue.name && e.venue.name.toLowerCase().includes(searchLower)) ||
        (e.sport && e.sport.name && e.sport.name.toLowerCase().includes(searchLower))
      );
    }
    if (sportFilter !== 'all') {
      filtered = filtered.filter(e => e.sport && e.sport.id === sportFilter);
    }
    if (venueFilter !== 'all') {
      filtered = filtered.filter(e => e.venue && e.venue.id === venueFilter);
    }
    filtered.sort((a, b) => {
      if (!a.start_date || !b.start_date) return 0;
      return sortOrder === 'asc'
        ? new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
        : new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
    });
    return filtered;
  }, [events, searchTerm, sportFilter, venueFilter, sortOrder]);

  return (
    <div className="space-y-6">
      {/* Filter/Sort Bar */}
      <div className="flex flex-wrap gap-4 items-end mb-4">
        {/* Search Bar */}
        <div>
          <label className="block text-xs font-medium mb-1">Search</label>
          <Input
            type="text"
            placeholder="Search by event, venue, or sport..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-48"
          />
        </div>
        {/* Sport Filter */}
        <div>
          <label className="block text-xs font-medium mb-1">Sport</label>
          <Select value={sportFilter} onValueChange={setSportFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Sports" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sports</SelectItem>
              {sports.map((sport) => (
                <SelectItem key={sport.id} value={sport.id}>{sport.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Venue Filter */}
        <div>
          <label className="block text-xs font-medium mb-1">Location</label>
          <Select value={venueFilter} onValueChange={setVenueFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {venues.map((venue) => (
                <SelectItem key={venue.id} value={venue.id}>
                  {venue.name} {venue.city ? `(${venue.city})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Sort by Date */}
        <div>
          <label className="block text-xs font-medium mb-1">Sort by Date</label>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            {sortOrder === 'asc' ? 'Earliest First' : 'Latest First'}
          </Button>
        </div>
      </div>

      {/* Event Cards */}
      {loading ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <Loader2 className="animate-spin h-8 w-8 text-muted-foreground" />
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">No events found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredEvents.map(event => (
            <EventCard
              key={event.id}
              event={event}
              selected={selectedEventId === event.id}
              onSelect={() => {
                // Map database fields to form schema fields
                const mappedEvent = {
                  id: event.id,
                  name: event.name,
                  location: event.venue?.name || event.location || '',
                  startDate: event.start_date || '',
                  endDate: event.end_date || event.start_date || ''
                };
                setValue('selectedEvent', mappedEvent);
                setCurrentStep(currentStep + 1);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EventCard({ event, selected, onSelect }: { event: EventType; selected: boolean; onSelect: () => void }) {
  // Match Package Manager card background logic
  let imageUrl = '';
  if (event.event_image) {
    if (typeof event.event_image === 'string') {
      imageUrl = event.event_image;
    } else if (event.event_image.image_url) {
      imageUrl = event.event_image.image_url;
    } else if (event.event_image.thumbnail_url) {
      imageUrl = event.event_image.thumbnail_url;
    } else if (event.event_image.url) {
      imageUrl = event.event_image.url;
    }
  }
  const backgroundStyle = imageUrl
    ? {
        backgroundImage:
          `linear-gradient(135deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.7) 100%), url(${imageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }
    : {
        background: 'linear-gradient(135deg, #222 60%, #444 100%)',
      };

  return (
    <Card
      className={
        'relative overflow-hidden shadow-lg cursor-pointer transition-all border-2 min-h-[220px] py-0 ' +
        (selected ? 'border-primary ring-2 ring-primary' : 'border-border hover:border-primary/60')
      }
      onClick={onSelect}
      style={backgroundStyle}
    >
      <div className="relative z-10 p-5 flex flex-col h-full justify-between min-h-[220px]">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="secondary">{event.start_date && new Date(event.start_date) > new Date() ? 'Upcoming' : 'Past'}</Badge>
          <Button size="icon" variant="ghost" className="opacity-70 pointer-events-none">
            <Users className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex items-center gap-3 mb-2">
          {event.sport && <span className="text-lg font-bold text-white/70">{event.sport.name}</span>}
        </div>
        <h3 className="text-xl font-bold text-white drop-shadow mb-1">{event.name}</h3>
        <div className="flex items-center gap-2 text-white/90 mb-1">
          <MapPin className="h-4 w-4" />
          <span>{event.venue?.name || event.location}</span>
        </div>
        <div className="flex items-center gap-2 text-white/90 mb-1">
          <Calendar className="h-4 w-4" />
          <span>
            {event.start_date ? new Date(event.start_date).toLocaleDateString() : ''}
            {event.end_date ? ` - ${new Date(event.end_date).toLocaleDateString()}` : ''}
          </span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-white/90 text-sm">{event.venue?.city || ''}</span>
          <span className="text-white/90 text-sm">View Packages &rarr;</span>
        </div>
      </div>
      {/* Overlay for selected */}
      {selected && (
        <div className="absolute inset-0 bg-primary/60 z-20 flex items-center justify-center">
          <span className="text-white font-bold text-lg">Selected</span>
        </div>
      )}
    </Card>
  );
} 