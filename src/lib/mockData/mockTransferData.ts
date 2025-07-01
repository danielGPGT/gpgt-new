// Transfer mock data for travel services
// This file provides realistic mock data for airport transfers

export interface MockTransfer {
  id: string;
  type: 'private' | 'shared' | 'luxury' | 'helicopter';
  vehicle: {
    name: string;
    type: string;
    capacity: number;
    amenities: string[];
    image: string;
  };
  pickup: {
    location: string;
    type: 'airport' | 'hotel' | 'custom';
    terminal?: string;
    time: string;
  };
  dropoff: {
    location: string;
    type: 'airport' | 'hotel' | 'custom';
    terminal?: string;
    time: string;
  };
  duration: string;
  distance: string;
  price: {
    amount: number;
    currency: string;
    perPerson: boolean;
  };
  available: boolean;
  cancellationPolicy: string;
  includes: string[];
  extras: {
    name: string;
    price: number;
    currency: string;
  }[];
}

export const mockTransfers: MockTransfer[] = [
  {
    id: 'transfer_1',
    type: 'private',
    vehicle: {
      name: 'Mercedes S-Class',
      type: 'sedan',
      capacity: 3,
      amenities: ['WiFi', 'Bottled Water', 'Air Conditioning', 'Leather Seats'],
      image: 'https://images.unsplash.com/photo-1511918984145-48de785d4c4e?w=600'
    },
    pickup: {
      location: 'Abu Dhabi International Airport',
      type: 'airport',
      terminal: '3',
      time: '2025-12-04T20:30:00+04:00'
    },
    dropoff: {
      location: 'Emirates Palace Mandarin Oriental',
      type: 'hotel',
      time: '2025-12-04T21:10:00+04:00'
    },
    duration: '40 min',
    distance: '38 km',
    price: {
      amount: 120,
      currency: 'GBP',
      perPerson: false
    },
    available: true,
    cancellationPolicy: 'Free cancellation up to 12 hours before pickup',
    includes: ['Meet & Greet', 'Flight Tracking', 'Luggage Assistance'],
    extras: [
      { name: 'Child Seat', price: 10, currency: 'GBP' },
      { name: 'Extra Stop', price: 20, currency: 'GBP' }
    ]
  },
  {
    id: 'transfer_2',
    type: 'luxury',
    vehicle: {
      name: 'Rolls-Royce Phantom',
      type: 'sedan',
      capacity: 3,
      amenities: ['WiFi', 'Champagne', 'Leather Seats', 'Premium Sound'],
      image: 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=600'
    },
    pickup: {
      location: 'Emirates Palace Mandarin Oriental',
      type: 'hotel',
      time: '2025-12-08T10:00:00+04:00'
    },
    dropoff: {
      location: 'Abu Dhabi International Airport',
      type: 'airport',
      terminal: '3',
      time: '2025-12-08T10:40:00+04:00'
    },
    duration: '40 min',
    distance: '38 km',
    price: {
      amount: 250,
      currency: 'GBP',
      perPerson: false
    },
    available: true,
    cancellationPolicy: 'Free cancellation up to 24 hours before pickup',
    includes: ['Meet & Greet', 'Luggage Assistance', 'VIP Service'],
    extras: [
      { name: 'Champagne', price: 50, currency: 'GBP' }
    ]
  }
];

export const getMockTransfers = (from?: string, to?: string): MockTransfer[] => {
  if (from && to) {
    return mockTransfers.filter(
      t => t.pickup.location.toLowerCase().includes(from.toLowerCase()) &&
           t.dropoff.location.toLowerCase().includes(to.toLowerCase())
    );
  }
  return mockTransfers;
}; 