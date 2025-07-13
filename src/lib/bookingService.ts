import { supabase } from './supabase';
import { getCurrentUserTeamId, ensureUserHasTeam } from './teamUtils';

export interface BookingTraveler {
  firstName: string;
  lastName: string;
}

export interface LeadTraveler {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
}

export interface BookingPayment {
  paymentType: 'deposit' | 'second_payment' | 'final_payment' | 'additional';
  amount: number;
  dueDate: string;
  notes?: string;
}

export interface BookingComponent {
  componentType: 'ticket' | 'hotel_room' | 'circuit_transfer' | 'airport_transfer' | 'flight' | 'lounge_pass';
  componentId: string;
  componentName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  componentData: any;
  supplierName?: string;
  supplierRef?: string;
  bookingNotes?: string;
}

export interface CreateBookingData {
  quoteId: string;
  leadTraveler: LeadTraveler;
  guestTravelers: BookingTraveler[];
  adjustedPaymentSchedule?: BookingPayment[];
  bookingNotes?: string;
  internalNotes?: string;
  specialRequests?: string;
  depositPaid?: boolean;
  depositReference?: string;
  flights?: Array<{
    bookingRef?: string;
    ticketingDeadline?: string;
    flightStatus?: string;
    notes?: string;
  }>;
  loungePasses?: Array<{
    bookingRef: string;
    notes?: string;
  }>;
}

export interface Booking {
  id: string;
  quoteId: string;
  userId: string;
  teamId: string;
  clientId?: string;
  status: 'draft' | 'provisional' | 'pending_payment' | 'confirmed' | 'cancelled' | 'completed' | 'refunded';
  depositPaid: boolean;
  depositPaidAt?: string;
  depositAmount?: number;
  depositReference?: string;
  leadTravelerName: string;
  leadTravelerEmail?: string;
  leadTravelerPhone?: string;
  guestTravelers: any;
  eventId?: string;
  eventName?: string;
  eventLocation?: string;
  eventStartDate?: string;
  eventEndDate?: string;
  packageId?: string;
  packageName?: string;
  tierId?: string;
  tierName?: string;
  totalCost: number;
  currency: string;
  originalPaymentSchedule: any;
  adjustedPaymentSchedule: any;
  paymentTerms?: string;
  selectedComponents: any;
  componentAvailability: any;
  supplierRefs: any;
  bookingNotes?: string;
  internalNotes?: string;
  specialRequests?: string;
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  cancelledAt?: string;
}

export interface BookingDetails {
  booking: Booking;
  components: BookingComponent[];
  payments: BookingPayment[];
  travelers: BookingTraveler[];
  activities: any[];
}

export interface BookingStats {
  totalBookings: number;
  confirmedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  completedBookings: number;
  totalRevenue: number;
  averageBookingValue: number;
  thisMonthBookings: number;
  thisMonthRevenue: number;
}

export class BookingService {
  /**
   * Get all bookings for the current user's team
   */
  static async getUserBookings(): Promise<Booking[]> {
    try {
      const teamId = await getCurrentUserTeamId();
      if (!teamId) {
        throw new Error('User not part of a team');
      }

      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch bookings: ${error.message}`);
      }

      return bookings.map(booking => ({
        id: booking.id,
        quoteId: booking.quote_id,
        userId: booking.user_id,
        teamId: booking.team_id,
        clientId: booking.client_id,
        status: booking.status,
        depositPaid: booking.deposit_paid,
        depositPaidAt: booking.deposit_paid_at,
        depositAmount: booking.deposit_amount,
        depositReference: booking.deposit_reference,
        leadTravelerName: booking.lead_traveler_name,
        leadTravelerEmail: booking.lead_traveler_email,
        leadTravelerPhone: booking.lead_traveler_phone,
        guestTravelers: booking.guest_travelers,
        eventId: booking.event_id,
        eventName: booking.event_name,
        eventLocation: booking.event_location,
        eventStartDate: booking.event_start_date,
        eventEndDate: booking.event_end_date,
        packageId: booking.package_id,
        packageName: booking.package_name,
        tierId: booking.tier_id,
        tierName: booking.tier_name,
        totalCost: booking.total_cost,
        currency: booking.currency,
        originalPaymentSchedule: booking.original_payment_schedule,
        adjustedPaymentSchedule: booking.adjusted_payment_schedule,
        paymentTerms: booking.payment_terms,
        selectedComponents: booking.selected_components,
        componentAvailability: booking.component_availability,
        supplierRefs: booking.supplier_refs,
        bookingNotes: booking.booking_notes,
        internalNotes: booking.internal_notes,
        specialRequests: booking.special_requests,
        createdAt: booking.created_at,
        updatedAt: booking.updated_at,
        confirmedAt: booking.confirmed_at,
        cancelledAt: booking.cancelled_at,
      }));

    } catch (error) {
      console.error('Fetch bookings error:', error);
      throw error;
    }
  }

  /**
   * Get booking by quote ID
   */
  static async getBookingByQuoteId(quoteId: string): Promise<Booking | null> {
    try {
      const teamId = await getCurrentUserTeamId();
      if (!teamId) {
        throw new Error('User not part of a team');
      }

      const { data: booking, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('quote_id', quoteId)
        .eq('team_id', teamId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw new Error(`Failed to fetch booking: ${error.message}`);
      }

      if (!booking) {
        return null;
      }

      return {
        id: booking.id,
        quoteId: booking.quote_id,
        userId: booking.user_id,
        teamId: booking.team_id,
        clientId: booking.client_id,
        status: booking.status,
        depositPaid: booking.deposit_paid,
        depositPaidAt: booking.deposit_paid_at,
        depositAmount: booking.deposit_amount,
        depositReference: booking.deposit_reference,
        leadTravelerName: booking.lead_traveler_name,
        leadTravelerEmail: booking.lead_traveler_email,
        leadTravelerPhone: booking.lead_traveler_phone,
        guestTravelers: booking.guest_travelers,
        eventId: booking.event_id,
        eventName: booking.event_name,
        eventLocation: booking.event_location,
        eventStartDate: booking.event_start_date,
        eventEndDate: booking.event_end_date,
        packageId: booking.package_id,
        packageName: booking.package_name,
        tierId: booking.tier_id,
        tierName: booking.tier_name,
        totalCost: booking.total_cost,
        currency: booking.currency,
        originalPaymentSchedule: booking.original_payment_schedule,
        adjustedPaymentSchedule: booking.adjusted_payment_schedule,
        paymentTerms: booking.payment_terms,
        selectedComponents: booking.selected_components,
        componentAvailability: booking.component_availability,
        supplierRefs: booking.supplier_refs,
        bookingNotes: booking.booking_notes,
        internalNotes: booking.internal_notes,
        specialRequests: booking.special_requests,
        createdAt: booking.created_at,
        updatedAt: booking.updated_at,
        confirmedAt: booking.confirmed_at,
        cancelledAt: booking.cancelled_at,
      };

    } catch (error) {
      console.error('Get booking by quote ID error:', error);
      throw error;
    }
  }

  /**
   * Get a specific booking by ID
   */
  static async getBookingById(bookingId: string): Promise<Booking> {
    try {
      const teamId = await getCurrentUserTeamId();
      if (!teamId) {
        throw new Error('User not part of a team');
      }

      const { data: booking, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .eq('team_id', teamId)
        .single();

      if (error) {
        throw new Error(`Failed to fetch booking: ${error.message}`);
      }

      return {
        id: booking.id,
        quoteId: booking.quote_id,
        userId: booking.user_id,
        teamId: booking.team_id,
        clientId: booking.client_id,
        status: booking.status,
        depositPaid: booking.deposit_paid,
        depositPaidAt: booking.deposit_paid_at,
        depositAmount: booking.deposit_amount,
        depositReference: booking.deposit_reference,
        leadTravelerName: booking.lead_traveler_name,
        leadTravelerEmail: booking.lead_traveler_email,
        leadTravelerPhone: booking.lead_traveler_phone,
        guestTravelers: booking.guest_travelers,
        eventId: booking.event_id,
        eventName: booking.event_name,
        eventLocation: booking.event_location,
        eventStartDate: booking.event_start_date,
        eventEndDate: booking.event_end_date,
        packageId: booking.package_id,
        packageName: booking.package_name,
        tierId: booking.tier_id,
        tierName: booking.tier_name,
        totalCost: booking.total_cost,
        currency: booking.currency,
        originalPaymentSchedule: booking.original_payment_schedule,
        adjustedPaymentSchedule: booking.adjusted_payment_schedule,
        paymentTerms: booking.payment_terms,
        selectedComponents: booking.selected_components,
        componentAvailability: booking.component_availability,
        supplierRefs: booking.supplier_refs,
        bookingNotes: booking.booking_notes,
        internalNotes: booking.internal_notes,
        specialRequests: booking.special_requests,
        createdAt: booking.created_at,
        updatedAt: booking.updated_at,
        confirmedAt: booking.confirmed_at,
        cancelledAt: booking.cancelled_at,
      };

    } catch (error) {
      console.error('Fetch booking error:', error);
      throw error;
    }
  }

  /**
   * Get booking statistics for the current user's team
   */
  static async getBookingStats(): Promise<BookingStats> {
    try {
      const teamId = await getCurrentUserTeamId();
      if (!teamId) {
        throw new Error('User not part of a team');
      }

      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('team_id', teamId);

      if (error) {
        throw new Error(`Failed to fetch bookings for stats: ${error.message}`);
      }

      const totalBookings = bookings.length;
      const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
      const pendingBookings = bookings.filter(b => b.status === 'pending').length;
      const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;
      const completedBookings = bookings.filter(b => b.status === 'completed').length;

      const totalRevenue = bookings
        .filter(b => b.status === 'confirmed' || b.status === 'completed')
        .reduce((sum, b) => sum + b.total_cost, 0);

      const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

      const now = new Date();
      const thisMonthBookings = bookings.filter(b => {
        const date = new Date(b.created_at);
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      }).length;

      const thisMonthRevenue = bookings
        .filter(b => {
          const date = new Date(b.created_at);
          return date.getMonth() === now.getMonth() && 
                 date.getFullYear() === now.getFullYear() && 
                 (b.status === 'confirmed' || b.status === 'completed');
        })
        .reduce((sum, b) => sum + b.total_cost, 0);

      return {
        totalBookings,
        confirmedBookings,
        pendingBookings,
        cancelledBookings,
        completedBookings,
        totalRevenue,
        averageBookingValue,
        thisMonthBookings,
        thisMonthRevenue,
      };

    } catch (error) {
      console.error('Get booking stats error:', error);
      throw error;
    }
  }

  /**
   * Create a booking from a quote with all necessary validations
   */
  static async createBookingFromQuote(data: CreateBookingData): Promise<string> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Ensure user has a team
      await ensureUserHasTeam();
      const teamId = await getCurrentUserTeamId();

      // Get the quote first
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .select('*')
        .eq('id', data.quoteId)
        .eq('team_id', teamId)
        .single();

      if (quoteError || !quote) {
        throw new Error('Quote not found or access denied');
      }

      // Check if booking already exists for this quote
      const { data: existingBooking } = await supabase
        .from('bookings')
        .select('id')
        .eq('quote_id', data.quoteId)
        .single();

      if (existingBooking) {
        throw new Error('Booking already exists for this quote');
      }

      // Validate component availability
      const availabilityCheck = await this.checkComponentAvailability(quote);
      if (!availabilityCheck.allAvailable) {
        throw new Error(`Some components are no longer available: ${availabilityCheck.unavailableComponents.join(', ')}`);
      }

      // Prepare booking data
      const bookingData = {
        booking_reference: `B-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        quote_id: data.quoteId,
        user_id: user.id,
        team_id: teamId,
        client_id: quote.client_id,
        consultant_id: quote.consultant_id,
        event_id: quote.event_id,
        status: 'pending_payment',
        total_price: quote.total_price,
        currency: quote.currency,
        payment_schedule_snapshot: {
          original: {
          deposit: quote.payment_deposit,
          secondPayment: quote.payment_second_payment,
          finalPayment: quote.payment_final_payment,
          depositDate: quote.payment_deposit_date,
          secondPaymentDate: quote.payment_second_payment_date,
          finalPaymentDate: quote.payment_final_payment_date
        },
          adjusted: data.adjustedPaymentSchedule || {
          deposit: quote.payment_deposit,
          secondPayment: quote.payment_second_payment,
          finalPayment: quote.payment_final_payment,
          depositDate: quote.payment_deposit_date,
          secondPaymentDate: quote.payment_second_payment_date,
          finalPaymentDate: quote.payment_final_payment_date
          }
        },
        package_snapshot: {
          package_id: quote.package_id,
          package_name: quote.package_name,
          tier_id: quote.tier_id,
          tier_name: quote.tier_name,
        selected_components: quote.selected_components,
        component_availability: availabilityCheck.availability,
        booking_notes: data.bookingNotes,
        internal_notes: data.internalNotes,
        special_requests: data.specialRequests
        }
      };

      // Create the booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert(bookingData)
        .select()
        .single();

      if (bookingError) {
        throw new Error(`Failed to create booking: ${bookingError.message}`);
      }

      // Merge form data with quote components for flights and lounge passes
      console.log('🔍 DEBUG: Form data received:', {
        flights: data.flights,
        loungePasses: data.loungePasses,
        selectedComponents: quote.selected_components
      });
      
      const enhancedComponents = this.mergeFormDataWithComponents(quote.selected_components, data.flights, data.loungePasses);
      
      console.log('🔍 DEBUG: Enhanced components after merge:', enhancedComponents);

      // Create booking components
      console.log('Creating booking components:', enhancedComponents);
      await this.createBookingComponents(booking.id, enhancedComponents);

      // Create payment schedule
      await this.createPaymentSchedule(
        booking.id,
        data.adjustedPaymentSchedule || [
          {
            paymentType: 'deposit',
            amount: quote.payment_deposit,
            dueDate: quote.payment_deposit_date
          },
          {
            paymentType: 'second_payment',
            amount: quote.payment_second_payment,
            dueDate: quote.payment_second_payment_date
          },
          {
            paymentType: 'final_payment',
            amount: quote.payment_final_payment,
            dueDate: quote.payment_final_payment_date
          }
        ],
        data.depositPaid // <-- pass depositPaid
      );

      // Create traveler records
      await this.createTravelerRecords(booking.id, data.leadTraveler, data.guestTravelers);

      // Log the booking creation
      await this.logBookingActivity(booking.id, 'booking_created', 'Booking created from quote', user.id);

      // Update quote status to confirmed
      try {
      await supabase
        .from('quotes')
        .update({ 
          status: 'confirmed',
          confirmed_at: new Date().toISOString()
        })
        .eq('id', data.quoteId);
      } catch (quoteUpdateError) {
        console.error('Failed to update quote status:', quoteUpdateError);
        // Don't throw error - quote status update is optional
      }

      console.log('✅ Booking created successfully:', {
        bookingId: booking.id,
        quoteId: data.quoteId,
        leadTraveler: data.leadTraveler.firstName + ' ' + data.leadTraveler.lastName,
        totalCost: quote.total_price
      });

      return booking.id;

    } catch (error) {
      console.error('Create booking error:', error);
      throw error;
    }
  }

  /**
   * Merge form data with quote components to include booking references and other form data
   */
  static mergeFormDataWithComponents(
    selectedComponents: any,
    flights?: Array<{ bookingRef?: string; ticketingDeadline?: string; flightStatus?: string; notes?: string }>,
    loungePasses?: Array<{ bookingRef: string; notes?: string }>
  ): any {
    if (!selectedComponents) return selectedComponents;

    const enhanced = { ...selectedComponents };

    // Handle array format (new format)
    if (Array.isArray(selectedComponents)) {
      return selectedComponents.map((component, index) => {
        const enhancedComponent = { ...component };

        if (component.type === 'flight' && flights && flights[index]) {
          enhancedComponent.bookingRef = flights[index].bookingRef;
          enhancedComponent.ticketingDeadline = flights[index].ticketingDeadline;
          enhancedComponent.flightStatus = flights[index].flightStatus;
          enhancedComponent.notes = flights[index].notes;
        }

        if (component.type === 'lounge_pass' && loungePasses && loungePasses[index]) {
          enhancedComponent.bookingRef = loungePasses[index].bookingRef;
          enhancedComponent.notes = loungePasses[index].notes;
        }

        return enhancedComponent;
      });
    }

    // Handle object format (legacy support)
    if (selectedComponents.flights && flights) {
      enhanced.flights = selectedComponents.flights.map((flight: any, index: number) => ({
        ...flight,
        bookingRef: flights[index]?.bookingRef,
        ticketingDeadline: flights[index]?.ticketingDeadline,
        flightStatus: flights[index]?.flightStatus,
        notes: flights[index]?.notes,
      }));
    }

    if (selectedComponents.lounge_passes && loungePasses) {
      enhanced.lounge_passes = selectedComponents.lounge_passes.map((loungePass: any, index: number) => ({
        ...loungePass,
        bookingRef: loungePasses[index]?.bookingRef,
        notes: loungePasses[index]?.notes,
      }));
    }

    if (selectedComponents.loungePass && loungePasses && loungePasses.length > 0) {
      enhanced.loungePass = {
        ...selectedComponents.loungePass,
        bookingRef: loungePasses[0]?.bookingRef,
        notes: loungePasses[0]?.notes,
      };
    }

    return enhanced;
  }

  /**
   * Check availability for all components in a quote
   */
  static async checkComponentAvailability(quote: any): Promise<{
    allAvailable: boolean;
    availability: any;
    unavailableComponents: string[];
  }> {
    const availability: any = {};
    const unavailableComponents: string[] = [];
    let allAvailable = true;

    if (!quote.selected_components) {
      return { allAvailable: true, availability: {}, unavailableComponents: [] };
    }

    // Check tickets
    if (quote.selected_components.tickets) {
      for (const ticket of quote.selected_components.tickets) {
        const { data: ticketData } = await supabase
          .from('tickets')
          .select('quantity_available, ticket_category')
          .eq('id', ticket.id)
          .single();

        const available = ticketData?.quantity_available >= ticket.quantity;
        availability[`ticket_${ticket.id}`] = {
          available,
          requested: ticket.quantity,
          availableQuantity: ticketData?.quantity_available || 0,
          componentName: ticketData?.ticket_category?.category_name || 'Ticket'
        };

        if (!available) {
          allAvailable = false;
          unavailableComponents.push(`Tickets: ${ticketData?.ticket_category?.category_name || 'Unknown'} (requested: ${ticket.quantity}, available: ${ticketData?.quantity_available || 0})`);
        }
      }
    }

    // Check hotel rooms
    if (quote.selected_components.hotels) {
      for (const hotel of quote.selected_components.hotels) {
        const { data: roomData } = await supabase
          .from('hotel_rooms')
          .select('quantity_available, room_type_id')
          .eq('id', hotel.roomId)
          .single();

        const available = roomData?.quantity_available >= (hotel.quantity || 1);
        availability[`hotel_${hotel.roomId}`] = {
          available,
          requested: hotel.quantity || 1,
          availableQuantity: roomData?.quantity_available || 0,
          componentName: `Hotel Room: ${roomData?.room_type_id || 'Unknown'}`
        };

        if (!available) {
          allAvailable = false;
          unavailableComponents.push(`Hotel Rooms: ${roomData?.room_type_id || 'Unknown'} (requested: ${hotel.quantity || 1}, available: ${roomData?.quantity_available || 0})`);
        }
      }
    }

    // Check circuit transfers
    if (quote.selected_components.circuitTransfers) {
      for (const transfer of quote.selected_components.circuitTransfers) {
        const { data: transferData } = await supabase
          .from('circuit_transfers')
          .select('coach_capacity, used, transfer_type')
          .eq('id', transfer.id)
          .single();

        const available = (transferData?.coach_capacity || 0) - (transferData?.used || 0) >= transfer.quantity;
        availability[`transfer_${transfer.id}`] = {
          available,
          requested: transfer.quantity,
          availableQuantity: (transferData?.coach_capacity || 0) - (transferData?.used || 0),
          componentName: `Circuit Transfer: ${transferData?.transfer_type || 'Unknown'}`
        };

        if (!available) {
          allAvailable = false;
          unavailableComponents.push(`Circuit Transfers: ${transferData?.transfer_type || 'Unknown'} (requested: ${transfer.quantity}, available: ${(transferData?.coach_capacity || 0) - (transferData?.used || 0)})`);
        }
      }
    }

    // Check airport transfers
    if (quote.selected_components.airportTransfers) {
      for (const transfer of quote.selected_components.airportTransfers) {
        const { data: transferData } = await supabase
          .from('airport_transfers')
          .select('max_capacity, used, transport_type')
          .eq('id', transfer.id)
          .single();

        const available = (transferData?.max_capacity || 0) - (transferData?.used || 0) >= transfer.quantity;
        availability[`airport_transfer_${transfer.id}`] = {
          available,
          requested: transfer.quantity,
          availableQuantity: (transferData?.max_capacity || 0) - (transferData?.used || 0),
          componentName: `Airport Transfer: ${transferData?.transport_type || 'Unknown'}`
        };

        if (!available) {
          allAvailable = false;
          unavailableComponents.push(`Airport Transfers: ${transferData?.transport_type || 'Unknown'} (requested: ${transfer.quantity}, available: ${(transferData?.max_capacity || 0) - (transferData?.used || 0)})`);
        }
      }
    }

    // Check flights (assume available if active)
    if (quote.selected_components.flights) {
      for (const flight of quote.selected_components.flights) {
        const { data: flightData } = await supabase
          .from('flights')
          .select('active, outbound_flight_number')
          .eq('id', flight.id)
          .single();

        const available = flightData?.active || false;
        availability[`flight_${flight.id}`] = {
          available,
          requested: flight.passengers || 1,
          availableQuantity: available ? 999 : 0,
          componentName: `Flight: ${flightData?.outbound_flight_number || 'Unknown'}`
        };

        if (!available) {
          allAvailable = false;
          unavailableComponents.push(`Flights: ${flightData?.outbound_flight_number || 'Unknown'} (no longer available)`);
        }
      }
    }

    // Check lounge passes
    if (quote.selected_components.loungePass) {
      const { data: loungeData } = await supabase
        .from('lounge_passes')
        .select('is_active, variant')
        .eq('id', quote.selected_components.loungePass.id)
        .single();

      const available = loungeData?.is_active || false;
      availability[`lounge_pass_${quote.selected_components.loungePass.id}`] = {
        available,
        requested: quote.selected_components.loungePass.quantity || 1,
        availableQuantity: available ? 999 : 0,
        componentName: `Lounge Pass: ${loungeData?.variant || 'Unknown'}`
      };

      if (!available) {
        allAvailable = false;
        unavailableComponents.push(`Lounge Pass: ${loungeData?.variant || 'Unknown'} (no longer available)`);
      }
    }

    return { allAvailable, availability, unavailableComponents };
  }

  /**
   * Create booking components
   */
  static async createBookingComponents(bookingId: string, selectedComponents: any): Promise<void> {
    if (!selectedComponents) return;

    console.log('Processing selected components:', selectedComponents);

    // Handle array format (as shown in your quote data)
    if (Array.isArray(selectedComponents)) {
      const components: any[] = [];

      for (const component of selectedComponents) {
        console.log('Processing component:', component);

        // Validate UUID format for component_id
        const isValidUUID = (str: string) => {
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          return uuidRegex.test(str);
        };

        const componentData = {
          booking_id: bookingId,
          component_type: component.type,
          component_id: isValidUUID(component.id) ? component.id : null,
          component_name: component.name,
          quantity: component.quantity,
          unit_price: component.unitPrice || component.data?.price || 0,
          total_price: component.totalPrice || (component.unitPrice || component.data?.price || 0) * component.quantity,
          component_data: component.data || component,
          component_snapshot: component
        };

        console.log('Component data to insert:', componentData);

        // For flights, create only in bookings_flights table (not in booking_components)
        if (component.type === 'flight') {
          console.log('🔍 DEBUG: Processing flight component:', {
            component,
            bookingRef: component.bookingRef,
            dataBookingRef: component.data?.bookingRef,
            finalBookingRef: component.bookingRef || component.data?.bookingRef
          });
          
          try {
            const flightInsertData = {
              booking_id: bookingId,
              source_flight_id: isValidUUID(component.id) ? component.id : null,
              api_source: component.data?.source || 'manual',
              ticketing_deadline: component.ticketingDeadline || component.data?.ticketingDeadline,
              booking_pnr: component.bookingRef || component.data?.bookingRef,
              flight_status: component.flightStatus || 'Booked - Not Ticketed',
              flight_details: component.data || component,
              quantity: component.quantity,
              unit_price: component.unitPrice || component.data?.price || 0,
              total_price: component.totalPrice || (component.unitPrice || component.data?.price || 0) * component.quantity,
              currency: 'GBP',
              refundable: component.data?.refundable || false
            };
            
            console.log('🔍 DEBUG: Flight insert data:', flightInsertData);
            
            const { error: flightError } = await supabase
              .from('bookings_flights')
              .insert(flightInsertData);

            if (flightError) {
              console.error('Failed to create flight booking:', flightError);
            } else {
              console.log('Flight booking created successfully');
            }
          } catch (error) {
            console.error('Error creating flight booking:', error);
          }
          continue; // Skip adding to booking_components
        }

        // For lounge passes, create only in bookings_lounge_passes table (not in booking_components)
        if (component.type === 'lounge_pass') {
          console.log('🔍 DEBUG: Processing lounge pass component:', {
            component,
            bookingRef: component.bookingRef,
            dataBookingRef: component.data?.bookingRef,
            finalBookingRef: component.bookingRef || component.data?.bookingRef
          });
          
          try {
            const loungeInsertData = {
              booking_id: bookingId,
              lounge_pass_id: isValidUUID(component.id) ? component.id : null,
              booking_reference: component.bookingRef || component.data?.bookingRef,
              quantity: component.quantity,
              unit_price: component.unitPrice || component.data?.price || 0,
              total_price: component.totalPrice || (component.unitPrice || component.data?.price || 0) * component.quantity
            };
            
            console.log('🔍 DEBUG: Lounge pass insert data:', loungeInsertData);
            
            const { error: loungeError } = await supabase
              .from('bookings_lounge_passes')
              .insert(loungeInsertData);

            if (loungeError) {
              console.error('Failed to create lounge pass booking:', loungeError);
            } else {
              console.log('Lounge pass booking created successfully');
            }
          } catch (error) {
            console.error('Error creating lounge pass booking:', error);
          }
          continue; // Skip adding to booking_components
        }

        components.push(componentData);
      }

      // Insert all components into booking_components table
      if (components.length > 0) {
        console.log('Inserting components into booking_components:', components);
        const { error } = await supabase
          .from('booking_components')
          .insert(components);

        if (error) {
          console.error('Failed to create booking components:', error);
          throw new Error(`Failed to create booking components: ${error.message}`);
        } else {
          console.log('Booking components created successfully');
          
          // Reserve tickets after successfully creating booking components
          const ticketComponents = components.filter(c => c.component_type === 'ticket');
          if (ticketComponents.length > 0) {
            console.log('Reserving tickets for booking:', ticketComponents);
            await this.reserveTickets(bookingId, ticketComponents);
          }

          // Reserve hotel rooms after successfully creating booking components
          const hotelRoomComponents = components.filter(c => c.component_type === 'hotel_room');
          if (hotelRoomComponents.length > 0) {
            console.log('Reserving hotel rooms for booking:', hotelRoomComponents);
            await this.reserveHotelRooms(bookingId, hotelRoomComponents);
          }

          // Reserve circuit transfers after successfully creating booking components
          const circuitTransferComponents = components.filter(c => c.component_type === 'circuit_transfer');
          if (circuitTransferComponents.length > 0) {
            console.log('Reserving circuit transfers for booking:', circuitTransferComponents);
            await this.reserveCircuitTransfers(bookingId, circuitTransferComponents);
          }

          // Reserve airport transfers after successfully creating booking components
          const airportTransferComponents = components.filter(c => c.component_type === 'airport_transfer');
          if (airportTransferComponents.length > 0) {
            console.log('Reserving airport transfers for booking:', airportTransferComponents);
            await this.reserveAirportTransfers(bookingId, airportTransferComponents);
          }
        }
      }
    } else {
      // Handle object format (legacy support)
      console.log('Processing legacy object format components');
    const components: any[] = [];

    // Process tickets
    if (selectedComponents.tickets) {
      for (const ticket of selectedComponents.tickets) {
        const { data: ticketData } = await supabase
          .from('tickets')
          .select('*, ticket_category(*)')
          .eq('id', ticket.id)
          .single();

        components.push({
          booking_id: bookingId,
          component_type: 'ticket',
          component_id: ticket.id,
          component_name: ticketData?.ticket_category?.category_name || 'Ticket',
          quantity: ticket.quantity,
          unit_price: ticket.price,
          total_price: ticket.price * ticket.quantity,
          component_data: { ...ticket, ticketData }
        });
      }
    }

    // Process hotels
    if (selectedComponents.hotels) {
      for (const hotel of selectedComponents.hotels) {
        const { data: roomData } = await supabase
          .from('hotel_rooms')
          .select('*, gpgt_hotels(*)')
          .eq('id', hotel.roomId)
          .single();

        components.push({
          booking_id: bookingId,
          component_type: 'hotel_room',
          component_id: hotel.roomId,
          component_name: `${roomData?.gpgt_hotels?.name || 'Hotel'} - ${roomData?.room_type_id || 'Room'}`,
          quantity: hotel.quantity || 1,
          unit_price: hotel.price || 0,
          total_price: (hotel.price || 0) * (hotel.quantity || 1),
          component_data: { ...hotel, roomData }
        });
      }
    }

      // Process circuit transfers
      if (selectedComponents.circuitTransfers) {
        for (const transfer of selectedComponents.circuitTransfers) {
          const { data: transferData } = await supabase
            .from('circuit_transfers')
            .select('*')
            .eq('id', transfer.id)
            .single();

          components.push({
            booking_id: bookingId,
            component_type: 'circuit_transfer',
            component_id: transfer.id,
            component_name: `Circuit Transfer - ${transferData?.transfer_type || 'Transfer'}`,
            quantity: transfer.quantity || 1,
            unit_price: transfer.price || 0,
            total_price: (transfer.price || 0) * (transfer.quantity || 1),
            component_data: { ...transfer, transferData }
          });
        }
      }

      // Process airport transfers
      if (selectedComponents.airportTransfers) {
        for (const transfer of selectedComponents.airportTransfers) {
          const { data: transferData } = await supabase
            .from('airport_transfers')
            .select('*')
            .eq('id', transfer.id)
            .single();

          components.push({
            booking_id: bookingId,
            component_type: 'airport_transfer',
            component_id: transfer.id,
            component_name: `Airport Transfer - ${transferData?.transport_type || 'Transfer'}`,
            quantity: transfer.quantity || 1,
            unit_price: transfer.price || 0,
            total_price: (transfer.price || 0) * (transfer.quantity || 1),
            component_data: { ...transfer, transferData }
          });
        }
      }

      // Process flights
      if (selectedComponents.flights) {
        for (const flight of selectedComponents.flights) {
          try {
            const { error: flightError } = await supabase
              .from('bookings_flights')
              .insert({
                booking_id: bookingId,
                source_flight_id: flight.id,
                api_source: flight.source || 'manual',
                ticketing_deadline: flight.ticketingDeadline,
                booking_pnr: flight.bookingRef,
                flight_status: flight.flightStatus || 'Booked - Not Ticketed',
                flight_details: flight,
                quantity: flight.passengers || 1,
                unit_price: flight.price || 0,
                total_price: (flight.price || 0) * (flight.passengers || 1),
                currency: 'GBP',
                refundable: flight.refundable || false
              });

            if (flightError) {
              console.error('Failed to create flight booking:', flightError);
            } else {
              console.log('Flight booking created successfully');
            }
          } catch (error) {
            console.error('Error creating flight booking:', error);
          }
        }
      }

      // Process lounge passes
      if (selectedComponents.loungePass) {
        try {
          const { error: loungeError } = await supabase
            .from('bookings_lounge_passes')
            .insert({
              booking_id: bookingId,
              lounge_pass_id: selectedComponents.loungePass.id,
              booking_reference: selectedComponents.loungePass.bookingRef,
              quantity: selectedComponents.loungePass.quantity || 1,
              unit_price: selectedComponents.loungePass.price || 0,
              total_price: (selectedComponents.loungePass.price || 0) * (selectedComponents.loungePass.quantity || 1)
            });

          if (loungeError) {
            console.error('Failed to create lounge pass booking:', loungeError);
          } else {
            console.log('Lounge pass booking created successfully');
          }
        } catch (error) {
          console.error('Error creating lounge pass booking:', error);
        }
      }

      // Insert all components into booking_components table
    if (components.length > 0) {
      const { error } = await supabase
        .from('booking_components')
        .insert(components);

      if (error) {
        throw new Error(`Failed to create booking components: ${error.message}`);
        } else {
          // Reserve tickets after successfully creating booking components
          const ticketComponents = components.filter(c => c.component_type === 'ticket');
          if (ticketComponents.length > 0) {
            console.log('Reserving tickets for booking (object format):', ticketComponents);
            await this.reserveTickets(bookingId, ticketComponents);
          }

          // Reserve hotel rooms after successfully creating booking components
          const hotelRoomComponents = components.filter(c => c.component_type === 'hotel_room');
          if (hotelRoomComponents.length > 0) {
            console.log('Reserving hotel rooms for booking (object format):', hotelRoomComponents);
            await this.reserveHotelRooms(bookingId, hotelRoomComponents);
          }

          // Reserve circuit transfers after successfully creating booking components
          const circuitTransferComponents = components.filter(c => c.component_type === 'circuit_transfer');
          if (circuitTransferComponents.length > 0) {
            console.log('Reserving circuit transfers for booking (object format):', circuitTransferComponents);
            await this.reserveCircuitTransfers(bookingId, circuitTransferComponents);
          }

          // Reserve airport transfers after successfully creating booking components
          const airportTransferComponents = components.filter(c => c.component_type === 'airport_transfer');
          if (airportTransferComponents.length > 0) {
            console.log('Reserving airport transfers for booking (object format):', airportTransferComponents);
            await this.reserveAirportTransfers(bookingId, airportTransferComponents);
          }
        }
      }
    }
  }

  /**
   * Reserve tickets for a booking (update quantity_reserved in tickets table)
   */
  static async reserveTickets(bookingId: string, ticketComponents: any[]): Promise<void> {
    for (const ticketComponent of ticketComponents) {
      if (ticketComponent.component_type === 'ticket' && ticketComponent.component_id) {
        try {
          // Get current ticket data
          const { data: ticketData, error: fetchError } = await supabase
            .from('tickets')
            .select('quantity_reserved, quantity_total, quantity_available')
            .eq('id', ticketComponent.component_id)
            .single();

          if (fetchError) {
            console.error('Failed to fetch ticket data:', fetchError);
            continue;
          }

          const newReservedQuantity = (ticketData.quantity_reserved || 0) + ticketComponent.quantity;
          
          // Check if we have enough available tickets
          if (newReservedQuantity > ticketData.quantity_total) {
            throw new Error(`Cannot reserve ${ticketComponent.quantity} tickets. Only ${ticketData.quantity_available} available.`);
          }

          // Update the reserved quantity
          const { error: updateError } = await supabase
            .from('tickets')
            .update({ 
              quantity_reserved: newReservedQuantity,
              updated_at: new Date().toISOString()
            })
            .eq('id', ticketComponent.component_id);

          if (updateError) {
            console.error('Failed to update ticket reservation:', updateError);
            throw new Error(`Failed to reserve tickets: ${updateError.message}`);
          }

          console.log(`✅ Reserved ${ticketComponent.quantity} tickets for booking ${bookingId}. New reserved total: ${newReservedQuantity}`);
          
        } catch (error) {
          console.error('Error reserving tickets:', error);
          throw error;
        }
      }
    }
  }

  /**
   * Reserve hotel rooms for a booking (update quantity_reserved in hotel_rooms table)
   */
  static async reserveHotelRooms(bookingId: string, hotelRoomComponents: any[]): Promise<void> {
    for (const roomComponent of hotelRoomComponents) {
      if (roomComponent.component_type === 'hotel_room' && roomComponent.component_id) {
        try {
          // Get current hotel room data
          const { data: roomData, error: fetchError } = await supabase
            .from('hotel_rooms')
            .select('quantity_reserved, quantity_total, quantity_available')
            .eq('id', roomComponent.component_id)
            .single();

          if (fetchError) {
            console.error('Failed to fetch hotel room data:', fetchError);
            continue;
          }

          const newReservedQuantity = (roomData.quantity_reserved || 0) + roomComponent.quantity;
          
          // Check if we have enough available rooms
          if (newReservedQuantity > roomData.quantity_total) {
            throw new Error(`Cannot reserve ${roomComponent.quantity} hotel rooms. Only ${roomData.quantity_available} available.`);
          }

          // Update the reserved quantity
          const { error: updateError } = await supabase
            .from('hotel_rooms')
            .update({ 
              quantity_reserved: newReservedQuantity,
              updated_at: new Date().toISOString()
            })
            .eq('id', roomComponent.component_id);

          if (updateError) {
            console.error('Failed to update hotel room reservation:', updateError);
            throw new Error(`Failed to reserve hotel rooms: ${updateError.message}`);
          }

          console.log(`✅ Reserved ${roomComponent.quantity} hotel rooms for booking ${bookingId}. New reserved total: ${newReservedQuantity}`);
          
        } catch (error) {
          console.error('Error reserving hotel rooms:', error);
          throw error;
        }
      }
    }
  }

  /**
   * Reserve circuit transfers for a booking (update used field in circuit_transfers table)
   */
  static async reserveCircuitTransfers(bookingId: string, circuitTransferComponents: any[]): Promise<void> {
    for (const transferComponent of circuitTransferComponents) {
      if (transferComponent.component_type === 'circuit_transfer' && transferComponent.component_id) {
        try {
          // Get current circuit transfer data
          const { data: transferData, error: fetchError } = await supabase
            .from('circuit_transfers')
            .select('used, coach_capacity, coaches_required')
            .eq('id', transferComponent.component_id)
            .single();

          if (fetchError) {
            console.error('Failed to fetch circuit transfer data:', fetchError);
            continue;
          }

          const newUsedQuantity = (transferData.used || 0) + transferComponent.quantity;
          const maxCapacity = transferData.coach_capacity * (transferData.coaches_required || 1);
          
          // Check if we have enough available capacity
          if (newUsedQuantity > maxCapacity) {
            throw new Error(`Cannot reserve ${transferComponent.quantity} circuit transfer seats. Only ${maxCapacity - (transferData.used || 0)} available.`);
          }

          // Update the used quantity
          const { error: updateError } = await supabase
            .from('circuit_transfers')
            .update({ 
              used: newUsedQuantity,
              updated_at: new Date().toISOString()
            })
            .eq('id', transferComponent.component_id);

          if (updateError) {
            console.error('Failed to update circuit transfer reservation:', updateError);
            throw new Error(`Failed to reserve circuit transfers: ${updateError.message}`);
          }

          console.log(`✅ Reserved ${transferComponent.quantity} circuit transfer seats for booking ${bookingId}. New used total: ${newUsedQuantity}`);
          
        } catch (error) {
          console.error('Error reserving circuit transfers:', error);
          throw error;
        }
      }
    }
  }

  /**
   * Reserve airport transfers for a booking (update used field in airport_transfers table)
   */
  static async reserveAirportTransfers(bookingId: string, airportTransferComponents: any[]): Promise<void> {
    for (const transferComponent of airportTransferComponents) {
      if (transferComponent.component_type === 'airport_transfer' && transferComponent.component_id) {
        try {
          // Get current airport transfer data
          const { data: transferData, error: fetchError } = await supabase
            .from('airport_transfers')
            .select('used, max_capacity')
            .eq('id', transferComponent.component_id)
            .single();

          if (fetchError) {
            console.error('Failed to fetch airport transfer data:', fetchError);
            continue;
          }

          const newUsedQuantity = (transferData.used || 0) + transferComponent.quantity;
          
          // Check if we have enough available capacity
          if (newUsedQuantity > transferData.max_capacity) {
            throw new Error(`Cannot reserve ${transferComponent.quantity} airport transfer seats. Only ${transferData.max_capacity - (transferData.used || 0)} available.`);
          }

          // Update the used quantity
          const { error: updateError } = await supabase
            .from('airport_transfers')
            .update({ 
              used: newUsedQuantity,
              updated_at: new Date().toISOString()
            })
            .eq('id', transferComponent.component_id);

          if (updateError) {
            console.error('Failed to update airport transfer reservation:', updateError);
            throw new Error(`Failed to reserve airport transfers: ${updateError.message}`);
          }

          console.log(`✅ Reserved ${transferComponent.quantity} airport transfer seats for booking ${bookingId}. New used total: ${newUsedQuantity}`);
          
        } catch (error) {
          console.error('Error reserving airport transfers:', error);
          throw error;
        }
      }
    }
  }

  /**
   * Release airport transfers when booking is cancelled (decrease used field)
   */
  static async releaseAirportTransfers(bookingId: string): Promise<void> {
    try {
      // Get all airport transfer components for this booking
      const { data: transferComponents, error: fetchError } = await supabase
        .from('booking_components')
        .select('component_id, quantity')
        .eq('booking_id', bookingId)
        .eq('component_type', 'airport_transfer');

      if (fetchError) {
        console.error('Failed to fetch airport transfer components:', fetchError);
        return;
      }

      for (const transferComponent of transferComponents || []) {
        if (transferComponent.component_id) {
          // Get current airport transfer data
          const { data: transferData, error: transferFetchError } = await supabase
            .from('airport_transfers')
            .select('used')
            .eq('id', transferComponent.component_id)
            .single();

          if (transferFetchError) {
            console.error('Failed to fetch airport transfer data for release:', transferFetchError);
            continue;
          }

          const newUsedQuantity = Math.max(0, (transferData.used || 0) - transferComponent.quantity);

          // Update the used quantity
          const { error: updateError } = await supabase
            .from('airport_transfers')
            .update({ 
              used: newUsedQuantity,
              updated_at: new Date().toISOString()
            })
            .eq('id', transferComponent.component_id);

          if (updateError) {
            console.error('Failed to release airport transfer reservation:', updateError);
          } else {
            console.log(`✅ Released ${transferComponent.quantity} airport transfer seats from booking ${bookingId}. New used total: ${newUsedQuantity}`);
          }
        }
      }
    } catch (error) {
      console.error('Error releasing airport transfers:', error);
    }
  }

  /**
   * Release circuit transfers when booking is cancelled (decrease used field)
   */
  static async releaseCircuitTransfers(bookingId: string): Promise<void> {
    try {
      // Get all circuit transfer components for this booking
      const { data: transferComponents, error: fetchError } = await supabase
        .from('booking_components')
        .select('component_id, quantity')
        .eq('booking_id', bookingId)
        .eq('component_type', 'circuit_transfer');

      if (fetchError) {
        console.error('Failed to fetch circuit transfer components:', fetchError);
        return;
      }

      for (const transferComponent of transferComponents || []) {
        if (transferComponent.component_id) {
          // Get current circuit transfer data
          const { data: transferData, error: transferFetchError } = await supabase
            .from('circuit_transfers')
            .select('used')
            .eq('id', transferComponent.component_id)
            .single();

          if (transferFetchError) {
            console.error('Failed to fetch circuit transfer data for release:', transferFetchError);
            continue;
          }

          const newUsedQuantity = Math.max(0, (transferData.used || 0) - transferComponent.quantity);

          // Update the used quantity
          const { error: updateError } = await supabase
            .from('circuit_transfers')
            .update({ 
              used: newUsedQuantity,
              updated_at: new Date().toISOString()
            })
            .eq('id', transferComponent.component_id);

          if (updateError) {
            console.error('Failed to release circuit transfer reservation:', updateError);
          } else {
            console.log(`✅ Released ${transferComponent.quantity} circuit transfer seats from booking ${bookingId}. New used total: ${newUsedQuantity}`);
          }
        }
      }
    } catch (error) {
      console.error('Error releasing circuit transfers:', error);
    }
  }

  /**
   * Release hotel rooms when booking is cancelled (decrease quantity_reserved)
   */
  static async releaseHotelRooms(bookingId: string): Promise<void> {
    try {
      // Get all hotel room components for this booking
      const { data: roomComponents, error: fetchError } = await supabase
        .from('booking_components')
        .select('component_id, quantity')
        .eq('booking_id', bookingId)
        .eq('component_type', 'hotel_room');

      if (fetchError) {
        console.error('Failed to fetch hotel room components:', fetchError);
        return;
      }

      for (const roomComponent of roomComponents || []) {
        if (roomComponent.component_id) {
          // Get current hotel room data
          const { data: roomData, error: roomFetchError } = await supabase
            .from('hotel_rooms')
            .select('quantity_reserved')
            .eq('id', roomComponent.component_id)
            .single();

          if (roomFetchError) {
            console.error('Failed to fetch hotel room data for release:', roomFetchError);
            continue;
          }

          const newReservedQuantity = Math.max(0, (roomData.quantity_reserved || 0) - roomComponent.quantity);

          // Update the reserved quantity
          const { error: updateError } = await supabase
            .from('hotel_rooms')
            .update({ 
              quantity_reserved: newReservedQuantity,
              updated_at: new Date().toISOString()
            })
            .eq('id', roomComponent.component_id);

          if (updateError) {
            console.error('Failed to release hotel room reservation:', updateError);
          } else {
            console.log(`✅ Released ${roomComponent.quantity} hotel rooms from booking ${bookingId}. New reserved total: ${newReservedQuantity}`);
          }
        }
      }
    } catch (error) {
      console.error('Error releasing hotel rooms:', error);
    }
  }

  /**
   * Release tickets when booking is cancelled (decrease quantity_reserved)
   */
  static async releaseTickets(bookingId: string): Promise<void> {
    try {
      // Get all ticket components for this booking
      const { data: ticketComponents, error: fetchError } = await supabase
        .from('booking_components')
        .select('component_id, quantity')
        .eq('booking_id', bookingId)
        .eq('component_type', 'ticket');

      if (fetchError) {
        console.error('Failed to fetch ticket components:', fetchError);
        return;
      }

      for (const ticketComponent of ticketComponents || []) {
        if (ticketComponent.component_id) {
          // Get current ticket data
          const { data: ticketData, error: ticketFetchError } = await supabase
            .from('tickets')
            .select('quantity_reserved')
            .eq('id', ticketComponent.component_id)
            .single();

          if (ticketFetchError) {
            console.error('Failed to fetch ticket data for release:', ticketFetchError);
            continue;
          }

          const newReservedQuantity = Math.max(0, (ticketData.quantity_reserved || 0) - ticketComponent.quantity);

          // Update the reserved quantity
          const { error: updateError } = await supabase
            .from('tickets')
            .update({ 
              quantity_reserved: newReservedQuantity,
              updated_at: new Date().toISOString()
            })
            .eq('id', ticketComponent.component_id);

          if (updateError) {
            console.error('Failed to release ticket reservation:', updateError);
          } else {
            console.log(`✅ Released ${ticketComponent.quantity} tickets from booking ${bookingId}. New reserved total: ${newReservedQuantity}`);
          }
        }
      }
    } catch (error) {
      console.error('Error releasing tickets:', error);
    }
  }

  /**
   * Create payment schedule
   */
  static async createPaymentSchedule(bookingId: string, payments: BookingPayment[], depositPaid?: boolean): Promise<void> {
    const paymentRecords = payments.map((payment, index) => {
      const isDeposit = payment.paymentType === 'deposit';
      const record: any = {
        booking_id: bookingId,
        payment_type: payment.paymentType,
        payment_number: index + 1,
        amount: payment.amount,
        due_date: payment.dueDate,
        notes: payment.notes
      };
      if (isDeposit && depositPaid) {
        record.paid = true;
        record.paid_at = new Date().toISOString();
      }
      return record;
    });

    const { error } = await supabase
      .from('booking_payments')
      .insert(paymentRecords);

    if (error) {
      throw new Error(`Failed to create payment schedule: ${error.message}`);
    }
  }

  /**
   * Create traveler records for a booking
   */
  static async createTravelerRecords(bookingId: string, leadTraveler: LeadTraveler, guestTravelers: BookingTraveler[]): Promise<void> {
    // First create the lead traveler
    const { data: leadTravelerData, error: leadError } = await supabase
      .from('booking_travelers')
      .insert({
        booking_id: bookingId,
        traveler_type: 'lead',
        first_name: leadTraveler.firstName,
        last_name: leadTraveler.lastName,
        email: leadTraveler.email,
        phone: leadTraveler.phone
      })
      .select()
      .single();

    if (leadError) {
      throw new Error(`Failed to create lead traveler: ${leadError.message}`);
    }

    // Update the booking with the lead traveler ID
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ lead_traveler_id: leadTravelerData.id })
      .eq('id', bookingId);

    if (updateError) {
      throw new Error(`Failed to update booking with lead traveler: ${updateError.message}`);
    }

    // Create guest travelers if any
    if (guestTravelers.length > 0) {
      const guestTravelerRecords = guestTravelers.map((traveler) => ({
        booking_id: bookingId,
        traveler_type: 'guest',
        first_name: traveler.firstName,
        last_name: traveler.lastName
      }));

      const { error: guestError } = await supabase
      .from('booking_travelers')
        .insert(guestTravelerRecords);

      if (guestError) {
        throw new Error(`Failed to create guest traveler records: ${guestError.message}`);
      }
    }
  }

  /**
   * Log booking activity
   */
  static async logBookingActivity(bookingId: string, activityType: string, description: string, performedBy: string): Promise<void> {
    try {
    const { error } = await supabase
      .from('booking_activity_log')
      .insert({
        booking_id: bookingId,
        activity_type: activityType,
        activity_description: description,
        performed_by: performedBy
      });

    if (error) {
      console.error('Failed to log booking activity:', error);
        // Don't throw error - activity logging is optional
      }
    } catch (error) {
      console.error('Error logging booking activity:', error);
      // Don't throw error - activity logging is optional
    }
  }

  /**
   * Get booking details
   */
  static async getBookingDetails(bookingId: string): Promise<BookingDetails> {
    try {
      const teamId = await getCurrentUserTeamId();
      if (!teamId) {
        throw new Error('User not part of a team');
      }

      // Get booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .eq('team_id', teamId)
        .single();

      if (bookingError || !booking) {
        throw new Error('Booking not found or access denied');
      }

      // Get components
      const { data: components } = await supabase
        .from('booking_components')
        .select('*')
        .eq('booking_id', bookingId);

      // Get payments
      const { data: payments } = await supabase
        .from('booking_payments')
        .select('*')
        .eq('booking_id', bookingId)
        .order('payment_number');

      // Get travelers
      const { data: travelers } = await supabase
        .from('booking_travelers')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at');

      // Get activities
      const { data: activities } = await supabase
        .from('booking_activity_log')
        .select('*')
        .eq('booking_id', bookingId)
        .order('performed_at', { ascending: false });

      return {
        booking,
        components: components || [],
        payments: payments || [],
        travelers: travelers || [],
        activities: activities || []
      };

    } catch (error) {
      console.error('Get booking details error:', error);
      throw error;
    }
  }

  /**
   * Get team bookings
   */
  static async getTeamBookings(
    status?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ bookings: Booking[]; total: number }> {
    try {
      const teamId = await getCurrentUserTeamId();
      if (!teamId) {
        throw new Error('User not part of a team');
      }

      let query = supabase
        .from('bookings')
        .select('*', { count: 'exact' })
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data: bookings, error, count } = await query
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(`Failed to fetch bookings: ${error.message}`);
      }

      return {
        bookings: bookings || [],
        total: count || 0
      };

    } catch (error) {
      console.error('Get team bookings error:', error);
      throw error;
    }
  }

  /**
   * Update booking status
   */
  static async updateBookingStatus(bookingId: string, status: Booking['status'], notes?: string): Promise<void> {
    try {
      const teamId = await getCurrentUserTeamId();
      if (!teamId) {
        throw new Error('User not part of a team');
      }

      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      // Set specific timestamps based on status
      switch (status) {
        case 'confirmed':
          updateData.confirmed_at = new Date().toISOString();
          break;
        case 'cancelled':
          updateData.cancelled_at = new Date().toISOString();
          // Release tickets, hotel rooms, circuit transfers, and airport transfers when booking is cancelled
          await this.releaseTickets(bookingId);
          await this.releaseHotelRooms(bookingId);
          await this.releaseCircuitTransfers(bookingId);
          await this.releaseAirportTransfers(bookingId);
          break;
      }

      const { error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId)
        .eq('team_id', teamId);

      if (error) {
        throw new Error(`Failed to update booking status: ${error.message}`);
      }

      // Log the status change
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await this.logBookingActivity(
          bookingId,
          'status_updated',
          `Booking status updated to ${status}${notes ? `: ${notes}` : ''}`,
          user.id
        );
      }

    } catch (error) {
      console.error('Update booking status error:', error);
      throw error;
    }
  }

  /**
   * Delete a booking and release all reserved inventory
   */
  static async deleteBooking(bookingId: string): Promise<void> {
    try {
      console.log(`🗑️ Starting deletion process for booking ${bookingId}`);
      
      // First, release all reserved inventory
      console.log('📦 Releasing reserved inventory...');
      
      // Release tickets
      await this.releaseTickets(bookingId);
      
      // Release hotel rooms
      await this.releaseHotelRooms(bookingId);
      
      // Release circuit transfers
      await this.releaseCircuitTransfers(bookingId);
      
      // Release airport transfers
      await this.releaseAirportTransfers(bookingId);
      
      console.log('✅ All inventory released successfully');
      
      // Now delete the booking and all related records
      console.log('🗑️ Deleting booking records...');
      
      // First, clear the lead_traveler_id reference to avoid foreign key constraint violation
      console.log('🔗 Clearing lead_traveler_id reference...');
      const { error: clearError } = await supabase
        .from('bookings')
        .update({ lead_traveler_id: null })
        .eq('id', bookingId);
      
      if (clearError) {
        console.error('Error clearing lead_traveler_id:', clearError);
        throw new Error(`Failed to clear lead_traveler_id reference: ${clearError.message}`);
      }
      
      // Delete in the correct order to respect foreign key constraints
      const deleteOperations = [
        // Delete booking components first
        supabase.from('booking_components').delete().eq('booking_id', bookingId),
        // Delete booking payments
        supabase.from('booking_payments').delete().eq('booking_id', bookingId),
        // Delete booking travelers (now safe since lead_traveler_id is cleared)
        supabase.from('booking_travelers').delete().eq('booking_id', bookingId),
        // Delete booking flights
        supabase.from('bookings_flights').delete().eq('booking_id', bookingId),
        // Delete booking lounge passes
        supabase.from('bookings_lounge_passes').delete().eq('booking_id', bookingId),
        // Finally delete the booking itself
        supabase.from('bookings').delete().eq('id', bookingId)
      ];
      
      // Execute all delete operations
      for (const operation of deleteOperations) {
        const { error } = await operation;
        if (error) {
          console.error('Error during deletion:', error);
          throw new Error(`Failed to delete booking records: ${error.message}`);
        }
      }
      
      console.log(`✅ Booking ${bookingId} deleted successfully with all related records`);
      
    } catch (error) {
      console.error('Error deleting booking:', error);
      throw error;
    }
  }

  /**
   * Mark deposit as paid
   */
  static async markDepositPaid(bookingId: string, reference?: string): Promise<void> {
    try {
      const teamId = await getCurrentUserTeamId();
      if (!teamId) {
        throw new Error('User not part of a team');
      }

      const { error } = await supabase
        .from('bookings')
        .update({
          deposit_paid: true,
          deposit_paid_at: new Date().toISOString(),
          deposit_reference: reference,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)
        .eq('team_id', teamId);

      if (error) {
        throw new Error(`Failed to mark deposit as paid: ${error.message}`);
      }

      // Log the payment
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await this.logBookingActivity(
          bookingId,
          'deposit_paid',
          `Deposit marked as paid${reference ? ` (Reference: ${reference})` : ''}`,
          user.id
        );
      }

    } catch (error) {
      console.error('Mark deposit paid error:', error);
      throw error;
    }
  }
} 

/**
 * Extracts all booking-relevant data from a quote row.
 * @param quote The quote object as returned from the DB
 * @returns An object with all fields needed for booking creation
 */
export function extractBookingDataFromQuote(quote: any) {
  // 1. Lead traveler info
  const [firstName, ...lastNameParts] = (quote.client_name || '').split(' ');
  const leadTraveler = {
    firstName: firstName || '',
    lastName: lastNameParts.join(' ') || '',
    email: quote.client_email || '',
    phone: quote.client_phone || '',
    address: quote.client_address || {},
  };

  // 2. Guest count (prompt for guest names later)
  let guestCount = 0;
  if (quote.travelers && typeof quote.travelers === 'object') {
    guestCount = (quote.travelers.adults || 1) - 1 + (quote.travelers.children || 0);
  } else if (quote.travelers_adults) {
    guestCount = (parseInt(quote.travelers_adults) || 1) - 1 + (parseInt(quote.travelers_children) || 0);
  }

  // 3. Components
  let components = [];
  try {
    components = typeof quote.selected_components === 'string'
      ? JSON.parse(quote.selected_components)
      : (quote.selected_components || []);
  } catch (e) {
    components = [];
  }

  // 4. Payments
  const payments = [
    {
      paymentType: 'deposit',
      amount: Number(quote.payment_deposit) || 0,
      dueDate: quote.payment_deposit_date || null,
    },
    {
      paymentType: 'second_payment',
      amount: Number(quote.payment_second_payment) || 0,
      dueDate: quote.payment_second_payment_date || null,
    },
    {
      paymentType: 'final_payment',
      amount: Number(quote.payment_final_payment) || 0,
      dueDate: quote.payment_final_payment_date || null,
    },
  ];

  // 5. Package/tier/price breakdown
  let packageSnapshot = null;
  try {
    packageSnapshot = typeof quote.selected_package === 'string'
      ? JSON.parse(quote.selected_package)
      : quote.selected_package;
  } catch (e) {
    packageSnapshot = quote.selected_package || null;
  }
  let tierSnapshot = null;
  try {
    tierSnapshot = typeof quote.selected_tier === 'string'
      ? JSON.parse(quote.selected_tier)
      : quote.selected_tier;
  } catch (e) {
    tierSnapshot = quote.selected_tier || null;
  }
  let priceBreakdown = null;
  try {
    priceBreakdown = typeof quote.price_breakdown === 'string'
      ? JSON.parse(quote.price_breakdown)
      : quote.price_breakdown;
  } catch (e) {
    priceBreakdown = quote.price_breakdown || null;
  }

  // 6. Other fields
  return {
    leadTraveler,
    guestCount,
    components,
    payments,
    packageSnapshot,
    tierSnapshot,
    priceBreakdown,
    eventId: quote.event_id,
    clientId: quote.client_id,
    teamId: quote.team_id,
    consultantId: quote.consultant_id,
    userId: quote.user_id,
    totalPrice: Number(quote.total_price) || 0,
    currency: quote.currency || 'GBP',
    internalNotes: quote.internal_notes || '',
    quoteId: quote.id,
    quoteNumber: quote.quote_number,
    status: quote.status,
    version: quote.version,
    parentQuoteId: quote.parent_quote_id,
    // Add more fields as needed
  };
} 