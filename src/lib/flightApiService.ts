import { supabase } from './supabase';

export interface FlightSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  children?: number;
  cabinClass?: string;
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
} 