import { getHotels as getFromHotelbeds } from './hotelbedsService';
import { HotelSearchParams, StandardHotelResult } from '@/types/inventory';

export async function getHotels(input: HotelSearchParams): Promise<StandardHotelResult[]> {
  // Swap providers here if needed later
  return await getFromHotelbeds(input);
} 