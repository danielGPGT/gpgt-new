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
  
  // Enhanced detailed flight information for API flights
  // Outbound flight details
  outboundFlightId?: string;
  outboundMarketingAirlineId?: string;
  outboundOperatingAirlineId?: string;
  outboundMarketingAirlineName?: string;
  outboundOperatingAirlineName?: string;
  outboundDepartureAirportId?: string;
  outboundDepartureAirportName?: string;
  outboundArrivalAirportId?: string;
  outboundArrivalAirportName?: string;
  outboundDepartureDateTime?: string;
  outboundDepartureDateTimeUtc?: string;
  outboundArrivalDateTime?: string;
  outboundArrivalDateTimeUtc?: string;
  outboundFlightDuration?: string;
  outboundAircraftType?: string;
  outboundDepartureTerminal?: string;
  outboundArrivalTerminal?: string;
  outboundCabinId?: string;
  outboundCabinName?: string;
  outboundFareBasisCode?: string;
  outboundFareTypeId?: string;
  outboundFareTypeName?: string;
  outboundFareSubTypeId?: string;
  outboundFareSubTypeName?: string;
  outboundBaggageAllowance?: {
    pieces?: number;
    weight?: number;
    weightUnit?: string;
    dimensions?: string;
  };
  outboundCheckedBaggage?: {
    pieces?: number;
    weight?: number;
    weightUnit?: string;
    dimensions?: string;
  };
  outboundCarryOnBaggage?: {
    pieces?: number;
    weight?: number;
    weightUnit?: string;
    dimensions?: string;
  };
  outboundStops?: any[];
  outboundLayoverInfo?: any[];
  
  // Inbound flight details (for return flights)
  inboundFlightId?: string;
  inboundMarketingAirlineId?: string;
  inboundOperatingAirlineId?: string;
  inboundMarketingAirlineName?: string;
  inboundOperatingAirlineName?: string;
  inboundDepartureAirportId?: string;
  inboundDepartureAirportName?: string;
  inboundArrivalAirportId?: string;
  inboundArrivalAirportName?: string;
  inboundDepartureDateTime?: string;
  inboundDepartureDateTimeUtc?: string;
  inboundArrivalDateTime?: string;
  inboundArrivalDateTimeUtc?: string;
  inboundFlightDuration?: string;
  inboundAircraftType?: string;
  inboundDepartureTerminal?: string;
  inboundArrivalTerminal?: string;
  inboundCabinId?: string;
  inboundCabinName?: string;
  inboundFareBasisCode?: string;
  inboundFareTypeId?: string;
  inboundFareTypeName?: string;
  inboundFareSubTypeId?: string;
  inboundFareSubTypeName?: string;
  inboundBaggageAllowance?: {
    pieces?: number;
    weight?: number;
    weightUnit?: string;
    dimensions?: string;
  };
  inboundCheckedBaggage?: {
    pieces?: number;
    weight?: number;
    weightUnit?: string;
    dimensions?: string;
  };
  inboundCarryOnBaggage?: {
    pieces?: number;
    weight?: number;
    weightUnit?: string;
    dimensions?: string;
  };
  inboundStops?: any[];
  inboundLayoverInfo?: any[];
  
  // Flight segments for multi-segment flights
  outboundFlightSegments?: any[];
  returnFlightSegments?: any[];
  
  // Fare and pricing details
  fareTypeId?: string;
  fareTypeName?: string;
  fareSubTypeId?: string;
  fareSubTypeName?: string;
  revenueStreamId?: string;
  revenueStreamName?: string;
  passengerTypeId?: string;
  passengerTypeName?: string;
  baseFare?: number;
  taxes?: number;
  fees?: number;
  totalFare?: number;
  currencyId?: string;
  currencyCode?: string;
  currencyName?: string;
  currencySymbol?: string;
  decimalPlaces?: number;
  
  // Additional metadata
  recommendationId?: string;
  validatingAirlineId?: string;
  validatingAirlineName?: string;
  skytraxRating?: number;
  isPremium?: boolean;
  isCorporate?: boolean;
  isInstantTicketing?: boolean;
  isSemiDeferred?: boolean;
  isBaggageOnly?: boolean;
  isAlternateRoute?: boolean;
  
  // Original API response data for reference
  originalApiData?: any;
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
    directFlightsOnly: false
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
      fetchDatabaseFlights().then(() => {
        // After fetching, rehydrate selectedFlightIds from value
        if (value && value.length > 0) {
          setSelectedFlightIds(value.map(flight => flight.id));
        }
      });
    }
  }, [source, eventId]);

  // Fetch API flights when source changes to api (if you have such logic)
  // (Assume similar logic for API fetch, e.g. after search)
  useEffect(() => {
    if (source === 'api' && apiFlights.length > 0) {
      // After fetching, rehydrate selectedFlightIds from value
      if (value && value.length > 0) {
        setSelectedFlightIds(value.map(flight => flight.id));
      }
    }
  }, [source, apiFlights.length, value]);

  // Always hydrate selectedFlightIds from value on mount and when value changes
  useEffect(() => {
    if (value && value.length > 0) {
      setSelectedFlightIds(value.map(flight => flight.id));
    } else {
      setSelectedFlightIds([]);
    }
  }, [value]);

  // Handle source changes
  useEffect(() => {
    if (source === 'none') {
      setSelectedFlightIds([]);
      onChange([]);
    }
  }, [source, onChange]);

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
        const newSelectedIds = [...selectedFlightIds, flightId];
        setSelectedFlightIds(newSelectedIds);
        
        // Update flights directly based on source
        if (source === 'database') {
          const selectedFlight = databaseFlights.find(flight => flight.id === flightId);
          if (selectedFlight) {
            const newFlight: SelectedFlight = {
              id: selectedFlight.id,
              source: 'database' as FlightSource,
              origin: selectedFlight.outbound_departure_airport_code,
              destination: selectedFlight.outbound_arrival_airport_code,
              departureDate: selectedFlight.outbound_departure_datetime,
              returnDate: selectedFlight.inbound_departure_datetime || undefined,
              price: selectedFlight.total_price_gbp * 1.1, // Add 10% markup
              passengers: adults,
            };
            onChange([...value, newFlight]);
          }
        } else if (source === 'api') {
          const selectedFlight = apiFlights.find(flight => flight.id === flightId);
          if (selectedFlight) {
            const newFlight: SelectedFlight = {
              id: selectedFlight.id,
              source: 'api' as FlightSource,
              origin: selectedFlight.origin,
              destination: selectedFlight.destination,
              departureDate: selectedFlight.departureDate,
              returnDate: selectedFlight.returnDate,
              price: selectedFlight.price * 1.1, // Add 10% markup
              passengers: selectedFlight.passengers,
              // Include all the detailed flight information
              ...selectedFlight,
            };
            onChange([...value, newFlight]);
          }
        }
      }
    } else {
      const newSelectedIds = selectedFlightIds.filter(id => id !== flightId);
      setSelectedFlightIds(newSelectedIds);
      
      // Remove flight from value
      const updatedFlights = value.filter(flight => flight.id !== flightId);
      onChange(updatedFlights);
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
    if (!searchParams.origin || !searchParams.destination || !searchParams.departureDate || !searchParams.returnDate) {
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
        returnDate: searchParams.returnDate,
        adults: adults,
        cabinClass: searchParams.cabinClass,
        directFlightsOnly: searchParams.directFlightsOnly,
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
                  <Label htmlFor="departureDate">Outbound Date</Label>
                  <Input
                    id="departureDate"
                    type="date"
                    value={searchParams.departureDate}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, departureDate: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="returnDate">Return Date</Label>
                  <Input
                    id="returnDate"
                    type="date"
                    value={searchParams.returnDate}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, returnDate: e.target.value }))}
                    min={searchParams.departureDate || new Date().toISOString().split('T')[0]}
                    required
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
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="directFlightsOnly"
                      checked={searchParams.directFlightsOnly}
                      onCheckedChange={(checked) => setSearchParams(prev => ({
                        ...prev,
                        directFlightsOnly: checked as boolean
                      }))}
                    />
                    <Label htmlFor="directFlightsOnly" className="text-sm">
                      Direct flights only
                    </Label>
                  </div>
                  <Label className="text-sm text-muted-foreground">
                    Return flights only - all packages include round-trip flights
                  </Label>
                </div>
              </div>

                            <Button 
                onClick={handleApiFlightSearch} 
                disabled={searching || !searchParams.origin || !searchParams.destination || !searchParams.departureDate || !searchParams.returnDate}
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
                    Search Return Flights
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
                    <span>Found {apiFlights.length} return flights</span>
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
                          Showing {getFilteredFlights().length} of {apiFlights.length} return flights
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
                              {/* Return Flight Badge */}
                              <div className="flex items-center gap-2">
                                <Badge variant="default" className="bg-primary/10 text-primary">
                                  Select this flight
                                </Badge>
                              </div>
                              
                              {/* Flight Header */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">
                                    {flight.outboundMarketingAirlineName || flight.outboundOperatingAirlineName || flight.airline}
                                  </Badge>
                                  
                
                                  <Badge variant="secondary">
                                    {FlightApiService.getCabinDisplayName(flight.outboundCabinName || flight.outboundCabinId || flight.cabin)}
                                  </Badge>
                                  {flight.refundable && (
                                    <Badge variant="default" className="bg-green-100 text-green-800">
                                      Refundable
                                    </Badge>
                                  )}
                                  {flight.isPremium && (
                                    <Badge variant="default" className="bg-purple-100 text-purple-800">
                                      Premium
                                    </Badge>
                                  )}
                                  {flight.validatingAirlineName && flight.validatingAirlineName !== (flight.outboundMarketingAirlineName || flight.outboundOperatingAirlineName || flight.airline) && (
                                    <Badge variant="outline" className="text-xs">
                                      Validated by {flight.validatingAirlineName}
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-semibold">
                                    {FlightApiService.formatPrice(flight.price * 1.1, flight.currencyId || flight.currency)}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    per passenger (incl. 10% markup)
                                  </div>
                                  {flight.baseFare && (
                                    <div className="text-xs text-muted-foreground">
                                      Base: {flight.currencySymbol || flight.currencyId || '£'}{flight.baseFare.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Route Information */}
                                                            {/* Multi-segment outbound flight display */}
                              {flight.outboundFlightSegments && flight.outboundFlightSegments.length > 0 ? (
                                <div className="space-y-3 border border-primary/40 rounded-lg p-4">
                                  {flight.outboundFlightSegments.map((segment: any, segmentIndex: number) => (
                                    <div key={segmentIndex} className="space-y-2">
                                      {/* Flight Segment */}
                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                          <div className="flex items-center gap-2 text-sm font-medium">
                                            <PlaneTakeoff className="h-4 w-4" />
                                            {segmentIndex === 0 ? 'Outbound' : `Segment ${segment.segmentIndex}`}
                                            <Badge variant="default" className="text-xs">
                                              {FlightApiService.formatFlightNumber(
                                                segment.marketingAirlineId || FlightApiService.getAirlineCode(flight),
                                                segment.flightNumber || ''
                                              )}
                                            </Badge>
                                          </div>
                                          <div className="text-sm">
                                            <div className="font-mono">
                                              {segment.departureAirportId}
                                            </div>
                                            <div className="text-muted-foreground">
                                              {segment.departureDateTime ? 
                                                FlightApiService.formatFlightTime(segment.departureDateTime) :
                                                'TBD'
                                              }
                                            </div>
                                          </div>
                                          <div className="text-xs text-muted-foreground">
                                            {segment.departureDateTime ? 
                                              FlightApiService.formatFlightDate(segment.departureDateTime) :
                                              'TBD'
                                            }
                                            {segment.departureTerminal && ` • Terminal ${segment.departureTerminal}`}
                                          </div>
                                          {segment.departureAirportName && (
                                            <div className="text-xs text-muted-foreground">
                                              {segment.departureAirportName}
                                            </div>
                                          )}
                                        </div>
                                        
                                        <div className="space-y-1">
                                          <div className="flex items-center gap-2 text-sm font-medium">
                                            <PlaneLanding className="h-4 w-4" />
                                            {segment.isLastSegment ? 'Final Arrival' : 'Arrival'}
                                          </div>
                                          <div className="text-sm">
                                            <div className="font-mono">
                                              {segment.arrivalAirportId}
                                            </div>
                                            <div className="text-muted-foreground">
                                              {segment.arrivalDateTime ? 
                                                FlightApiService.formatFlightTime(segment.arrivalDateTime) :
                                                'TBD'
                                              }
                                            </div>
                                          </div>
                                          <div className="text-xs text-muted-foreground">
                                            {segment.arrivalDateTime ? 
                                              FlightApiService.formatFlightDate(segment.arrivalDateTime) :
                                              'TBD'
                                            }
                                            {segment.arrivalTerminal && ` • Terminal ${segment.arrivalTerminal}`}
                                          </div>
                                          {segment.arrivalAirportName && (
                                            <div className="text-xs text-muted-foreground">
                                              {segment.arrivalAirportName}
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      {/* Layover information (if not the last segment) */}
                                      {!segment.isLastSegment && flight.outboundLayoverInfo && flight.outboundLayoverInfo[segmentIndex] && (
                                        <div className="bg-muted/50 p-2 rounded text-xs">
                                          <div className="flex items-center justify-between">
                                            <span className="font-medium">
                                              Layover at {flight.outboundLayoverInfo[segmentIndex].airport}
                                            </span>
                                            <span className="text-muted-foreground">
                                              {flight.outboundLayoverInfo[segmentIndex].duration}
                                            </span>
                                          </div>
                                          {flight.outboundLayoverInfo[segmentIndex].terminal && (
                                            <div className="text-muted-foreground">
                                              Terminal {flight.outboundLayoverInfo[segmentIndex].terminal}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                /* Fallback to single segment display */
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm font-medium">
                                      <PlaneTakeoff className="h-4 w-4" />
                                      Outbound
                                      {(flight.outboundFlightNumber || flight.flightNumber) && (
                                        <Badge variant="default" className="text-xs">
                                          {FlightApiService.formatFlightNumber(
                                            FlightApiService.getAirlineCode(flight),
                                            flight.outboundFlightNumber || flight.flightNumber || ''
                                          )}
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="text-sm">
                                      <div className="font-mono">
                                        {flight.outboundDepartureAirportId || flight.origin}
                                      </div>
                                      <div className="text-muted-foreground">
                                        {flight.outboundDepartureDateTime ? 
                                          FlightApiService.formatFlightTime(flight.outboundDepartureDateTime) :
                                          FlightApiService.formatFlightTime(flight.departureDate)
                                        }
                                      </div>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {flight.outboundDepartureDateTime ? 
                                        FlightApiService.formatFlightDate(flight.outboundDepartureDateTime) :
                                        FlightApiService.formatFlightDate(flight.departureDate)
                                      }
                                      {flight.outboundDepartureTerminal && ` • Terminal ${flight.outboundDepartureTerminal}`}
                                    </div>
                                    {flight.outboundDepartureAirportName && (
                                      <div className="text-xs text-muted-foreground">
                                        {flight.outboundDepartureAirportName}
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm font-medium">
                                      <PlaneLanding className="h-4 w-4" />
                                      Arrival
                                    </div>
                                    <div className="text-sm">
                                      <div className="font-mono">
                                        {flight.outboundArrivalAirportId || flight.destination}
                                      </div>
                                      <div className="text-muted-foreground">
                                        {flight.outboundArrivalDateTime ? 
                                          FlightApiService.formatFlightTime(flight.outboundArrivalDateTime) :
                                          'TBD'
                                        }
                                      </div>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {flight.outboundArrivalDateTime ? 
                                        FlightApiService.formatFlightDate(flight.outboundArrivalDateTime) :
                                        'TBD'
                                      }
                                      {flight.outboundArrivalTerminal && ` • Terminal ${flight.outboundArrivalTerminal}`}
                                    </div>
                                    {flight.outboundArrivalAirportName && (
                                      <div className="text-xs text-muted-foreground">
                                        {flight.outboundArrivalAirportName}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Flight Details */}
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {FlightApiService.formatDuration(flight.outboundFlightDuration || flight.duration)}
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {FlightApiService.getStopsDisplay(flight.outboundStops?.length || flight.stops)}
                                </div>
                                {flight.outboundAircraftType && (
                                  <div className="flex items-center gap-1">
                                    <Plane className="h-3 w-3" />
                                    {flight.outboundAircraftType}
                                  </div>
                                )}
                                {flight.outboundCabinName && (
                                  <div className="flex items-center gap-1">
                                    <Building className="h-3 w-3" />
                                    {flight.outboundCabinName}
                                  </div>
                                )}
                              </div>

                              {/* Outbound Flight Airline Details */}
                              {(flight.outboundMarketingAirlineName || flight.outboundOperatingAirlineName) && (
                                <div className="text-xs text-muted-foreground">
                                  <div className="flex items-center gap-2">
                                    {flight.outboundMarketingAirlineName && (
                                      <span>Marketing: {flight.outboundMarketingAirlineName}</span>
                                    )}
                                    {flight.outboundOperatingAirlineName && flight.outboundOperatingAirlineName !== flight.outboundMarketingAirlineName && (
                                      <span>• Operating: {flight.outboundOperatingAirlineName}</span>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Outbound Baggage Information */}
                              {(flight.outboundCheckedBaggage || flight.outboundCarryOnBaggage || flight.outboundBaggageAllowance) && (
                                <div className="text-xs text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <BaggageClaim className="h-3 w-3" />
                                    <span className="font-medium">Baggage:</span>
                                    {flight.outboundCheckedBaggage && (
                                      <span>
                                        {flight.outboundCheckedBaggage.pieces && `${flight.outboundCheckedBaggage.pieces} piece${flight.outboundCheckedBaggage.pieces !== 1 ? 's' : ''}`}
                                        {flight.outboundCheckedBaggage.weight && ` ${flight.outboundCheckedBaggage.weight}${flight.outboundCheckedBaggage.weightUnit}`}
                                      </span>
                                    )}
                                    {flight.outboundCarryOnBaggage && (
                                      <span>
                                        {flight.outboundCheckedBaggage && ' + '}
                                        Carry-on: {flight.outboundCarryOnBaggage.pieces && `${flight.outboundCarryOnBaggage.pieces} piece${flight.outboundCarryOnBaggage.pieces !== 1 ? 's' : ''}`}
                                        {flight.outboundCarryOnBaggage.weight && ` ${flight.outboundCarryOnBaggage.weight}${flight.outboundCarryOnBaggage.weightUnit}`}
                                      </span>
                                    )}
                                    {flight.outboundBaggageAllowance && !flight.outboundCheckedBaggage && !flight.outboundCarryOnBaggage && (
                                      <span>
                                        {typeof flight.outboundBaggageAllowance === 'string' 
                                          ? flight.outboundBaggageAllowance 
                                          : flight.outboundBaggageAllowance.pieces 
                                            ? `${flight.outboundBaggageAllowance.pieces} pieces`
                                            : flight.outboundBaggageAllowance.weight 
                                              ? `${flight.outboundBaggageAllowance.weight}${flight.outboundBaggageAllowance.weightUnit || 'kg'}`
                                              : 'Baggage included'
                                        }
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}

                             

                              {/* Multi-segment return flight display */}
                              {flight.returnDate && (
                                <div className="pt-2 border border-primary/40 rounded-lg p-4">
                                  {flight.returnFlightSegments && flight.returnFlightSegments.length > 0 ? (
                                    <div className="space-y-3">
                                      {flight.returnFlightSegments.map((segment: any, segmentIndex: number) => (
                                        <div key={segmentIndex} className="space-y-2">
                                          {/* Flight Segment */}
                                          <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                              <div className="flex items-center gap-2 text-sm font-medium">
                                                <PlaneTakeoff className="h-4 w-4" />
                                                {segmentIndex === 0 ? 'Return' : `Segment ${segment.segmentIndex}`}
                                                <Badge variant="default" className="text-xs">
                                                  {FlightApiService.formatFlightNumber(
                                                    segment.marketingAirlineId || FlightApiService.getAirlineCode(flight),
                                                    segment.flightNumber || ''
                                                  )}
                                                </Badge>
                                              </div>
                                              <div className="text-sm">
                                                <div className="font-mono">
                                                  {segment.departureAirportId}
                                                </div>
                                                <div className="text-muted-foreground">
                                                  {segment.departureDateTime ? 
                                                    FlightApiService.formatFlightTime(segment.departureDateTime) :
                                                    'TBD'
                                                  }
                                                </div>
                                              </div>
                                              <div className="text-xs text-muted-foreground">
                                                {segment.departureDateTime ? 
                                                  FlightApiService.formatFlightDate(segment.departureDateTime) :
                                                  'TBD'
                                                }
                                                {segment.departureTerminal && ` • Terminal ${segment.departureTerminal}`}
                                              </div>
                                              {segment.departureAirportName && (
                                                <div className="text-xs text-muted-foreground">
                                                  {segment.departureAirportName}
                                                </div>
                                              )}
                                            </div>
                                            
                                            <div className="space-y-1">
                                              <div className="flex items-center gap-2 text-sm font-medium">
                                                <PlaneLanding className="h-4 w-4" />
                                                {segment.isLastSegment ? 'Final Arrival' : 'Arrival'}
                                              </div>
                                              <div className="text-sm">
                                                <div className="font-mono">
                                                  {segment.arrivalAirportId}
                                                </div>
                                                <div className="text-muted-foreground">
                                                  {segment.arrivalDateTime ? 
                                                    FlightApiService.formatFlightTime(segment.arrivalDateTime) :
                                                    'TBD'
                                                  }
                                                </div>
                                              </div>
                                              <div className="text-xs text-muted-foreground">
                                                {segment.arrivalDateTime ? 
                                                  FlightApiService.formatFlightDate(segment.arrivalDateTime) :
                                                  'TBD'
                                                }
                                                {segment.arrivalTerminal && ` • Terminal ${segment.arrivalTerminal}`}
                                              </div>
                                              {segment.arrivalAirportName && (
                                                <div className="text-xs text-muted-foreground">
                                                  {segment.arrivalAirportName}
                                                </div>
                                              )}
                                            </div>
                                          </div>

                                          {/* Layover information (if not the last segment) */}
                                          {!segment.isLastSegment && flight.returnLayoverInfo && flight.returnLayoverInfo[segmentIndex] && (
                                            <div className="bg-muted/50 p-2 rounded text-xs">
                                              <div className="flex items-center justify-between">
                                                <span className="font-medium">
                                                  Layover at {flight.returnLayoverInfo[segmentIndex].airport}
                                                </span>
                                                <span className="text-muted-foreground">
                                                  {flight.returnLayoverInfo[segmentIndex].duration}
                                                </span>
                                              </div>
                                              {flight.returnLayoverInfo[segmentIndex].terminal && (
                                                <div className="text-muted-foreground">
                                                  Terminal {flight.returnLayoverInfo[segmentIndex].terminal}
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    /* Fallback to single segment display */
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-sm font-medium">
                                          <PlaneTakeoff className="h-4 w-4" />
                                          Return
                                          {(flight.inboundFlightNumber || flight.returnFlightNumber) && (
                                            <Badge variant="default" className="text-xs">
                                              {FlightApiService.formatFlightNumber(
                                                FlightApiService.getAirlineCode(flight),
                                                flight.inboundFlightNumber || flight.returnFlightNumber || ''
                                              )}
                                            </Badge>
                                          )}
                                        </div>
                                        <div className="text-sm">
                                          <div className="font-mono">
                                            {flight.inboundDepartureAirportId || flight.destination}
                                          </div>
                                          <div className="text-muted-foreground">
                                            {flight.inboundDepartureDateTime ? 
                                              FlightApiService.formatFlightTime(flight.inboundDepartureDateTime) :
                                              'TBD'
                                            }
                                          </div>
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          {flight.inboundDepartureDateTime ? 
                                            FlightApiService.formatFlightDate(flight.inboundDepartureDateTime) :
                                            'TBD'
                                          }
                                          {flight.inboundDepartureTerminal && ` • Terminal ${flight.inboundDepartureTerminal}`}
                                        </div>
                                        {flight.inboundDepartureAirportName && (
                                          <div className="text-xs text-muted-foreground">
                                            {flight.inboundDepartureAirportName}
                                          </div>
                                        )}
                                      </div>
                                      
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-sm font-medium">
                                          <PlaneLanding className="h-4 w-4" />
                                          Arrival
                                        </div>
                                        <div className="text-sm">
                                          <div className="font-mono">
                                            {flight.inboundArrivalAirportId || flight.origin}
                                          </div>
                                          <div className="text-muted-foreground">
                                            {flight.inboundArrivalDateTime ? 
                                              FlightApiService.formatFlightTime(flight.inboundArrivalDateTime) :
                                              'TBD'
                                            }
                                          </div>
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          {flight.inboundArrivalDateTime ? 
                                            FlightApiService.formatFlightDate(flight.inboundArrivalDateTime) :
                                            'TBD'
                                          }
                                          {flight.inboundArrivalTerminal && ` • Terminal ${flight.inboundArrivalTerminal}`}
                                        </div>
                                        {flight.inboundArrivalAirportName && (
                                          <div className="text-xs text-muted-foreground">
                                            {flight.inboundArrivalAirportName}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Return Flight Details */}
                              {flight.returnDate && (
                                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {FlightApiService.formatDuration(flight.inboundFlightDuration || flight.returnDuration)}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {FlightApiService.getStopsDisplay(flight.inboundStops?.length || flight.returnStops)}
                                  </div>
                                  {flight.inboundAircraftType && (
                                    <div className="flex items-center gap-1">
                                      <Plane className="h-3 w-3" />
                                      {flight.inboundAircraftType}
                                    </div>
                                  )}
                                  {flight.inboundCabinName && (
                                    <div className="flex items-center gap-1">
                                      <Building className="h-3 w-3" />
                                      {flight.inboundCabinName}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Return Flight Airline Details */}
                              {flight.returnDate && (flight.inboundMarketingAirlineName || flight.inboundOperatingAirlineName) && (
                                <div className="text-xs text-muted-foreground">
                                  <div className="flex items-center gap-2">
                                    {flight.inboundMarketingAirlineName && (
                                      <span>Marketing: {flight.inboundMarketingAirlineName}</span>
                                    )}
                                    {flight.inboundOperatingAirlineName && flight.inboundOperatingAirlineName !== flight.inboundMarketingAirlineName && (
                                      <span>• Operating: {flight.inboundOperatingAirlineName}</span>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Return Flight Baggage Information */}
                              {flight.returnDate && (flight.inboundCheckedBaggage || flight.inboundCarryOnBaggage || flight.inboundBaggageAllowance) && (
                                <div className="text-xs text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <BaggageClaim className="h-3 w-3" />
                                    <span className="font-medium">Return Baggage:</span>
                                    {flight.inboundCheckedBaggage && (
                                      <span>
                                        {flight.inboundCheckedBaggage.pieces && `${flight.inboundCheckedBaggage.pieces} piece${flight.inboundCheckedBaggage.pieces !== 1 ? 's' : ''}`}
                                        {flight.inboundCheckedBaggage.weight && ` ${flight.inboundCheckedBaggage.weight}${flight.inboundCheckedBaggage.weightUnit}`}
                                      </span>
                                    )}
                                    {flight.inboundCarryOnBaggage && (
                                      <span>
                                        {flight.inboundCheckedBaggage && ' + '}
                                        Carry-on: {flight.inboundCarryOnBaggage.pieces && `${flight.inboundCarryOnBaggage.pieces} piece${flight.inboundCarryOnBaggage.pieces !== 1 ? 's' : ''}`}
                                        {flight.inboundCarryOnBaggage.weight && ` ${flight.inboundCarryOnBaggage.weight}${flight.inboundCarryOnBaggage.weightUnit}`}
                                      </span>
                                    )}
                                    {flight.inboundBaggageAllowance && !flight.inboundCheckedBaggage && !flight.inboundCarryOnBaggage && (
                                      <span>
                                        {typeof flight.inboundBaggageAllowance === 'string' 
                                          ? flight.inboundBaggageAllowance 
                                          : flight.inboundBaggageAllowance.pieces 
                                            ? `${flight.inboundBaggageAllowance.pieces} pieces`
                                            : flight.inboundBaggageAllowance.weight 
                                              ? `${flight.inboundBaggageAllowance.weight}${flight.inboundBaggageAllowance.weightUnit || 'kg'}`
                                              : 'Baggage included'
                                        }
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}

                             

                              {/* Additional Details */}
                              <div className="pt-2 border-t">
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <div className="flex items-center gap-4">
                                    {(flight.outboundCheckedBaggage || flight.outboundCarryOnBaggage || flight.outboundBaggageAllowance || flight.baggageAllowance) && (
                                      <div className="flex items-center gap-1">
                                        <BaggageClaim className="h-3 w-3" />
                                        {flight.outboundCheckedBaggage && (
                                          <span>
                                            {flight.outboundCheckedBaggage.pieces && `${flight.outboundCheckedBaggage.pieces} pieces`}
                                            {flight.outboundCheckedBaggage.weight && ` ${flight.outboundCheckedBaggage.weight}${flight.outboundCheckedBaggage.weightUnit}`}
                                          </span>
                                        )}
                                        {flight.outboundCarryOnBaggage && !flight.outboundCheckedBaggage && (
                                          <span>
                                            {flight.outboundCarryOnBaggage.pieces && `${flight.outboundCarryOnBaggage.pieces} pieces`}
                                            {flight.outboundCarryOnBaggage.weight && ` ${flight.outboundCarryOnBaggage.weight}${flight.outboundCarryOnBaggage.weightUnit}`}
                                          </span>
                                        )}
                                        {flight.outboundBaggageAllowance && !flight.outboundCheckedBaggage && !flight.outboundCarryOnBaggage && (
                                          <span>
                                            {typeof flight.outboundBaggageAllowance === 'string'
                                              ? flight.outboundBaggageAllowance
                                              : flight.outboundBaggageAllowance.pieces
                                                ? `${flight.outboundBaggageAllowance.pieces} pieces`
                                                : flight.outboundBaggageAllowance.weight
                                                  ? `${flight.outboundBaggageAllowance.weight}${flight.outboundBaggageAllowance.weightUnit || 'kg'}`
                                                  : 'Baggage included'
                                            }
                                          </span>
                                        )}
                                        {flight.baggageAllowance && !flight.outboundCheckedBaggage && !flight.outboundCarryOnBaggage && !flight.outboundBaggageAllowance && (
                                          <span>
                                            {typeof flight.baggageAllowance === 'string' 
                                              ? flight.baggageAllowance 
                                              : flight.baggageAllowance.NumberOfPieces 
                                                ? `${flight.baggageAllowance.NumberOfPieces} pieces`
                                                : flight.baggageAllowance.WeightInKilograms 
                                                  ? `${flight.baggageAllowance.WeightInKilograms}kg`
                                                  : 'Baggage included'
                                            }
                                          </span>
                                        )}
                                      </div>
                                    )}
                                    <div className="flex items-center gap-1">
                                      <CreditCard className="h-3 w-3" />
                                      {flight.fareTypeName || flight.fareType}
                                    </div>
                                    {flight.validatingAirlineName && (
                                      <div className="flex items-center gap-1">
                                        <Plane className="h-3 w-3" />
                                        {flight.validatingAirlineName}
                                      </div>
                                    )}
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