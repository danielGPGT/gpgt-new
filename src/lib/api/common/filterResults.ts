import { StandardHotelResult, HotelSearchParams } from '@/types/inventory';

export function filterResults(
  hotels: StandardHotelResult[],
  filters: HotelSearchParams
): StandardHotelResult[] {
  return hotels.filter(hotel => {
    const priceOk = !filters.maxPrice || hotel.price <= filters.maxPrice;
    return priceOk;
  });
} 