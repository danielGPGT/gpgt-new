import { supabase } from './supabase';

export interface Booking {
  id: string;
  quoteId: string;
  userId: string;
  clientName: string;
  destination: string;
  startDate: string;
  endDate: string;
  totalCost: number;
  currency: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  supplierRef?: string;
  bookingData: any;
  itinerary: any;
  createdAt: string;
  updatedAt: string;
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
   * Get all bookings for the current user
   */
  static async getUserBookings(): Promise<Booking[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch bookings: ${error.message}`);
      }

      return bookings.map(booking => ({
        id: booking.id,
        quoteId: booking.quote_id,
        userId: booking.user_id,
        clientName: booking.client_name,
        destination: booking.booking_data?.destination || 'Unknown',
        startDate: booking.booking_data?.startDate || new Date().toISOString(),
        endDate: booking.booking_data?.endDate || new Date().toISOString(),
        totalCost: booking.total_cost,
        currency: booking.currency,
        status: booking.status,
        supplierRef: booking.supplier_ref,
        bookingData: booking.booking_data,
        itinerary: booking.booking_data?.itinerary,
        createdAt: booking.created_at,
        updatedAt: booking.updated_at,
      }));

    } catch (error) {
      console.error('Fetch bookings error:', error);
      throw error;
    }
  }

  /**
   * Get a specific booking by ID
   */
  static async getBookingById(bookingId: string): Promise<Booking> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: booking, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        throw new Error(`Failed to fetch booking: ${error.message}`);
      }

      return {
        id: booking.id,
        quoteId: booking.quote_id,
        userId: booking.user_id,
        clientName: booking.client_name,
        destination: booking.booking_data?.destination || 'Unknown',
        startDate: booking.booking_data?.startDate || new Date().toISOString(),
        endDate: booking.booking_data?.endDate || new Date().toISOString(),
        totalCost: booking.total_cost,
        currency: booking.currency,
        status: booking.status,
        supplierRef: booking.supplier_ref,
        bookingData: booking.booking_data,
        itinerary: booking.booking_data?.itinerary,
        createdAt: booking.created_at,
        updatedAt: booking.updated_at,
      };

    } catch (error) {
      console.error('Fetch booking error:', error);
      throw error;
    }
  }

  /**
   * Update booking status
   */
  static async updateBookingStatus(bookingId: string, status: 'confirmed' | 'pending' | 'cancelled' | 'completed'): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('bookings')
        .update({ 
          status, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', bookingId)
        .eq('user_id', user.id);

      if (error) {
        throw new Error(`Failed to update booking: ${error.message}`);
      }

    } catch (error) {
      console.error('Update booking error:', error);
      throw error;
    }
  }

  /**
   * Delete a booking
   */
  static async deleteBooking(bookingId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId)
        .eq('user_id', user.id);

      if (error) {
        throw new Error(`Failed to delete booking: ${error.message}`);
      }

    } catch (error) {
      console.error('Delete booking error:', error);
      throw error;
    }
  }

  /**
   * Get booking statistics for the current user
   */
  static async getBookingStats(): Promise<BookingStats> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user.id);

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
   * Create a booking from a quote (moved from QuoteService for better organization)
   */
  static async createBookingFromQuote(quoteId: string, bookingData: any): Promise<string> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const bookingPayload = {
        quote_id: quoteId,
        user_id: user.id,
        client_name: bookingData.clientName || 'Unknown',
        booking_data: bookingData,
        total_cost: bookingData.totalCost,
        currency: bookingData.currency,
        status: 'confirmed',
        supplier_ref: bookingData.supplierRef || null,
      };

      const { data: booking, error } = await supabase
        .from('bookings')
        .insert(bookingPayload)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create booking: ${error.message}`);
      }

      return booking.id;

    } catch (error) {
      console.error('Create booking error:', error);
      throw error;
    }
  }
} 