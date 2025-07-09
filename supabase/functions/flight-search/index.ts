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
    
    // Get passenger and fare details
    const passenger = recommendation.Passengers?.[0];
    const fare = passenger?.Fares?.[0];
    
    // Calculate total price
    const totalPrice = recommendation.Passengers?.reduce((sum: number, passenger: any) => 
      sum + (passenger.Total || 0), 0) || 0;
    
    // Get outbound flight details
    const outboundFlight = outboundFlights[0];
    const outboundCabin = outboundFlight?.Cabins?.[0];
    const outboundMarketingAirline = apiResponse.LowFareResult.Airlines?.find((a: any) => a.AirlineId === outboundFlight?.MarketingAirlineId);
    const outboundOperatingAirline = apiResponse.LowFareResult.Airlines?.find((a: any) => a.AirlineId === outboundFlight?.OperatingAirlineId);
    const outboundDepartureLocation = apiResponse.LowFareResult.Locations?.find((l: any) => l.AirportId === outboundFlight?.DepartureAirportId);
    const outboundArrivalLocation = apiResponse.LowFareResult.Locations?.find((l: any) => l.AirportId === outboundFlight?.ArrivalAirportId);
    
    // Get inbound flight details (for return flights)
    const inboundFlight = returnFlights[0];
    const inboundCabin = inboundFlight?.Cabins?.[0];
    const inboundMarketingAirline = inboundFlight ? apiResponse.LowFareResult.Airlines?.find((a: any) => a.AirlineId === inboundFlight?.MarketingAirlineId) : null;
    const inboundOperatingAirline = inboundFlight ? apiResponse.LowFareResult.Airlines?.find((a: any) => a.AirlineId === inboundFlight?.OperatingAirlineId) : null;
    const inboundDepartureLocation = inboundFlight ? apiResponse.LowFareResult.Locations?.find((l: any) => l.AirportId === inboundFlight?.DepartureAirportId) : null;
    const inboundArrivalLocation = inboundFlight ? apiResponse.LowFareResult.Locations?.find((l: any) => l.AirportId === inboundFlight?.ArrivalAirportId) : null;
    
    // Get fare type details
    const fareType = apiResponse.LowFareResult.FareTypes?.find((f: any) => f.FareTypeId === recommendation.FareTypeId);
    const fareSubType = apiResponse.LowFareResult.FareSubTypes?.find((f: any) => f.FareSubTypeId === fare?.FareSubTypeId);
    const revenueStream = apiResponse.LowFareResult.RevenueStreams?.find((r: any) => r.RevenueStreamId === fare?.RevenueStreamId);
    const passengerType = apiResponse.LowFareResult.PassengerTypes?.find((p: any) => p.PassengerTypeId === passenger?.PassengerTypeId);
    
    // Create flight object with all detailed information
    const flight = {
      id: recommendation.RecommendationId,
      source: 'api' as const,
      origin: outboundFlight?.DepartureAirportId || '',
      destination: outboundFlight?.ArrivalAirportId || '',
      departureDate: outboundFlight?.DepartureDateTime || '',
      returnDate: inboundFlight?.DepartureDateTime || undefined,
      price: totalPrice,
      passengers: passenger?.TypeCount || 1,
      airline: airline?.AirlineName || recommendation.ValidatingAirlineId,
      flightNumber: outboundFlight?.FlightNumber || '',
      returnFlightNumber: inboundFlight?.FlightNumber || '',
      duration: outboundFlight?.FlightDuration || '',
      returnDuration: inboundFlight?.FlightDuration || '',
      cabin: outboundCabin?.GenericCabinId || 'ECO',
      stops: outboundFlight?.Stops?.length || 0,
      returnStops: inboundFlight?.Stops?.length || 0,
      departureTerminal: outboundFlight?.DepartureTerminal || '',
      arrivalTerminal: outboundFlight?.ArrivalTerminal || '',
      returnDepartureTerminal: inboundFlight?.DepartureTerminal || '',
      returnArrivalTerminal: inboundFlight?.ArrivalTerminal || '',
      aircraft: outboundFlight?.AircraftType || '',
      returnAircraft: inboundFlight?.AircraftType || '',
      ticketingDeadline: recommendation.TicketingDeadline || '',
      fareType: recommendation.FareTypeId || '',
      refundable: fare?.FareBasisCode?.includes('REF') || false,
      baggageAllowance: fare?.BaggageAllowance || null,
      currency: apiResponse.LowFareResult.Currency?.CurrencyId || 'GBP',
      layoverInfo: extractLayoverInfo(outboundFlights, apiResponse.LowFareResult.Locations),
      returnLayoverInfo: extractLayoverInfo(returnFlights, apiResponse.LowFareResult.Locations),
      
      // Enhanced detailed flight information
      // Outbound flight details
      outboundFlightId: outboundFlight?.FlightId,
      outboundMarketingAirlineId: outboundFlight?.MarketingAirlineId,
      outboundOperatingAirlineId: outboundFlight?.OperatingAirlineId,
      outboundMarketingAirlineName: outboundMarketingAirline?.AirlineName,
      outboundOperatingAirlineName: outboundOperatingAirline?.AirlineName,
      outboundDepartureAirportId: outboundFlight?.DepartureAirportId,
      outboundDepartureAirportName: outboundDepartureLocation?.AirportName,
      outboundArrivalAirportId: outboundFlight?.ArrivalAirportId,
      outboundArrivalAirportName: outboundArrivalLocation?.AirportName,
      outboundDepartureDateTime: outboundFlight?.DepartureDateTime || outboundFlight?.DepartureDateTimeUtc,
      outboundDepartureDateTimeUtc: outboundFlight?.DepartureDateTimeUtc,
      outboundArrivalDateTime: outboundFlight?.ArrivalDateTime || outboundFlight?.ArrivalDateTimeUtc,
      outboundArrivalDateTimeUtc: outboundFlight?.ArrivalDateTimeUtc,
      outboundFlightDuration: outboundFlight?.FlightDuration,
      outboundAircraftType: outboundFlight?.AircraftType,
      outboundDepartureTerminal: outboundFlight?.DepartureTerminal,
      outboundArrivalTerminal: outboundFlight?.ArrivalTerminal,
      outboundCabinId: outboundCabin?.CabinId,
      outboundCabinName: outboundCabin?.CabinName,
      outboundFareBasisCode: fare?.FareBasisCode,
      outboundFareTypeId: fare?.FareTypeId,
      outboundFareTypeName: fare?.FareTypeName,
      outboundFareSubTypeId: fare?.FareSubTypeId,
      outboundFareSubTypeName: fare?.FareSubTypeName,
      outboundBaggageAllowance: fare?.BaggageAllowance,
      outboundCheckedBaggage: fare?.CheckedBaggage,
      outboundCarryOnBaggage: fare?.CarryOnBaggage,
      outboundStops: outboundFlight?.Stops || [],
      outboundLayoverInfo: extractLayoverInfo(outboundFlights, apiResponse.LowFareResult.Locations),
      
      // Inbound flight details (for return flights)
      inboundFlightId: inboundFlight?.FlightId,
      inboundMarketingAirlineId: inboundFlight?.MarketingAirlineId,
      inboundOperatingAirlineId: inboundFlight?.OperatingAirlineId,
      inboundMarketingAirlineName: inboundMarketingAirline?.AirlineName,
      inboundOperatingAirlineName: inboundOperatingAirline?.AirlineName,
      inboundDepartureAirportId: inboundFlight?.DepartureAirportId,
      inboundDepartureAirportName: inboundDepartureLocation?.AirportName,
      inboundArrivalAirportId: inboundFlight?.ArrivalAirportId,
      inboundArrivalAirportName: inboundArrivalLocation?.AirportName,
      inboundDepartureDateTime: inboundFlight?.DepartureDateTime || inboundFlight?.DepartureDateTimeUtc,
      inboundDepartureDateTimeUtc: inboundFlight?.DepartureDateTimeUtc,
      inboundArrivalDateTime: inboundFlight?.ArrivalDateTime || inboundFlight?.ArrivalDateTimeUtc,
      inboundArrivalDateTimeUtc: inboundFlight?.ArrivalDateTimeUtc,
      inboundFlightDuration: inboundFlight?.FlightDuration,
      inboundAircraftType: inboundFlight?.AircraftType,
      inboundDepartureTerminal: inboundFlight?.DepartureTerminal,
      inboundArrivalTerminal: inboundFlight?.ArrivalTerminal,
      inboundCabinId: inboundCabin?.CabinId,
      inboundCabinName: inboundCabin?.CabinName,
      inboundFareBasisCode: fare?.FareBasisCode,
      inboundFareTypeId: fare?.FareTypeId,
      inboundFareTypeName: fare?.FareTypeName,
      inboundFareSubTypeId: fare?.FareSubTypeId,
      inboundFareSubTypeName: fare?.FareSubTypeName,
      inboundBaggageAllowance: fare?.BaggageAllowance,
      inboundCheckedBaggage: fare?.CheckedBaggage,
      inboundCarryOnBaggage: fare?.CarryOnBaggage,
      inboundStops: inboundFlight?.Stops || [],
      inboundLayoverInfo: extractLayoverInfo(returnFlights, apiResponse.LowFareResult.Locations),
      
      // Fare and pricing details
      fareTypeId: recommendation.FareTypeId,
      fareTypeName: fareType?.FareTypeName,
      fareSubTypeId: fare?.FareSubTypeId,
      fareSubTypeName: fareSubType?.FareSubTypeName,
      revenueStreamId: fare?.RevenueStreamId,
      revenueStreamName: revenueStream?.RevenueStreamName,
      passengerTypeId: passenger?.PassengerTypeId,
      passengerTypeName: passengerType?.PassengerTypeName,
      baseFare: fare?.BaseFare || 0,
      taxes: fare?.Taxes || 0,
      fees: fare?.Fees || 0,
      totalFare: fare?.Total || 0,
      currencyId: apiResponse.LowFareResult.Currency?.CurrencyId,
      currencyCode: apiResponse.LowFareResult.Currency?.CurrencyCode,
      currencyName: apiResponse.LowFareResult.Currency?.CurrencyName,
      currencySymbol: apiResponse.LowFareResult.Currency?.CurrencySymbol,
      decimalPlaces: apiResponse.LowFareResult.Currency?.DecimalPlaces,
      
      // Additional metadata
      recommendationId: recommendation.RecommendationId,
      validatingAirlineId: recommendation.ValidatingAirlineId,
      validatingAirlineName: airline?.AirlineName,
      skytraxRating: airline?.SkytraxRating,
      isPremium: outboundCabin?.IsPremium || false,
      isCorporate: fare?.IsCorporate || false,
      isInstantTicketing: fare?.IsInstantTicketing || false,
      isSemiDeferred: fare?.IsSemiDeferred || false,
      isBaggageOnly: fare?.IsBaggageOnly || false,
      isAlternateRoute: recommendation.IsAlternateRoute || false,
      
      // Original API response data for reference
      originalApiData: {
        recommendation,
        outboundFlight,
        inboundFlight,
        passenger,
        fare,
        airline,
        outboundMarketingAirline,
        outboundOperatingAirline,
        inboundMarketingAirline,
        inboundOperatingAirline,
        outboundDepartureLocation,
        outboundArrivalLocation,
        inboundDepartureLocation,
        inboundArrivalLocation,
        fareType,
        fareSubType,
        revenueStream,
        passengerType,
        outboundCabin,
        inboundCabin
      }
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