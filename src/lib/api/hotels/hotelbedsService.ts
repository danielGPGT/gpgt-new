// Mocked Hotelbeds API integration for hotels
import { HotelSearchParams, StandardHotelResult } from '@/types/inventory';
import { applyMargin } from '@/lib/api/common/applyMargin';
import { filterResults } from '@/lib/api/common/filterResults';

export async function getHotels(input: HotelSearchParams): Promise<StandardHotelResult[]> {
  const mockResults: StandardHotelResult[] = [
    {
      id: 'demo-001',
      name: 'Hotel Le Grand',
      image: '/demo/hotel.jpg',
      description: 'A luxurious hotel in the heart of Paris.',
      rating: 4.8,
      price: 400,
      currency: 'EUR',
      refundPolicy: 'Free cancellation within 72 hours',
      location: 'Paris, France',
      tags: ['Luxury', 'City Center', 'Romantic']
    },
    // ...more hotels
  ];

  const priced = applyMargin(mockResults, 0.15);
  const filtered = filterResults(priced, input);
  return filtered;
} 