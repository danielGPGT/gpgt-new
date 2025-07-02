import { supabase } from './supabase';
import type { Database } from '@/types/supabase';

export type Hotel = Database['public']['Tables']['gpgt_hotels']['Row'];
export type HotelInsert = Database['public']['Tables']['gpgt_hotels']['Insert'];
export type HotelUpdate = Database['public']['Tables']['gpgt_hotels']['Update'];

export interface HotelWithRoomCount extends Hotel {
  room_count: number;
}

export class HotelService {
  static async getHotels(search?: string): Promise<Hotel[]> {
    let query = supabase.from('gpgt_hotels').select('*');
    if (search) {
      query = query.or(`name.ilike.%${search}%,city.ilike.%${search}%,country.ilike.%${search}%`);
    }
    const { data, error } = await query.order('name');
    if (error) throw new Error(`Failed to fetch hotels: ${error.message}`);
    return data || [];
  }

  static async getHotelsWithRoomCounts(search?: string): Promise<HotelWithRoomCount[]> {
    let query = supabase
      .from('gpgt_hotels')
      .select(`
        *,
        room_count:hotel_rooms(count)
      `);
    
    if (search) {
      query = query.or(`name.ilike.%${search}%,city.ilike.%${search}%,country.ilike.%${search}%`);
    }
    
    const { data, error } = await query.order('name');
    if (error) throw new Error(`Failed to fetch hotels: ${error.message}`);
    
    // Transform the data to flatten the room_count
    return (data || []).map(hotel => ({
      ...hotel,
      room_count: hotel.room_count?.[0]?.count || 0
    }));
  }

  static async getHotel(id: string): Promise<Hotel> {
    const { data, error } = await supabase.from('gpgt_hotels').select('*').eq('id', id).single();
    if (error) throw new Error(`Failed to fetch hotel: ${error.message}`);
    return data;
  }

  static async createHotel(hotel: HotelInsert): Promise<Hotel> {
    const { data, error } = await supabase.from('gpgt_hotels').insert(hotel).select().single();
    if (error) throw new Error(`Failed to create hotel: ${error.message}`);
    return data;
  }

  static async updateHotel(id: string, updates: HotelUpdate): Promise<Hotel> {
    const { data, error } = await supabase.from('gpgt_hotels').update(updates).eq('id', id).select().single();
    if (error) throw new Error(`Failed to update hotel: ${error.message}`);
    return data;
  }

  static async deleteHotel(id: string): Promise<void> {
    const { error } = await supabase.from('gpgt_hotels').delete().eq('id', id);
    if (error) throw new Error(`Failed to delete hotel: ${error.message}`);
  }
} 