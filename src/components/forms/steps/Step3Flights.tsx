import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { format, addDays, isAfter, isBefore } from 'date-fns';
import { 
  Plane, 
  MapPin, 
  Calendar, 
  Users, 
  Star,
  Plus,
  Minus,
  Trash2,
  Copy,
  Edit,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowRight,
  Building2,
  Globe,
  Settings,
  Filter,
  Search,
  X,
  DollarSign,
  Clock3,
  Zap,
  Heart,
  Eye,
  BookOpen,
  TrendingUp,
  Shield,
  Wifi,
  Coffee,
  Utensils,
  Briefcase,
  Baby,
  Luggage,
  Award,
  Route,
  Navigation,
  Compass,
  Timer,
  CalendarDays,
  PlaneTakeoff,
  PlaneLanding,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { toast } from 'sonner';
import { cn, convertCurrency, formatCurrency } from '@/lib/utils';
import { NewIntake, CabinClass } from '@/types/newIntake';
import { 
  mockLowFareResult, 
  getAirlineById, 
  getLocationById,
  getFlightsByDirection,
  getRecommendationsByPriceRange,
  MockFlight,
  MockRecommendation,
  MockAirline,
  MockLocation
} from '@/lib/mockData/mockFlightData';

interface Step3FlightsProps {
  disabled?: boolean;
}

// Cabin class options with enhanced details
const cabinClassOptions = [
  { 
    value: 'economy', 
    label: 'Economy', 
    description: 'Standard seating with essential amenities',
    icon: Plane,
    features: ['Standard seat', 'Meal service', 'Entertainment'],
    priceMultiplier: 1
  },
  { 
    value: 'premium_economy', 
    label: 'Premium Economy', 
    description: 'Enhanced comfort with extra legroom',
    icon: Star,
    features: ['Extra legroom', 'Priority boarding', 'Enhanced meal'],
    priceMultiplier: 1.5
  },
  { 
    value: 'business', 
    label: 'Business', 
    description: 'Premium service with lie-flat seats',
    icon: Building2,
    features: ['Lie-flat seats', 'Lounge access', 'Premium dining'],
    priceMultiplier: 3
  },
  { 
    value: 'first', 
    label: 'First Class', 
    description: 'Ultimate luxury with private suites',
    icon: Award,
    features: ['Private suite', 'Concierge service', 'Fine dining'],
    priceMultiplier: 5
  },
];

// Popular airports for quick selection
const popularAirports = [
  { code: 'LHR', name: 'London Heathrow', city: 'London', country: 'UK' },
  { code: 'LGW', name: 'London Gatwick', city: 'London', country: 'UK' },
  { code: 'STN', name: 'London Stansted', city: 'London', country: 'UK' },
  { code: 'LCY', name: 'London City', city: 'London', country: 'UK' },
  { code: 'JFK', name: 'John F. Kennedy', city: 'New York', country: 'USA' },
  { code: 'LAX', name: 'Los Angeles International', city: 'Los Angeles', country: 'USA' },
  { code: 'CDG', name: 'Charles de Gaulle', city: 'Paris', country: 'France' },
  { code: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Germany' },
  { code: 'DXB', name: 'Dubai International', city: 'Dubai', country: 'UAE' },
  { code: 'AUH', name: 'Abu Dhabi International', city: 'Abu Dhabi', country: 'UAE' },
  { code: 'SIN', name: 'Changi Airport', city: 'Singapore', country: 'Singapore' },
  { code: 'HKG', name: 'Hong Kong International', city: 'Hong Kong', country: 'China' },
  { code: 'NRT', name: 'Narita International', city: 'Tokyo', country: 'Japan' },
  { code: 'SYD', name: 'Sydney Airport', city: 'Sydney', country: 'Australia' },
];

// Flight search filters
interface FlightFilters {
  priceRange: [number, number];
  duration: [number, number];
  stops: 'any' | 'direct' | '1-stop' | '2-plus';
  airlines: string[];
  departureTime: 'any' | 'morning' | 'afternoon' | 'evening' | 'night';
  arrivalTime: 'any' | 'morning' | 'afternoon' | 'evening' | 'night';
}

export function Step3Flights({ disabled }: Step3FlightsProps) {
  const form = useFormContext<NewIntake>();
  
  // Form state
  const flightsEnabled = form.watch('flights.enabled');
  const flightGroups = form.watch('flights.groups') || [];
  const tripGroups = form.watch('tripDetails.groups') || [];
  const primaryDestination = form.watch('tripDetails.primaryDestination');
  const totalTravelers = form.watch('tripDetails.totalTravelers');
  const useSubgroups = form.watch('tripDetails.useSubgroups');

  // Derive traveler type from existing fields
  const getTravelerType = () => {
    if (useSubgroups && tripGroups.length > 1) {
      return 'group';
    }
    const totalAdults = totalTravelers?.adults || 0;
    const totalChildren = totalTravelers?.children || 0;
    const total = totalAdults + totalChildren;
    
    if (total === 1) return 'solo';
    if (total === 2 && totalChildren === 0) return 'couple';
    if (totalChildren > 0) return 'family';
    return 'group';
  };
  
  const travelerType = getTravelerType();

  // Local state
  const [showAirportSearch, setShowAirportSearch] = useState<string | null>(null);
  const [airportSearchQuery, setAirportSearchQuery] = useState('');
  const [showAirlineSearch, setShowAirlineSearch] = useState<string | null>(null);
  const [airlineSearchQuery, setAirlineSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('search');
  const [searchResults, setSearchResults] = useState<MockRecommendation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showFlightResults, setShowFlightResults] = useState(false);
  // Store selected flights per groupId
  const [selectedFlights, setSelectedFlights] = useState<{ [groupId: string]: MockRecommendation }>({});
  const [activeGroupId, setActiveGroupId] = useState<string>('default');

  // Get available airlines and airports from mock data
  const availableAirlines = mockLowFareResult.Airlines;
  const availableAirports = mockLowFareResult.Locations;

  // Prevent infinite update loop: only initialize once per enable
  const initializedRef = useRef(false);
  useEffect(() => {
    if (flightsEnabled && !initializedRef.current && tripGroups.length > 0) {
      const initialFlightGroups = tripGroups.map(group => ({
        groupId: group.id,
        originAirport: '',
        destinationAirport: primaryDestination || '',
        cabinClass: 'economy' as CabinClass,
        preferredAirlines: [] as string[],
        flexibleDates: false,
        frequentFlyerInfo: '',
        selectedFlight: undefined, // Initialize with undefined to ensure proper form state
      }));
      form.setValue('flights.groups', initialFlightGroups);
      initializedRef.current = true;
    }
    if (!flightsEnabled) {
      initializedRef.current = false;
    }
  }, [flightsEnabled, tripGroups, primaryDestination, form]);

  // Smart default for solo/couple: always 1 group, hide group UI
  useEffect(() => {
    if ((travelerType === 'solo' || travelerType === 'couple') && flightsEnabled) {
      if (flightGroups.length === 0) {
        form.setValue('flights.groups', [{
          groupId: 'default',
          originAirport: '',
          destinationAirport: primaryDestination || '',
          cabinClass: 'economy',
          preferredAirlines: [],
          flexibleDates: false,
          frequentFlyerInfo: '',
          selectedFlight: undefined, // Initialize with undefined to ensure proper form state
        }]);
      } else if (flightGroups.length > 1) {
        // Only keep the first group
        form.setValue('flights.groups', [flightGroups[0]]);
      }
    }
  }, [travelerType, flightsEnabled, flightGroups, primaryDestination, form]);

  // Handlers
  const handleToggleFlights = (enabled: boolean) => {
    form.setValue('flights.enabled', enabled);
    
    if (!enabled) {
      form.setValue('flights.groups', []);
    } else if (tripGroups.length > 0) {
      const initialFlightGroups = tripGroups.map(group => ({
        groupId: group.id,
        originAirport: '',
        destinationAirport: primaryDestination || '',
        cabinClass: 'economy' as CabinClass,
        preferredAirlines: [] as string[],
        flexibleDates: false,
        frequentFlyerInfo: '',
        selectedFlight: undefined, // Initialize with undefined to ensure proper form state
      }));
      
      form.setValue('flights.groups', initialFlightGroups);
    }
  };

  const updateFlightGroup = (groupId: string, updates: Partial<typeof flightGroups[0]>) => {
    const updatedGroups = flightGroups.map(group =>
      group.groupId === groupId ? { ...group, ...updates } : group
    );
    form.setValue('flights.groups', updatedGroups);
  };

  const addFlightGroup = () => {
    const newGroup = {
      groupId: `flight-group-${Date.now()}`,
      originAirport: '',
      destinationAirport: primaryDestination || '',
      cabinClass: 'economy' as CabinClass,
      preferredAirlines: [] as string[],
      flexibleDates: false,
      frequentFlyerInfo: '',
      selectedFlight: undefined, // Initialize with undefined to ensure proper form state
    };
    
    form.setValue('flights.groups', [...flightGroups, newGroup]);
  };

  const removeFlightGroup = (groupId: string) => {
    const updatedGroups = flightGroups.filter(group => group.groupId !== groupId);
    form.setValue('flights.groups', updatedGroups);
    toast.success('Flight group removed');
  };

  const duplicateFlightGroup = (groupId: string) => {
    const groupToDuplicate = flightGroups.find(group => group.groupId === groupId);
    if (groupToDuplicate) {
      const duplicatedGroup = {
        ...groupToDuplicate,
        groupId: `flight-group-${Date.now()}`,
        selectedFlight: undefined, // Initialize with undefined to ensure proper form state
      };
      form.setValue('flights.groups', [...flightGroups, duplicatedGroup]);
      toast.success('Flight group duplicated');
    }
  };

  const toggleAirline = (groupId: string, airlineId: string) => {
    const group = flightGroups.find(g => g.groupId === groupId);
    if (group) {
      const currentAirlines = group.preferredAirlines || [];
      const updatedAirlines = currentAirlines.includes(airlineId)
        ? currentAirlines.filter(id => id !== airlineId)
        : [...currentAirlines, airlineId];
      
      updateFlightGroup(groupId, { preferredAirlines: updatedAirlines });
    }
  };

  // Flight search functionality
  const searchFlights = useCallback(async (groupId: string) => {
    setActiveGroupId(groupId);
    // For solo/couple mode, check the first group directly
    if (travelerType === 'solo' || travelerType === 'couple') {
      const firstGroup = flightGroups[0];
      if (!firstGroup?.originAirport || !firstGroup?.destinationAirport) {
        toast.error('Please select origin and destination airports');
        return;
      }
    } else {
      // For group mode, find the specific group
    const group = flightGroups.find(g => g.groupId === groupId);
    if (!group?.originAirport || !group?.destinationAirport) {
      toast.error('Please select origin and destination airports');
      return;
      }
    }

    setIsSearching(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Get mock search results with default price range
    const results = getRecommendationsByPriceRange(0, 5000);
    setSearchResults(results);
    setIsSearching(false);
    
    // Show the flight results dialog
    setShowFlightResults(true);
    
    toast.success(`Found ${results.length} flights`);
  }, [flightGroups, travelerType]);

  // Handle flight selection (per group)
  const handleFlightSelection = (flight: MockRecommendation) => {
    setSelectedFlights(prev => ({ ...prev, [activeGroupId]: flight }));
    toast.success(`Selected flight: ${flight.Routing}`);
    setShowFlightResults(false);

    // Get client's preferred currency
    const preferredCurrency = form.watch('preferences.currency') || 'GBP';
    const originalCurrency = mockLowFareResult.Currency.CurrencyId;
    const originalPrice = flight.Total;

    // Convert price to preferred currency with 2% spread
    const convertedPrice = convertCurrency(originalPrice, originalCurrency, preferredCurrency, 0.02);

    // Save selected flight data to the form
    const groupIndex = flightGroups.findIndex(g => g.groupId === activeGroupId);
    if (groupIndex !== -1) {
      const selectedFlightData = {
        recommendationId: flight.RecommendationId,
        routing: flight.Routing,
        total: originalPrice,
        currency: originalCurrency,
        airline: flight.ValidatingAirlineId,
        flightNumber: flight.GdsId,
        departureTime: flight.TicketingDeadline, // Or actual departure time if available
        arrivalTime: '', // Fill if available
        // Converted price fields
        convertedTotal: convertedPrice,
        convertedCurrency: preferredCurrency,
      };
      
      form.setValue(`flights.groups.${groupIndex}.selectedFlight`, selectedFlightData);
      
      // Debug logging
      console.log('✈️ Flight selection debug:', {
        activeGroupId,
        groupIndex,
        flightData: flight,
        selectedFlightData,
        formPath: `flights.groups.${groupIndex}.selectedFlight`,
        currentFormData: form.getValues('flights')
      });
    } else {
      console.error('❌ Could not find flight group for ID:', activeGroupId, 'Available groups:', flightGroups);
    }
  };

  // Filter airports based on search query
  const filteredAirports = availableAirports.filter(airport =>
    airport.AirportId.toLowerCase().includes(airportSearchQuery.toLowerCase()) ||
    airport.AirportName.toLowerCase().includes(airportSearchQuery.toLowerCase())
  );

  // Filter airlines based on search query
  const filteredAirlines = availableAirlines.filter(airline =>
    airline.AirlineId.toLowerCase().includes(airlineSearchQuery.toLowerCase()) ||
    airline.AirlineName.toLowerCase().includes(airlineSearchQuery.toLowerCase())
  );

  // Check completion status
  const isComplete = flightsEnabled 
    ? flightGroups.length > 0 && flightGroups.every(group => 
        group.originAirport && group.destinationAirport && group.cabinClass
      )
    : true;

  if (disabled) {
    return (
      <div className="space-y-6">
        <div className="h-10 bg-muted animate-pulse rounded-lg" />
        <div className="h-10 bg-muted animate-pulse rounded-lg" />
        <div className="h-10 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mx-auto space-y-8 max-w-6xl"
    >
      {/* Flight Section Toggle */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-gradient-to-br from-[var(--card)] via-[var(--card)]/95 to-[var(--background)]/30 border border-[var(--border)] rounded-3xl shadow-lg overflow-hidden backdrop-blur-sm">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-[var(--card-foreground)]">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary)]/10 flex items-center justify-center border border-[var(--primary)]/30 shadow-sm">
                  <Plane className="h-6 w-6 text-[var(--primary)]" />
                </div>
                <div>
                  <div className="text-xl font-bold">Flight Search & Preferences</div>
                  <div className="text-sm font-normal text-[var(--muted-foreground)] mt-1">
                    {travelerType === 'group' ? 'Search and configure flights for each travel group' : 'Search flights for your trip'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={flightsEnabled}
                  onCheckedChange={handleToggleFlights}
                  disabled={disabled}
                />
                <Label className="text-sm font-medium">
                  {flightsEnabled ? 'Include Flights' : 'Exclude Flights'}
                </Label>
              </div>
            </CardTitle>
          </CardHeader>
          
          {flightsEnabled && (
            <CardContent className="space-y-6">
              {/* Flight Groups with Tabs - Only show for Group */}
              {travelerType === 'group' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
                    <Users className="h-4 w-4 text-[var(--primary)]" />
                    Flight Groups ({flightGroups.length})
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addFlightGroup}
                    disabled={disabled}
                    className="h-8"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Group
                  </Button>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 bg-[var(--muted)]/50">
                    <TabsTrigger value="search" className="flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      Flight Search
                    </TabsTrigger>
                    <TabsTrigger value="preferences" className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Preferences
                    </TabsTrigger>
                    <TabsTrigger value="summary" className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Summary
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="search" className="space-y-6 mt-6">
                <AnimatePresence>
                  {flightGroups.map((flightGroup, index) => {
                    const tripGroup = tripGroups.find(g => g.id === flightGroup.groupId);
                    const groupName = tripGroup?.name || `Group ${index + 1}`;
                    const groupSize = (tripGroup?.adults || 0) + (tripGroup?.children || 0);

                    return (
                            <React.Fragment key={flightGroup.groupId}>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="border border-[var(--border)] rounded-2xl p-6 space-y-6 bg-gradient-to-br from-[var(--background)]/50 to-[var(--background)]/20 backdrop-blur-sm hover:shadow-md transition-all duration-200"
                      >
                        {/* Group Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center border border-[var(--primary)]/20">
                              <Users className="h-5 w-5 text-[var(--primary)]" />
                            </div>
                            <div>
                              <span className="font-semibold text-[var(--foreground)]">{groupName}</span>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="text-xs bg-[var(--accent)]/20 text-[var(--accent-foreground)]">
                                  {groupSize} travelers
                                </Badge>
                                    {tripGroup?.adults && tripGroup.adults > 0 && (
                                  <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                                        {tripGroup?.adults} adults
                                  </Badge>
                                )}
                                    {tripGroup?.children && tripGroup.children > 0 && (
                                  <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-200">
                                        {tripGroup?.children} children
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => duplicateFlightGroup(flightGroup.groupId)}
                              disabled={disabled}
                              className="h-8 w-8 p-0 rounded-lg hover:bg-[var(--accent)] transition-colors"
                              title="Duplicate group"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFlightGroup(flightGroup.groupId)}
                              disabled={disabled}
                              className="h-8 w-8 p-0 rounded-lg hover:bg-red-100 hover:text-red-700 transition-colors"
                              title="Remove group"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                            {/* Flight Search Interface */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          {/* Origin Airport */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-[var(--foreground)] flex items-center gap-2">
                                  <PlaneTakeoff className="h-4 w-4 text-[var(--primary)]" />
                                  From *
                            </Label>
                                <Popover open={showAirportSearch === `origin-${flightGroup.groupId}`} onOpenChange={(open) => setShowAirportSearch(open ? `origin-${flightGroup.groupId}` : null)}>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                        "w-full justify-start text-left font-normal h-12 rounded-xl border-[var(--border)] bg-[var(--background)] hover:border-[var(--primary)]/30 transition-colors duration-200",
                                    !flightGroup.originAirport && "text-[var(--muted-foreground)]"
                                  )}
                                >
                                  <MapPin className="mr-2 h-4 w-4" />
                                      {flightGroup.originAirport || "Select departure airport"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80 p-0" align="start">
                                <Command>
                                  <CommandInput 
                                    placeholder="Search airports..." 
                                    value={airportSearchQuery}
                                    onValueChange={setAirportSearchQuery}
                                  />
                                  <CommandList>
                                    <CommandEmpty>No airports found.</CommandEmpty>
                                    <CommandGroup>
                                      <div className="px-2 py-1.5 text-sm font-medium text-[var(--muted-foreground)]">
                                        Popular Airports
                                      </div>
                                      {popularAirports.map((airport) => (
                                        <CommandItem
                                          key={airport.code}
                                          value={`${airport.code} ${airport.name} ${airport.city}`}
                                          onSelect={() => {
                                            updateFlightGroup(flightGroup.groupId, { originAirport: airport.code });
                                            setShowAirportSearch(null);
                                            setAirportSearchQuery('');
                                          }}
                                          className="flex items-center gap-3"
                                        >
                                          <MapPin className="h-4 w-4 text-[var(--muted-foreground)]" />
                                          <div>
                                            <div className="font-medium">{airport.code}</div>
                                            <div className="text-xs text-[var(--muted-foreground)]">
                                              {airport.name}, {airport.city}
                                            </div>
                                          </div>
                                        </CommandItem>
                                      ))}
                                      
                                      <Separator className="my-2" />
                                      
                                      <div className="px-2 py-1.5 text-sm font-medium text-[var(--muted-foreground)]">
                                        All Airports
                                      </div>
                                      {filteredAirports.map((airport) => (
                                        <CommandItem
                                          key={airport.AirportId}
                                          value={`${airport.AirportId} ${airport.AirportName}`}
                                          onSelect={() => {
                                            updateFlightGroup(flightGroup.groupId, { originAirport: airport.AirportId });
                                            setShowAirportSearch(null);
                                            setAirportSearchQuery('');
                                          }}
                                          className="flex items-center gap-3"
                                        >
                                          <MapPin className="h-4 w-4 text-[var(--muted-foreground)]" />
                                          <div>
                                            <div className="font-medium">{airport.AirportId}</div>
                                            <div className="text-xs text-[var(--muted-foreground)]">
                                              {airport.AirportName}
                                            </div>
                                          </div>
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          </div>

                          {/* Destination Airport */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-[var(--foreground)] flex items-center gap-2">
                                  <PlaneLanding className="h-4 w-4 text-[var(--primary)]" />
                                  To *
                            </Label>
                                    <Popover open={showAirportSearch === `destination-${flightGroup.groupId}`} onOpenChange={(open) => setShowAirportSearch(open ? `destination-${flightGroup.groupId}` : null)}>
                                      <PopoverTrigger asChild>
                                        <Button
                                          variant="outline"
                                          className={cn(
                                            "w-full justify-start text-left font-normal h-12 rounded-xl border-[var(--border)] bg-[var(--background)] hover:border-[var(--primary)]/30 transition-colors duration-200",
                                            !flightGroup.destinationAirport && "text-[var(--muted-foreground)]"
                                          )}
                                        >
                                          <MapPin className="mr-2 h-4 w-4" />
                                          {flightGroup.destinationAirport || "Select arrival airport"}
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-80 p-0" align="start">
                                        <Command>
                                          <CommandInput 
                                            placeholder="Search airports..." 
                                            value={airportSearchQuery}
                                            onValueChange={setAirportSearchQuery}
                                          />
                                          <CommandList>
                                            <CommandEmpty>No airports found.</CommandEmpty>
                                            <CommandGroup>
                                              <div className="px-2 py-1.5 text-sm font-medium text-[var(--muted-foreground)]">
                                                Popular Airports
                        </div>
                                              {popularAirports.map((airport) => (
                                                <CommandItem
                                                  key={airport.code}
                                                  value={`${airport.code} ${airport.name} ${airport.city}`}
                                                  onSelect={() => {
                                                    updateFlightGroup(flightGroup.groupId, { destinationAirport: airport.code });
                                                    setShowAirportSearch(null);
                                                    setAirportSearchQuery('');
                                                  }}
                                                  className="flex items-center gap-3"
                                                >
                                                  <MapPin className="h-4 w-4 text-[var(--muted-foreground)]" />
                                                  <div>
                                                    <div className="font-medium">{airport.code}</div>
                                                    <div className="text-xs text-[var(--muted-foreground)]">
                                                      {airport.name}, {airport.city}
                                                    </div>
                                                  </div>
                                                </CommandItem>
                                              ))}
                                              
                                              <Separator className="my-2" />
                                              
                                              <div className="px-2 py-1.5 text-sm font-medium text-[var(--muted-foreground)]">
                                                All Airports
                                              </div>
                                              {filteredAirports.map((airport) => (
                                                <CommandItem
                                                  key={airport.AirportId}
                                                  value={`${airport.AirportId} ${airport.AirportName}`}
                                                  onSelect={() => {
                                                    updateFlightGroup(flightGroup.groupId, { destinationAirport: airport.AirportId });
                                                    setShowAirportSearch(null);
                                                    setAirportSearchQuery('');
                                                  }}
                                                  className="flex items-center gap-3"
                                                >
                                                  <MapPin className="h-4 w-4 text-[var(--muted-foreground)]" />
                                                  <div>
                                                    <div className="font-medium">{airport.AirportId}</div>
                                                    <div className="text-xs text-[var(--muted-foreground)]">
                                                      {airport.AirportName}
                                                    </div>
                                                  </div>
                                                </CommandItem>
                                              ))}
                                            </CommandGroup>
                                          </CommandList>
                                        </Command>
                                      </PopoverContent>
                                    </Popover>
                                  </div>

                                  {/* Cabin Class */}
                        <div className="space-y-2">
                                    <Label className="text-sm font-medium text-[var(--foreground)] flex items-center gap-2">
                                      <Star className="h-4 w-4 text-[var(--primary)]" />
                                      Cabin Class
                          </Label>
                                    <Select
                                      value={flightGroup.cabinClass || 'economy'}
                                      onValueChange={val => updateFlightGroup(flightGroup.groupId, { cabinClass: val as CabinClass })}
                                      disabled={disabled}
                                    >
                                      <SelectTrigger className="h-12 rounded-xl border-[var(--border)] bg-[var(--background)] focus:border-[var(--primary)] focus:ring-[var(--primary)]/20">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {cabinClassOptions.map(opt => (
                                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>

                                {/* Search Button */}
                                <div className="flex justify-end">
                                <Button
                                  onClick={() => searchFlights(flightGroup.groupId)}
                                    disabled={disabled || !flightGroup.originAirport || !flightGroup.destinationAirport || isSearching}
                                    className="h-12 px-6 rounded-xl"
                                >
                                  {isSearching ? (
                                    <>
                                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                      Searching...
                                    </>
                                  ) : (
                                    <>
                                      <Search className="h-4 w-4 mr-2" />
                                      Search Flights
                                    </>
                                  )}
                                </Button>
                              </div>
                              </motion.div>
                              {/* Selected Flight Summary for this group */}
                              {selectedFlights[flightGroup.groupId] && (
                                <div className="mt-4">
                                  <Card className="border-2 border-[var(--primary)]/30 bg-[var(--primary)]/5">
                                    <CardHeader>
                                      <CardTitle className="flex items-center gap-2">
                                        <Plane className="h-5 w-5 text-[var(--primary)]" />
                                        Selected Flight for {groupName}
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                        <div>
                                          <div className="font-semibold">{selectedFlights[flightGroup.groupId].Routing}</div>
                                          <div className="text-xs text-[var(--muted-foreground)]">Airline: {getAirlineById(selectedFlights[flightGroup.groupId].ValidatingAirlineId)?.AirlineName || 'Unknown'}</div>
                                          <div className="text-xs text-[var(--muted-foreground)]">Stops: {selectedFlights[flightGroup.groupId].Routing.split('-').length - 1}</div>
                            </div>
                                        <div className="flex items-center gap-4">
                                          <div className="text-lg font-bold text-[var(--primary)]">${selectedFlights[flightGroup.groupId].Total}</div>
                                          <Button variant="outline" onClick={() => { setActiveGroupId(flightGroup.groupId); setShowFlightResults(true); }}>Change</Button>
                                          </div>
                                            </div>
                                    </CardContent>
                                  </Card>
                              </div>
                            )}
                            </React.Fragment>
                        );
                      })}
                    </AnimatePresence>
                  </TabsContent>

                    {/* Rest of the tabs content remains the same */}
                  <TabsContent value="preferences" className="space-y-6 mt-6">
                      {/* Preferences content */}
                    </TabsContent>
                    <TabsContent value="summary" className="space-y-6 mt-6">
                      {/* Summary content */}
                    </TabsContent>
                  </Tabs>
                </div>
              )}

              {/* Simple Flight Search for Solo/Couple/Family */}
              {(travelerType === 'solo' || travelerType === 'couple' || travelerType === 'family') && (
                <div className="border border-[var(--border)] rounded-2xl p-6 space-y-6 bg-gradient-to-br from-[var(--background)]/50 to-[var(--background)]/20 backdrop-blur-sm">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center border border-[var(--primary)]/20">
                                <Users className="h-5 w-5 text-[var(--primary)]" />
                              </div>
                    <div>
                      <span className="font-semibold text-[var(--foreground)]">
                        {travelerType === 'solo' ? 'Solo Traveler' : travelerType === 'couple' ? 'Couple' : 'Family'}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs bg-[var(--accent)]/20 text-[var(--accent-foreground)]">
                          {travelerType === 'solo' ? '1 traveler' : travelerType === 'couple' ? '2 travelers' : 'Family travelers'}
                        </Badge>
                      </div>
                    </div>
                        </div>

                  {/* Flight Search Interface */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Origin Airport */}
                    <div className="space-y-2">
                            <Label className="text-sm font-medium text-[var(--foreground)] flex items-center gap-2">
                        <PlaneTakeoff className="h-4 w-4 text-[var(--primary)]" />
                        From *
                            </Label>
                      <Popover open={showAirportSearch === 'origin-simple'} onOpenChange={(open) => setShowAirportSearch(open ? 'origin-simple' : null)}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal h-12 rounded-xl border-[var(--border)] bg-[var(--background)] hover:border-[var(--primary)]/30 transition-colors duration-200",
                              !flightGroups[0]?.originAirport && "text-[var(--muted-foreground)]"
                            )}
                          >
                            <MapPin className="mr-2 h-4 w-4" />
                            {flightGroups[0]?.originAirport || "Select departure airport"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0" align="start">
                          <Command>
                            <CommandInput 
                              placeholder="Search airports..." 
                              value={airportSearchQuery}
                              onValueChange={setAirportSearchQuery}
                            />
                            <CommandList>
                              <CommandEmpty>No airports found.</CommandEmpty>
                              <CommandGroup>
                                <div className="px-2 py-1.5 text-sm font-medium text-[var(--muted-foreground)]">
                                  Popular Airports
                                        </div>
                                {popularAirports.map((airport) => (
                                  <CommandItem
                                    key={airport.code}
                                    value={`${airport.code} ${airport.name} ${airport.city}`}
                                    onSelect={() => {
                                      form.setValue('flights.groups.0.originAirport', airport.code);
                                      setShowAirportSearch(null);
                                      setAirportSearchQuery('');
                                    }}
                                    className="flex items-center gap-3"
                                  >
                                    <MapPin className="h-4 w-4 text-[var(--muted-foreground)]" />
                                        <div>
                                      <div className="font-medium">{airport.code}</div>
                                      <div className="text-xs text-[var(--muted-foreground)]">
                                        {airport.name}, {airport.city}
                                        </div>
                                      </div>
                                  </CommandItem>
                                ))}
                                
                                <Separator className="my-2" />
                                
                                <div className="px-2 py-1.5 text-sm font-medium text-[var(--muted-foreground)]">
                                  All Airports
                            </div>
                                {filteredAirports.map((airport) => (
                                  <CommandItem
                                    key={airport.AirportId}
                                    value={`${airport.AirportId} ${airport.AirportName}`}
                                    onSelect={() => {
                                      form.setValue('flights.groups.0.originAirport', airport.AirportId);
                                      setShowAirportSearch(null);
                                      setAirportSearchQuery('');
                                    }}
                                    className="flex items-center gap-3"
                                  >
                                    <MapPin className="h-4 w-4 text-[var(--muted-foreground)]" />
                                    <div>
                                      <div className="font-medium">{airport.AirportId}</div>
                                      <div className="text-xs text-[var(--muted-foreground)]">
                                        {airport.AirportName}
                          </div>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                        </div>

                    {/* Destination Airport */}
                    <div className="space-y-2">
                          <Label className="text-sm font-medium text-[var(--foreground)] flex items-center gap-2">
                        <PlaneLanding className="h-4 w-4 text-[var(--primary)]" />
                        To *
                          </Label>
                      <Popover open={showAirportSearch === 'destination-simple'} onOpenChange={(open) => setShowAirportSearch(open ? 'destination-simple' : null)}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal h-12 rounded-xl border-[var(--border)] bg-[var(--background)] hover:border-[var(--primary)]/30 transition-colors duration-200",
                              !flightGroups[0]?.destinationAirport && "text-[var(--muted-foreground)]"
                            )}
                          >
                            <MapPin className="mr-2 h-4 w-4" />
                            {flightGroups[0]?.destinationAirport || "Select arrival airport"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-0" align="start">
                              <Command>
                                <CommandInput 
                              placeholder="Search airports..." 
                              value={airportSearchQuery}
                              onValueChange={setAirportSearchQuery}
                                />
                                <CommandList>
                              <CommandEmpty>No airports found.</CommandEmpty>
                                  <CommandGroup>
                                <div className="px-2 py-1.5 text-sm font-medium text-[var(--muted-foreground)]">
                                  Popular Airports
                                </div>
                                {popularAirports.map((airport) => (
                                      <CommandItem
                                    key={airport.code}
                                    value={`${airport.code} ${airport.name} ${airport.city}`}
                                    onSelect={() => {
                                      form.setValue('flights.groups.0.destinationAirport', airport.code);
                                      setShowAirportSearch(null);
                                      setAirportSearchQuery('');
                                    }}
                                        className="flex items-center gap-3"
                                      >
                                    <MapPin className="h-4 w-4 text-[var(--muted-foreground)]" />
                                        <div>
                                      <div className="font-medium">{airport.code}</div>
                                          <div className="text-xs text-[var(--muted-foreground)]">
                                        {airport.name}, {airport.city}
                                      </div>
                                    </div>
                                  </CommandItem>
                                ))}
                                
                                <Separator className="my-2" />
                                
                                <div className="px-2 py-1.5 text-sm font-medium text-[var(--muted-foreground)]">
                                  All Airports
                                </div>
                                {filteredAirports.map((airport) => (
                                  <CommandItem
                                    key={airport.AirportId}
                                    value={`${airport.AirportId} ${airport.AirportName}`}
                                    onSelect={() => {
                                      form.setValue('flights.groups.0.destinationAirport', airport.AirportId);
                                      setShowAirportSearch(null);
                                      setAirportSearchQuery('');
                                    }}
                                    className="flex items-center gap-3"
                                  >
                                    <MapPin className="h-4 w-4 text-[var(--muted-foreground)]" />
                                    <div>
                                      <div className="font-medium">{airport.AirportId}</div>
                                      <div className="text-xs text-[var(--muted-foreground)]">
                                        {airport.AirportName}
                                          </div>
                                        </div>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                    </div>

                    {/* Cabin Class */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-[var(--foreground)] flex items-center gap-2">
                        <Star className="h-4 w-4 text-[var(--primary)]" />
                        Cabin Class
                      </Label>
                      <Select
                        value={flightGroups[0]?.cabinClass || 'economy'}
                        onValueChange={val => form.setValue('flights.groups.0.cabinClass', val as CabinClass)}
                                      disabled={disabled}
                      >
                        <SelectTrigger className="h-12 rounded-xl border-[var(--border)] bg-[var(--background)] focus:border-[var(--primary)] focus:ring-[var(--primary)]/20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {cabinClassOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                            </div>
                        </div>

                  {/* Search Button */}
                  <div className="flex justify-end">
                    <Button
                      onClick={() => searchFlights('default')}
                      disabled={disabled || !flightGroups[0]?.originAirport || !flightGroups[0]?.destinationAirport || isSearching}
                      className="h-12 px-6 rounded-xl"
                    >
                      {isSearching ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Searching...
                        </>
                      ) : (
                        <>
                          <Search className="h-4 w-4 mr-2" />
                          Search Flights
                        </>
                      )}
                    </Button>
                        </div>
                </div>
              )}
            </CardContent>
          )}
        </Card>
                      </motion.div>

      {/* Flight Results Dialog */}
      <Dialog open={showFlightResults} onOpenChange={setShowFlightResults}>
        <DialogContent className="!max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Plane className="h-6 w-6 text-[var(--primary)]" />
              Flight Search Results
            </DialogTitle>
          </DialogHeader>
          
                    <div className="space-y-4">
            {/* Search Summary */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[var(--primary)]/10 to-[var(--primary)]/5 rounded-2xl border border-[var(--primary)]/20">
                              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/20 flex items-center justify-center">
                  <Search className="h-5 w-5 text-[var(--primary)]" />
                                </div>
                <div>
                  <div className="text-sm font-semibold text-[var(--primary)]">
                    {searchResults.length} flights found
                  </div>
                  <div className="text-xs text-[var(--muted-foreground)]">
                    {flightGroups[0]?.originAirport} → {flightGroups[0]?.destinationAirport}
                  </div>
                </div>
                              </div>
                              <Badge variant="outline" className="bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20">
                {flightGroups[0]?.cabinClass || 'economy'} class
                              </Badge>
                            </div>

            {/* Flight Results */}
            <div className="space-y-3">
              {searchResults.map((flight, index) => {
                const airline = getAirlineById(flight.ValidatingAirlineId);
                const routeParts = flight.Routing.split('-');
                const origin = getLocationById(routeParts[0] || '');
                const destination = getLocationById(routeParts[routeParts.length - 1] || '');

                        return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border border-[var(--border)] rounded-2xl p-6 hover:shadow-md transition-all duration-200 cursor-pointer bg-gradient-to-br from-[var(--background)]/50 to-[var(--background)]/20 backdrop-blur-sm"
                    onClick={() => handleFlightSelection(flight)}
                  >
                            <div className="flex items-center justify-between">
                      {/* Flight Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
                              <Plane className="h-4 w-4 text-[var(--primary)]" />
                                </div>
                              <div>
                              <div className="font-semibold text-[var(--foreground)]">
                                {airline?.AirlineName || 'Unknown Airline'}
                              </div>
                              <div className="text-xs text-[var(--muted-foreground)]">
                                Flight {flight.ValidatingAirlineId}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {routeParts.length - 1} stop{(routeParts.length - 1) !== 1 ? 's' : ''}
                              </Badge>
                            {routeParts.length === 2 && (
                              <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-200">
                                Direct
                              </Badge>
                            )}
                            </div>
                        </div>

                        {/* Route */}
                        <div className="flex items-center gap-4 mb-4">
                          <div className="text-center">
                            <div className="text-lg font-bold text-[var(--foreground)]">
                              {origin?.AirportId || 'N/A'}
                            </div>
                            <div className="text-xs text-[var(--muted-foreground)]">
                              {origin?.AirportName || 'Unknown'}
                            </div>
                          </div>
                          
                          <div className="flex-1 flex items-center justify-center">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-1 bg-[var(--primary)]/30 rounded-full"></div>
                              <Plane className="h-4 w-4 text-[var(--primary)]" />
                              <div className="w-8 h-1 bg-[var(--primary)]/30 rounded-full"></div>
                            </div>
                          </div>
                          
                          <div className="text-center">
                            <div className="text-lg font-bold text-[var(--foreground)]">
                              {destination?.AirportId || 'N/A'}
                            </div>
                            <div className="text-xs text-[var(--muted-foreground)]">
                              {destination?.AirportName || 'Unknown'}
                            </div>
                          </div>
                        </div>

                        {/* Flight Details */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-[var(--muted-foreground)]" />
                              <div>
                              <div className="font-medium text-[var(--foreground)]">
                                {flight.TicketingDeadline ? 
                                  format(new Date(flight.TicketingDeadline), 'MMM dd') : 'N/A'
                                }
                              </div>
                              <div className="text-xs text-[var(--muted-foreground)]">Ticketing Deadline</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Route className="h-4 w-4 text-[var(--muted-foreground)]" />
                              <div>
                              <div className="font-medium text-[var(--foreground)]">
                                {flight.Routing}
                              </div>
                              <div className="text-xs text-[var(--muted-foreground)]">Route</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-[var(--muted-foreground)]" />
                            <div>
                              <div className="font-medium text-[var(--foreground)]">
                                {flight.Passengers.reduce((sum, p) => sum + p.TypeCount, 0)}
                              </div>
                              <div className="text-xs text-[var(--muted-foreground)]">Passengers</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-[var(--muted-foreground)]" />
                            <div>
                              <div className="font-medium text-[var(--foreground)]">
                                {(() => {
                                  const preferredCurrency = form.watch('preferences.currency') || 'GBP';
                                  const originalCurrency = mockLowFareResult.Currency.CurrencyId;
                                  const originalPrice = flight.Total;
                                  
                                  if (originalPrice && preferredCurrency !== originalCurrency) {
                                    const convertedPrice = convertCurrency(originalPrice, originalCurrency, preferredCurrency, 0.02);
                                    return formatCurrency(convertedPrice, preferredCurrency);
                                  }
                                  return formatCurrency(originalPrice || 0, originalCurrency);
                                })()}
                              </div>
                              <div className="text-xs text-[var(--muted-foreground)]">Total Price</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Select Button */}
                      <div className="flex flex-col items-end gap-2">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFlightSelection(flight);
                          }}
                          className="h-10 px-4 rounded-xl"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Select Flight
                        </Button>
                        <div className="text-right">
                          <div className="text-lg font-bold text-[var(--foreground)]">
                            {(() => {
                              const preferredCurrency = form.watch('preferences.currency') || 'GBP';
                              const originalCurrency = mockLowFareResult.Currency.CurrencyId;
                              const originalPrice = flight.Total;
                              
                              if (originalPrice && preferredCurrency !== originalCurrency) {
                                const convertedPrice = convertCurrency(originalPrice, originalCurrency, preferredCurrency, 0.02);
                                return formatCurrency(convertedPrice, preferredCurrency);
                              }
                              return formatCurrency(originalPrice || 0, originalCurrency);
                            })()}
                          </div>
                          <div className="text-xs text-[var(--muted-foreground)]">total</div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                        );
                      })}
                    </div>

            {/* No Results */}
            {searchResults.length === 0 && (
              <div className="text-center py-12">
                <Plane className="h-12 w-12 text-[var(--muted-foreground)] mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">No flights found</h3>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Try adjusting your search criteria or dates
                </p>
                  </div>
                )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Selected Flight Summary */}
      {(travelerType === 'solo' || travelerType === 'couple' || travelerType === 'family') && selectedFlights['default'] && (
        <div className="mt-6">
          <Card className="border-2 border-[var(--primary)]/30 bg-[var(--primary)]/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plane className="h-5 w-5 text-[var(--primary)]" />
                Selected Flight
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="font-semibold">{selectedFlights['default'].Routing}</div>
                  <div className="text-xs text-[var(--muted-foreground)]">Airline: {getAirlineById(selectedFlights['default'].ValidatingAirlineId)?.AirlineName || 'Unknown'}</div>
                  <div className="text-xs text-[var(--muted-foreground)]">Stops: {selectedFlights['default'].Routing.split('-').length - 1}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-lg font-bold text-[var(--primary)]">${selectedFlights['default'].Total}</div>
                  <Button variant="outline" onClick={() => { setActiveGroupId('default'); setShowFlightResults(true); }}>Change</Button>
                </div>
              </div>
            </CardContent>
        </Card>
        </div>
      )}

      {/* Selected Flight Summary for Group Mode */}
      {travelerType === 'group' && flightGroups.map((flightGroup, index) => (
        selectedFlights[flightGroup.groupId] && (
          <div className="mt-6" key={flightGroup.groupId}>
            <Card className="border-2 border-[var(--primary)]/30 bg-[var(--primary)]/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plane className="h-5 w-5 text-[var(--primary)]" />
                  Selected Flight for {tripGroups.find(g => g.id === flightGroup.groupId)?.name || `Group ${index + 1}`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="font-semibold">{selectedFlights[flightGroup.groupId].Routing}</div>
                    <div className="text-xs text-[var(--muted-foreground)]">Airline: {getAirlineById(selectedFlights[flightGroup.groupId].ValidatingAirlineId)?.AirlineName || 'Unknown'}</div>
                    <div className="text-xs text-[var(--muted-foreground)]">Stops: {selectedFlights[flightGroup.groupId].Routing.split('-').length - 1}</div>
        </div>
                  <div className="flex items-center gap-4">
                    <div className="text-lg font-bold text-[var(--primary)]">${selectedFlights[flightGroup.groupId].Total}</div>
                    <Button variant="outline" onClick={() => { setActiveGroupId(flightGroup.groupId); setShowFlightResults(true); }}>Change</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )
      ))}
    </motion.div>
  );
} 