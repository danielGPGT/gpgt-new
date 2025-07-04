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
  Globe,
  Download,
  Car,
  Circle,
  Target,
  Zap,
  Star
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
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import MediaLibrarySelector from '@/components/MediaLibrarySelector';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
import { SportForm } from '@/components/forms/SportForm';
import { VenueForm } from '@/components/forms/VenueForm';
import { cleanEventUpdate } from '@/components/inventory/SportsEventsManager';
import { PackageForm } from '@/components/package-manager/PackageForm';
import { EventForm } from '@/components/package-manager/EventForm';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PackageTierForm } from '@/components/package-manager/PackageTierForm';
import { PackageComponentForm } from '@/components/package-manager/PackageComponentForm';
import { PackageDetails } from '@/components/package-manager/PackageDetails';

// Import custom icons
import f1Icon from '@/assets/icons/f1.svg';
import motogpIcon from '@/assets/icons/motogp.svg';

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
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const queryClient = useQueryClient();

  // Event mutations
  const createEventMutation = useMutation({
    mutationFn: (data: any) => InventoryService.createEvent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setIsEventFormOpen(false);
      toast.success('Event created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create event: ${error.message}`);
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => InventoryService.updateEvent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setIsEventFormOpen(false);
      setEditingEvent(null);
      toast.success('Event updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update event: ${error.message}`);
    },
  });

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

  // Add query for all packages to get counts
  const { data: allPackages } = useQuery({
    queryKey: ['all-packages'],
    queryFn: () => PackageManagerService.getPackages(),
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
    const icons: { [key: string]: React.ReactNode } = {
      'Formula 1': <img src={f1Icon} alt="Formula 1" className="h-10 w-10 brightness-0 invert" />,
      'MotoGP': <img src={motogpIcon} alt="MotoGP" className="h-6 w-6" />,
      'Tennis': <Circle className="h-6 w-6" />,
      'Football': <Target className="h-6 w-6" />,
      'Basketball': <Circle className="h-6 w-6" />,
      'Golf': <Target className="h-6 w-6" />,
      'Rugby': <Zap className="h-6 w-6" />,
    };
    return icons[sportName] || <Trophy className="h-6 w-6" />;
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
    <div className="mx-auto px-8 pt-0 pb-8 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">Package Manager</h1>
          <p className="text-[var(--muted-foreground)] text-base">
            Manage Formula 1 events, venues, and travel packages
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm"
            className="border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)]"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button 
            onClick={() => {
              setEditingEvent(null);
              setIsEventFormOpen(true);
            }}
            className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] shadow-sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
        </div>
      </div>

     

      {/* Main Content with Left Column */}
      <div className="flex gap-8">
        {/* Left Column - Filters Card */}
        <div className="w-80 flex-shrink-0">
          <Card className="bg-gradient-to-b from-[var(--card)]/95 to-[var(--card)]/20 border-[var(--border)] shadow-sm sticky top-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2 text-[var(--foreground)]">
                <Filter className="h-4 w-4 text-[var(--primary)]" />
                Filters & Search
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Search */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-[var(--muted-foreground)]" />
                  <Label className="text-sm font-medium text-[var(--foreground)]">Search Events</Label>
                </div>
                <div className="relative">
                  <Input
                    placeholder="Search by name, venue, sport..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-[var(--background)] border-[var(--border)] focus:border-[var(--primary)] focus:ring-[var(--primary)]/20"
                  />
                </div>
              </div>

              <Separator className="bg-[var(--border)]" />

              {/* Sport Filter */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-[var(--primary)]" />
                    <Label className="text-sm font-medium text-[var(--foreground)]">Sports</Label>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsSportFormOpen(true)}
                    className="h-7 w-7 p-0 hover:bg-[var(--muted)]"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                  {sports?.map((sport) => (
                    <div key={sport.id} className="flex items-center space-x-2 hover:bg-[var(--muted)]/50 rounded-md p-1 transition-colors">
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
                        className="data-[state=checked]:bg-[var(--primary)] data-[state=checked]:border-[var(--primary)]"
                      />
                      <Label 
                        htmlFor={`sport-${sport.id}`}
                        className="text-sm cursor-pointer text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
                      >
                        {sport.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator className="bg-[var(--border)]" />

              {/* Venue Filter */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[var(--secondary)]" />
                    <Label className="text-sm font-medium text-[var(--foreground)]">Venues</Label>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsVenueFormOpen(true)}
                    className="h-7 w-7 p-0 hover:bg-[var(--muted)]"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                  {venues?.map((venue) => (
                    <div key={venue.id} className="flex items-center space-x-2 hover:bg-[var(--muted)]/50 rounded-md p-1 transition-colors">
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
                        className="data-[state=checked]:bg-[var(--secondary)] data-[state=checked]:border-[var(--secondary)]"
                      />
                      <Label 
                        htmlFor={`venue-${venue.id}`}
                        className="text-sm cursor-pointer text-[var(--foreground)] hover:text-[var(--secondary)] transition-colors"
                      >
                        {venue.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator className="bg-[var(--border)]" />

              {/* Date Range */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[var(--chart-4)]" />
                  <Label className="text-sm font-medium text-[var(--foreground)]">Date Range</Label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="bg-[var(--background)] border-[var(--border)] hover:bg-[var(--muted)] text-[var(--foreground)]"
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
                        className="bg-[var(--background)] border-[var(--border)] hover:bg-[var(--muted)] text-[var(--foreground)]"
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

              <Separator className="bg-[var(--border)]" />

              {/* Country Filter */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-[var(--chart-2)]" />
                  <Label className="text-sm font-medium text-[var(--foreground)]">Countries</Label>
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                  {venues?.reduce((countries: string[], venue) => {
                    if (venue.country && !countries.includes(venue.country)) {
                      countries.push(venue.country);
                    }
                    return countries;
                  }, []).map((country) => (
                    <div key={country} className="flex items-center space-x-2 hover:bg-[var(--muted)]/50 rounded-md p-1 transition-colors">
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
                        className="data-[state=checked]:bg-[var(--chart-2)] data-[state=checked]:border-[var(--chart-2)]"
                      />
                      <Label 
                        htmlFor={`country-${country}`}
                        className="text-sm cursor-pointer text-[var(--foreground)] hover:text-[var(--chart-2)] transition-colors"
                      >
                        {country}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Events Grid */}
        <div className="flex-1">
          <div className="space-y-6">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse bg-gradient-to-br from-[var(--card)] to-[var(--card)]/80 border-[var(--border)]">
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
              <Card className="bg-gradient-to-b from-[var(--card)]/95 to-[var(--card)]/20 border-[var(--border)] shadow-sm">
                <CardContent className="text-center py-16">
                  <div className="h-16 w-16 rounded-full bg-[var(--muted)]/20 flex items-center justify-center mx-auto mb-4">
                    <Package className="h-8 w-8 text-[var(--muted-foreground)]" />
                  </div>
                  <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">No events found</h3>
                  <p className="text-[var(--muted-foreground)] mb-6 max-w-md mx-auto">
                    Create your first event to get started with package management and begin building travel experiences.
                  </p>
                  <Button 
                    onClick={() => {
                      setEditingEvent(null);
                      setIsEventFormOpen(true);
                    }}
                    className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] shadow-sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Event
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 lg:gap-6">
                <AnimatePresence>
                  {filteredEvents.map((event) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      whileHover={{ y: -4 }}
                      className="group"
                    >
                      <Card 
                        className={`relative overflow-hidden transition-all duration-300 cursor-pointer border-[var(--border)] hover:border-[var(--primary)]/40 hover:shadow-xl hover:shadow-[var(--primary)]/5 ${
                          event.event_image 
                            ? 'bg-cover bg-center bg-no-repeat min-h-[280px] sm:min-h-[320px]' 
                            : 'bg-gradient-to-br from-[var(--card)] via-[var(--card)]/95 to-[var(--card)]/90 min-h-[280px] sm:min-h-[320px]'
                        }`}
                        style={event.event_image ? {
                          backgroundImage: `linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.5) 50%, rgba(0, 0, 0, 0.7) 100%), url(${event.event_image.image_url || event.event_image.thumbnail_url})`
                        } : undefined}
                        onClick={() => setSelectedEvent(event)}
                      >
                        {/* Gradient Overlay for better text readability */}
                        {event.event_image && (
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        )}
                        
                        {/* Status Badge */}
                        <div className="absolute top-3 left-3 z-20">
                          <Badge 
                            variant={getEventStatus(event).status === 'ongoing' ? 'default' : 'secondary'}
                            className={`transition-all duration-300 ${
                              event.event_image 
                                ? 'bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30' 
                                : 'bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20 border-[var(--primary)]/20'
                            }`}
                          >
                            {getEventStatus(event).label}
                          </Badge>
                        </div>

                        {/* Action Menu */}
                        <div className="absolute top-3 right-3 z-20">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className={`opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 ${
                                  event.event_image 
                                    ? 'bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white' 
                                    : 'hover:bg-[var(--muted)]'
                                }`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Settings className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-[var(--card)] border-[var(--border)] shadow-lg">
                              <DropdownMenuLabel className="text-[var(--foreground)]">Actions</DropdownMenuLabel>
                                                              <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedEvent(event);
                                  }}
                                  className="text-[var(--foreground)] hover:bg-[var(--muted)]"
                                >
                                <Eye className="h-4 w-4 mr-2" />
                                View Packages
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-[var(--border)]" />
                                                              <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingEvent(event);
                                    setIsEventFormOpen(true);
                                  }}
                                  className="text-[var(--foreground)] hover:bg-[var(--muted)]"
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Event
                                </DropdownMenuItem>
                              <DropdownMenuItem className="text-[var(--destructive)] hover:bg-[var(--destructive)]/10">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Event
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <CardHeader className="pb-2 pt-16 relative z-10">
                          <div className="space-y-3">
                            {/* Sport Icon and Name */}
                            <div className="flex items-center gap-3">
                              <div className={`h-12 w-12 rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg ${
                                event.event_image 
                                  ? 'bg-white/20 backdrop-blur-sm group-hover:bg-white/30 group-hover:scale-110' 
                                  : 'bg-[var(--primary)]/10 group-hover:bg-[var(--primary)]/20 group-hover:scale-110'
                              }`}>
                                {getSportIcon(event.sport?.name || '')}
                              </div>
                              <div className="flex-1 min-w-0">
                                <CardTitle className={`text-lg font-bold transition-colors line-clamp-2 ${
                                  event.event_image 
                                    ? 'text-white group-hover:text-white/90' 
                                    : 'text-[var(--foreground)] group-hover:text-[var(--primary)]'
                                }`}>
                                  {event.name}
                                </CardTitle>
                                <p className={`text-sm mt-1 font-medium ${
                                  event.event_image 
                                    ? 'text-white/80' 
                                    : 'text-[var(--muted-foreground)]'
                                }`}>
                                  {event.sport?.name}
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="relative z-10 pt-0">
                          <div className="space-y-4">
                            {/* Venue Info */}
                            <div className="flex items-start gap-2">
                              <MapPin className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                                event.event_image ? 'text-white/80' : 'text-[var(--secondary)]'
                              }`} />
                              <span className={`text-sm line-clamp-2 ${
                                event.event_image ? 'text-white/80' : 'text-[var(--muted-foreground)]'
                              }`}>
                                {event.venue?.name}
                              </span>
                            </div>

                            {/* Date Info */}
                            <div className="flex items-start gap-2">
                              <Calendar className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                                event.event_image ? 'text-white/80' : 'text-[var(--chart-4)]'
                              }`} />
                              <span className={`text-sm ${
                                event.event_image ? 'text-white/80' : 'text-[var(--muted-foreground)]'
                              }`}>
                                {event.start_date && format(new Date(event.start_date), 'MMM dd, yyyy')}
                                {event.end_date && event.end_date !== event.start_date && 
                                  ` - ${format(new Date(event.end_date), 'MMM dd, yyyy')}`
                                }
                              </span>
                            </div>

                            {/* Bottom Section */}
                            <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]/20">
                              <div className="flex items-center gap-2">
                                <Package className={`h-4 w-4 ${
                                  event.event_image ? 'text-white/60' : 'text-[var(--muted-foreground)]'
                                }`} />
                                                                 <span className={`text-xs font-medium ${
                                   event.event_image ? 'text-white/60' : 'text-[var(--muted-foreground)]'
                                 }`}>
                                   {allPackages?.filter(p => p.event_id === event.id).length || 0} packages
                                 </span>
                              </div>
                              
                              {/* View Details Button */}
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className={`opacity-0 group-hover:opacity-100 transition-all duration-300 text-xs ${
                                  event.event_image 
                                    ? 'text-white/80 hover:text-white hover:bg-white/20' 
                                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]'
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedEvent(event);
                                }}
                              >
                                View Details
                                <ChevronRight className="h-3 w-3 ml-1" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>

                        {/* Hover Effect Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[var(--primary)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
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
      {/* Event Form */}
      <EventForm
        open={isEventFormOpen}
        onOpenChange={(open) => {
          setIsEventFormOpen(open);
          if (!open) setEditingEvent(null);
        }}
        event={editingEvent || undefined}
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


 