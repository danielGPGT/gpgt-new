import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

interface FlightSearchRequest {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  children?: number;
  cabinClass?: string;
}

interface AuthToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

interface FlightSearchResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// Cache for auth token
let cachedToken: AuthToken | null = null;
let tokenExpiry: number = 0;

async function getAuthToken(): Promise<string> {
  const now = Date.now();
  
  // Check if we have a valid cached token
  if (cachedToken && now < tokenExpiry) {
    return cachedToken.access_token;
  }

  try {
    const username = Deno.env.get('VITE_FLIGHT_API_USERNAME');
    const password = Deno.env.get('VITE_FLIGHT_API_PASSWORD');
    const subscriptionKey = Deno.env.get('VITE_FLIGHT_API_SUBSCRIPTION_KEY');
    
    if (!username || !password || !subscriptionKey) {
      throw new Error('Flight API credentials not configured. Please set VITE_FLIGHT_API_USERNAME, VITE_FLIGHT_API_PASSWORD, and VITE_FLIGHT_API_SUBSCRIPTION_KEY');
    }

    const authResponse = await fetch('https://apiprod.travelinnovationgroup.com/Book/v7/Auth/Token', {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': subscriptionKey,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `grant_type=password&Username=${encodeURIComponent(username)}&Password=${encodeURIComponent(password)}`
    });

    if (!authResponse.ok) {
      throw new Error(`Auth failed: ${authResponse.status} ${authResponse.statusText}`);
    }

    const authData: AuthToken = await authResponse.json();
    
    // Cache the token with 50-minute expiry (10 minutes buffer)
    cachedToken = authData;
    tokenExpiry = now + (authData.expires_in - 600) * 1000;
    
    return authData.access_token;
  } catch (error) {
    console.error('Auth token error:', error);
    throw error;
  }
}

async function searchFlights(searchRequest: FlightSearchRequest): Promise<any> {
  const token = await getAuthToken();
  const subscriptionKey = Deno.env.get('VITE_FLIGHT_API_SUBSCRIPTION_KEY');
  
  const requestBody = {
    FlightRequestType: searchRequest.returnDate ? "Return" : "Oneway",
    RequestedFlights: [
      {
        RequestedFlightTypes: ["NoStopDirect", "StopDirect"],
        DepartureLocation: { AirportId: searchRequest.origin },
        ArrivalLocation: { AirportId: searchRequest.destination },
        DepartureDateTime: searchRequest.departureDate,
        RequestedCabins: [{ CabinId: searchRequest.cabinClass || "ECO" }]
      }
    ],
    PassengerCount: {
      PassengerTypeCount: {
        ADT: searchRequest.adults,
        ...(searchRequest.children && searchRequest.children > 0 && { CHD: searchRequest.children })
      },
      ChildAges: [],
      AdultAges: []
    },
    FareTypes: ["ITR"],
    IncludeTaxes: true,
    IncludeFees: true,
    IncludeBaggageOnlyFares: false,
    IncludeSemiDeferredFares: false,
    IncludeAlternateRoutes: true,
    IncludeCorporateFares: false,
    IncludeInstantTicketingFares: false
  };

  // Add return flight if specified
  if (searchRequest.returnDate) {
    requestBody.RequestedFlights.push({
      RequestedFlightTypes: ["NoStopDirect", "StopDirect"],
      DepartureLocation: { AirportId: searchRequest.destination },
      ArrivalLocation: { AirportId: searchRequest.origin },
      DepartureDateTime: searchRequest.returnDate,
      RequestedCabins: [{ CabinId: searchRequest.cabinClass || "ECO" }]
    });
  }

  try {
    const searchResponse = await fetch('https://apiprod.travelinnovationgroup.com/Book/v7/api/Flight/FindLowFares', {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': subscriptionKey!,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!searchResponse.ok) {
      throw new Error(`Flight search failed: ${searchResponse.status} ${searchResponse.statusText}`);
    }

    const searchData = await searchResponse.json();
    return searchData;
  } catch (error) {
    console.error('Flight search error:', error);
    throw error;
  }
}

function extractLayoverInfo(flights: any[], locations: any[]): any[] {
  if (!flights || flights.length <= 1) return [];
  
  const layovers: any[] = [];
  
  for (let i = 0; i < flights.length - 1; i++) {
    const currentFlight = flights[i];
    const nextFlight = flights[i + 1];
    
    if (currentFlight && nextFlight) {
      // Find the layover airport (arrival of current = departure of next)
      const layoverAirport = currentFlight.ArrivalAirportId;
      const layoverLocation = locations?.find((loc: any) => loc.AirportId === layoverAirport);
      
      // Calculate layover duration
      const currentArrival = new Date(currentFlight.ArrivalDateTime);
      const nextDeparture = new Date(nextFlight.DepartureDateTime);
      const layoverDurationMs = nextDeparture.getTime() - currentArrival.getTime();
      const layoverHours = Math.floor(layoverDurationMs / (1000 * 60 * 60));
      const layoverMinutes = Math.floor((layoverDurationMs % (1000 * 60 * 60)) / (1000 * 60));
      
      let layoverDuration = '';
      if (layoverHours > 0) {
        layoverDuration = `${layoverHours}h ${layoverMinutes}m`;
      } else {
        layoverDuration = `${layoverMinutes}m`;
      }
      
      layovers.push({
        airport: layoverLocation?.AirportName || layoverAirport,
        airportCode: layoverAirport,
        duration: layoverDuration,
        terminal: currentFlight.ArrivalTerminal || nextFlight.DepartureTerminal || '',
        arrivalTime: currentFlight.ArrivalDateTime,
        departureTime: nextFlight.DepartureDateTime
      });
    }
  }
  
  return layovers;
}

function formatFlightResults(apiResponse: any): any[] {
  if (!apiResponse.LowFareResult?.Recommendations) {
    return [];
  }

  const flights: any[] = [];
  
  apiResponse.LowFareResult.Recommendations.forEach((recommendation: any) => {
    // Get airline info
    const airline = apiResponse.LowFareResult.Airlines?.find((a: any) => a.AirlineId === recommendation.ValidatingAirlineId);
    
    // Get route info
    const routeCombination = recommendation.RouteCombinations?.[0];
    if (!routeCombination) return;
    
    const routes = routeCombination.RouteIds.map((routeId: string) => {
      return apiResponse.LowFareResult.RouteGroups?.find((group: any) => 
        group.Routes?.some((route: any) => route.RouteId === routeId)
      )?.Routes?.find((route: any) => route.RouteId === routeId);
    }).filter(Boolean);
    
    if (routes.length === 0) return;
    
    // Get flight details
    const outboundRoute = routes[0];
    const returnRoute = routes[1];
    
    const outboundFlights = outboundRoute?.FlightIds?.map((flightId: string) => 
      apiResponse.LowFareResult.Flights?.find((f: any) => f.FlightId === flightId)
    ).filter(Boolean) || [];
    
    const returnFlights = returnRoute?.FlightIds?.map((flightId: string) => 
      apiResponse.LowFareResult.Flights?.find((f: any) => f.FlightId === flightId)
    ).filter(Boolean) || [];
    
    // Calculate total price
    const totalPrice = recommendation.Passengers?.reduce((sum: number, passenger: any) => 
      sum + (passenger.Total || 0), 0) || 0;
    
    // Create flight object
    const flight = {
      id: recommendation.RecommendationId,
      source: 'api' as const,
      origin: outboundFlights[0]?.DepartureAirportId || '',
      destination: outboundFlights[0]?.ArrivalAirportId || '',
      departureDate: outboundFlights[0]?.DepartureDateTime || '',
      returnDate: returnFlights[0]?.DepartureDateTime || undefined,
      price: totalPrice,
      passengers: recommendation.Passengers?.[0]?.TypeCount || 1,
      airline: airline?.AirlineName || recommendation.ValidatingAirlineId,
      flightNumber: outboundFlights[0]?.FlightNumber || '',
      returnFlightNumber: returnFlights[0]?.FlightNumber || '',
      duration: outboundFlights[0]?.FlightDuration || '',
      returnDuration: returnFlights[0]?.FlightDuration || '',
      cabin: outboundFlights[0]?.Cabins?.[0]?.GenericCabinId || 'ECO',
      stops: outboundFlights[0]?.Stops?.length || 0,
      returnStops: returnFlights[0]?.Stops?.length || 0,
      departureTerminal: outboundFlights[0]?.DepartureTerminal || '',
      arrivalTerminal: outboundFlights[0]?.ArrivalTerminal || '',
      returnDepartureTerminal: returnFlights[0]?.DepartureTerminal || '',
      returnArrivalTerminal: returnFlights[0]?.ArrivalTerminal || '',
      aircraft: outboundFlights[0]?.AircraftType || '',
      returnAircraft: returnFlights[0]?.AircraftType || '',
      ticketingDeadline: recommendation.TicketingDeadline || '',
      fareType: recommendation.FareTypeId || '',
      refundable: recommendation.Passengers?.[0]?.Fares?.some((f: any) => f.FareBasisCode?.includes('REF')) || false,
      baggageAllowance: recommendation.Passengers?.[0]?.Fares?.[0]?.BaggageAllowance || null,
      currency: apiResponse.LowFareResult.Currency?.CurrencyId || 'GBP',
      layoverInfo: extractLayoverInfo(outboundFlights, apiResponse.LowFareResult.Locations),
      returnLayoverInfo: extractLayoverInfo(returnFlights, apiResponse.LowFareResult.Locations)
    };
    
    flights.push(flight);
  });
  
  return flights.sort((a, b) => a.price - b.price);
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey, x-client-trace-id, x-client-session-id, x-client-user-agent, x-client-request-id',
      },
    });
  }

  try {
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    const searchRequest: FlightSearchRequest = await req.json();
    
    // Validate required fields
    if (!searchRequest.origin || !searchRequest.destination || !searchRequest.departureDate || !searchRequest.adults) {
      throw new Error('Missing required fields: origin, destination, departureDate, adults');
    }

    const apiResponse = await searchFlights(searchRequest);
    const formattedFlights = formatFlightResults(apiResponse);

    return new Response(JSON.stringify({
      success: true,
      data: formattedFlights
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey, x-client-trace-id, x-client-session-id, x-client-user-agent, x-client-request-id',
      },
    });

  } catch (error) {
    console.error('Flight search error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey, x-client-trace-id, x-client-session-id, x-client-user-agent, x-client-request-id',
      },
    });
  }
}); 