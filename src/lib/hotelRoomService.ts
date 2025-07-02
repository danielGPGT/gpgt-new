import { supabase } from './supabase';

export interface HotelRoom {
  id: string;
  hotel_id: string;
  room_type_id: string;
  event_id?: string;
  check_in: string;
  check_out: string;
  nights: number;
  quantity_total: number;
  quantity_reserved: number;
  quantity_provisional: number;
  quantity_available: number;
  markup_percent: number;
  currency: string;
  vat_percent?: number;
  resort_fee?: number;
  resort_fee_type: 'per_night' | 'per_stay';
  city_tax_per_person_per_night?: number;
  contracted: boolean;
  attrition_deadline?: string;
  release_allowed_percent?: number;
  penalty_terms?: string;
  supplier?: string;
  supplier_ref?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  supplier_price: number;
  supplier_currency: string;
  price_gbp: number;
}

export interface HotelRoomInsert {
  hotel_id: string;
  room_type_id: string;
  event_id?: string;
  check_in: string;
  check_out: string;
  quantity_total: number;
  quantity_reserved?: number;
  quantity_provisional?: number;
  markup_percent?: number;
  currency?: string;
  vat_percent?: number;
  resort_fee?: number;
  resort_fee_type?: 'per_night' | 'per_stay';
  city_tax_per_person_per_night?: number;
  contracted?: boolean;
  attrition_deadline?: string;
  release_allowed_percent?: number;
  penalty_terms?: string;
  supplier?: string;
  supplier_ref?: string;
  active?: boolean;
  supplier_price: number;
  supplier_currency?: string;
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
  price_gbp: number;
  currency: string;
  supplier_price: number;
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
          nights,
          quantity_total,
          quantity_available,
          price_gbp,
          currency,
          supplier_price,
          supplier_currency,
          markup_percent
        `)
        .eq('hotel_id', hotelId)
        .eq('active', true)
        .gte('check_in', checkIn)
        .lte('check_out', checkOut)
        .order('check_in', { ascending: true });

      if (error) throw error;
      return data || [];
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