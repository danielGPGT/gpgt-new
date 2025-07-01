import { supabase } from './supabase';
import type {
  Event,
  EventInsert,
  EventUpdate,
  Sport,
  SportInsert,
  SportUpdate,
  Venue,
  VenueInsert,
  VenueUpdate,
  Ticket,
  TicketInsert,
  TicketUpdate,
  TicketWithEvent,
  HotelRoom,
  HotelRoomInsert,
  HotelRoomUpdate,
  HotelRoomWithEvent,
  CircuitTransfer,
  CircuitTransferInsert,
  CircuitTransferUpdate,
  CircuitTransferWithRelations,
  AirportTransfer,
  AirportTransferInsert,
  AirportTransferUpdate,
  AirportTransferWithRelations,
  Flight,
  FlightInsert,
  FlightUpdate,
  FlightWithEvent,
  LoungePass,
  LoungePassInsert,
  LoungePassUpdate,
  LoungePassWithEvent,
  Package,
  PackageInsert,
  PackageUpdate,
  PackageWithRelations,
  PackageTier,
  PackageTierInsert,
  PackageTierUpdate,
  PackageComponent,
  PackageComponentInsert,
  PackageComponentUpdate,
  InventoryFilters,
  TicketFilters,
  HotelRoomFilters,
  TransferFilters,
  FlightFilters,
  LoungePassFilters,
  InventorySummary,
  ComponentSummary,
  BulkUpdateData,
  BulkDeleteData,
  TicketCategory,
  TicketCategoryInsert,
  TicketCategoryUpdate,
} from '@/types/inventory';

export class InventoryService {
  // Events
  static async getEvents(filters?: InventoryFilters): Promise<Event[]> {
    let query = supabase
      .from('events')
      .select(`
        *,
        sport:sports(*),
        venue:venues(*)
      `);

    if (filters?.sport_id) {
      query = query.eq('sport_id', filters.sport_id);
    }
    if (filters?.venue_id) {
      query = query.eq('venue_id', filters.venue_id);
    }
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,location.ilike.%${filters.search}%`);
    }
    if (filters?.date_from) {
      query = query.gte('start_date', filters.date_from);
    }
    if (filters?.date_to) {
      query = query.lte('end_date', filters.date_to);
    }

    const { data, error } = await query.order('start_date', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch events: ${error.message}`);
    }

    return data || [];
  }

  static async getEvent(id: string): Promise<EventWithRelations> {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        sport:sports(*),
        venue:venues(*),
        tickets(*),
        hotel_rooms(*),
        circuit_transfers(*),
        airport_transfers(*),
        flights(*),
        lounge_passes(*),
        packages(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch event: ${error.message}`);
    }

    return data;
  }

  static async createEvent(event: EventInsert): Promise<Event> {
    const { data, error } = await supabase
      .from('events')
      .insert(event)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create event: ${error.message}`);
    }

    return data;
  }

  static async updateEvent(id: string, updates: EventUpdate): Promise<Event> {
    const { data, error } = await supabase
      .from('events')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update event: ${error.message}`);
    }

    return data;
  }

  static async deleteEvent(id: string): Promise<void> {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete event: ${error.message}`);
    }
  }

  // Sports
  static async getSports(): Promise<Sport[]> {
    const { data, error } = await supabase
      .from('sports')
      .select('*')
      .order('name');

    if (error) {
      throw new Error(`Failed to fetch sports: ${error.message}`);
    }

    return data || [];
  }

  static async createSport(sport: SportInsert): Promise<Sport> {
    const { data, error } = await supabase
      .from('sports')
      .insert(sport)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create sport: ${error.message}`);
    }

    return data;
  }

  static async updateSport(id: string, updates: SportUpdate): Promise<Sport> {
    const { data, error } = await supabase
      .from('sports')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(`Failed to update sport: ${error.message}`);
    return data;
  }

  static async deleteSport(id: string): Promise<void> {
    const { error } = await supabase
      .from('sports')
      .delete()
      .eq('id', id);
    if (error) throw new Error(`Failed to delete sport: ${error.message}`);
  }

  // Venues
  static async getVenues(): Promise<Venue[]> {
    const { data, error } = await supabase
      .from('venues')
      .select('*')
      .order('name');

    if (error) {
      throw new Error(`Failed to fetch venues: ${error.message}`);
    }

    return data || [];
  }

  static async createVenue(venue: VenueInsert): Promise<Venue> {
    const { data, error } = await supabase
      .from('venues')
      .insert(venue)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create venue: ${error.message}`);
    }

    return data;
  }

  static async updateVenue(id: string, updates: VenueUpdate): Promise<Venue> {
    const { data, error } = await supabase
      .from('venues')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(`Failed to update venue: ${error.message}`);
    return data;
  }

  // Tickets
  static async getTickets(filters?: TicketFilters): Promise<TicketWithEvent[]> {
    let query = supabase
      .from('tickets')
      .select(`
        *,
        event:events(*)
      `);

    if (filters?.event_id) {
      query = query.eq('event_id', filters.event_id);
    }
    if (filters?.ticket_category_id) {
      query = query.eq('ticket_category_id', filters.ticket_category_id);
    }
    if (filters?.delivery_method) {
      query = query.eq('delivery_method', filters.delivery_method);
    }
    if (filters?.ticket_type) {
      query = query.eq('ticket_type', filters.ticket_type);
    }
    if (filters?.refundable !== undefined) {
      query = query.eq('refundable', filters.refundable);
    }
    if (filters?.resellable !== undefined) {
      query = query.eq('resellable', filters.resellable);
    }
    if (filters?.ordered !== undefined) {
      query = query.eq('ordered', filters.ordered);
    }
    if (filters?.paid !== undefined) {
      query = query.eq('paid', filters.paid);
    }
    if (filters?.tickets_received !== undefined) {
      query = query.eq('tickets_received', filters.tickets_received);
    }
    if (filters?.quantity_available_min) {
      query = query.gte('quantity_available', filters.quantity_available_min);
    }
    if (filters?.quantity_available_max) {
      query = query.lte('quantity_available', filters.quantity_available_max);
    }
    if (filters?.price_min) {
      query = query.gte('price_with_markup', filters.price_min);
    }
    if (filters?.price_max) {
      query = query.lte('price_with_markup', filters.price_max);
    }
    if (filters?.currency) {
      query = query.eq('currency', filters.currency);
    }
    if (filters?.supplier) {
      query = query.eq('supplier', filters.supplier);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch tickets: ${error.message}`);
    }

    return data || [];
  }

  static async getTicket(id: string): Promise<TicketWithEvent> {
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        *,
        event:events(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch ticket: ${error.message}`);
    }

    return data;
  }

  static async createTicket(ticket: TicketInsert): Promise<Ticket> {
    const { data, error } = await supabase
      .from('tickets')
      .insert(ticket)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create ticket: ${error.message}`);
    }

    return data;
  }

  static async updateTicket(id: string, updates: TicketUpdate): Promise<Ticket> {
    const { data, error } = await supabase
      .from('tickets')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update ticket: ${error.message}`);
    }

    return data;
  }

  static async deleteTicket(id: string): Promise<void> {
    const { error } = await supabase
      .from('tickets')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete ticket: ${error.message}`);
    }
  }

  // Ticket Categories
  static async getTicketCategories(filters?: { venue_id?: string; search?: string }): Promise<TicketCategory[]> {
    let query = supabase
      .from('ticket_categories')
      .select('*');
    if (filters?.venue_id) {
      query = query.eq('venue_id', filters.venue_id);
    }
    if (filters?.search) {
      query = query.ilike('category_name', `%${filters.search}%`);
    }
    const { data, error } = await query.order('category_name');
    if (error) throw new Error(`Failed to fetch ticket categories: ${error.message}`);
    return data || [];
  }

  static async createTicketCategory(category: TicketCategoryInsert): Promise<TicketCategory> {
    const { data, error } = await supabase
      .from('ticket_categories')
      .insert(category)
      .select()
      .single();
    if (error) throw new Error(`Failed to create ticket category: ${error.message}`);
    return data;
  }

  static async updateTicketCategory(id: string, updates: TicketCategoryUpdate): Promise<TicketCategory> {
    const { data, error } = await supabase
      .from('ticket_categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(`Failed to update ticket category: ${error.message}`);
    return data;
  }

  static async deleteTicketCategory(id: string): Promise<void> {
    const { error } = await supabase
      .from('ticket_categories')
      .delete()
      .eq('id', id);
    if (error) throw new Error(`Failed to delete ticket category: ${error.message}`);
  }

  // Hotel Rooms
  static async getHotelRooms(filters?: HotelRoomFilters): Promise<HotelRoomWithEvent[]> {
    let query = supabase
      .from('hotel_rooms')
      .select(`
        *,
        event:events(*)
      `);

    if (filters?.event_id) {
      query = query.eq('event_id', filters.event_id);
    }
    if (filters?.room_type_id) {
      query = query.eq('room_type_id', filters.room_type_id);
    }
    if (filters?.check_in_from) {
      query = query.gte('check_in', filters.check_in_from);
    }
    if (filters?.check_in_to) {
      query = query.lte('check_in', filters.check_in_to);
    }
    if (filters?.check_out_from) {
      query = query.gte('check_out', filters.check_out_from);
    }
    if (filters?.check_out_to) {
      query = query.lte('check_out', filters.check_out_to);
    }
    if (filters?.contracted !== undefined) {
      query = query.eq('contracted', filters.contracted);
    }
    if (filters?.quantity_available_min) {
      query = query.gte('quantity_available', filters.quantity_available_min);
    }
    if (filters?.quantity_available_max) {
      query = query.lte('quantity_available', filters.quantity_available_max);
    }
    if (filters?.price_min) {
      query = query.gte('price_with_markup', filters.price_min);
    }
    if (filters?.price_max) {
      query = query.lte('price_with_markup', filters.price_max);
    }
    if (filters?.currency) {
      query = query.eq('currency', filters.currency);
    }
    if (filters?.supplier) {
      query = query.eq('supplier', filters.supplier);
    }

    const { data, error } = await query.order('check_in', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch hotel rooms: ${error.message}`);
    }

    return data || [];
  }

  static async getHotelRoom(id: string): Promise<HotelRoomWithEvent> {
    const { data, error } = await supabase
      .from('hotel_rooms')
      .select(`
        *,
        event:events(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch hotel room: ${error.message}`);
    }

    return data;
  }

  static async createHotelRoom(room: HotelRoomInsert): Promise<HotelRoom> {
    const { data, error } = await supabase
      .from('hotel_rooms')
      .insert(room)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create hotel room: ${error.message}`);
    }

    return data;
  }

  static async updateHotelRoom(id: string, updates: HotelRoomUpdate): Promise<HotelRoom> {
    const { data, error } = await supabase
      .from('hotel_rooms')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update hotel room: ${error.message}`);
    }

    return data;
  }

  static async deleteHotelRoom(id: string): Promise<void> {
    const { error } = await supabase
      .from('hotel_rooms')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete hotel room: ${error.message}`);
    }
  }

  // Circuit Transfers
  static async getCircuitTransfers(filters?: TransferFilters): Promise<CircuitTransferWithRelations[]> {
    let query = supabase
      .from('circuit_transfers')
      .select(`
        *,
        event:events(*)
      `);

    if (filters?.event_id) {
      query = query.eq('event_id', filters.event_id);
    }
    if (filters?.transfer_type) {
      query = query.eq('transfer_type', filters.transfer_type);
    }
    if (filters?.seat_capacity_min) {
      query = query.gte('seat_capacity', filters.seat_capacity_min);
    }
    if (filters?.seat_capacity_max) {
      query = query.lte('seat_capacity', filters.seat_capacity_max);
    }
    if (filters?.seats_available_min) {
      query = query.gte('seats_available', filters.seats_available_min);
    }
    if (filters?.seats_available_max) {
      query = query.lte('seats_available', filters.seats_available_max);
    }
    if (filters?.price_min) {
      query = query.gte('price_per_seat', filters.price_min);
    }
    if (filters?.price_max) {
      query = query.lte('price_per_seat', filters.price_max);
    }
    if (filters?.currency) {
      query = query.eq('currency', filters.currency);
    }
    if (filters?.supplier) {
      query = query.eq('supplier', filters.supplier);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch circuit transfers: ${error.message}`);
    }

    return data || [];
  }

  static async createCircuitTransfer(transfer: CircuitTransferInsert): Promise<CircuitTransfer> {
    const { data, error } = await supabase
      .from('circuit_transfers')
      .insert(transfer)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create circuit transfer: ${error.message}`);
    }

    return data;
  }

  static async updateCircuitTransfer(id: string, updates: CircuitTransferUpdate): Promise<CircuitTransfer> {
    const { data, error } = await supabase
      .from('circuit_transfers')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update circuit transfer: ${error.message}`);
    }

    return data;
  }

  static async deleteCircuitTransfer(id: string): Promise<void> {
    const { error } = await supabase
      .from('circuit_transfers')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete circuit transfer: ${error.message}`);
    }
  }

  // Airport Transfers
  static async getAirportTransfers(filters?: TransferFilters): Promise<AirportTransferWithRelations[]> {
    let query = supabase
      .from('airport_transfers')
      .select(`
        *,
        event:events(*)
      `);

    if (filters?.event_id) {
      query = query.eq('event_id', filters.event_id);
    }
    if (filters?.transfer_type) {
      query = query.eq('transfer_type', filters.transfer_type);
    }
    if (filters?.vehicle_type) {
      query = query.eq('vehicle_type', filters.vehicle_type);
    }
    if (filters?.seats_available_min) {
      query = query.gte('vehicles_available', filters.seats_available_min);
    }
    if (filters?.seats_available_max) {
      query = query.lte('vehicles_available', filters.seats_available_max);
    }
    if (filters?.price_min) {
      query = query.gte('client_price', filters.price_min);
    }
    if (filters?.price_max) {
      query = query.lte('client_price', filters.price_max);
    }
    if (filters?.currency) {
      query = query.eq('currency', filters.currency);
    }
    if (filters?.supplier) {
      query = query.eq('supplier', filters.supplier);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch airport transfers: ${error.message}`);
    }

    return data || [];
  }

  static async createAirportTransfer(transfer: AirportTransferInsert): Promise<AirportTransfer> {
    const { data, error } = await supabase
      .from('airport_transfers')
      .insert(transfer)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create airport transfer: ${error.message}`);
    }

    return data;
  }

  static async updateAirportTransfer(id: string, updates: AirportTransferUpdate): Promise<AirportTransfer> {
    const { data, error } = await supabase
      .from('airport_transfers')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update airport transfer: ${error.message}`);
    }

    return data;
  }

  static async deleteAirportTransfer(id: string): Promise<void> {
    const { error } = await supabase
      .from('airport_transfers')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete airport transfer: ${error.message}`);
    }
  }

  // Flights
  static async getFlights(filters?: FlightFilters): Promise<FlightWithEvent[]> {
    let query = supabase
      .from('flights')
      .select(`
        *,
        event:events(*)
      `);

    if (filters?.event_id) {
      query = query.eq('event_id', filters.event_id);
    }
    if (filters?.departure_airport_code) {
      query = query.eq('departure_airport_code', filters.departure_airport_code);
    }
    if (filters?.arrival_airport_code) {
      query = query.eq('arrival_airport_code', filters.arrival_airport_code);
    }
    if (filters?.airline) {
      query = query.eq('airline', filters.airline);
    }
    if (filters?.flight_class) {
      query = query.eq('flight_class', filters.flight_class);
    }
    if (filters?.stops_outbound !== undefined) {
      query = query.eq('stops_outbound', filters.stops_outbound);
    }
    if (filters?.stops_return !== undefined) {
      query = query.eq('stops_return', filters.stops_return);
    }
    if (filters?.price_min) {
      query = query.gte('price_gbp', filters.price_min);
    }
    if (filters?.price_max) {
      query = query.lte('price_gbp', filters.price_max);
    }
    if (filters?.supplier) {
      query = query.eq('supplier', filters.supplier);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch flights: ${error.message}`);
    }

    return data || [];
  }

  static async createFlight(flight: FlightInsert): Promise<Flight> {
    const { data, error } = await supabase
      .from('flights')
      .insert(flight)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create flight: ${error.message}`);
    }

    return data;
  }

  static async updateFlight(id: string, updates: FlightUpdate): Promise<Flight> {
    const { data, error } = await supabase
      .from('flights')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update flight: ${error.message}`);
    }

    return data;
  }

  static async deleteFlight(id: string): Promise<void> {
    const { error } = await supabase
      .from('flights')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete flight: ${error.message}`);
    }
  }

  // Lounge Passes
  static async getLoungePasses(filters?: LoungePassFilters): Promise<LoungePassWithEvent[]> {
    let query = supabase
      .from('lounge_passes')
      .select(`
        *,
        event:events(*)
      `);

    if (filters?.event_id) {
      query = query.eq('event_id', filters.event_id);
    }
    if (filters?.airport_code) {
      query = query.eq('airport_code', filters.airport_code);
    }
    if (filters?.terminal) {
      query = query.eq('terminal', filters.terminal);
    }
    if (filters?.capacity_min) {
      query = query.gte('capacity', filters.capacity_min);
    }
    if (filters?.capacity_max) {
      query = query.lte('capacity', filters.capacity_max);
    }
    if (filters?.price_min) {
      query = query.gte('price_gbp', filters.price_min);
    }
    if (filters?.price_max) {
      query = query.lte('price_gbp', filters.price_max);
    }
    if (filters?.supplier) {
      query = query.eq('supplier', filters.supplier);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch lounge passes: ${error.message}`);
    }

    return data || [];
  }

  static async createLoungePass(loungePass: LoungePassInsert): Promise<LoungePass> {
    const { data, error } = await supabase
      .from('lounge_passes')
      .insert(loungePass)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create lounge pass: ${error.message}`);
    }

    return data;
  }

  static async updateLoungePass(id: string, updates: LoungePassUpdate): Promise<LoungePass> {
    const { data, error } = await supabase
      .from('lounge_passes')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update lounge pass: ${error.message}`);
    }

    return data;
  }

  static async deleteLoungePass(id: string): Promise<void> {
    const { error } = await supabase
      .from('lounge_passes')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete lounge pass: ${error.message}`);
    }
  }

  // Packages
  static async getPackages(filters?: InventoryFilters): Promise<PackageWithRelations[]> {
    let query = supabase
      .from('packages')
      .select(`
        *,
        event:events(*),
        tiers:package_tiers(
          *,
          components:package_components(*)
        )
      `);

    if (filters?.event_id) {
      query = query.eq('event_id', filters.event_id);
    }
    if (filters?.active !== undefined) {
      query = query.eq('active', filters.active);
    }
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch packages: ${error.message}`);
    }

    return data || [];
  }

  static async createPackage(packageData: PackageInsert): Promise<Package> {
    const { data, error } = await supabase
      .from('packages')
      .insert(packageData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create package: ${error.message}`);
    }

    return data;
  }

  static async updatePackage(id: string, updates: PackageUpdate): Promise<Package> {
    const { data, error } = await supabase
      .from('packages')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update package: ${error.message}`);
    }

    return data;
  }

  static async deletePackage(id: string): Promise<void> {
    const { error } = await supabase
      .from('packages')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete package: ${error.message}`);
    }
  }

  // Package Tiers
  static async createPackageTier(tier: PackageTierInsert): Promise<PackageTier> {
    const { data, error } = await supabase
      .from('package_tiers')
      .insert(tier)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create package tier: ${error.message}`);
    }

    return data;
  }

  static async updatePackageTier(id: string, updates: PackageTierUpdate): Promise<PackageTier> {
    const { data, error } = await supabase
      .from('package_tiers')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update package tier: ${error.message}`);
    }

    return data;
  }

  static async deletePackageTier(id: string): Promise<void> {
    const { error } = await supabase
      .from('package_tiers')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete package tier: ${error.message}`);
    }
  }

  // Package Components
  static async createPackageComponent(component: PackageComponentInsert): Promise<PackageComponent> {
    const { data, error } = await supabase
      .from('package_components')
      .insert(component)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create package component: ${error.message}`);
    }

    return data;
  }

  static async updatePackageComponent(id: string, updates: PackageComponentUpdate): Promise<PackageComponent> {
    const { data, error } = await supabase
      .from('package_components')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update package component: ${error.message}`);
    }

    return data;
  }

  static async deletePackageComponent(id: string): Promise<void> {
    const { error } = await supabase
      .from('package_components')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete package component: ${error.message}`);
    }
  }

  // Bulk operations
  static async bulkUpdate(data: BulkUpdateData): Promise<void> {
    const { ids, updates } = data;
    
    // Determine table based on component type (this would need to be passed in the data)
    // For now, we'll assume it's tickets
    const { error } = await supabase
      .from('tickets')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .in('id', ids);

    if (error) {
      throw new Error(`Failed to bulk update: ${error.message}`);
    }
  }

  static async bulkDelete(data: BulkDeleteData): Promise<void> {
    const { ids, component_type } = data;
    
    let tableName: string;
    switch (component_type) {
      case 'ticket':
        tableName = 'tickets';
        break;
      case 'hotel_room':
        tableName = 'hotel_rooms';
        break;
      case 'circuit_transfer':
        tableName = 'circuit_transfers';
        break;
      case 'airport_transfer':
        tableName = 'airport_transfers';
        break;
      case 'flight':
        tableName = 'flights';
        break;
      case 'lounge_pass':
        tableName = 'lounge_passes';
        break;
      default:
        throw new Error(`Invalid component type: ${component_type}`);
    }

    const { error } = await supabase
      .from(tableName)
      .delete()
      .in('id', ids);

    if (error) {
      throw new Error(`Failed to bulk delete: ${error.message}`);
    }
  }

  // Inventory summary
  static async getInventorySummary(): Promise<InventorySummary> {
    // This would need to be implemented with a more complex query
    // For now, returning a placeholder
    return {
      total_items: 0,
      available_items: 0,
      low_stock_items: 0,
      provisional_items: 0,
      out_of_stock_items: 0,
      total_value: 0,
      currency: 'EUR'
    };
  }

  static async getComponentSummary(componentType: string): Promise<ComponentSummary> {
    // This would need to be implemented with a more complex query
    // For now, returning a placeholder
    return {
      component_type: componentType as any,
      count: 0,
      available: 0,
      low_stock: 0,
      provisional: 0,
      out_of_stock: 0,
      total_value: 0
    };
  }
} 