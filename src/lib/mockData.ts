// Comprehensive mock data for travel services
// This file provides realistic mock data for flights, events, transfers, and other travel services

export interface MockFlight {
  id: string;
  flightNumber: string;
  airline: string;
  airlineCode: string;
  departure: {
    airport: string;
    airportCode: string;
    city: string;
    country: string;
    terminal: string;
    time: string;
    date: string;
  };
  arrival: {
    airport: string;
    airportCode: string;
    city: string;
    country: string;
    terminal: string;
    time: string;
    date: string;
  };
  duration: string;
  stops: number;
  aircraft: string;
  class: 'economy' | 'business' | 'first';
  price: {
    amount: number;
    currency: string;
    originalAmount?: number;
  };
  available: boolean;
  refundable: boolean;
  cancellationPolicy: string;
  baggage: {
    checked: string;
    carryOn: string;
  };
  amenities: string[];
  seats: {
    total: number;
    available: number;
  };
}

export interface MockEvent {
  id: string;
  name: string;
  type: 'concert' | 'sports' | 'theater' | 'festival' | 'exhibition';
  dateOfEvent: string;
  time: string;
  venue: {
    name: string;
    city: string;
    country: string;
    address: string;
    capacity: number;
  };
  description: string;
  category: string;
  image: string;
  tickets: MockTicket[];
}

export interface MockTicket {
  id: string;
  categoryName: string;
  description: string;
  price: {
    amount: number;
    currency: string;
    originalAmount?: number;
  };
  available: boolean;
  quantity: number;
  section?: string;
  row?: string;
  seat?: string;
  benefits: string[];
  cancellationPolicy: string;
}

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

export interface MockActivity {
  id: string;
  name: string;
  type: 'tour' | 'experience' | 'adventure' | 'wellness' | 'culinary';
  description: string;
  duration: string;
  location: {
    city: string;
    country: string;
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  price: {
    amount: number;
    currency: string;
    perPerson: boolean;
    originalAmount?: number;
  };
  images: string[];
  rating: number;
  reviews: number;
  maxGroupSize: number;
  minAge: number;
  difficulty: 'easy' | 'moderate' | 'challenging';
  includes: string[];
  excludes: string[];
  schedule: {
    startTime: string;
    endTime: string;
    days: string[];
  };
  cancellationPolicy: string;
  available: boolean;
  tags: string[];
}

export interface MockInsurance {
  id: string;
  name: string;
  type: 'basic' | 'comprehensive' | 'premium';
  provider: string;
  description: string;
  coverage: {
    medical: number;
    tripCancellation: number;
    baggage: number;
    flightDelay: number;
    personalLiability: number;
  };
  price: {
    amount: number;
    currency: string;
    perPerson: boolean;
    perDay: boolean;
  };
  duration: string;
  deductible: number;
  exclusions: string[];
  benefits: string[];
  available: boolean;
}

export interface MockHotel {
  id: string;
  name: string;
  brand: string;
  rating: number;
  stars: number;
  location: {
    city: string;
    country: string;
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    area: string;
    distanceFromAirport: string;
    distanceFromCityCenter: string;
  };
  description: string;
  amenities: string[];
  images: string[];
  rooms: MockHotelRoom[];
  policies: {
    checkIn: string;
    checkOut: string;
    cancellationPolicy: string;
    petPolicy: string;
    smokingPolicy: string;
  };
  reviews: {
    average: number;
    total: number;
    breakdown: {
      cleanliness: number;
      service: number;
      location: number;
      value: number;
    };
  };
  available: boolean;
}

export interface MockHotelRoom {
  id: string;
  name: string;
  type: 'standard' | 'deluxe' | 'suite' | 'presidential';
  description: string;
  size: string;
  maxOccupancy: number;
  bedConfiguration: string;
  amenities: string[];
  images: string[];
  price: {
    amount: number;
    currency: string;
    perNight: boolean;
    originalAmount?: number;
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

// Mock Flight Data
export const mockFlights: MockFlight[] = [
  {
    id: 'flight_1',
    flightNumber: 'AF1234',
    airline: 'Air France',
    airlineCode: 'AF',
    departure: {
      airport: 'Charles de Gaulle Airport',
      airportCode: 'CDG',
      city: 'Paris',
      country: 'France',
      terminal: '2F',
      time: '10:30',
      date: '2025-01-15'
    },
    arrival: {
      airport: 'John F. Kennedy International Airport',
      airportCode: 'JFK',
      city: 'New York',
      country: 'United States',
      terminal: '1',
      time: '13:45',
      date: '2025-01-15'
    },
    duration: '7h 15m',
    stops: 0,
    aircraft: 'Airbus A350-900',
    class: 'business',
    price: {
      amount: 2800,
      currency: 'USD',
      originalAmount: 3200
    },
    available: true,
    refundable: true,
    cancellationPolicy: 'Free cancellation until 24h before departure',
    baggage: {
      checked: '2 bags up to 32kg each',
      carryOn: '1 bag up to 12kg + 1 personal item'
    },
    amenities: ['WiFi', 'Power outlets', 'Entertainment system', 'Meal service', 'Priority boarding'],
    seats: {
      total: 42,
      available: 8
    }
  },
  {
    id: 'flight_2',
    flightNumber: 'BA789',
    airline: 'British Airways',
    airlineCode: 'BA',
    departure: {
      airport: 'Heathrow Airport',
      airportCode: 'LHR',
      city: 'London',
      country: 'United Kingdom',
      terminal: '5',
      time: '14:20',
      date: '2025-01-15'
    },
    arrival: {
      airport: 'Charles de Gaulle Airport',
      airportCode: 'CDG',
      city: 'Paris',
      country: 'France',
      terminal: '2A',
      time: '17:35',
      date: '2025-01-15'
    },
    duration: '1h 15m',
    stops: 0,
    aircraft: 'Airbus A320neo',
    class: 'economy',
    price: {
      amount: 180,
      currency: 'EUR'
    },
    available: true,
    refundable: false,
    cancellationPolicy: 'Non-refundable, changes allowed with fee',
    baggage: {
      checked: '1 bag up to 23kg',
      carryOn: '1 bag up to 7kg + 1 personal item'
    },
    amenities: ['WiFi', 'Power outlets', 'Entertainment system'],
    seats: {
      total: 180,
      available: 45
    }
  },
  {
    id: 'flight_3',
    flightNumber: 'LH456',
    airline: 'Lufthansa',
    airlineCode: 'LH',
    departure: {
      airport: 'Frankfurt Airport',
      airportCode: 'FRA',
      city: 'Frankfurt',
      country: 'Germany',
      terminal: '1',
      time: '08:15',
      date: '2025-01-15'
    },
    arrival: {
      airport: 'Charles de Gaulle Airport',
      airportCode: 'CDG',
      city: 'Paris',
      country: 'France',
      terminal: '1',
      time: '09:45',
      date: '2025-01-15'
    },
    duration: '1h 30m',
    stops: 0,
    aircraft: 'Airbus A321',
    class: 'business',
    price: {
      amount: 450,
      currency: 'EUR'
    },
    available: true,
    refundable: true,
    cancellationPolicy: 'Free cancellation until 2h before departure',
    baggage: {
      checked: '2 bags up to 32kg each',
      carryOn: '1 bag up to 8kg + 1 personal item'
    },
    amenities: ['WiFi', 'Power outlets', 'Entertainment system', 'Meal service', 'Priority boarding', 'Lounge access'],
    seats: {
      total: 28,
      available: 12
    }
  }
];

// Mock Event Data for Abu Dhabi (December 2025)
export const mockEvents: MockEvent[] = [
  {
    id: 'event_1',
    name: 'Abu Dhabi Grand Prix 2025',
    type: 'sports',
    dateOfEvent: '2025-12-06',
    time: '17:00',
    venue: {
      name: 'Yas Marina Circuit',
      city: 'Abu Dhabi',
      country: 'United Arab Emirates',
      address: 'Yas Island, Abu Dhabi',
      capacity: 60000
    },
    description: 'The season finale of the Formula 1 World Championship, featuring the most advanced racing technology and world-class drivers competing under the lights.',
    category: 'Formula 1 Racing',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
    tickets: [
      {
        id: 'ticket_1_1',
        categoryName: 'Grandstand Premium',
        description: 'Premium seating with excellent views of the main straight and pit lane',
        price: { amount: 450, currency: 'GBP' },
        available: true,
        quantity: 50,
        section: 'Main Grandstand',
        row: 'A-C',
        benefits: ['Premium View', 'Access to Premium Lounge', 'Complimentary Refreshments', 'Exclusive Merchandise'],
        cancellationPolicy: 'Non-refundable'
      },
      {
        id: 'ticket_1_2',
        categoryName: 'General Admission',
        description: 'Access to general viewing areas around the circuit',
        price: { amount: 180, currency: 'GBP' },
        available: true,
        quantity: 200,
        benefits: ['Circuit Access', 'Food & Beverage Stalls', 'Fan Zone Access'],
        cancellationPolicy: 'Non-refundable'
      }
    ]
  },
  {
    id: 'event_2',
    name: 'Abu Dhabi International Jazz Festival',
    type: 'concert',
    dateOfEvent: '2025-12-05',
    time: '19:30',
    venue: {
      name: 'Emirates Palace Auditorium',
      city: 'Abu Dhabi',
      country: 'United Arab Emirates',
      address: 'West Corniche Road, Abu Dhabi',
      capacity: 1200
    },
    description: 'An evening of world-class jazz performances featuring international artists in the stunning Emirates Palace.',
    category: 'Jazz Music',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
    tickets: [
      {
        id: 'ticket_2_1',
        categoryName: 'VIP Seating',
        description: 'Premium front-row seating with meet & greet opportunity',
        price: { amount: 320, currency: 'GBP' },
        available: true,
        quantity: 30,
        section: 'VIP',
        row: 'A',
        benefits: ['Front Row Seating', 'Meet & Greet', 'Complimentary Drinks', 'Exclusive After-Party Access'],
        cancellationPolicy: 'Free cancellation until 24 hours before event'
      },
      {
        id: 'ticket_2_2',
        categoryName: 'Standard Seating',
        description: 'Excellent seating with great acoustics',
        price: { amount: 150, currency: 'GBP' },
        available: true,
        quantity: 100,
        benefits: ['Premium Seating', 'Complimentary Welcome Drink'],
        cancellationPolicy: 'Free cancellation until 24 hours before event'
      }
    ]
  },
  {
    id: 'event_3',
    name: 'Louvre Abu Dhabi Special Exhibition',
    type: 'exhibition',
    dateOfEvent: '2025-12-07',
    time: '10:00',
    venue: {
      name: 'Louvre Abu Dhabi',
      city: 'Abu Dhabi',
      country: 'United Arab Emirates',
      address: 'Saadiyat Cultural District, Abu Dhabi',
      capacity: 5000
    },
    description: 'Exclusive exhibition featuring masterpieces from the Louvre collection, showcasing art from different civilizations and cultures.',
    category: 'Art Exhibition',
    image: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800',
    tickets: [
      {
        id: 'ticket_3_1',
        categoryName: 'Guided Tour VIP',
        description: 'Private guided tour with art historian and exclusive access',
        price: { amount: 95, currency: 'GBP' },
        available: true,
        quantity: 20,
        benefits: ['Private Guide', 'Exclusive Access', 'Complimentary Audio Guide', 'Skip-the-Line Entry'],
        cancellationPolicy: 'Free cancellation until 24 hours before event'
      },
      {
        id: 'ticket_3_2',
        categoryName: 'General Admission',
        description: 'Standard museum entry with audio guide',
        price: { amount: 45, currency: 'GBP' },
        available: true,
        quantity: 200,
        benefits: ['Museum Access', 'Audio Guide', 'Cafe Discount'],
        cancellationPolicy: 'Free cancellation until 24 hours before event'
      }
    ]
  }
];

// Mock Transfer Data for Abu Dhabi
export const mockTransfers: MockTransfer[] = [
  {
    id: 'transfer_1',
    type: 'luxury',
    vehicle: {
      name: 'Mercedes S-Class',
      type: 'Luxury Sedan',
      capacity: 4,
      amenities: ['Leather Seats', 'Climate Control', 'WiFi', 'Refreshments', 'Professional Driver'],
      image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600'
    },
    pickup: {
      location: 'Abu Dhabi International Airport',
      type: 'airport',
      terminal: 'Terminal 1',
      time: '2025-12-04T19:45:00Z'
    },
    dropoff: {
      location: 'Emirates Palace Mandarin Oriental',
      type: 'hotel',
      time: '2025-12-04T20:30:00Z'
    },
    duration: '45 minutes',
    distance: '35 km',
    price: { amount: 120, currency: 'GBP', perPerson: false },
    available: true,
    cancellationPolicy: 'Free cancellation until 2 hours before pickup',
    includes: ['Meet & Greet', 'Flight Monitoring', 'Luggage Assistance', 'Bottled Water'],
    extras: [
      { name: 'Child Seat', price: 15, currency: 'GBP' },
      { name: 'Extra Luggage', price: 10, currency: 'GBP' }
    ]
  },
  {
    id: 'transfer_2',
    type: 'private',
    vehicle: {
      name: 'BMW 7 Series',
      type: 'Executive Sedan',
      capacity: 4,
      amenities: ['Premium Audio', 'Climate Control', 'WiFi', 'Refreshments', 'Professional Driver'],
      image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600'
    },
    pickup: {
      location: 'Abu Dhabi International Airport',
      type: 'airport',
      terminal: 'Terminal 3',
      time: '2025-12-04T19:45:00Z'
    },
    dropoff: {
      location: 'St. Regis Abu Dhabi',
      type: 'hotel',
      time: '2025-12-04T20:25:00Z'
    },
    duration: '40 minutes',
    distance: '32 km',
    price: { amount: 95, currency: 'GBP', perPerson: false },
    available: true,
    cancellationPolicy: 'Free cancellation until 2 hours before pickup',
    includes: ['Meet & Greet', 'Flight Monitoring', 'Luggage Assistance'],
    extras: [
      { name: 'Child Seat', price: 12, currency: 'GBP' },
      { name: 'Extra Luggage', price: 8, currency: 'GBP' }
    ]
  },
  {
    id: 'transfer_3',
    type: 'helicopter',
    vehicle: {
      name: 'AgustaWestland AW139',
      type: 'Luxury Helicopter',
      capacity: 6,
      amenities: ['Leather Seats', 'Climate Control', 'Noise-Canceling Headphones', 'Refreshments', 'Professional Pilot'],
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600'
    },
    pickup: {
      location: 'Abu Dhabi International Airport',
      type: 'airport',
      terminal: 'Helipad',
      time: '2025-12-04T19:45:00Z'
    },
    dropoff: {
      location: 'Emirates Palace Mandarin Oriental',
      type: 'hotel',
      time: '2025-12-04T20:00:00Z'
    },
    duration: '15 minutes',
    distance: '35 km',
    price: { amount: 450, currency: 'GBP', perPerson: false },
    available: true,
    cancellationPolicy: 'Free cancellation until 24 hours before pickup',
    includes: ['Meet & Greet', 'Flight Monitoring', 'Luggage Assistance', 'Champagne Service'],
    extras: [
      { name: 'Extended Flight', price: 200, currency: 'GBP' },
      { name: 'Photography Service', price: 150, currency: 'GBP' }
    ]
  }
];

// Mock Activity Data for Abu Dhabi
export const mockActivities: MockActivity[] = [
  {
    id: 'activity_1',
    name: 'Desert Safari & Luxury Camp Experience',
    type: 'experience',
    description: 'Experience the magic of the Arabian desert with a luxury safari including dune bashing, camel riding, and a gourmet dinner under the stars.',
    duration: '6 hours',
    location: {
      city: 'Abu Dhabi',
      country: 'United Arab Emirates',
      address: 'Liwa Desert, Abu Dhabi',
      coordinates: { latitude: 23.1333, longitude: 53.7833 }
    },
    price: { amount: 180, currency: 'GBP', perPerson: true },
    images: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'
    ],
    rating: 4.8,
    reviews: 342,
    maxGroupSize: 12,
    minAge: 8,
    difficulty: 'easy',
    includes: ['Hotel Pickup/Dropoff', 'Professional Guide', 'Dune Bashing', 'Camel Riding', 'Gourmet Dinner', 'Traditional Entertainment'],
    excludes: ['Alcoholic Beverages', 'Personal Expenses', 'Gratuities'],
    schedule: {
      startTime: '15:00',
      endTime: '21:00',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    cancellationPolicy: 'Free cancellation until 24 hours before activity',
    available: true,
    tags: ['Desert', 'Adventure', 'Cultural', 'Luxury']
  },
  {
    id: 'activity_2',
    name: 'Private Yacht Charter - Arabian Gulf',
    type: 'experience',
    description: 'Cruise the stunning Arabian Gulf on a private luxury yacht with professional crew, gourmet catering, and water sports activities.',
    duration: '4 hours',
    location: {
      city: 'Abu Dhabi',
      country: 'United Arab Emirates',
      address: 'Marina Bay, Abu Dhabi',
      coordinates: { latitude: 24.4539, longitude: 54.3773 }
    },
    price: { amount: 850, currency: 'GBP', perPerson: false },
    images: [
      'https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?w=800',
      'https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?w=800'
    ],
    rating: 4.9,
    reviews: 156,
    maxGroupSize: 8,
    minAge: 5,
    difficulty: 'easy',
    includes: ['Professional Crew', 'Gourmet Catering', 'Water Sports Equipment', 'Safety Equipment', 'Marina Fees'],
    excludes: ['Alcoholic Beverages', 'Personal Expenses', 'Gratuities'],
    schedule: {
      startTime: '10:00',
      endTime: '14:00',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    cancellationPolicy: 'Free cancellation until 48 hours before activity',
    available: true,
    tags: ['Yacht', 'Luxury', 'Water Sports', 'Gourmet']
  },
  {
    id: 'activity_3',
    name: 'Ferrari World & Yas Island Adventure',
    type: 'adventure',
    description: 'Experience the world\'s fastest roller coaster and explore the thrilling attractions of Yas Island, including Ferrari World and Yas Waterworld.',
    duration: '8 hours',
    location: {
      city: 'Abu Dhabi',
      country: 'United Arab Emirates',
      address: 'Yas Island, Abu Dhabi',
      coordinates: { latitude: 24.4744, longitude: 54.6011 }
    },
    price: { amount: 120, currency: 'GBP', perPerson: true },
    images: [
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800'
    ],
    rating: 4.6,
    reviews: 289,
    maxGroupSize: 15,
    minAge: 10,
    difficulty: 'moderate',
    includes: ['Hotel Pickup/Dropoff', 'Professional Guide', 'Ferrari World Entry', 'Yas Waterworld Entry', 'Lunch'],
    excludes: ['Personal Expenses', 'Gratuities', 'Optional Activities'],
    schedule: {
      startTime: '09:00',
      endTime: '17:00',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    cancellationPolicy: 'Free cancellation until 24 hours before activity',
    available: true,
    tags: ['Adventure', 'Theme Parks', 'Family', 'Thrills']
  },
  {
    id: 'activity_4',
    name: 'Luxury Spa & Wellness Retreat',
    type: 'wellness',
    description: 'Indulge in a luxurious spa experience featuring traditional Arabian treatments, modern wellness therapies, and exclusive spa facilities.',
    duration: '3 hours',
    location: {
      city: 'Abu Dhabi',
      country: 'United Arab Emirates',
      address: 'Emirates Palace Spa, Abu Dhabi',
      coordinates: { latitude: 24.4539, longitude: 54.3773 }
    },
    price: { amount: 250, currency: 'GBP', perPerson: true },
    images: [
      'https://images.unsplash.com/photo-1544161512-84f9c86cbeb4?w=800',
      'https://images.unsplash.com/photo-1544161512-84f9c86cbeb4?w=800'
    ],
    rating: 4.9,
    reviews: 198,
    maxGroupSize: 4,
    minAge: 18,
    difficulty: 'easy',
    includes: ['Spa Access', 'Traditional Hammam', 'Aromatherapy Massage', 'Wellness Consultation', 'Refreshments'],
    excludes: ['Additional Treatments', 'Personal Expenses', 'Gratuities'],
    schedule: {
      startTime: '10:00',
      endTime: '13:00',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    cancellationPolicy: 'Free cancellation until 24 hours before activity',
    available: true,
    tags: ['Spa', 'Wellness', 'Luxury', 'Relaxation']
  }
];

// Mock Insurance Data for Abu Dhabi Trip
export const mockInsurance: MockInsurance[] = [
  {
    id: 'insurance_1',
    name: 'Luxury Travel Protection Plus',
    type: 'premium',
    provider: 'Global Travel Insurance',
    description: 'Comprehensive luxury travel insurance covering medical emergencies, trip cancellation, baggage loss, and premium concierge services.',
    coverage: {
      medical: 1000000,
      tripCancellation: 25000,
      baggage: 5000,
      flightDelay: 1000,
      personalLiability: 1000000
    },
    price: { amount: 85, currency: 'GBP', perPerson: true, perDay: false },
    duration: '5 days',
    deductible: 0,
    exclusions: ['Pre-existing conditions', 'Extreme sports', 'War zones'],
    benefits: [
      '24/7 Global Assistance',
      'Medical Evacuation',
      'Trip Cancellation',
      'Baggage Protection',
      'Flight Delay Coverage',
      'Luxury Concierge Service',
      'Emergency Cash Advance'
    ],
    available: true
  },
  {
    id: 'insurance_2',
    name: 'Comprehensive Travel Shield',
    type: 'comprehensive',
    provider: 'Worldwide Travel Protection',
    description: 'Reliable travel insurance with excellent coverage for medical emergencies, trip interruptions, and baggage protection.',
    coverage: {
      medical: 500000,
      tripCancellation: 15000,
      baggage: 3000,
      flightDelay: 500,
      personalLiability: 500000
    },
    price: { amount: 65, currency: 'GBP', perPerson: true, perDay: false },
    duration: '5 days',
    deductible: 50,
    exclusions: ['Pre-existing conditions', 'Extreme sports'],
    benefits: [
      '24/7 Emergency Assistance',
      'Medical Coverage',
      'Trip Cancellation',
      'Baggage Protection',
      'Flight Delay Coverage',
      'Travel Assistance'
    ],
    available: true
  },
  {
    id: 'insurance_3',
    name: 'Essential Travel Cover',
    type: 'basic',
    provider: 'TravelSafe Insurance',
    description: 'Basic travel insurance providing essential coverage for medical emergencies and trip cancellation.',
    coverage: {
      medical: 250000,
      tripCancellation: 10000,
      baggage: 1500,
      flightDelay: 250,
      personalLiability: 250000
    },
    price: { amount: 45, currency: 'GBP', perPerson: true, perDay: false },
    duration: '5 days',
    deductible: 100,
    exclusions: ['Pre-existing conditions', 'Extreme sports', 'Luxury items'],
    benefits: [
      'Emergency Medical Coverage',
      'Trip Cancellation',
      'Basic Baggage Protection',
      'Flight Delay Coverage'
    ],
    available: true
  }
];

// Helper functions to get mock data
export const getMockFlights = (destination?: string, date?: string): MockFlight[] => {
  if (destination && date) {
    return mockFlights.filter(flight => 
      flight.arrival.city.toLowerCase().includes(destination.toLowerCase()) &&
      flight.departure.date === date
    );
  }
  return mockFlights;
};

export const getMockEvents = (city?: string, date?: string): MockEvent[] => {
  if (city && date) {
    return mockEvents.filter(event => 
      event.venue.city.toLowerCase().includes(city.toLowerCase()) &&
      event.dateOfEvent === date
    );
  }
  return mockEvents;
};

export const getMockTransfers = (from?: string, to?: string): MockTransfer[] => {
  if (from && to) {
    return mockTransfers.filter(transfer => 
      transfer.pickup.location.toLowerCase().includes(from.toLowerCase()) &&
      transfer.dropoff.location.toLowerCase().includes(to.toLowerCase())
    );
  }
  return mockTransfers;
};

export const getMockActivities = (city?: string, type?: string): MockActivity[] => {
  if (city && type) {
    return mockActivities.filter(activity => 
      activity.location.city.toLowerCase().includes(city.toLowerCase()) &&
      activity.type === type
    );
  }
  return mockActivities;
};

export const getMockInsurance = (type?: string): MockInsurance[] => {
  return mockInsurance.filter(insurance => !type || insurance.type === type);
};

// Mock Hotel Data for Abu Dhabi
export const mockHotels: MockHotel[] = [
  {
    id: 'hotel_1',
    name: 'Emirates Palace Mandarin Oriental',
    brand: 'Mandarin Oriental',
    rating: 4.8,
    stars: 5,
    location: {
      city: 'Abu Dhabi',
      country: 'United Arab Emirates',
      address: 'West Corniche Road, Abu Dhabi',
      coordinates: { latitude: 24.4539, longitude: 54.3773 },
      area: 'Corniche',
      distanceFromAirport: '45 minutes',
      distanceFromCityCenter: '5 minutes'
    },
    description: 'Iconic luxury hotel featuring stunning Arabian architecture, private beach access, and world-class dining. Perfect for discerning travelers seeking the ultimate luxury experience.',
    amenities: [
      'Private Beach',
      'Infinity Pool',
      'Spa & Wellness Center',
      'Multiple Fine Dining Restaurants',
      '24/7 Butler Service',
      'Helicopter Pad',
      'Gold ATM',
      'Marina Access',
      'Kids Club',
      'Business Center'
    ],
    images: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800'
    ],
    rooms: [
      {
        id: 'room_1_1',
        name: 'Palace Deluxe Room',
        type: 'deluxe',
        description: 'Spacious room with Arabian Gulf views, featuring elegant furnishings and marble bathrooms.',
        size: '65 sqm',
        maxOccupancy: 3,
        bedConfiguration: '1 King Bed or 2 Twin Beds',
        amenities: ['Gulf View', 'Marble Bathroom', 'Private Balcony', '24/7 Room Service', 'Mini Bar'],
        images: ['https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600'],
        price: { amount: 850, currency: 'GBP', perNight: true },
        available: true,
        cancellationPolicy: 'Free cancellation until 24 hours before arrival',
        includes: ['Breakfast', 'WiFi', 'Access to Spa', 'Beach Access'],
        extras: [
          { name: 'Airport Transfer', price: 120, currency: 'GBP' },
          { name: 'Spa Treatment', price: 200, currency: 'GBP' }
        ]
      },
      {
        id: 'room_1_2',
        name: 'Palace Suite',
        type: 'suite',
        description: 'Luxurious suite with separate living area, panoramic views, and exclusive butler service.',
        size: '120 sqm',
        maxOccupancy: 4,
        bedConfiguration: '1 King Bed + Living Room',
        amenities: ['Panoramic Views', 'Separate Living Room', 'Butler Service', 'Private Dining', 'Luxury Bathroom'],
        images: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600'],
        price: { amount: 1500, currency: 'GBP', perNight: true },
        available: true,
        cancellationPolicy: 'Free cancellation until 48 hours before arrival',
        includes: ['Breakfast', 'WiFi', 'Spa Access', 'Beach Access', 'Butler Service'],
        extras: [
          { name: 'Private Chef', price: 300, currency: 'GBP' },
          { name: 'Luxury Car Service', price: 250, currency: 'GBP' }
        ]
      }
    ],
    policies: {
      checkIn: '3:00 PM',
      checkOut: '12:00 PM',
      cancellationPolicy: 'Free cancellation up to 24 hours before arrival',
      petPolicy: 'Pets allowed with prior arrangement',
      smokingPolicy: 'Designated smoking areas available'
    },
    reviews: {
      average: 4.8,
      total: 1247,
      breakdown: {
        cleanliness: 4.9,
        service: 4.8,
        location: 4.7,
        value: 4.6
      }
    },
    available: true
  },
  {
    id: 'hotel_2',
    name: 'St. Regis Abu Dhabi',
    brand: 'St. Regis',
    rating: 4.7,
    stars: 5,
    location: {
      city: 'Abu Dhabi',
      country: 'United Arab Emirates',
      address: 'Nation Towers, Corniche Road, Abu Dhabi',
      coordinates: { latitude: 24.4539, longitude: 54.3773 },
      area: 'Corniche',
      distanceFromAirport: '40 minutes',
      distanceFromCityCenter: '3 minutes'
    },
    description: 'Sophisticated luxury hotel offering personalized butler service, stunning city views, and world-class amenities in the heart of Abu Dhabi.',
    amenities: [
      'Infinity Pool',
      'Spa & Wellness Center',
      'Multiple Restaurants',
      'Butler Service',
      'Fitness Center',
      'Kids Club',
      'Business Center',
      'Valet Parking',
      'Concierge Service',
      'Private Beach Access'
    ],
    images: [
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800',
      'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800'
    ],
    rooms: [
      {
        id: 'room_2_1',
        name: 'Deluxe Room',
        type: 'deluxe',
        description: 'Elegant room with city or sea views, featuring modern amenities and luxurious furnishings.',
        size: '55 sqm',
        maxOccupancy: 3,
        bedConfiguration: '1 King Bed or 2 Twin Beds',
        amenities: ['City/Sea View', 'Luxury Bathroom', 'Work Desk', 'Mini Bar', 'In-room Safe'],
        images: ['https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=600'],
        price: { amount: 720, currency: 'GBP', perNight: true },
        available: true,
        cancellationPolicy: 'Free cancellation until 24 hours before arrival',
        includes: ['Breakfast', 'WiFi', 'Spa Access', 'Pool Access'],
        extras: [
          { name: 'Airport Transfer', price: 100, currency: 'GBP' },
          { name: 'Spa Treatment', price: 180, currency: 'GBP' }
        ]
      },
      {
        id: 'room_2_2',
        name: 'St. Regis Suite',
        type: 'suite',
        description: 'Spacious suite with separate living area, butler service, and panoramic views of the city.',
        size: '95 sqm',
        maxOccupancy: 4,
        bedConfiguration: '1 King Bed + Living Room',
        amenities: ['Panoramic Views', 'Separate Living Room', 'Butler Service', 'Dining Area', 'Luxury Bathroom'],
        images: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600'],
        price: { amount: 1200, currency: 'GBP', perNight: true },
        available: true,
        cancellationPolicy: 'Free cancellation until 48 hours before arrival',
        includes: ['Breakfast', 'WiFi', 'Spa Access', 'Butler Service', 'Pool Access'],
        extras: [
          { name: 'Private Dining', price: 250, currency: 'GBP' },
          { name: 'Luxury Car Service', price: 200, currency: 'GBP' }
        ]
      }
    ],
    policies: {
      checkIn: '3:00 PM',
      checkOut: '12:00 PM',
      cancellationPolicy: 'Free cancellation up to 24 hours before arrival',
      petPolicy: 'Pets allowed with prior arrangement',
      smokingPolicy: 'Designated smoking areas available'
    },
    reviews: {
      average: 4.7,
      total: 892,
      breakdown: {
        cleanliness: 4.8,
        service: 4.7,
        location: 4.8,
        value: 4.6
      }
    },
    available: true
  },
  {
    id: 'hotel_3',
    name: 'Four Seasons Hotel Abu Dhabi',
    brand: 'Four Seasons',
    rating: 4.6,
    stars: 5,
    location: {
      city: 'Abu Dhabi',
      country: 'United Arab Emirates',
      address: 'Al Maryah Island, Abu Dhabi',
      coordinates: { latitude: 24.4539, longitude: 54.3773 },
      area: 'Al Maryah Island',
      distanceFromAirport: '35 minutes',
      distanceFromCityCenter: '8 minutes'
    },
    description: 'Contemporary luxury hotel on Al Maryah Island, offering stunning waterfront views, world-class dining, and exceptional service.',
    amenities: [
      'Infinity Pool',
      'Spa & Wellness Center',
      'Multiple Restaurants',
      'Fitness Center',
      'Kids Club',
      'Business Center',
      'Valet Parking',
      'Concierge Service',
      'Private Beach Access',
      'Marina Access'
    ],
    images: [
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800'
    ],
    rooms: [
      {
        id: 'room_3_1',
        name: 'Premier Room',
        type: 'deluxe',
        description: 'Modern room with waterfront views, featuring contemporary design and luxury amenities.',
        size: '50 sqm',
        maxOccupancy: 3,
        bedConfiguration: '1 King Bed or 2 Twin Beds',
        amenities: ['Waterfront View', 'Modern Bathroom', 'Work Desk', 'Mini Bar', 'In-room Safe'],
        images: ['https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600'],
        price: { amount: 680, currency: 'GBP', perNight: true },
        available: true,
        cancellationPolicy: 'Free cancellation until 24 hours before arrival',
        includes: ['Breakfast', 'WiFi', 'Spa Access', 'Pool Access'],
        extras: [
          { name: 'Airport Transfer', price: 90, currency: 'GBP' },
          { name: 'Spa Treatment', price: 160, currency: 'GBP' }
        ]
      },
      {
        id: 'room_3_2',
        name: 'Executive Suite',
        type: 'suite',
        description: 'Spacious suite with separate living area, executive lounge access, and panoramic waterfront views.',
        size: '85 sqm',
        maxOccupancy: 4,
        bedConfiguration: '1 King Bed + Living Room',
        amenities: ['Panoramic Views', 'Separate Living Room', 'Executive Lounge Access', 'Dining Area', 'Luxury Bathroom'],
        images: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600'],
        price: { amount: 1100, currency: 'GBP', perNight: true },
        available: true,
        cancellationPolicy: 'Free cancellation until 48 hours before arrival',
        includes: ['Breakfast', 'WiFi', 'Spa Access', 'Executive Lounge', 'Pool Access'],
        extras: [
          { name: 'Private Dining', price: 220, currency: 'GBP' },
          { name: 'Luxury Car Service', price: 180, currency: 'GBP' }
        ]
      }
    ],
    policies: {
      checkIn: '3:00 PM',
      checkOut: '12:00 PM',
      cancellationPolicy: 'Free cancellation up to 24 hours before arrival',
      petPolicy: 'Pets allowed with prior arrangement',
      smokingPolicy: 'Designated smoking areas available'
    },
    reviews: {
      average: 4.6,
      total: 756,
      breakdown: {
        cleanliness: 4.7,
        service: 4.6,
        location: 4.7,
        value: 4.5
      }
    },
    available: true
  }
];

export const getMockHotels = (city?: string, stars?: number): MockHotel[] => {
  return mockHotels.filter(hotel => {
    if (city && !hotel.location.city.toLowerCase().includes(city.toLowerCase())) return false;
    if (stars && hotel.stars !== stars) return false;
    return true;
  });
}; 