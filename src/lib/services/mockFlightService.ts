import { MockLowFareResult, MockFlight, MockRecommendation, getFlightsByDirection, getRecommendationsByPriceRange, getAirlineById, getLocationById, mockLowFareResult } from '../mockData/mockFlightData';

export interface FlightSearchParams {
  from?: string;
  to?: string;
  departureDate?: string;
  returnDate?: string;
  adults?: number;
  children?: number;
  cabin?: string;
  airline?: string;
  maxPrice?: number;
  minPrice?: number;
  nonstopOnly?: boolean;
  preferredAirlines?: string[];
}

export interface FlightSearchResult {
  flights: MockFlight[];
  recommendations: MockRecommendation[];
  total: number;
  currency: string;
  filters: {
    airlines: string[];
    cabins: string[];
    priceRange: { min: number; max: number };
  };
}

export const mockFlightService = {
  async searchFlights(params: FlightSearchParams): Promise<FlightSearchResult> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));

    console.log('Mock flight search with params:', params);

    // Get all flights from the mock data
    let flights = mockLowFareResult.Flights;
    let recommendations = mockLowFareResult.Recommendations;

    // Apply filters
    if (params.from) {
      flights = flights.filter(flight => 
        flight.DepartureAirportId.toLowerCase().includes(params.from!.toLowerCase())
      );
    }

    if (params.to) {
      flights = flights.filter(flight => 
        flight.ArrivalAirportId.toLowerCase().includes(params.to!.toLowerCase())
      );
    }

    if (params.airline) {
      flights = flights.filter(flight => 
        flight.MarketingAirlineId.toLowerCase() === params.airline!.toLowerCase()
      );
    }

    if (params.preferredAirlines && params.preferredAirlines.length > 0) {
      flights = flights.filter(flight => 
        params.preferredAirlines!.includes(flight.MarketingAirlineId)
      );
    }

    if (params.nonstopOnly) {
      flights = flights.filter(flight => flight.Stops.length === 0);
    }

    // Filter recommendations based on price
    if (params.maxPrice) {
      recommendations = recommendations.filter(rec => rec.Total <= params.maxPrice!);
    }

    if (params.minPrice) {
      recommendations = recommendations.filter(rec => rec.Total >= params.minPrice!);
    }

    // Calculate price range
    const allPrices = recommendations.map(rec => rec.Total);
    const priceRange = {
      min: Math.min(...allPrices),
      max: Math.max(...allPrices)
    };

    // Get unique airlines and cabins
    const airlines = [...new Set(flights.map(flight => flight.MarketingAirlineId))];
    const cabins = [...new Set(flights.flatMap(flight => flight.Cabins.map(cabin => cabin.GenericCabinId)))];

    return {
      flights,
      recommendations,
      total: flights.length,
      currency: mockLowFareResult.Currency.CurrencyId,
      filters: {
        airlines,
        cabins,
        priceRange
      }
    };
  },

  async getFlightDetails(flightId: string): Promise<MockFlight | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockLowFareResult.Flights.find(flight => flight.FlightId === flightId) || null;
  },

  async getRecommendations(params: FlightSearchParams): Promise<MockRecommendation[]> {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    let recommendations = mockLowFareResult.Recommendations;
    
    // Apply filters
    if (params.maxPrice) {
      recommendations = recommendations.filter(rec => rec.Total <= params.maxPrice!);
    }
    
    if (params.minPrice) {
      recommendations = recommendations.filter(rec => rec.Total >= params.minPrice!);
    }
    
    // Sort by price
    recommendations = recommendations.sort((a, b) => a.Total - b.Total);
    
    return recommendations.slice(0, 10);
  },

  async getOutboundFlights(params: FlightSearchParams): Promise<MockFlight[]> {
    await new Promise(resolve => setTimeout(resolve, 400));
    return getFlightsByDirection('outbound');
  },

  async getInboundFlights(params: FlightSearchParams): Promise<MockFlight[]> {
    await new Promise(resolve => setTimeout(resolve, 400));
    return getFlightsByDirection('inbound');
  },

  async getRouteOptions(params: FlightSearchParams): Promise<MockRecommendation[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return recommendations that match the route
    let recommendations = mockLowFareResult.Recommendations;
    
    if (params.from && params.to) {
      recommendations = recommendations.filter(rec => 
        rec.Routing.toLowerCase().includes(params.from!.toLowerCase()) &&
        rec.Routing.toLowerCase().includes(params.to!.toLowerCase())
      );
    }
    
    return recommendations.sort((a, b) => a.Total - b.Total);
  }
}; 