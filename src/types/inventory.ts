import { Database } from './supabase';

// Base types from Supabase
export type Event = Database['public']['Tables']['events']['Row'];
export type Sport = Database['public']['Tables']['sports']['Row'];
export type Venue = Database['public']['Tables']['venues']['Row'];
export type Ticket = Database['public']['Tables']['tickets']['Row'];
export type TicketCategory = Database['public']['Tables']['ticket_categories']['Row'];
export type HotelRoom = Database['public']['Tables']['hotel_rooms']['Row'];
export type CircuitTransfer = {
  id: string;
  event_id: string | null;
  hotel_id: string | null;
  transfer_type: TransferType;
  used: number | null;
  coach_capacity: number;
  days: number;
  quote_hours: number | null;
  expected_hours: number | null;
  supplier: string | null;
  coach_cost_per_day_local: number | null;
  coach_vat: number | null;
  parking_ticket_per_coach_per_day: number | null;
  supplier_currency: string | null;
  guide_included: boolean | null;
  guide_cost_per_day: number | null;
  guide_vat: number | null;
  markup_percent: number | null;
  coaches_required: number | null;
  coach_cost_local: number | null;
  guide_cost_local: number | null;
  utilisation_percent: number | null;
  utilisation_cost_per_seat_local: number | null;
  coach_cost_gbp: number | null;
  guide_cost_gbp: number | null;
  utilisation_cost_per_seat_gbp: number | null;
  sell_price_per_seat_gbp: number | null;
  active: boolean | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
};
export type AirportTransfer = Database['public']['Tables']['airport_transfers']['Row'];
export type Flight = Database['public']['Tables']['flights']['Row'];
export type LoungePass = {
  id: string;
  event_id: string;
  variant: string;
  cost: number;
  markup: number;
  sell_price: number;
  currency: string;
  is_active: boolean;
  notes?: string | null;
  created_at: string;
  updated_at: string;
};
export type Package = Database['public']['Tables']['packages']['Row'];
export type PackageTier = Database['public']['Tables']['package_tiers']['Row'];
export type PackageComponent = Database['public']['Tables']['package_components']['Row'];

// Insert types
export type EventInsert = Database['public']['Tables']['events']['Insert'];
export type SportInsert = Database['public']['Tables']['sports']['Insert'];
export type VenueInsert = Database['public']['Tables']['venues']['Insert'];
export type TicketInsert = Database['public']['Tables']['tickets']['Insert'];
export type TicketCategoryInsert = Database['public']['Tables']['ticket_categories']['Insert'];
export type HotelRoomInsert = Database['public']['Tables']['hotel_rooms']['Insert'];
export type CircuitTransferInsert = {
  event_id?: string | null;
  hotel_id?: string | null;
  transfer_type: TransferType;
  used?: number | null;
  coach_capacity: number;
  days: number;
  quote_hours?: number | null;
  expected_hours?: number | null;
  supplier?: string | null;
  coach_cost_per_day_local?: number | null;
  coach_vat?: number | null;
  parking_ticket_per_coach_per_day?: number | null;
  supplier_currency?: string | null;
  guide_included?: boolean | null;
  guide_cost_per_day?: number | null;
  guide_vat?: number | null;
  markup_percent?: number | null;
  utilisation_percent?: number | null;
  active?: boolean | null;
  notes?: string | null;
};
export type AirportTransferInsert = Database['public']['Tables']['airport_transfers']['Insert'];
export type FlightInsert = Database['public']['Tables']['flights']['Insert'];
export type LoungePassInsert = Database['public']['Tables']['lounge_passes']['Insert'];
export type PackageInsert = Database['public']['Tables']['packages']['Insert'];
export type PackageTierInsert = Database['public']['Tables']['package_tiers']['Insert'];
export type PackageComponentInsert = Database['public']['Tables']['package_components']['Insert'];

// Update types
export type EventUpdate = Database['public']['Tables']['events']['Update'];
export type SportUpdate = Database['public']['Tables']['sports']['Update'];
export type VenueUpdate = Database['public']['Tables']['venues']['Update'];
export type TicketUpdate = Database['public']['Tables']['tickets']['Update'];
export type TicketCategoryUpdate = Database['public']['Tables']['ticket_categories']['Update'];
export type HotelRoomUpdate = Database['public']['Tables']['hotel_rooms']['Update'];
export type CircuitTransferUpdate = {
  event_id?: string | null;
  hotel_id?: string | null;
  transfer_type?: TransferType;
  used?: number | null;
  coach_capacity?: number;
  days?: number;
  quote_hours?: number | null;
  expected_hours?: number | null;
  supplier?: string | null;
  coach_cost_per_day_local?: number | null;
  coach_vat?: number | null;
  parking_ticket_per_coach_per_day?: number | null;
  supplier_currency?: string | null;
  guide_included?: boolean | null;
  guide_cost_per_day?: number | null;
  guide_vat?: number | null;
  markup_percent?: number | null;
  utilisation_percent?: number | null;
  active?: boolean | null;
  notes?: string | null;
};
export type AirportTransferUpdate = Database['public']['Tables']['airport_transfers']['Update'];
export type FlightUpdate = Database['public']['Tables']['flights']['Update'];
export type LoungePassUpdate = Database['public']['Tables']['lounge_passes']['Update'];
export type PackageUpdate = Database['public']['Tables']['packages']['Update'];
export type PackageTierUpdate = Database['public']['Tables']['package_tiers']['Update'];
export type PackageComponentUpdate = Database['public']['Tables']['package_components']['Update'];

// Extended types with relationships
export interface EventWithRelations extends Event {
  sport?: Sport;
  venue?: Venue;
  tickets?: Ticket[];
  hotel_rooms?: HotelRoom[];
  circuit_transfers?: CircuitTransfer[];
  airport_transfers?: AirportTransfer[];
  flights?: Flight[];
  lounge_passes?: LoungePass[];
  packages?: Package[];
}

export interface TicketWithEvent extends Ticket {
  event?: Event;
}

export interface HotelRoomWithEvent extends HotelRoom {
  event?: Event;
  hotel?: {
    id: string;
    name: string;
    location: string;
    rating: number;
    imageUrl: string;
  };
}

export interface CircuitTransferWithRelations extends CircuitTransfer {
  event?: Event;
  hotel?: {
    id: string;
    name: string;
    location: string;
  };
}

export interface FlightWithEvent extends Flight {
  event?: Event;
}

export interface LoungePassWithEvent extends LoungePass {
  event?: Event;
}

export interface PackageWithRelations extends Package {
  event?: Event;
  tiers?: (PackageTier & {
    components?: PackageComponent[];
  })[];
}

// Component type enum
export type ComponentType = 'ticket' | 'hotel_room' | 'circuit_transfer' | 'airport_transfer' | 'flight' | 'lounge_pass';

// Inventory status types
export type InventoryStatus = 'available' | 'low_stock' | 'reserved' | 'provisional' | 'out_of_stock';

export type TicketStatus = 'available' | 'ordered' | 'paid' | 'received' | 'out_of_stock';

export type TransferType = 'coach' | 'mpv';
export type AirportTransferType = 'arrival' | 'departure' | 'return';
export type VehicleType = 'private car' | 'mpv' | 'luxury' | 'chauffeur';

// Filter types
export interface InventoryFilters {
  event_id?: string;
  sport_id?: string;
  venue_id?: string;
  supplier?: string;
  active?: boolean;
  date_from?: string;
  date_to?: string;
  price_min?: number;
  price_max?: number;
  currency?: string;
  search?: string;
}

export interface TicketFilters extends InventoryFilters {
  ticket_category_id?: string;
  delivery_method?: string;
  ticket_type?: string;
  refundable?: boolean;
  resellable?: boolean;
  ordered?: boolean;
  paid?: boolean;
  tickets_received?: boolean;
  quantity_available_min?: number;
  quantity_available_max?: number;
}

export interface HotelRoomFilters extends InventoryFilters {
  room_type_id?: string;
  check_in_from?: string;
  check_in_to?: string;
  check_out_from?: string;
  check_out_to?: string;
  contracted?: boolean;
  quantity_available_min?: number;
  quantity_available_max?: number;
}

export interface TransferFilters extends InventoryFilters {
  transfer_type?: TransferType | AirportTransferType;
  vehicle_type?: VehicleType;
  seat_capacity_min?: number;
  seat_capacity_max?: number;
  seats_available_min?: number;
  seats_available_max?: number;
}

export interface FlightFilters extends InventoryFilters {
  departure_airport_code?: string;
  arrival_airport_code?: string;
  airline?: string;
  flight_class?: string;
  stops_outbound?: number;
  stops_return?: number;
}

export interface LoungePassFilters extends InventoryFilters {
  airport_code?: string;
  terminal?: string;
  capacity_min?: number;
  capacity_max?: number;
}

// Form types for creating/editing
export interface TicketFormData {
  // Required fields
  event_id: string;
  ticket_category_id: string;
  quantity_total: number;
  supplier_currency: string;
  supplier_price: number;
  currency: string;
  price: number;
  markup_percent: number;
  refundable: boolean;
  resellable: boolean;
  
  // Optional fields
  ticket_days?: string | null;
  quantity_provisional?: number | null;
  ticket_type?: string | null;
  supplier?: string | null;
  supplier_ref?: string | null;
  ordered?: boolean;
  ordered_at?: string | null;
  paid?: boolean;
  paid_at?: string | null;
  tickets_received?: boolean;
  tickets_received_at?: string | null;
  metadata?: Record<string, any>;
}

export interface HotelRoomFormData {
  hotel_id: string;
  room_type_id: string;
  event_id?: string;
  check_in: string;
  check_out: string;
  quantity_total: number;
  base_price: number;
  markup_percent?: number;
  currency?: string;
  vat_percent?: number;
  resort_fee?: number;
  resort_fee_type?: string;
  city_tax_per_person_per_night?: number;
  contracted?: boolean;
  attrition_deadline?: string;
  release_allowed_percent?: number;
  penalty_terms?: string;
  supplier?: string;
  supplier_ref?: string;
  contract_file_path?: string;
}

export interface CircuitTransferFormData {
  id?: string;
  event_id?: string | null;
  hotel_id?: string | null;
  transfer_type: TransferType;
  used?: number | null;
  coach_capacity: number;
  days: number;
  quote_hours?: number | null;
  expected_hours?: number | null;
  supplier?: string | null;
  coach_cost_per_day_local?: number | null;
  coach_vat?: number | null;
  parking_ticket_per_coach_per_day?: number | null;
  supplier_currency?: string | null;
  guide_included?: boolean | null;
  guide_cost_per_day?: number | null;
  guide_vat?: number | null;
  markup_percent?: number | null;
  utilisation_percent?: number | null;
  active?: boolean | null;
  notes?: string | null;
  coaches_required?: number | null;
  coach_cost_local?: number | null;
  guide_cost_local?: number | null;
  utilisation_cost_per_seat_local?: number | null;
  coach_cost_gbp?: number | null;
  guide_cost_gbp?: number | null;
  utilisation_cost_per_seat_gbp?: number | null;
  sell_price_per_seat_gbp?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export type AirportTransferTransportType = 'hotel_chauffeur' | 'private_car';

export interface AirportTransferWithRelations extends AirportTransfer {
  event?: Event;
  hotel?: {
    id: string;
    name: string;
    location: string;
  };
}

export interface AirportTransferFormData {
  event_id?: string;
  hotel_id?: string;
  transport_type: AirportTransferTransportType;
  max_capacity: number;
  used?: number;
  supplier?: string;
  quote_currency?: string;
  supplier_quote_per_car_local?: number;
  supplier_quote_per_car_gbp?: number;
  paid_to_supplier?: boolean;
  outstanding?: boolean;
  markup?: number;
  notes?: string;
}

export interface FlightFormData {
  event_id?: string;
  departure_airport_code: string;
  arrival_airport_code: string;
  return_departure_airport_code?: string;
  return_arrival_airport_code?: string;
  airline?: string;
  flight_class?: string;
  outbound_flight_number?: string;
  return_flight_number?: string;
  outbound_departure_datetime?: string;
  outbound_arrival_datetime?: string;
  return_departure_datetime?: string;
  return_arrival_datetime?: string;
  stops_outbound?: number;
  stops_return?: number;
  layovers_outbound?: Record<string, any>[];
  layovers_return?: Record<string, any>[];
  supplier?: string;
  quote_currency?: string;
  supplier_quote?: number;
  markup_percent?: number;
  baggage_policy?: string;
  notes?: string;
}

export interface LoungePassFormData {
  event_id?: string;
  airport_code?: string;
  lounge_name: string;
  terminal?: string;
  supplier?: string;
  quote_currency?: string;
  supplier_quote?: number;
  markup_percent?: number;
  capacity?: number;
  delivery_method?: string;
  description?: string;
  notes?: string;
}

// Package form types
export interface PackageFormData {
  event_id?: string;
  name: string;
  slug?: string;
  description?: string;
  base_type?: string;
  active?: boolean;
}

export interface PackageTierFormData {
  package_id?: string;
  name: string;
  short_label?: string;
  description?: string;
  display_order?: number;
  price_override?: number;
}

export interface PackageComponentFormData {
  tier_id?: string;
  event_id?: string;
  component_type: ComponentType;
  component_id: string;
  quantity?: number;
  price_override?: number;
  notes?: string;
}

// Table column definitions
export interface InventoryTableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

// Inventory summary types
export interface InventorySummary {
  total_items: number;
  available_items: number;
  low_stock_items: number;
  provisional_items: number;
  out_of_stock_items: number;
  total_value: number;
  currency: string;
}

export interface ComponentSummary {
  component_type: ComponentType;
  count: number;
  available: number;
  low_stock: number;
  provisional: number;
  out_of_stock: number;
  total_value: number;
}

// Export types for bulk operations
export interface BulkUpdateData {
  ids: string[];
  updates: Partial<TicketUpdate | HotelRoomUpdate | CircuitTransferUpdate | AirportTransferUpdate | FlightUpdate | LoungePassUpdate>;
}

export interface BulkDeleteData {
  ids: string[];
  component_type: ComponentType;
}

// Legacy types for backward compatibility
export interface Hotel {
  id: string;
  name: string;
  location: string;
  rating: number; // 1-5
  pricePerNight: number;
  imageUrl: string;
  description: string;
  amenities: string[];
}

export interface HotelSearchParams {
  destination: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  roomCount: number;
  maxPrice?: number;
  amenities?: string[];
}

export interface StandardHotelResult {
  id: string;
  name: string;
  image: string;
  description: string;
  rating: number;
  price: number;
  currency: string;
  refundPolicy: string;
  location: string;
  tags: string[];
}

 