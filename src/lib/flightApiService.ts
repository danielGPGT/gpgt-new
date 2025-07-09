import { supabase } from './supabase';

export interface FlightSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  children?: number;
  cabinClass?: string;
  directFlightsOnly?: boolean;
}

export interface ApiFlight {
  id: string;
  source: 'api';
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  price: number;
  passengers: number;
  airline: string;
  flightNumber: string;
  returnFlightNumber?: string;
  duration: string;
  returnDuration?: string;
  cabin: string;
  stops: number;
  returnStops?: number;
  departureTerminal: string;
  arrivalTerminal: string;
  returnDepartureTerminal?: string;
  returnArrivalTerminal?: string;
  aircraft: string;
  returnAircraft?: string;
  ticketingDeadline: string;
  fareType: string;
  refundable: boolean;
  baggageAllowance: any;
  currency: string;
  
  // Enhanced detailed flight information
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

export interface FlightSearchResponse {
  success: boolean;
  data?: ApiFlight[];
  error?: string;
}

export class FlightApiService {
  private static async callEdgeFunction(endpoint: string, data: any): Promise<any> {
    const { data: response, error } = await supabase.functions.invoke(endpoint, {
      body: data
    });

    if (error) {
      throw new Error(`Edge function error: ${error.message}`);
    }

    return response;
  }

  static async searchFlights(params: FlightSearchParams): Promise<ApiFlight[]> {
    try {
      const response: FlightSearchResponse = await this.callEdgeFunction('flight-search', params);
      
      if (!response.success) {
        throw new Error(response.error || 'Flight search failed');
      }

      return response.data || [];
    } catch (error) {
      console.error('Flight search error:', error);
      throw error;
    }
  }

  static async searchFlightsWithRetry(params: FlightSearchParams, maxRetries: number = 3): Promise<ApiFlight[]> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.searchFlights(params);
      } catch (error) {
        lastError = error as Error;
        console.warn(`Flight search attempt ${attempt} failed:`, error);
        
        if (attempt < maxRetries) {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }
    
    throw lastError || new Error('Flight search failed after all retries');
  }

  // Helper method to validate airport codes
  static validateAirportCode(code: string): boolean {
    return /^[A-Z]{3}$/.test(code);
  }

  // Helper method to format flight duration
  static formatDuration(duration: string): string {
    if (!duration) return '';
    
    // Duration is in format "HH:MM"
    const [hours, minutes] = duration.split(':').map(Number);
    if (hours === 0) {
      return `${minutes}m`;
    } else if (minutes === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${minutes}m`;
    }
  }

  // Helper method to format price
  static formatPrice(price: number, currency: string = 'GBP'): string {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  }

  // Helper method to get cabin class display name
  static getCabinDisplayName(cabinCode: string): string {
    const cabinMap: Record<string, string> = {
      'ECO': 'Economy',
      'PEC': 'Premium Economy',
      'BUS': 'Business',
      'FIR': 'First Class',
      'CALEC': 'Economy',
      'UAECO': 'Economy',
      'QFPEC': 'Premium Economy',
    };
    
    return cabinMap[cabinCode] || cabinCode;
  }

  // Helper method to get stops display text
  static getStopsDisplay(stops: number): string {
    if (stops === 0) return 'Direct';
    if (stops === 1) return '1 stop';
    return `${stops} stops`;
  }

  // Helper method to format date for display
  static formatFlightDate(dateString: string): string {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  }

  // Helper method to format time for display
  static formatFlightTime(dateString: string): string {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  // Helper method to parse duration from HH:MM to hours
  static parseDurationToHours(duration: string): number {
    if (!duration) return 0;
    
    const [hours, minutes] = duration.split(':').map(Number);
    return hours + (minutes / 60);
  }

  // Helper method to format flight number universally
  static formatFlightNumber(airlineCode: string, flightNumber: string): string {
    if (!airlineCode || !flightNumber) return flightNumber || '';
    
    // Remove any existing airline code from the flight number if it's already there
    const cleanFlightNumber = flightNumber.replace(/^[A-Z]{2,3}/, '');
    
    // Format as airline code + flight number (e.g., "EK 123" or "BA 456")
    return `${airlineCode} ${cleanFlightNumber}`;
  }

  // Helper method to get airline code from various sources
  static getAirlineCode(flight: any): string {
    // Try different sources for airline code in order of preference
    return flight.outboundMarketingAirlineId || 
           flight.inboundMarketingAirlineId || 
           flight.validatingAirlineId || 
           flight.airline?.substring(0, 2) || 
           '';
  }
} 