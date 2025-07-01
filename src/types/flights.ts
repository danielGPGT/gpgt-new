export interface Flight {
  id: string;
  airline: string;
  flightNumber: string;
  departure: {
    airport: string;
    city: string;
    country: string;
    time: string;
    terminal: string;
  };
  arrival: {
    airport: string;
    city: string;
    country: string;
    time: string;
    terminal: string;
  };
  duration: string;
  stops: number;
  aircraft: string;
  class: 'economy' | 'business' | 'first';
  price: {
    amount: number;
    currency: string;
  };
  available: boolean;
  refundable: boolean;
  baggage: {
    checked: number;
    carryOn: number;
  };
  amenities: string[];
  images: string[];
}

export interface FlightSearchParams {
  from?: string;
  to?: string;
  date?: string;
  returnDate?: string;
  adults?: number;
  children?: number;
  infants?: number;
  class?: 'economy' | 'business' | 'first';
  direct?: boolean;
  maxPrice?: number;
  currency?: string;
}

export interface FlightSearchResponse {
  flights: Flight[];
  totalResults: number;
  searchId: string;
  searchParams: FlightSearchParams;
}

export interface FlightRoute {
  outbound: Flight;
  inbound: Flight;
  totalPrice: {
    amount: number;
    currency: string;
  };
  savings?: {
    amount: number;
    currency: string;
  };
} 