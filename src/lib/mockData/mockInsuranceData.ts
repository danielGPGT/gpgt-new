// Insurance mock data for travel services
// This file provides realistic mock data for travel insurance

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

export const mockInsurance: MockInsurance[] = [
  {
    id: 'insurance_1',
    name: 'GlobalCare Comprehensive',
    type: 'comprehensive',
    provider: 'GlobalCare',
    description: 'Comprehensive travel insurance for Abu Dhabi, including medical, cancellation, and baggage coverage.',
    coverage: {
      medical: 1000000,
      tripCancellation: 5000,
      baggage: 2000,
      flightDelay: 500,
      personalLiability: 200000
    },
    price: {
      amount: 60,
      currency: 'GBP',
      perPerson: true,
      perDay: false
    },
    duration: '5 days',
    deductible: 100,
    exclusions: ['Extreme Sports', 'Pre-existing Conditions'],
    benefits: ['24/7 Assistance', 'Emergency Medical', 'Trip Cancellation', 'Lost Baggage', 'Personal Liability'],
    available: true
  },
  {
    id: 'insurance_2',
    name: 'SafeTrip Basic',
    type: 'basic',
    provider: 'SafeTrip',
    description: 'Basic travel insurance for Abu Dhabi, covering medical emergencies and baggage.',
    coverage: {
      medical: 250000,
      tripCancellation: 1000,
      baggage: 1000,
      flightDelay: 200,
      personalLiability: 50000
    },
    price: {
      amount: 30,
      currency: 'GBP',
      perPerson: true,
      perDay: false
    },
    duration: '5 days',
    deductible: 200,
    exclusions: ['Adventure Sports', 'Pre-existing Conditions'],
    benefits: ['Emergency Medical', 'Lost Baggage'],
    available: true
  }
];

export const getMockInsurance = (type?: string): MockInsurance[] => {
  if (type) {
    return mockInsurance.filter(i => i.type === type);
  }
  return mockInsurance;
}; 