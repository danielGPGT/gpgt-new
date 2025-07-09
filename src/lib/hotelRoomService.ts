import { supabase } from './supabase';

export interface HotelRoom {
  id: string;
  hotel_id: string;
  room_type_id: string;
  event_id?: string | null;
  check_in: string; // date
  check_out: string; // date
  quantity_total: number;
  quantity_reserved?: number | null;
  quantity_available?: number | null; // GENERATED
  supplier_price_per_night?: number | null;
  supplier_currency?: string | null;
  markup_percent?: number | null;
  vat_percentage?: number | null;
  resort_fee?: number | null;
  resort_fee_type?: string | null;
  city_tax?: number | null;
  city_tax_type?: string | null;
  breakfast_included?: boolean | null;
  breakfast_price_per_person_per_night?: number | null;
  extra_night_markup_percent?: number | null;
  contracted?: boolean | null;
  attrition_deadline?: string | null;
  release_allowed_percent?: number | null;
  penalty_terms?: string | null;
  supplier?: string | null;
  supplier_ref?: string | null;
  contract_file_path?: string | null;
  active?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
  max_people?: number | null;
  is_provisional: boolean;
  bed_type: string;
  commission_percent?: number | null;
  flexibility: string; // 'Flex' or 'Non Flex'
  // The following are generated columns, keep as read-only for display only
  total_supplier_price_per_night?: number | null; // GENERATED
  total_price_per_night_gbp?: number | null; // GENERATED
  total_price_per_stay_gbp?: number | null; // GENERATED
  total_price_per_night_gbp_with_markup?: number | null; // GENERATED
  total_price_per_stay_gbp_with_markup?: number | null; // GENERATED
  extra_night_price_gbp?: number | null; // GENERATED
}

export interface HotelRoomInsert {
  hotel_id: string;
  room_type_id: string;
  event_id?: string | null;
  check_in: string;
  check_out: string;
  quantity_total: number;
  quantity_reserved?: number | null;
  supplier_price_per_night?: number | null;
  supplier_currency?: string | null;
  markup_percent?: number | null;
  vat_percentage?: number | null;
  resort_fee?: number | null;
  resort_fee_type?: string | null;
  city_tax?: number | null;
  city_tax_type?: string | null;
  breakfast_included?: boolean | null;
  extra_night_markup_percent?: number | null;
  contracted?: boolean | null;
  attrition_deadline?: string | null;
  release_allowed_percent?: number | null;
  penalty_terms?: string | null;
  supplier?: string | null;
  supplier_ref?: string | null;
  contract_file_path?: string | null;
  active?: boolean | null;
  max_people?: number | null;
  breakfast_price_per_person_per_night?: number | null;
  is_provisional?: boolean;
  bed_type: string;
  commission_percent?: number | null;
  flexibility?: string; // 'Flex' or 'Non Flex', default 'Flex'
}

export interface HotelRoomUpdate extends Partial<HotelRoomInsert> {
  id: string;
}

export interface RoomAvailability {
  room_id: string;
  room_type_id: string;
  check_in: string;
  check_out: string;
  nights: number;
  quantity_total: number;
  quantity_available: number;
  price_per_night_gbp: number;
  supplier_price_per_night: number;
  supplier_currency: string;
  markup_percent: number;
}

export class HotelRoomService {
  /**
   * Get all rooms for a hotel
   */
  static async getHotelRooms(hotelId: string): Promise<HotelRoom[]> {
    try {
      const { data, error } = await supabase
        .from('hotel_rooms')
        .select('*')
        .eq('hotel_id', hotelId)
        .eq('active', true)
        .order('check_in', { ascending: true });

      if (error) throw error;
      
      // Debug: Log the first room to see what fields are returned
      console.log('DEBUG - Service: First room from DB:', data?.[0]);
      console.log('DEBUG - Service: is_provisional field exists:', data?.[0]?.hasOwnProperty('is_provisional'));
      console.log('DEBUG - Service: is_provisional value:', data?.[0]?.is_provisional);
      console.log('DEBUG - Service: is_provisional type:', typeof data?.[0]?.is_provisional);
      console.log('DEBUG - Service: All fields:', Object.keys(data?.[0] || {}));
      
      return data || [];
    } catch (error) {
      console.error('Error fetching hotel rooms:', error);
      throw error;
    }
  }

  /**
   * Get room by ID
   */
  static async getRoomById(roomId: string): Promise<HotelRoom | null> {
    try {
      const { data, error } = await supabase
        .from('hotel_rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching room:', error);
      throw error;
    }
  }

  /**
   * Create a new room
   */
  static async createRoom(roomData: HotelRoomInsert): Promise<HotelRoom> {
    try {
      const { data, error } = await supabase
        .from('hotel_rooms')
        .insert(roomData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating room:', error);
      throw error;
    }
  }

  /**
   * Update a room
   */
  static async updateRoom(roomId: string, updates: Partial<HotelRoomInsert>): Promise<HotelRoom> {
    try {
      const { data, error } = await supabase
        .from('hotel_rooms')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', roomId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating room:', error);
      throw error;
    }
  }

  /**
   * Delete a room (soft delete by setting active to false)
   */
  static async deleteRoom(roomId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('hotel_rooms')
        .update({ 
          active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', roomId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting room:', error);
      throw error;
    }
  }

  /**
   * Get room availability for a date range
   */
  static async getRoomAvailability(
    hotelId: string,
    checkIn: string,
    checkOut: string
  ): Promise<RoomAvailability[]> {
    try {
      const { data, error } = await supabase
        .from('hotel_rooms')
        .select(`
          id,
          room_type_id,
          check_in,
          check_out,
          (check_out::date - check_in::date) as nights,
          quantity_total,
          quantity_available,
          price_per_night_gbp,
          supplier_price_per_night,
          supplier_currency,
          markup_percent
        `)
        .eq('hotel_id', hotelId)
        .eq('active', true)
        .gte('check_in', checkIn)
        .lte('check_out', checkOut)
        .order('check_in', { ascending: true });

      if (error) throw error;
      // Map id to room_id for compatibility
      return (data || []).map((row: any) => ({
        room_id: row.id,
        room_type_id: row.room_type_id,
        check_in: row.check_in,
        check_out: row.check_out,
        nights: row.nights,
        quantity_total: row.quantity_total,
        quantity_available: row.quantity_available,
        price_per_night_gbp: row.price_per_night_gbp,
        supplier_price_per_night: row.supplier_price_per_night,
        supplier_currency: row.supplier_currency,
        markup_percent: row.markup_percent,
      }));
    } catch (error) {
      console.error('Error fetching room availability:', error);
      throw error;
    }
  }

  /**
   * Update room quantities (reserved/provisional)
   */
  static async updateRoomQuantities(
    roomId: string,
    quantityReserved?: number,
    quantityProvisional?: number
  ): Promise<HotelRoom> {
    try {
      const updates: any = {
        updated_at: new Date().toISOString(),
      };

      if (quantityReserved !== undefined) {
        updates.quantity_reserved = quantityReserved;
      }

      if (quantityProvisional !== undefined) {
        updates.quantity_provisional = quantityProvisional;
      }

      const { data, error } = await supabase
        .from('hotel_rooms')
        .update(updates)
        .eq('id', roomId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating room quantities:', error);
      throw error;
    }
  }

  /**
   * Get rooms by event
   */
  static async getRoomsByEvent(eventId: string): Promise<HotelRoom[]> {
    try {
      const { data, error } = await supabase
        .from('hotel_rooms')
        .select('*')
        .eq('event_id', eventId)
        .eq('active', true)
        .order('check_in', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching event rooms:', error);
      throw error;
    }
  }

  /**
   * Get room statistics for a hotel
   */
  static async getRoomStats(hotelId: string): Promise<{
    totalRooms: number;
    totalAvailable: number;
    totalReserved: number;
    totalProvisional: number;
    averagePrice: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('hotel_rooms')
        .select('quantity_total, quantity_available, quantity_reserved, quantity_provisional, price_gbp')
        .eq('hotel_id', hotelId)
        .eq('active', true);

      if (error) throw error;

      const stats = data?.reduce(
        (acc, room) => ({
          totalRooms: acc.totalRooms + room.quantity_total,
          totalAvailable: acc.totalAvailable + room.quantity_available,
          totalReserved: acc.totalReserved + room.quantity_reserved,
          totalProvisional: acc.totalProvisional + room.quantity_provisional,
          totalPrice: acc.totalPrice + room.price_gbp,
        }),
        { totalRooms: 0, totalAvailable: 0, totalReserved: 0, totalProvisional: 0, totalPrice: 0 }
      ) || { totalRooms: 0, totalAvailable: 0, totalReserved: 0, totalProvisional: 0, totalPrice: 0 };

      return {
        ...stats,
        averagePrice: stats.totalRooms > 0 ? stats.totalPrice / stats.totalRooms : 0,
      };
    } catch (error) {
      console.error('Error fetching room stats:', error);
      throw error;
    }
  }
} 