import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plane, Database, CloudOff, Search, Calendar, Clock, MapPin, Building, Users, CheckCircle, AlertCircle, Loader2, Info, PlaneTakeoff, PlaneLanding, BaggageClaim, CreditCard } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { FlightApiService, ApiFlight } from '@/lib/flightApiService';

export type FlightSource = 'none' | 'database' | 'api';

export interface SelectedFlight {
  id: string;
  source: FlightSource;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  price: number;
  passengers: number;
  // Additional fields for database flights
  outboundFlightNumber?: string;
  inboundFlightNumber?: string;
  outboundDepartureAirportCode?: string;
  outboundArrivalAirportCode?: string;
  inboundDepartureAirportCode?: string;
  inboundArrivalAirportCode?: string;
  airline?: string;
  cabin?: string;
  refundable?: boolean;
  baggageAllowance?: string;
}

interface DatabaseFlight {
  id: string;
  event_id: string;
  outbound_flight_number: string;
  outbound_departure_airport_code: string;
  outbound_departure_airport_name: string;
  outbound_arrival_airport_code: string;
  outbound_arrival_airport_name: string;
  outbound_departure_datetime: string;
  outbound_arrival_datetime: string;
  inbound_flight_number: string | null;
  inbound_departure_airport_code: string | null;
  inbound_departure_airport_name: string | null;
  inbound_arrival_airport_code: string | null;
  inbound_arrival_airport_name: string | null;
  inbound_departure_datetime: string | null;
  inbound_arrival_datetime: string | null;
  airline: string | null;
  cabin: string | null;
  total_price_gbp: number;
  currency: string;
  refundable: boolean;
  baggage_allowance: string | null;
  notes: string | null;
  supplier: string | null;
  active: boolean;
}

interface StepFlightsProps {
  adults: number;
  eventId?: string;
  value: SelectedFlight[];
  source: FlightSource;
  onSourceChange: (source: FlightSource) => void;
  onChange: (flights: SelectedFlight[]) => void;
}

export function StepFlights({ adults, eventId, value, source, onSourceChange, onChange }: StepFlightsProps) {
  const [databaseFlights, setDatabaseFlights] = useState<DatabaseFlight[]>([]);
  const [apiFlights, setApiFlights] = useState<ApiFlight[]>([]);
  const [selectedFlightIds, setSelectedFlightIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // API Flight Search State
  const [searchParams, setSearchParams] = useState({
    origin: '',
    destination: '',
    departureDate: '',
    returnDate: '',
    cabinClass: 'ECO',
    isReturn: false
  });
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Flight Filters State
  const [filters, setFilters] = useState({
    priceRange: [0, 5000],
    airlines: [] as string[],
    cabinClasses: [] as string[],
    maxStops: 2,
    maxDuration: 24,
    sortBy: 'price' as 'price' | 'duration' | 'departureTime'
  });

  // Fetch database flights when source changes to database
  useEffect(() => {
    if (source === 'database' && eventId) {
      fetchDatabaseFlights();
    }
  }, [source, eventId]);

  // Update selected flights when database flights change
  useEffect(() => {
    if (source === 'database' && databaseFlights.length > 0 && selectedFlightIds.length > 0) {
      const selectedFlights = databaseFlights
        .filter(flight => selectedFlightIds.includes(flight.id))
        .map(flight => ({
          id: flight.id,
          source: 'database' as FlightSource,
          origin: flight.outbound_departure_airport_code,
          destination: flight.outbound_arrival_airport_code,
          departureDate: flight.outbound_departure_datetime,
          returnDate: flight.inbound_departure_datetime || undefined,
          price: flight.total_price_gbp * 1.1, // Add 10% markup
          passengers: adults,
        }));

      // Only update if the selection actually changed
      const currentFlightIds = value.map(f => f.id).sort();
      const newFlightIds = selectedFlights.map(f => f.id).sort();
      
      if (JSON.stringify(currentFlightIds) !== JSON.stringify(newFlightIds)) {
        onChange(selectedFlights);
      }
    } else if (source === 'database' && selectedFlightIds.length === 0 && value.length > 0) {
      onChange([]);
    }
  }, [selectedFlightIds, databaseFlights, source, adults]);

  // Update selected flights when API flights change
  useEffect(() => {
    if (source === 'api' && apiFlights.length > 0 && selectedFlightIds.length > 0) {
      const selectedFlights = apiFlights
        .filter(flight => selectedFlightIds.includes(flight.id))
        .map(flight => ({
          id: flight.id,
          source: 'api' as FlightSource,
          origin: flight.origin,
          destination: flight.destination,
          departureDate: flight.departureDate,
          returnDate: flight.returnDate,
          price: flight.price * 1.1, // Add 10% markup
          passengers: flight.passengers,
        }));

      // Only update if the selection actually changed
      const currentFlightIds = value.map(f => f.id).sort();
      const newFlightIds = selectedFlights.map(f => f.id).sort();
      
      if (JSON.stringify(currentFlightIds) !== JSON.stringify(newFlightIds)) {
        onChange(selectedFlights);
      }
    } else if (source === 'api' && selectedFlightIds.length === 0 && value.length > 0) {
      onChange([]);
    }
  }, [selectedFlightIds, apiFlights, source]);

  // Sync selectedFlightIds with value when source changes
  useEffect(() => {
    if (source === 'none') {
      setSelectedFlightIds([]);
    } else {
      const currentIds = value.map(f => f.id);
      setSelectedFlightIds(currentIds);
    }
  }, [source, value]);

  const fetchDatabaseFlights = async () => {
    if (!eventId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('flights')
        .select('*')
        .eq('event_id', eventId)
        .eq('active', true)
        .order('total_price_gbp', { ascending: true });

      if (error) throw error;
      setDatabaseFlights(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch flights');
    } finally {
      setLoading(false);
    }
  };

  const handleFlightSelection = (flightId: string, checked: boolean) => {
    if (checked) {
      if (selectedFlightIds.length < adults) {
        setSelectedFlightIds(prev => [...prev, flightId]);
      }
    } else {
      setSelectedFlightIds(prev => prev.filter(id => id !== flightId));
    }
  };

  const handlePassengerCountChange = (flightId: string, count: number) => {
    // Update the flight in the value array with new passenger count
    const updatedFlights = value.map(flight => 
      flight.id === flightId ? { ...flight, passengers: count } : flight
    );
    onChange(updatedFlights);
  };

  const handleApiFlightSearch = async () => {
    if (!searchParams.origin || !searchParams.destination || !searchParams.departureDate) {
      setSearchError('Please fill in all required fields');
      return;
    }

    if (!FlightApiService.validateAirportCode(searchParams.origin) || 
        !FlightApiService.validateAirportCode(searchParams.destination)) {
      setSearchError('Please enter valid 3-letter airport codes');
      return;
    }

    setSearching(true);
    setSearchError(null);
    setApiFlights([]);
    setSelectedFlightIds([]);

    try {
      const params = {
        origin: searchParams.origin.toUpperCase(),
        destination: searchParams.destination.toUpperCase(),
        departureDate: searchParams.departureDate,
        returnDate: searchParams.isReturn && searchParams.returnDate ? searchParams.returnDate : undefined,
        adults: adults,
        cabinClass: searchParams.cabinClass,
      };

      const flights = await FlightApiService.searchFlightsWithRetry(params);
      setApiFlights(flights);
      
      if (flights.length === 0) {
        setSearchError('No flights found for your search criteria');
      }
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Failed to search flights');
    } finally {
      setSearching(false);
    }
  };

  // Filter and sort flights
  const getFilteredFlights = () => {
    if (apiFlights.length === 0) return [];

    let filtered = apiFlights.filter(flight => {
      // Price filter (apply 10% markup for comparison)
      const markedUpPrice = flight.price * 1.1;
      if (markedUpPrice < filters.priceRange[0] || markedUpPrice > filters.priceRange[1]) {
        return false;
      }

      // Airline filter
      if (filters.airlines.length > 0 && !filters.airlines.includes(flight.airline)) {
        return false;
      }

      // Cabin class filter
      if (filters.cabinClasses.length > 0 && !filters.cabinClasses.includes(flight.cabin)) {
        return false;
      }

      // Stops filter
      if (flight.stops > filters.maxStops) {
        return false;
      }

      // Duration filter (convert HH:MM to hours)
      const durationHours = FlightApiService.parseDurationToHours(flight.duration);
      if (durationHours > filters.maxDuration) {
        return false;
      }

      return true;
    });

    // Sort flights
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'price':
          return (a.price * 1.1) - (b.price * 1.1); // Sort by marked-up price
        case 'duration':
          return FlightApiService.parseDurationToHours(a.duration) - FlightApiService.parseDurationToHours(b.duration);
        case 'departureTime':
          return new Date(a.departureDate).getTime() - new Date(b.departureDate).getTime();
        default:
          return (a.price * 1.1) - (b.price * 1.1); // Sort by marked-up price
      }
    });

    return filtered;
  };

  // Get unique airlines and cabin classes for filter options
  const getUniqueAirlines = () => {
    const airlines = new Set(apiFlights.map(f => f.airline));
    return Array.from(airlines).sort();
  };

  const getUniqueCabinClasses = () => {
    const cabins = new Set(apiFlights.map(f => f.cabin));
    return Array.from(cabins).sort();
  };

  const getPriceRange = () => {
    if (apiFlights.length === 0) return [0, 1000];
    const prices = apiFlights.map(f => f.price * 1.1); // Apply 10% markup to price range
    return [Math.min(...prices), Math.max(...prices)];
  };

  const getTotalSelectedPrice = () => {
    return value.reduce((sum, flight) => sum + (flight.price * flight.passengers), 0);
  };

  const formatDateTime = (dateTime: string) => {
    return format(new Date(dateTime), 'MMM dd, yyyy HH:mm');
  };

  const formatDate = (dateTime: string) => {
    return format(new Date(dateTime), 'MMM dd, yyyy');
  };

  return (
    <div className="space-y-6">
      {/* Source Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5" />
            Flight Options
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={source}
            onValueChange={val => onSourceChange(val as FlightSource)}
            className="flex flex-col gap-3"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="none" id="flight-none" />
              <Label htmlFor="flight-none" className="flex items-center gap-2">
                <CloudOff className="w-4 h-4" />
                No flights needed
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="database" id="flight-database" />
              <Label htmlFor="flight-database" className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                Select from database
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="api" id="flight-api" />
              <Label htmlFor="flight-api" className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                Search via Flight API
              </Label>
          </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Mode Content */}
      {source === 'none' && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No flights will be included in this package.
          </CardContent>
        </Card>
      )}

      {source === 'database' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Available Flights
              {eventId && (
                <Badge variant="secondary">
                  Event ID: {eventId.slice(0, 8)}...
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading flights...</span>
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : databaseFlights.length === 0 ? (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  No flights found for this event. Please try a different event or use the live flight search.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Select up to {adults} flights (one per passenger)</span>
                  <span>{selectedFlightIds.length} of {adults} selected</span>
                </div>

                <div className="grid gap-4">
                  {databaseFlights.map((flight) => {
                    const isSelected = selectedFlightIds.includes(flight.id);
                    const isDisabled = !isSelected && selectedFlightIds.length >= adults;
                    
                    return (
                      <div
                        key={flight.id}
                        className={`p-4 border rounded-lg transition-colors ${
                          isSelected 
                            ? 'border-primary bg-primary/5' 
                            : isDisabled 
                              ? 'border-muted bg-muted/20 opacity-50' 
                              : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleFlightSelection(flight.id, checked as boolean)}
                            disabled={isDisabled}
                          />
                          
                          <div className="flex-1 space-y-3">
                            {/* Flight Header */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{flight.airline || 'Unknown'}</Badge>
                                <span className="font-mono text-sm">{flight.outbound_flight_number}</span>
                                {flight.cabin && (
                                  <Badge variant="secondary">{flight.cabin}</Badge>
                                )}
                                {flight.refundable && (
                                  <Badge variant="default" className="bg-green-100 text-green-800">
                                    Refundable
                      </Badge>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-semibold">
                                  £{(flight.total_price_gbp * 1.1).toFixed(2)}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {flight.currency || 'GBP'} (incl. 10% markup)
                                </div>
                              </div>
                            </div>

                            {/* Route Information */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm font-medium">
                                  <PlaneTakeoff className="h-4 w-4" />
                                  Outbound
                                </div>
                                <div className="text-sm">
                                  <div className="font-mono">{flight.outbound_departure_airport_code}</div>
                                  <div className="text-muted-foreground">{flight.outbound_departure_airport_name}</div>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(flight.outbound_departure_datetime).toLocaleString()}
                                </div>
                              </div>
                              
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm font-medium">
                                  <PlaneLanding className="h-4 w-4" />
                                  Arrival
                                </div>
                                <div className="text-sm">
                                  <div className="font-mono">{flight.outbound_arrival_airport_code}</div>
                                  <div className="text-muted-foreground">{flight.outbound_arrival_airport_name}</div>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(flight.outbound_arrival_datetime).toLocaleString()}
                                </div>
                              </div>
                            </div>

                            {/* Return Flight (if exists) */}
                            {flight.inbound_flight_number && (
                              <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 text-sm font-medium">
                                    <PlaneTakeoff className="h-4 w-4" />
                                    Return
                                  </div>
                                  <div className="text-sm">
                                    <div className="font-mono">{flight.inbound_departure_airport_code}</div>
                                    <div className="text-muted-foreground">{flight.inbound_departure_airport_name}</div>
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {new Date(flight.inbound_departure_datetime!).toLocaleString()}
                                  </div>
                                </div>
                                
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 text-sm font-medium">
                                    <PlaneLanding className="h-4 w-4" />
                                    Arrival
                                  </div>
                                  <div className="text-sm">
                                    <div className="font-mono">{flight.inbound_arrival_airport_code}</div>
                                    <div className="text-muted-foreground">{flight.inbound_arrival_airport_name}</div>
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {new Date(flight.inbound_arrival_datetime!).toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Additional Details */}
                            {(flight.baggage_allowance || flight.notes || flight.supplier) && (
                              <div className="pt-2 border-t">
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  {flight.baggage_allowance && (
                                    <div className="flex items-center gap-1">
                                      <BaggageClaim className="h-3 w-3" />
                                      {flight.baggage_allowance}
                                    </div>
                                  )}
                                  {flight.supplier && (
                                    <div className="flex items-center gap-1">
                                      <Building className="h-3 w-3" />
                                      {flight.supplier}
                    </div>
                                  )}
                      </div>
                                {flight.notes && (
                                  <div className="mt-1 text-xs text-muted-foreground">
                                    {flight.notes}
                      </div>
                                )}
                      </div>
                            )}

                            {/* Return Flight Layover Information */}
                            {flight.returnDate && flight.returnStops && flight.returnStops > 0 && (
                              <div className="pt-2 border-t border-dashed">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                                  <MapPin className="h-3 w-3" />
                                  <span className="font-medium">Return Layover Details</span>
                                </div>
                                <div className="space-y-1 text-xs">
                                  <div className="flex items-center justify-between">
                                    <span>Stops:</span>
                                    <span className="font-medium">{flight.returnStops} connection{flight.returnStops !== 1 ? 's' : ''}</span>
                                  </div>
                                  {flight.returnLayoverInfo && (
                                    <div className="space-y-1">
                                      {flight.returnLayoverInfo.map((layover: any, index: number) => (
                                        <div key={index} className="bg-muted/50 p-2 rounded text-xs">
                                          <div className="flex items-center justify-between">
                                            <span className="font-medium">{layover.airport}</span>
                                            <span className="text-muted-foreground">
                                              {layover.duration} layover
                                            </span>
                                          </div>
                                          {layover.terminal && (
                                            <div className="text-muted-foreground">
                                              Terminal {layover.terminal}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                      </div>
                    </div>
                  </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {source === 'api' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Live Flight Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Search Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="origin">Origin Airport</Label>
                  <Input
                    id="origin"
                    placeholder="LHR"
                    value={searchParams.origin}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, origin: e.target.value.toUpperCase() }))}
                    maxLength={3}
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">3-letter airport code</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="destination">Destination Airport</Label>
                  <Input
                    id="destination"
                    placeholder="JFK"
                    value={searchParams.destination}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, destination: e.target.value.toUpperCase() }))}
                    maxLength={3}
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">3-letter airport code</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="departureDate">Departure Date</Label>
                  <Input
                    id="departureDate"
                    type="date"
                    value={searchParams.departureDate}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, departureDate: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="returnDate">Return Date (Optional)</Label>
                  <Input
                    id="returnDate"
                    type="date"
                    value={searchParams.returnDate}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, returnDate: e.target.value }))}
                    min={searchParams.departureDate || new Date().toISOString().split('T')[0]}
                    disabled={!searchParams.isReturn}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cabinClass">Cabin Class</Label>
                  <Select
                    value={searchParams.cabinClass}
                    onValueChange={(value) => setSearchParams(prev => ({ ...prev, cabinClass: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ECO">Economy</SelectItem>
                      <SelectItem value="PEC">Premium Economy</SelectItem>
                      <SelectItem value="BUS">Business</SelectItem>
                      <SelectItem value="FIR">First Class</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Return Flight</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isReturn"
                      checked={searchParams.isReturn}
                      onCheckedChange={(checked) => setSearchParams(prev => ({ 
                        ...prev, 
                        isReturn: checked as boolean,
                        returnDate: checked ? prev.returnDate : ''
                      }))}
                    />
                    <Label htmlFor="isReturn" className="text-sm">Include return flight</Label>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleApiFlightSearch}
                disabled={searching || !searchParams.origin || !searchParams.destination || !searchParams.departureDate}
                className="w-full"
              >
                {searching ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Searching Flights...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Search Flights
                  </>
                )}
              </Button>

              {searchError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{searchError}</AlertDescription>
                </Alert>
              )}

              {/* Search Results */}
              {apiFlights.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Found {apiFlights.length} flights</span>
                    <span>{selectedFlightIds.length} of {adults} selected</span>
                  </div>

                  {/* Filters */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Filters & Sort</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Price Range */}
                        <div className="space-y-2">
                          <Label>Price Range (£)</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              placeholder="Min"
                              value={filters.priceRange[0]}
                              onChange={(e) => setFilters(prev => ({
                                ...prev,
                                priceRange: [Number(e.target.value), prev.priceRange[1]]
                              }))}
                              className="w-20"
                            />
                            <span>-</span>
                            <Input
                              type="number"
                              placeholder="Max"
                              value={filters.priceRange[1]}
                              onChange={(e) => setFilters(prev => ({
                                ...prev,
                                priceRange: [prev.priceRange[0], Number(e.target.value)]
                              }))}
                              className="w-20"
                            />
                          </div>
                        </div>

                        {/* Max Stops */}
                        <div className="space-y-2">
                          <Label>Max Stops</Label>
                          <Select
                            value={filters.maxStops.toString()}
                            onValueChange={(value) => setFilters(prev => ({
                              ...prev,
                              maxStops: Number(value)
                            }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">Direct only</SelectItem>
                              <SelectItem value="1">1 stop max</SelectItem>
                              <SelectItem value="2">2 stops max</SelectItem>
                              <SelectItem value="3">3+ stops</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Max Duration */}
                        <div className="space-y-2">
                          <Label>Max Duration (hours)</Label>
                          <Input
                            type="number"
                            placeholder="24"
                            value={filters.maxDuration}
                            onChange={(e) => setFilters(prev => ({
                              ...prev,
                              maxDuration: Number(e.target.value)
                            }))}
                            className="w-full"
                          />
                        </div>

                        {/* Sort By */}
                        <div className="space-y-2">
                          <Label>Sort By</Label>
                          <Select
                            value={filters.sortBy}
                            onValueChange={(value) => setFilters(prev => ({
                              ...prev,
                              sortBy: value as 'price' | 'duration' | 'departureTime'
                            }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="price">Price (Lowest first)</SelectItem>
                              <SelectItem value="duration">Duration (Shortest first)</SelectItem>
                              <SelectItem value="departureTime">Departure Time</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Airlines Filter */}
                      {getUniqueAirlines().length > 0 && (
                        <div className="space-y-2">
                          <Label>Airlines</Label>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {getUniqueAirlines().map((airline) => (
                              <div key={airline} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`airline-${airline}`}
                                  checked={filters.airlines.includes(airline)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setFilters(prev => ({
                                        ...prev,
                                        airlines: [...prev.airlines, airline]
                                      }));
                                    } else {
                                      setFilters(prev => ({
                                        ...prev,
                                        airlines: prev.airlines.filter(a => a !== airline)
                                      }));
                                    }
                                  }}
                                />
                                <Label htmlFor={`airline-${airline}`} className="text-sm">
                                  {airline}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Cabin Classes Filter */}
                      {getUniqueCabinClasses().length > 0 && (
                        <div className="space-y-2">
                          <Label>Cabin Classes</Label>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {getUniqueCabinClasses().map((cabin) => (
                              <div key={cabin} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`cabin-${cabin}`}
                                  checked={filters.cabinClasses.includes(cabin)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setFilters(prev => ({
                                        ...prev,
                                        cabinClasses: [...prev.cabinClasses, cabin]
                                      }));
                                    } else {
                                      setFilters(prev => ({
                                        ...prev,
                                        cabinClasses: prev.cabinClasses.filter(c => c !== cabin)
                                      }));
                                    }
                                  }}
                                />
                                <Label htmlFor={`cabin-${cabin}`} className="text-sm">
                                  {FlightApiService.getCabinDisplayName(cabin)}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Clear Filters Button */}
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="text-sm text-muted-foreground">
                          Showing {getFilteredFlights().length} of {apiFlights.length} flights
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setFilters({
                            priceRange: getPriceRange(),
                            airlines: [],
                            cabinClasses: [],
                            maxStops: 2,
                            maxDuration: 24,
                            sortBy: 'price'
                          })}
                        >
                          Clear Filters
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <div className="grid gap-4">
                    {getFilteredFlights().map((flight) => {
                      const isSelected = selectedFlightIds.includes(flight.id);
                      const isDisabled = !isSelected && selectedFlightIds.length >= adults;
                      
                      return (
                        <div
                          key={flight.id}
                          className={`p-4 border rounded-lg transition-colors ${
                            isSelected 
                              ? 'border-primary bg-primary/5' 
                              : isDisabled 
                                ? 'border-muted bg-muted/20 opacity-50' 
                                : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => handleFlightSelection(flight.id, checked as boolean)}
                              disabled={isDisabled}
                            />
                            
                            <div className="flex-1 space-y-3">
                              {/* Flight Header */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">{flight.airline}</Badge>
                                  <span className="font-mono text-sm">{flight.flightNumber}</span>
                                  {flight.returnFlightNumber && (
                                    <span className="font-mono text-sm">/ {flight.returnFlightNumber}</span>
                                  )}
                                  <Badge variant="secondary">
                                    {FlightApiService.getCabinDisplayName(flight.cabin)}
                                  </Badge>
                                  {flight.refundable && (
                                    <Badge variant="default" className="bg-green-100 text-green-800">
                                      Refundable
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-semibold">
                                    {FlightApiService.formatPrice(flight.price * 1.1, flight.currency)}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    per passenger (incl. 10% markup)
                                  </div>
                                </div>
                              </div>

                              {/* Route Information */}
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 text-sm font-medium">
                                    <PlaneTakeoff className="h-4 w-4" />
                                    Outbound
                                  </div>
                                  <div className="text-sm">
                                    <div className="font-mono">{flight.origin}</div>
                                    <div className="text-muted-foreground">
                                      {FlightApiService.formatFlightTime(flight.departureDate)}
                                    </div>
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {FlightApiService.formatFlightDate(flight.departureDate)}
                                    {flight.departureTerminal && ` • Terminal ${flight.departureTerminal}`}
                                  </div>
                                </div>
                                
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 text-sm font-medium">
                                    <PlaneLanding className="h-4 w-4" />
                                    Arrival
                                  </div>
                                  <div className="text-sm">
                                    <div className="font-mono">{flight.destination}</div>
                                    <div className="text-muted-foreground">
                                      {FlightApiService.formatFlightTime(flight.departureDate)}
                                    </div>
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {FlightApiService.formatFlightDate(flight.departureDate)}
                                    {flight.arrivalTerminal && ` • Terminal ${flight.arrivalTerminal}`}
                                  </div>
                                </div>
                              </div>

                              {/* Flight Details */}
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {FlightApiService.formatDuration(flight.duration)}
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {FlightApiService.getStopsDisplay(flight.stops)}
                                </div>
                                {flight.aircraft && (
                                  <div className="flex items-center gap-1">
                                    <Plane className="h-3 w-3" />
                                    {flight.aircraft}
                                  </div>
                                )}
                              </div>

                              {/* Layover Information */}
                              {flight.stops > 0 && (
                                <div className="pt-2 border-t border-dashed">
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                                    <MapPin className="h-3 w-3" />
                                    <span className="font-medium">Layover Details</span>
                                  </div>
                                  <div className="space-y-1 text-xs">
                                    <div className="flex items-center justify-between">
                                      <span>Stops:</span>
                                      <span className="font-medium">{flight.stops} connection{flight.stops !== 1 ? 's' : ''}</span>
                                    </div>
                                    {flight.layoverInfo && (
                                      <div className="space-y-1">
                                        {flight.layoverInfo.map((layover: any, index: number) => (
                                          <div key={index} className="bg-muted/50 p-2 rounded text-xs">
                                            <div className="flex items-center justify-between">
                                              <span className="font-medium">{layover.airport}</span>
                                              <span className="text-muted-foreground">
                                                {layover.duration} layover
                                              </span>
                                            </div>
                                            {layover.terminal && (
                                              <div className="text-muted-foreground">
                                                Terminal {layover.terminal}
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Return Flight (if exists) */}
                              {flight.returnDate && (
                                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm font-medium">
                                      <PlaneTakeoff className="h-4 w-4" />
                                      Return
                                    </div>
                                    <div className="text-sm">
                                      <div className="font-mono">{flight.destination}</div>
                                      <div className="text-muted-foreground">
                                        {FlightApiService.formatFlightTime(flight.returnDate)}
                                      </div>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {FlightApiService.formatFlightDate(flight.returnDate)}
                                      {flight.returnDepartureTerminal && ` • Terminal ${flight.returnDepartureTerminal}`}
                                    </div>
                                  </div>
                                  
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm font-medium">
                                      <PlaneLanding className="h-4 w-4" />
                                      Arrival
                                    </div>
                                    <div className="text-sm">
                                      <div className="font-mono">{flight.origin}</div>
                                      <div className="text-muted-foreground">
                                        {FlightApiService.formatFlightTime(flight.returnDate)}
                                      </div>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {FlightApiService.formatFlightDate(flight.returnDate)}
                                      {flight.returnArrivalTerminal && ` • Terminal ${flight.returnArrivalTerminal}`}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Return Flight Layover Information */}
                              {flight.returnDate && flight.returnStops && flight.returnStops > 0 && (
                                <div className="pt-2 border-t border-dashed">
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                                    <MapPin className="h-3 w-3" />
                                    <span className="font-medium">Return Layover Details</span>
                                  </div>
                                  <div className="space-y-1 text-xs">
                                    <div className="flex items-center justify-between">
                                      <span>Stops:</span>
                                      <span className="font-medium">{flight.returnStops} connection{flight.returnStops !== 1 ? 's' : ''}</span>
                                    </div>
                                    {flight.returnLayoverInfo && (
                                      <div className="space-y-1">
                                        {flight.returnLayoverInfo.map((layover: any, index: number) => (
                                          <div key={index} className="bg-muted/50 p-2 rounded text-xs">
                                            <div className="flex items-center justify-between">
                                              <span className="font-medium">{layover.airport}</span>
                                              <span className="text-muted-foreground">
                                                {layover.duration} layover
                                              </span>
                                            </div>
                                            {layover.terminal && (
                                              <div className="text-muted-foreground">
                                                Terminal {layover.terminal}
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Additional Details */}
                              <div className="pt-2 border-t">
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <div className="flex items-center gap-4">
                                    {flight.baggageAllowance && (
                                      <div className="flex items-center gap-1">
                                        <BaggageClaim className="h-3 w-3" />
                                        {flight.baggageAllowance.NumberOfPieces 
                                          ? `${flight.baggageAllowance.NumberOfPieces} pieces`
                                          : flight.baggageAllowance.WeightInKilograms 
                                            ? `${flight.baggageAllowance.WeightInKilograms}kg`
                                            : 'Baggage included'
                                        }
                                      </div>
                                    )}
                                    <div className="flex items-center gap-1">
                                      <CreditCard className="h-3 w-3" />
                                      {flight.fareType}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div>Ticketing deadline:</div>
                                    <div>{FlightApiService.formatFlightDate(flight.ticketingDeadline)}</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Flights Summary */}
      {value.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Selected Flights ({value.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {value.map((flight, index) => (
                <div key={flight.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant={flight.source === 'database' ? 'secondary' : 'default'}>
                      {flight.source === 'database' ? 'Database' : 'API'}
                    </Badge>
                    <div>
                      <div className="font-medium">
                        {flight.origin} → {flight.destination}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(flight.departureDate).toLocaleDateString()}
                        {flight.returnDate && ` - ${new Date(flight.returnDate).toLocaleDateString()}`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-semibold">£{(flight.price * flight.passengers).toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground">
                        {flight.passengers} passenger{flight.passengers !== 1 ? 's' : ''}
                      </div>
          </div>
            </div>
                </div>
              ))}
              
              <div className="flex items-center justify-between pt-3 border-t">
                <span className="font-semibold">Total Flight Cost:</span>
                <span className="text-lg font-bold">£{getTotalSelectedPrice().toFixed(2)}</span>
                </div>
          </div>
        </CardContent>
      </Card>
      )}
    </div>
  );
} 