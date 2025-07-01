export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          agency_name: string | null
          logo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          agency_name?: string | null
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          agency_name?: string | null
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan_type: 'starter' | 'professional' | 'enterprise'
          status: 'active' | 'canceled' | 'past_due' | 'trialing'
          current_period_start: string
          current_period_end: string
          cancel_at_period_end: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_type: 'starter' | 'professional' | 'enterprise'
          status?: 'active' | 'canceled' | 'past_due' | 'trialing'
          current_period_start?: string
          current_period_end?: string
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_type?: 'starter' | 'professional' | 'enterprise'
          status?: 'active' | 'canceled' | 'past_due' | 'trialing'
          current_period_start?: string
          current_period_end?: string
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      usage_tracking: {
        Row: {
          id: string
          user_id: string
          month: string // YYYY-MM format
          itineraries_created: number
          pdf_downloads: number
          api_calls: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          month: string
          itineraries_created?: number
          pdf_downloads?: number
          api_calls?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          month?: string
          itineraries_created?: number
          pdf_downloads?: number
          api_calls?: number
          created_at?: string
          updated_at?: string
        }
      }
      itineraries: {
        Row: {
          id: string
          title: string
          client_name: string
          destination: string
          generated_by: string
          date_created: string
          preferences: Json
          days: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          client_name: string
          destination: string
          generated_by: string
          date_created?: string
          preferences: Json
          days: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          client_name?: string
          destination?: string
          generated_by?: string
          date_created?: string
          preferences?: Json
          days?: Json
          created_at?: string
          updated_at?: string
        }
      }
      // Inventory Management Tables
      events: {
        Row: {
          id: string
          sport_id: string | null
          name: string
          location: string | null
          start_date: string | null
          end_date: string | null
          venue_id: string | null
        }
        Insert: {
          id?: string
          sport_id?: string | null
          name: string
          location?: string | null
          start_date?: string | null
          end_date?: string | null
          venue_id?: string | null
        }
        Update: {
          id?: string
          sport_id?: string | null
          name?: string
          location?: string | null
          start_date?: string | null
          end_date?: string | null
          venue_id?: string | null
        }
      }
      sports: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
      }
      venues: {
        Row: {
          id: string
          name: string
          slug: string | null
          country: string | null
          city: string | null
          timezone: string | null
          latitude: number | null
          longitude: number | null
          description: string | null
          images: Json | null
          map_url: string | null
          website: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug?: string | null
          country?: string | null
          city?: string | null
          timezone?: string | null
          latitude?: number | null
          longitude?: number | null
          description?: string | null
          images?: Json | null
          map_url?: string | null
          website?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string | null
          country?: string | null
          city?: string | null
          timezone?: string | null
          latitude?: number | null
          longitude?: number | null
          description?: string | null
          images?: Json | null
          map_url?: string | null
          website?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tickets: {
        Row: {
          id: string
          event_id: string
          ticket_category_id: string | null
          quantity_total: number
          quantity_reserved: number
          quantity_provisional: number
          quantity_available: number
          price: number
          markup_percent: number
          price_with_markup: number
          currency: string
          delivery_method: string | null
          ticket_format: string | null
          ticket_type: string | null
          ticket_delivery_days: number | null
          available_from: string | null
          available_until: string | null
          refundable: boolean
          resellable: boolean
          party_size_together: number | null
          supplier: string | null
          supplier_ref: string | null
          distribution_channel: string | null
          ordered: boolean
          ordered_at: string | null
          paid: boolean
          paid_at: string | null
          tickets_received: boolean
          tickets_received_at: string | null
          created_at: string
          updated_at: string
          metadata: Json | null
        }
        Insert: {
          id?: string
          event_id: string
          ticket_category_id?: string | null
          quantity_total: number
          quantity_reserved?: number
          quantity_provisional?: number
          price: number
          markup_percent?: number
          currency?: string
          delivery_method?: string | null
          ticket_format?: string | null
          ticket_type?: string | null
          ticket_delivery_days?: number | null
          available_from?: string | null
          available_until?: string | null
          refundable?: boolean
          resellable?: boolean
          party_size_together?: number | null
          supplier?: string | null
          supplier_ref?: string | null
          distribution_channel?: string | null
          ordered?: boolean
          ordered_at?: string | null
          paid?: boolean
          paid_at?: string | null
          tickets_received?: boolean
          tickets_received_at?: string | null
          created_at?: string
          updated_at?: string
          metadata?: Json | null
        }
        Update: {
          id?: string
          event_id?: string
          ticket_category_id?: string | null
          quantity_total?: number
          quantity_reserved?: number
          quantity_provisional?: number
          price?: number
          markup_percent?: number
          currency?: string
          delivery_method?: string | null
          ticket_format?: string | null
          ticket_type?: string | null
          ticket_delivery_days?: number | null
          available_from?: string | null
          available_until?: string | null
          refundable?: boolean
          resellable?: boolean
          party_size_together?: number | null
          supplier?: string | null
          supplier_ref?: string | null
          distribution_channel?: string | null
          ordered?: boolean
          ordered_at?: string | null
          paid?: boolean
          paid_at?: string | null
          tickets_received?: boolean
          tickets_received_at?: string | null
          created_at?: string
          updated_at?: string
          metadata?: Json | null
        }
      }
      hotel_rooms: {
        Row: {
          id: string
          hotel_id: string
          room_type_id: string
          event_id: string | null
          check_in: string
          check_out: string
          nights: number
          quantity_total: number
          quantity_reserved: number
          quantity_provisional: number
          quantity_available: number
          base_price: number
          markup_percent: number
          price_with_markup: number
          currency: string
          vat_percent: number | null
          resort_fee: number | null
          resort_fee_type: string
          city_tax_per_person_per_night: number | null
          contracted: boolean
          attrition_deadline: string | null
          release_allowed_percent: number | null
          penalty_terms: string | null
          supplier: string | null
          supplier_ref: string | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          hotel_id: string
          room_type_id: string
          event_id?: string | null
          check_in: string
          check_out: string
          quantity_total: number
          quantity_reserved?: number
          quantity_provisional?: number
          base_price: number
          markup_percent?: number
          currency?: string
          vat_percent?: number | null
          resort_fee?: number | null
          resort_fee_type?: string
          city_tax_per_person_per_night?: number | null
          contracted?: boolean
          attrition_deadline?: string | null
          release_allowed_percent?: number | null
          penalty_terms?: string | null
          supplier?: string | null
          supplier_ref?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          hotel_id?: string
          room_type_id?: string
          event_id?: string | null
          check_in?: string
          check_out?: string
          quantity_total?: number
          quantity_reserved?: number
          quantity_provisional?: number
          base_price?: number
          markup_percent?: number
          currency?: string
          vat_percent?: number | null
          resort_fee?: number | null
          resort_fee_type?: string
          city_tax_per_person_per_night?: number | null
          contracted?: boolean
          attrition_deadline?: string | null
          release_allowed_percent?: number | null
          penalty_terms?: string | null
          supplier?: string | null
          supplier_ref?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      circuit_transfers: {
        Row: {
          id: string
          event_id: string | null
          hotel_id: string | null
          transfer_type: 'coach' | 'mpv'
          vehicle_name: string | null
          seat_capacity: number
          pickup_time: string | null
          return_time: string | null
          total_cost: number
          currency: string
          markup_percent: number
          cost_per_seat: number
          price_per_seat: number
          min_fill_percent: number
          breakeven_per_seat: number
          profit_per_seat: number
          seats_reserved: number
          seats_provisional: number
          seats_available: number
          guide_included: boolean
          guide_name: string | null
          guide_cost: number | null
          supplier: string | null
          supplier_ref: string | null
          notes: string | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id?: string | null
          hotel_id?: string | null
          transfer_type: 'coach' | 'mpv'
          vehicle_name?: string | null
          seat_capacity: number
          pickup_time?: string | null
          return_time?: string | null
          total_cost: number
          currency?: string
          markup_percent?: number
          seats_reserved?: number
          seats_provisional?: number
          guide_included?: boolean
          guide_name?: string | null
          guide_cost?: number | null
          supplier?: string | null
          supplier_ref?: string | null
          notes?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string | null
          hotel_id?: string | null
          transfer_type?: 'coach' | 'mpv'
          vehicle_name?: string | null
          seat_capacity?: number
          pickup_time?: string | null
          return_time?: string | null
          total_cost?: number
          currency?: string
          markup_percent?: number
          seats_reserved?: number
          seats_provisional?: number
          guide_included?: boolean
          guide_name?: string | null
          guide_cost?: number | null
          supplier?: string | null
          supplier_ref?: string | null
          notes?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      airport_transfers: {
        Row: {
          id: string
          event_id: string | null
          hotel_id: string | null
          airport_id: string | null
          transfer_type: 'arrival' | 'departure' | 'return'
          vehicle_type: 'private car' | 'mpv' | 'luxury' | 'chauffeur'
          vehicle_name: string | null
          max_capacity: number | null
          pickup_window_start: string | null
          pickup_window_end: string | null
          cost: number
          markup_percent: number
          currency: string
          client_price: number
          total_vehicles: number
          vehicles_reserved: number
          vehicles_provisional: number
          vehicles_available: number
          supplier: string | null
          supplier_ref: string | null
          notes: string | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id?: string | null
          hotel_id?: string | null
          airport_id?: string | null
          transfer_type: 'arrival' | 'departure' | 'return'
          vehicle_type: 'private car' | 'mpv' | 'luxury' | 'chauffeur'
          vehicle_name?: string | null
          max_capacity?: number | null
          pickup_window_start?: string | null
          pickup_window_end?: string | null
          cost: number
          markup_percent?: number
          currency?: string
          total_vehicles?: number
          vehicles_reserved?: number
          vehicles_provisional?: number
          supplier?: string | null
          supplier_ref?: string | null
          notes?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string | null
          hotel_id?: string | null
          airport_id?: string | null
          transfer_type?: 'arrival' | 'departure' | 'return'
          vehicle_type?: 'private car' | 'mpv' | 'luxury' | 'chauffeur'
          vehicle_name?: string | null
          max_capacity?: number | null
          pickup_window_start?: string | null
          pickup_window_end?: string | null
          cost?: number
          markup_percent?: number
          currency?: string
          total_vehicles?: number
          vehicles_reserved?: number
          vehicles_provisional?: number
          supplier?: string | null
          supplier_ref?: string | null
          notes?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      flights: {
        Row: {
          id: string
          event_id: string | null
          departure_airport_code: string
          arrival_airport_code: string
          return_departure_airport_code: string | null
          return_arrival_airport_code: string | null
          airline: string | null
          flight_class: string | null
          outbound_flight_number: string | null
          return_flight_number: string | null
          outbound_departure_datetime: string | null
          outbound_arrival_datetime: string | null
          return_departure_datetime: string | null
          return_arrival_datetime: string | null
          stops_outbound: number
          stops_return: number
          layovers_outbound: Json | null
          layovers_return: Json | null
          supplier: string | null
          quote_currency: string
          supplier_quote: number | null
          markup_percent: number
          price_gbp: number | null
          baggage_policy: string | null
          notes: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id?: string | null
          departure_airport_code: string
          arrival_airport_code: string
          return_departure_airport_code?: string | null
          return_arrival_airport_code?: string | null
          airline?: string | null
          flight_class?: string | null
          outbound_flight_number?: string | null
          return_flight_number?: string | null
          outbound_departure_datetime?: string | null
          outbound_arrival_datetime?: string | null
          return_departure_datetime?: string | null
          return_arrival_datetime?: string | null
          stops_outbound?: number
          stops_return?: number
          layovers_outbound?: Json | null
          layovers_return?: Json | null
          supplier?: string | null
          quote_currency?: string
          supplier_quote?: number | null
          markup_percent?: number
          baggage_policy?: string | null
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string | null
          departure_airport_code?: string
          arrival_airport_code?: string
          return_departure_airport_code?: string | null
          return_arrival_airport_code?: string | null
          airline?: string | null
          flight_class?: string | null
          outbound_flight_number?: string | null
          return_flight_number?: string | null
          outbound_departure_datetime?: string | null
          outbound_arrival_datetime?: string | null
          return_departure_datetime?: string | null
          return_arrival_datetime?: string | null
          stops_outbound?: number
          stops_return?: number
          layovers_outbound?: Json | null
          layovers_return?: Json | null
          supplier?: string | null
          quote_currency?: string
          supplier_quote?: number | null
          markup_percent?: number
          baggage_policy?: string | null
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      lounge_passes: {
        Row: {
          id: string
          event_id: string | null
          airport_code: string | null
          lounge_name: string
          terminal: string | null
          supplier: string | null
          quote_currency: string
          supplier_quote: number | null
          markup_percent: number
          price_gbp: number | null
          capacity: number | null
          delivery_method: string | null
          description: string | null
          notes: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id?: string | null
          airport_code?: string | null
          lounge_name: string
          terminal?: string | null
          supplier?: string | null
          quote_currency?: string
          supplier_quote?: number | null
          markup_percent?: number
          capacity?: number | null
          delivery_method?: string | null
          description?: string | null
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string | null
          airport_code?: string | null
          lounge_name?: string
          terminal?: string | null
          supplier?: string | null
          quote_currency?: string
          supplier_quote?: number | null
          markup_percent?: number
          capacity?: number | null
          delivery_method?: string | null
          description?: string | null
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      packages: {
        Row: {
          id: string
          event_id: string | null
          name: string
          slug: string | null
          description: string | null
          base_type: string | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id?: string | null
          name: string
          slug?: string | null
          description?: string | null
          base_type?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string | null
          name?: string
          slug?: string | null
          description?: string | null
          base_type?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      package_tiers: {
        Row: {
          id: string
          package_id: string | null
          name: string
          short_label: string | null
          description: string | null
          display_order: number | null
          price_override: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          package_id?: string | null
          name: string
          short_label?: string | null
          description?: string | null
          display_order?: number | null
          price_override?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          package_id?: string | null
          name?: string
          short_label?: string | null
          description?: string | null
          display_order?: number | null
          price_override?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      package_components: {
        Row: {
          id: string
          tier_id: string | null
          event_id: string | null
          component_type: 'ticket' | 'hotel_room' | 'circuit_transfer' | 'airport_transfer' | 'flight' | 'lounge_pass'
          component_id: string
          quantity: number
          price_override: number | null
          notes: string | null
        }
        Insert: {
          id?: string
          tier_id?: string | null
          event_id?: string | null
          component_type: 'ticket' | 'hotel_room' | 'circuit_transfer' | 'airport_transfer' | 'flight' | 'lounge_pass'
          component_id: string
          quantity?: number
          price_override?: number | null
          notes?: string | null
        }
        Update: {
          id?: string
          tier_id?: string | null
          event_id?: string | null
          component_type?: 'ticket' | 'hotel_room' | 'circuit_transfer' | 'airport_transfer' | 'flight' | 'lounge_pass'
          component_id?: string
          quantity?: number
          price_override?: number | null
          notes?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 