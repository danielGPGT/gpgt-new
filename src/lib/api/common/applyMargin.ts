import { StandardHotelResult } from '@/types/inventory';

// Utility to apply a margin to a price
export function applyMargin(
  hotels: StandardHotelResult[],
  markup: number
): StandardHotelResult[] {
  return hotels.map(h => ({
    ...h,
    price: Math.round(h.price * (1 + markup))
  }));
} 