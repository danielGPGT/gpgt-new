import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Filter, 
  Search, 
  Plus, 
  Calendar, 
  MapPin, 
  Trophy, 
  Package, 
  ChevronLeft,
  ChevronRight,
  Settings,
  Trash2,
  Edit,
  Eye,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Calendar as CalendarIcon } from '@/components/ui/calendar';
import { format } from 'date-fns';

import { InventoryService } from '@/lib/inventoryService';
import { PackageManagerService } from '@/lib/packageManagerService';
import { SportForm } from '@/components/package-manager/SportForm';
import { EventForm } from '@/components/package-manager/EventForm';
import { VenueForm } from '@/components/package-manager/VenueForm';
import { PackageForm } from '@/components/package-manager/PackageForm';
import { PackageTierForm } from '@/components/package-manager/PackageTierForm';
import { PackageComponentForm } from '@/components/package-manager/PackageComponentForm';
import { PackageDetails } from '@/components/package-manager/PackageDetails';

interface Filters {
  sport_ids?: string[];
  event_name?: string;
  venue_ids?: string[];
  date_from?: Date;
  date_to?: Date;
  countries?: string[];
}

export default function PackageManager() {
  const [filters, setFilters] = useState<Filters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isSportFormOpen, setIsSportFormOpen] = useState(false);
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [isVenueFormOpen, setIsVenueFormOpen] = useState(false);
  const [isPackageFormOpen, setIsPackageFormOpen] = useState(false);

  // Fetch data
  const { data: sports } = useQuery({
    queryKey: ['sports'],
    queryFn: () => PackageManagerService.getSports(),
  });

  const { data: venues } = useQuery({
    queryKey: ['venues'],
    queryFn: () => PackageManagerService.getVenues(),
  });

  const { data: events, isLoading } = useQuery({
    queryKey: ['events', filters],
    queryFn: () => PackageManagerService.getEvents(filters),
  });

  const { data: packages } = useQuery({
    queryKey: ['packages', selectedEvent?.id],
    queryFn: () => selectedEvent ? PackageManagerService.getPackagesByEvent(selectedEvent.id) : null,
    enabled: !!selectedEvent,
  });

  const filteredEvents = events?.filter(event => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = (
        event.name.toLowerCase().includes(searchLower) ||
        event.venue?.name.toLowerCase().includes(searchLower) ||
        event.sport?.name.toLowerCase().includes(searchLower)
      );
      if (!matchesSearch) return false;
    }

    // Sport filter
    if (filters.sport_ids && filters.sport_ids.length > 0) {
      if (!event.sport_id || !filters.sport_ids.includes(event.sport_id)) {
        return false;
      }
    }

    // Venue filter
    if (filters.venue_ids && filters.venue_ids.length > 0) {
      if (!event.venue_id || !filters.venue_ids.includes(event.venue_id)) {
        return false;
      }
    }

    // Date range filter
    if (filters.date_from && event.start_date) {
      const eventDate = new Date(event.start_date);
      if (eventDate < filters.date_from) return false;
    }

    if (filters.date_to && event.end_date) {
      const eventDate = new Date(event.end_date);
      if (eventDate > filters.date_to) return false;
    }

    // Country filter
    if (filters.countries && filters.countries.length > 0) {
      if (!event.venue?.country || !filters.countries.includes(event.venue.country)) {
        return false;
      }
    }

    return true;
  }) || [];

  const getSportIcon = (sportName: string) => {
    const icons: { [key: string]: string } = {
      'Formula 1': '🏎️',
      'Tennis': '🎾',
      'Football': '⚽',
      'Basketball': '🏀',
      'Golf': '⛳',
      'Rugby': '🏉',
    };
    return icons[sportName] || '🏆';
  };

  const getEventStatus = (event: any) => {
    const now = new Date();
    const startDate = new Date(event.start_date);
    const endDate = new Date(event.end_date);
    
    if (now < startDate) {
      return { status: 'upcoming', label: 'Upcoming', color: 'bg-blue-100 text-blue-800' };
    } else if (now >= startDate && now <= endDate) {
      return { status: 'ongoing', label: 'Live', color: 'bg-green-100 text-green-800' };
    } else {
      return { status: 'past', label: 'Past', color: 'bg-gray-100 text-gray-800' };
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[var(--foreground)]">Formula 1 Travel Packages</h1>
            <p className="text-[var(--muted-foreground)] mt-1">
              Manage events, packages, and components
            </p>
          </div>
          <Button onClick={() => setIsEventFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
        </div>
      </div>

      {/* Filters Card */}
      <Card className="mb-6 bg-[var(--card)] border-[var(--border)]">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Search */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-[var(--muted-foreground)]" />
                <Label className="text-sm font-medium">Search</Label>
              </div>
              <Input
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-[var(--background)] border-[var(--border)]"
              />
            </div>

            {/* Sport Filter */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-[var(--muted-foreground)]" />
                  <Label className="text-sm font-medium">Sports</Label>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSportFormOpen(true)}
                  className="h-6 w-6 p-0"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {sports?.map((sport) => (
                  <div key={sport.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`sport-${sport.id}`}
                      checked={filters.sport_ids?.includes(sport.id) || false}
                      onCheckedChange={(checked) => {
                        setFilters(prev => ({
                          ...prev,
                          sport_ids: checked 
                            ? [...(prev.sport_ids || []), sport.id]
                            : (prev.sport_ids || []).filter(id => id !== sport.id)
                        }));
                      }}
                    />
                    <Label 
                      htmlFor={`sport-${sport.id}`}
                      className="text-sm cursor-pointer"
                    >
                      {sport.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Venue Filter */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[var(--muted-foreground)]" />
                  <Label className="text-sm font-medium">Venues</Label>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsVenueFormOpen(true)}
                  className="h-6 w-6 p-0"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {venues?.map((venue) => (
                  <div key={venue.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`venue-${venue.id}`}
                      checked={filters.venue_ids?.includes(venue.id) || false}
                      onCheckedChange={(checked) => {
                        setFilters(prev => ({
                          ...prev,
                          venue_ids: checked 
                            ? [...(prev.venue_ids || []), venue.id]
                            : (prev.venue_ids || []).filter(id => id !== venue.id)
                        }));
                      }}
                    />
                    <Label 
                      htmlFor={`venue-${venue.id}`}
                      className="text-sm cursor-pointer"
                    >
                      {venue.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Date Range & Countries */}
            <div className="space-y-6">
              {/* Date Range */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[var(--muted-foreground)]" />
                  <Label className="text-sm font-medium">Date Range</Label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="bg-[var(--background)] border-[var(--border)]"
                      >
                        <Calendar className="h-3 w-3 mr-1" />
                        From
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarIcon
                        mode="single"
                        selected={filters.date_from}
                        onSelect={(date) => setFilters(prev => ({ ...prev, date_from: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="bg-[var(--background)] border-[var(--border)]"
                      >
                        <Calendar className="h-3 w-3 mr-1" />
                        To
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarIcon
                        mode="single"
                        selected={filters.date_to}
                        onSelect={(date) => setFilters(prev => ({ ...prev, date_to: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Country Filter */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-[var(--muted-foreground)]" />
                  <Label className="text-sm font-medium">Countries</Label>
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {venues?.reduce((countries: string[], venue) => {
                    if (venue.country && !countries.includes(venue.country)) {
                      countries.push(venue.country);
                    }
                    return countries;
                  }, []).map((country) => (
                    <div key={country} className="flex items-center space-x-2">
                      <Checkbox
                        id={`country-${country}`}
                        checked={filters.countries?.includes(country) || false}
                        onCheckedChange={(checked) => {
                          setFilters(prev => ({
                            ...prev,
                            countries: checked 
                              ? [...(prev.countries || []), country]
                              : (prev.countries || []).filter(c => c !== country)
                          }));
                        }}
                      />
                      <Label 
                        htmlFor={`country-${country}`}
                        className="text-sm cursor-pointer"
                      >
                        {country}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

            {/* Events Grid */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-[var(--muted)] rounded w-3/4"></div>
                  <div className="h-3 bg-[var(--muted)] rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-20 bg-[var(--muted)] rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-[var(--muted-foreground)] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">No events found</h3>
            <p className="text-[var(--muted-foreground)] mb-4">
              Create your first event to get started with package management.
            </p>
            <Button onClick={() => setIsEventFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredEvents.map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{getSportIcon(event.sport?.name || '')}</span>
                          <div>
                            <CardTitle className="text-lg">{event.name}</CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {event.sport?.name}
                            </p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => setSelectedEvent(event)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Packages
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setIsPackageFormOpen(true)}>
                              <Plus className="h-4 w-4 mr-2" />
                              Add Package
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Event
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Event
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{event.venue?.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {event.start_date && format(new Date(event.start_date), 'MMM dd, yyyy')}
                            {event.end_date && event.end_date !== event.start_date && 
                              ` - ${format(new Date(event.end_date), 'MMM dd, yyyy')}`
                            }
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge variant={getEventStatus(event).status === 'ongoing' ? 'default' : 'secondary'}>
                            {getEventStatus(event).label}
                          </Badge>
                          <Badge variant="outline">
                            {packages?.filter(p => p.event_id === event.id).length || 0} packages
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Package Details Sheet */}
      {selectedEvent && (
        <Sheet open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
          <SheetContent className="w-[800px] sm:max-w-[800px]">
            <SheetHeader>
              <SheetTitle>{selectedEvent.name} - Packages</SheetTitle>
              <SheetDescription>
                Manage packages and tiers for this event
              </SheetDescription>
            </SheetHeader>
            <PackageDetails 
              event={selectedEvent} 
              packages={packages || []}
              onClose={() => setSelectedEvent(null)}
            />
          </SheetContent>
        </Sheet>
      )}

      {/* Forms */}
      <SportForm 
        open={isSportFormOpen} 
        onOpenChange={setIsSportFormOpen} 
      />
      <EventForm 
        open={isEventFormOpen} 
        onOpenChange={setIsEventFormOpen}
        sports={sports || []}
        venues={venues || []}
      />
      <VenueForm 
        open={isVenueFormOpen} 
        onOpenChange={setIsVenueFormOpen} 
      />
      <PackageForm 
        open={isPackageFormOpen} 
        onOpenChange={setIsPackageFormOpen}
        events={events || []}
      />
    </div>
  );
} 